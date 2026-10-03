// "Cérebro" do bot: junta o motor de interpretação (botNlu.ts) com a base de conhecimento editável e decide o que
// responder/fazer. Não fala com o WhatsApp diretamente: as ações (mandar texto, pedir CPF, chamar atendente…)
// chegam por `BrainIO`, montado pelo baileysManager.
import type { Express } from "express";
import { prisma, rawPrisma } from "./db.js";
import { brtParts } from "./time.js";
import {
  BUILTIN_INTENTS, AFFIRM, DENY, strip, understand, type IntentDef, type Understanding, type Candidate,
} from "./botNlu.js";

// ─── Contexto da conversa e ações ────────────────────────────────────────────

type PendingChoice = { id: string; text: string; intentId?: string; handoff?: string };
export interface BrainCtx {
  pushName?: string | null;
  lastIntent?: string;
  lastSystem?: string;
  fails: number;
  pending?: { type: "choices"; options: PendingChoice[] } | { type: "handoff"; sector: string };
  history: Record<string, number>;
}
export const newBrainCtx = (pushName?: string | null): BrainCtx => ({ pushName, fails: 0, history: {} });

export interface BrainIO {
  say(text: string): Promise<void>;
  choose(text: string, options: { id: string; text: string }[]): Promise<void>;
  askDoc(kind: "invoice" | "statement", doc?: string): Promise<void>;
  support(system: string | null, subject: string): Promise<void>;
  handoff(sector: string): Promise<void>;
  menu(): Promise<void>;
  queueStatus(): Promise<void>;
  goodbye(): Promise<void>;
}

// ─── Base de conhecimento (carregada do banco, com cache curto) ──────────────

interface Brain { defs: IntentDef[]; systems: { name: string; aliases?: string[] }[]; products: { name: string; description: string | null; price: number; type: string }[] }
let cache: { at: number; brain: Brain } | null = null;
const CACHE_MS = 60_000;

const KNOWN_ALIASES: Record<string, string[]> = {
  "Store BoxSys": ["boxsys", "box sys", "store boxsys", "storeboxsys", "loja boxsys", "boxis"],
};

const safeJson = <T,>(s: string | null | undefined, fallback: T): T => { try { return s ? (JSON.parse(s) as T) : fallback; } catch { return fallback; } };

export async function loadBrain(force = false): Promise<Brain> {
  if (!force && cache && Date.now() - cache.at < CACHE_MS) return cache.brain;
  const [rows, products] = await Promise.all([
    prisma.wppBotKnowledge.findMany({ where: { enabled: true } }),
    prisma.product.findMany({ where: { active: true }, select: { name: true, description: true, price: true, type: true } }).catch(() => []),
  ]);
  const custom: IntentDef[] = rows.map(r => ({
    id: `kb:${r.id}`, label: r.title, custom: true, system: r.system, priority: r.priority,
    phrases: safeJson<string[]>(r.phrases, []),
    keywords: safeJson<[string, number][]>(r.keywords, []),
    replies: r.answer.split(/\n\s*-{3,}\s*\n/).map(x => x.trim()).filter(Boolean),
    action: (r.action || "reply") as IntentDef["action"],
    followUp: r.followUp ?? undefined,
  }));
  const names = new Set<string>([...products.map(p => p.name), ...rows.map(r => r.system).filter((x): x is string => !!x), ...Object.keys(KNOWN_ALIASES)]);
  const systems = [...names].map(name => ({ name, aliases: KNOWN_ALIASES[name] ?? [] }));
  const brain = { defs: [...BUILTIN_INTENTS, ...custom], systems, products };
  cache = { at: Date.now(), brain };
  return brain;
}
export const resetBrainCache = () => { cache = null; };

// ─── Textos ──────────────────────────────────────────────────────────────────

const saud = () => { const h = brtParts().hour; return h >= 5 && h < 12 ? "Bom dia" : h >= 12 && h < 18 ? "Boa tarde" : "Boa noite"; };
const firstName = (n?: string | null) => {
  const f = String(n || "").trim().split(/\s+/)[0];
  return f && /^[\p{L}][\p{L}'-]{1,}$/u.test(f) ? f.charAt(0).toUpperCase() + f.slice(1).toLowerCase() : null;
};

function fill(text: string, ctx: BrainCtx, system?: string | null): string {
  const nome = firstName(ctx.pushName);
  return text
    .replace(/\{\{\s*,\s*nome\s*\}\}/gi, nome ? `, ${nome}` : "")
    .replace(/\{\{\s*nome\s*\}\}/gi, nome ?? "")
    .replace(/\{\{\s*saudacao\s*\}\}/gi, saud())
    .replace(/\{\{\s*sistema\s*\}\}/gi, system ?? "o sistema");
}

// escolhe uma variação sem repetir a anterior (o bot fica menos robótico)
function pick(key: string, arr: string[], ctx: BrainCtx, preview = false): string {
  if (!arr.length) return "";
  if (preview || arr.length === 1) return arr[0];
  let i = Math.floor(Math.random() * arr.length);
  if (i === ctx.history[key]) i = (i + 1) % arr.length;
  ctx.history[key] = i;
  return arr[i];
}

const FOLLOW_UPS = ["Posso ajudar em mais alguma coisa? 😊", "Quer saber mais algo? É só perguntar!", "Se precisar de mais alguma coisa, estou por aqui. 🙌", "Mais alguma dúvida? Pode mandar. 😉"];
const FALLBACKS = [
  "Hmm, não consegui entender direitinho 🤔 Pode me explicar de outro jeito? Ou escolha uma das opções:",
  "Desculpe, essa eu não peguei 🙏 Me conta com outras palavras, ou veja as opções abaixo:",
  "Quero te ajudar, mas não entendi bem o que você precisa. Tenta escrever de outra forma? Se preferir, use o menu:",
];
const EMPATHY = ["Entendo a sua frustração e peço desculpas pelo transtorno. 🙏", "Sinto muito por isso, vamos resolver."];

const money = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

function systemsText(b: Brain): string {
  const intro = "A *Develoi Soluções Digitais* cria sistemas e soluções digitais para negócios. 🚀";
  if (!b.products.length) return `${intro}\n\nMe conta o que você precisa e eu te indico o melhor caminho.`;
  const list = b.products.slice(0, 8).map(p => `• *${p.name}*${p.description ? ` — ${cut(p.description.replace(/\s+/g, " "), 90)}` : ""}`).join("\n");
  return `${intro}\n\nConheça o que temos hoje:\n${list}\n\nQuer saber mais de algum deles? É só dizer o nome. 😉`;
}

function priceText(b: Brain, system?: string | null): { text: string; offerSales: boolean } {
  const prod = system ? b.products.find(p => strip(p.name).includes(strip(system)) || strip(system).includes(strip(p.name))) : undefined;
  if (prod && prod.price > 0) return { text: `O *${prod.name}* custa a partir de *${money(prod.price)}*. Os valores podem variar conforme o plano e o que você precisa.`, offerSales: true };
  const priced = b.products.filter(p => p.price > 0).slice(0, 6);
  if (!system && priced.length) {
    return { text: `Esses são os valores que temos hoje:\n${priced.map(p => `• *${p.name}* — a partir de ${money(p.price)}`).join("\n")}\n\nO valor final depende do plano e do que você precisa.`, offerSales: true };
  }
  return { text: `${system ? `Os valores do *${system}* variam` : "Os valores variam"} conforme o plano e o que você precisa — assim você não paga por nada que não vai usar. 😉`, offerSales: true };
}

// ─── Decisão ─────────────────────────────────────────────────────────────────

const GENERIC_ONLY = new Set(["greeting", "laugh", "how_are_you", "thanks", "compliment", "goodbye", "menu"]);

async function remember(def: IntentDef) {
  if (def.custom) await rawPrisma.wppBotKnowledge.update({ where: { id: def.id.slice(3) }, data: { hits: { increment: 1 } } }).catch(() => {});
}
async function logUnknown(text: string, u: Understanding) {
  await rawPrisma.wppBotNluLog.create({
    data: { text: text.slice(0, 500), intentId: u.intent?.id ?? null, confidence: u.confidence, outcome: u.decision === "ask" ? "ask" : u.decision === "act" ? "act" : "none" },
  }).catch(() => {});
}

const SECTOR_CHOICES: PendingChoice[] = [
  { id: "a", text: "Financeiro (pagamentos, faturas)", handoff: "Financeiro" },
  { id: "b", text: "Comercial (contratar, valores)", handoff: "Comercial" },
  { id: "c", text: "Suporte (ajuda com o sistema)", handoff: "Suporte" },
];

async function askSector(ctx: BrainCtx, io: BrainIO, lead: string) {
  ctx.pending = { type: "choices", options: SECTOR_CHOICES };
  await io.choose(lead, SECTOR_CHOICES.map(o => ({ id: o.id, text: o.text })));
}

async function execute(def: IntentDef, u: Understanding, text: string, ctx: BrainCtx, io: BrainIO, brain: Brain, outro = true) {
  const system = u.entities.system ?? ctx.lastSystem ?? def.system ?? null;
  if (u.entities.system) ctx.lastSystem = u.entities.system;
  else if (def.system) ctx.lastSystem = def.system;
  ctx.lastIntent = def.id;
  ctx.fails = 0;
  void remember(def);

  const reply = () => fill(pick(def.id, def.replies ?? [], ctx), ctx, system);
  if (u.mood.angry && def.id !== "complaint" && !GENERIC_ONLY.has(def.id)) await io.say(pick("empathy", EMPATHY, ctx));

  switch (def.id) {
    case "greeting": case "menu": {
      await io.say(reply());
      await io.menu();
      return;
    }
    case "price": {
      const p = priceText(brain, system);
      await io.say(p.text);
      ctx.pending = { type: "handoff", sector: "Comercial" };
      await io.say("Quer que eu chame o nosso time comercial para montar uma proposta? 😊");
      return;
    }
    case "systems_overview": { await io.say(systemsText(brain)); return; }
    case "queue_status": { await io.queueStatus(); return; }
    default: break;
  }

  const action = def.action ?? "reply";
  const say = reply();
  if (say) await io.say(say);

  if (action === "invoice" || action === "statement") { await io.askDoc(action, u.entities.document); return; }
  if (action === "support") {
    if (u.mood.urgent) await io.say("Vou tratar isso com prioridade. ⚡");
    await io.support(system, text);
    return;
  }
  if (action === "goodbye") { await io.goodbye(); return; }
  if (action === "menu") { await io.menu(); return; }
  if (typeof action === "string" && action.startsWith("handoff:")) {
    const sector = action.slice(8) || u.entities.sector || "";
    if (!sector) { await askSector(ctx, io, "Para quem você prefere falar?"); return; }
    await io.handoff(sector);
    return;
  }

  // resposta informativa: segue com a pergunta de continuidade
  if (def.followUp) await io.say(fill(def.followUp, ctx, system));
  else if (outro && !GENERIC_ONLY.has(def.id)) await io.say(pick("followup", FOLLOW_UPS, ctx));
}

// Devolve true se o bot tratou a mensagem (false = deixa o fluxo normal responder, ex.: só uma saudação)
export async function respondTo(text: string, ctx: BrainCtx, io: BrainIO, opts: { inQueue?: boolean } = {}): Promise<boolean> {
  const brain = await loadBrain();
  const t = text.trim();

  // 1) resposta a uma pergunta que o próprio bot fez
  if (ctx.pending) {
    const pend = ctx.pending;
    ctx.pending = undefined;
    if (pend.type === "handoff") {
      if (AFFIRM.test(t)) { await io.say("Perfeito! Vou chamar alguém da equipe. 🙌"); await io.handoff(pend.sector); return true; }
      if (DENY.test(t)) { await io.say("Tudo bem! Se mudar de ideia, é só me avisar. Posso ajudar em mais alguma coisa? 😊"); return true; }
    } else {
      const pickd = pend.options.find(o => o.id.toLowerCase() === t.toLowerCase() || strip(o.text).startsWith(strip(t)) && strip(t).length >= 4);
      if (pickd) {
        if (pickd.handoff) { await io.handoff(pickd.handoff); return true; }
        const def = brain.defs.find(d => d.id === pickd.intentId);
        if (def) { await execute(def, understand(def.phrases[0] ?? t, brain.defs, brain.systems, ctx.lastSystem), t, ctx, io, brain); return true; }
      }
      if (/^(x|nenhuma|nenhum|nenhuma dessas|outra|outra coisa)$/i.test(t) || DENY.test(t)) {
        await io.say("Sem problemas! Me conta com outras palavras o que você precisa que eu tento de novo. ✍️");
        return true;
      }
    }
  }

  const u = understand(t, brain.defs, brain.systems, ctx.lastSystem);
  if (u.greetingOnly) return false;

  // "sim"/"não" soltos
  if (AFFIRM.test(t) || DENY.test(t)) {
    await io.say(AFFIRM.test(t) ? "Certo! 😊 Em que posso ajudar?" : "Tudo bem! Se precisar de algo, é só falar. 🙌");
    return true;
  }

  // atenção: dentro da fila, só reage ao que importa
  if (opts.inQueue && !(u.intent && u.decision === "act" && u.intent.def.id === "queue_status")) return false;

  if (u.decision === "act" && u.intent) {
    if (u.confidence < 0.7) await logUnknown(text, u);
    await execute(u.intent.def, u, t, ctx, io, brain);
    return true;
  }

  if (u.decision === "ask") {
    await logUnknown(text, u);
    const options = u.candidates.filter(c => !GENERIC_ONLY.has(c.id) || c.id === "menu").slice(0, 3);
    if (options.length) {
      const letters = ["a", "b", "c"];
      const choices: PendingChoice[] = options.map((c: Candidate, i) => ({ id: letters[i], text: c.label, intentId: c.id }));
      choices.push({ id: "x", text: "Nenhuma dessas" });
      ctx.pending = { type: "choices", options: choices };
      await io.choose("Quase lá! 🤔 Não tenho certeza se entendi. Você quis dizer:", choices.map(c => ({ id: c.id, text: c.text })));
      return true;
    }
  }

  // não entendeu
  await logUnknown(text, u);
  ctx.fails += 1;
  if (u.mood.angry || ctx.fails >= 2) {
    ctx.fails = 0;
    await io.say(u.mood.angry ? pick("empathy", EMPATHY, ctx) : "Pelo visto não estou conseguindo te ajudar do jeito certo. 😕");
    ctx.pending = { type: "handoff", sector: "Suporte" };
    await io.say("Quer que eu chame alguém da nossa equipe para falar com você?");
    return true;
  }
  await io.say(pick("fallback", FALLBACKS, ctx));
  await io.menu();
  return true;
}

// ─── Mensagens de inatividade (encerramento inteligente) ─────────────────────

export function idleNudge(ctx: { lastIntent?: string; pushName?: string | null }): string {
  const nome = firstName(ctx.pushName);
  const hi = nome ? `${nome}, ` : "";
  if (ctx.lastIntent === "invoice" || ctx.lastIntent === "statement") return `${hi}ainda por aí? 😊 Se precisar da fatura ou do extrato, é só me dizer.`;
  if (ctx.lastIntent === "support_problem") return `${hi}conseguiu resolver? Se ainda precisar de ajuda com o sistema, me avise que eu chamo o suporte. 🛠️`;
  return `${hi}ainda está por aí? 😊 Se precisar de algo, é só me escrever. Vou encerrar este atendimento em alguns minutos por falta de interação.`;
}

export function idleClose(ctx: { lastIntent?: string; pushName?: string | null }): string {
  const nome = firstName(ctx.pushName);
  const hi = nome ? `, ${nome}` : "";
  const base = [
    `Como não tivemos retorno, vou encerrar o atendimento por aqui${hi}. 😊 Quando quiser retomar, é só mandar uma mensagem — estou sempre por perto!`,
    `Vou encerrar esta conversa por inatividade${hi}, mas fica à vontade para chamar de novo quando precisar. Até logo! 👋`,
  ];
  const i = Math.floor(Math.random() * base.length);
  if (ctx.lastIntent === "invoice" || ctx.lastIntent === "statement") return `${base[i]}\n\nSe ainda precisar da sua fatura, é só pedir "segunda via". 🧾`;
  if (ctx.lastIntent === "support_problem") return `${base[i]}\n\nSe o problema continuar, escreva "suporte" que abrimos um atendimento na hora. 🛠️`;
  return base[i];
}

// ─── Base inicial (editável depois no painel) ────────────────────────────────

const SEED = [
  {
    title: "O que é o Store BoxSys", system: "Store BoxSys", priority: 6,
    phrases: ["o que e o boxsys", "como funciona o store boxsys", "para que serve o boxsys", "me explica o boxsys", "sistema para loja", "sistema de estoque e vendas", "controle de estoque", "pdv para loja", "o que e store boxsys"],
    keywords: [["boxsys", 2.5], ["estoque", 1.5]],
    answer: "O *Store BoxSys* é um sistema de gestão para lojas: você controla vendas, estoque, caixa e catálogo em um só lugar, tudo online. 🛍️\n---\nO *Store BoxSys* junta o que sua loja precisa no dia a dia: frente de caixa (PDV), estoque, pedidos, catálogo online e relatórios. Tudo em um só sistema. 😉",
    followUp: "Quer ver as funcionalidades ou fazer um teste gratuito?",
  },
  {
    title: "Funcionalidades do Store BoxSys", system: "Store BoxSys", priority: 6,
    phrases: ["o que tem no boxsys", "funcionalidades do boxsys", "tem nota fiscal", "emite nfe", "tem pdv", "tem catalogo online", "tem controle de caixa", "tem crediario", "tem etiquetas", "tem ordem de servico", "faz orcamento", "tem loja virtual", "quais recursos tem", "o que o sistema faz"],
    keywords: [["funcionalidade", 2], ["recurso", 1.5], ["tem", 0.5]],
    answer: "No *Store BoxSys* você tem:\n\n• PDV / frente de caixa e fluxo de caixa\n• Pedidos, orçamentos e ordens de serviço\n• Notas fiscais\n• Catálogo, estoque, categorias, fornecedores e etiquetas\n• Markup (formação de preço)\n• Crediário e consignação\n• Integração com maquininhas\n• Loja virtual para o seu cliente comprar online\n\nTudo no mesmo painel. 💙",
    followUp: "Quer testar gratuitamente por 14 dias?",
  },
  {
    title: "Teste grátis do Store BoxSys", system: "Store BoxSys", priority: 6,
    phrases: ["tem teste gratis", "posso testar", "quero fazer um teste", "periodo de teste", "como testar o sistema", "tem demonstracao", "quero ver funcionando", "teste gratuito"],
    keywords: [["teste", 2.5], ["demonstracao", 2], ["gratis", 2]],
    answer: "Tem sim! 🎉 Você pode testar o *Store BoxSys* gratuitamente por *14 dias*, sem compromisso, para ver se ele serve para o seu negócio.\n---\nClaro! O *Store BoxSys* tem um período de teste de *14 dias* para você conhecer tudo com calma. 😉",
    action: "handoff:Comercial",
  },
  {
    title: "Como acessar o Store BoxSys", system: "Store BoxSys", priority: 5,
    phrases: ["como acesso o boxsys", "qual o link do sistema", "onde eu entro", "como faco login", "qual o endereco do sistema", "link de acesso", "onde acesso minha loja"],
    keywords: [["link", 1.5], ["acesso", 1.5]],
    answer: "O acesso é pelo endereço da sua loja no BoxSys (*store.boxsys.com.br*) com o e-mail e a senha que enviamos quando o seu cadastro foi criado. 🔑",
    followUp: "Se não conseguir entrar, me avise que eu abro um atendimento de suporte para você.",
  },
  {
    title: "Formas de pagamento", priority: 5,
    phrases: ["quais formas de pagamento", "aceita boleto", "posso pagar no cartao", "aceitam pix", "como posso pagar", "pagar no cartao de credito", "formas de pagar"],
    keywords: [["cartao", 1.5], ["boleto", 1]],
    answer: "Você pode pagar por *Pix*, *boleto* ou *cartão de crédito*. 💳 A cobrança chega pelo WhatsApp com um link seguro, e o pagamento é confirmado automaticamente.",
    followUp: "Quer receber a sua fatura agora? É só dizer \"segunda via\".",
  },
  {
    title: "Pix Automático", priority: 6,
    phrases: ["o que e pix automatico", "como funciona o pix automatico", "pagar todo mes automatico", "debito automatico no pix", "pix recorrente", "pagamento automatico", "autorizar pix automatico"],
    keywords: [["automatico", 2], ["recorrente", 2]],
    answer: "O *Pix Automático* é bem prático: você autoriza *uma única vez* no app do seu banco e as próximas cobranças acontecem sozinhas, no vencimento. Sem boleto e sem precisar lembrar de pagar. ✅",
    followUp: "Quer ativar na sua assinatura? Posso chamar o financeiro para configurar.",
  },
  {
    title: "Horário de atendimento (preencha e ative)", priority: 5, enabled: false,
    phrases: ["qual o horario de atendimento", "que horas voces atendem", "funcionam no sabado", "atendem aos domingos", "ate que horas atendem", "horario de funcionamento"],
    keywords: [["horario", 2.5]],
    answer: "Nosso atendimento humano funciona de *segunda a sexta, das 9h às 18h*. Fora desse horário, eu continuo por aqui para ajudar com fatura, extrato e dúvidas. 😊",
  },
] as { title: string; system?: string; priority: number; phrases: string[]; keywords?: [string, number][]; answer: string; followUp?: string; action?: string; enabled?: boolean }[];

export async function seedKnowledge() {
  try {
    if ((await prisma.wppBotKnowledge.count()) > 0) return;
    for (const s of SEED) {
      await prisma.wppBotKnowledge.create({
        data: {
          title: s.title, system: s.system ?? null, priority: s.priority, phrases: JSON.stringify(s.phrases),
          keywords: s.keywords ? JSON.stringify(s.keywords) : null, answer: s.answer, followUp: s.followUp ?? null,
          action: s.action ?? "reply", enabled: s.enabled !== false,
        },
      });
    }
    console.log("[bot] base de conhecimento inicial criada");
  } catch (e) { console.error("[bot] não consegui criar a base de conhecimento:", e); }
}

// ─── Rotas do painel (base de conhecimento, simulador, o que o bot não entendeu) ──

export function registerBotBrainRoutes(app: Express) {
  const clean = (b: any) => ({
    title: String(b.title || "").trim().slice(0, 120),
    system: b.system ? String(b.system).trim().slice(0, 80) : null,
    phrases: JSON.stringify((Array.isArray(b.phrases) ? b.phrases : String(b.phrases || "").split("\n")).map((x: string) => String(x).trim()).filter(Boolean)),
    keywords: Array.isArray(b.keywords) && b.keywords.length ? JSON.stringify(b.keywords) : null,
    answer: String(b.answer || "").trim(),
    action: String(b.action || "reply").slice(0, 40),
    followUp: b.followUp ? String(b.followUp).trim() : null,
    priority: Math.min(9, Math.max(0, Number(b.priority) || 5)),
    enabled: b.enabled !== false,
  });
  const valid = (d: ReturnType<typeof clean>) => d.title && d.answer && JSON.parse(d.phrases).length > 0;

  app.get("/api/admin/bot/kb", async (_req, res) => {
    const rows = await prisma.wppBotKnowledge.findMany({ orderBy: [{ enabled: "desc" }, { title: "asc" }] });
    res.json(rows.map(r => ({ ...r, phrases: safeJson<string[]>(r.phrases, []), keywords: safeJson<[string, number][]>(r.keywords, []) })));
  });
  app.post("/api/admin/bot/kb", async (req, res) => {
    const d = clean(req.body ?? {});
    if (!valid(d)) return res.status(400).json({ error: "Preencha o título, ao menos uma frase de exemplo e a resposta." });
    const row = await prisma.wppBotKnowledge.create({ data: d });
    resetBrainCache();
    res.json(row);
  });
  app.put("/api/admin/bot/kb/:id", async (req, res) => {
    const d = clean(req.body ?? {});
    if (!valid(d)) return res.status(400).json({ error: "Preencha o título, ao menos uma frase de exemplo e a resposta." });
    const row = await prisma.wppBotKnowledge.update({ where: { id: req.params.id }, data: d });
    resetBrainCache();
    res.json(row);
  });
  app.delete("/api/admin/bot/kb/:id", async (req, res) => {
    await prisma.wppBotKnowledge.delete({ where: { id: req.params.id } }).catch(() => {});
    resetBrainCache();
    res.json({ success: true });
  });

  // Simulador: mostra o que o bot entenderia (sem enviar nada a ninguém)
  app.post("/api/admin/bot/nlu/test", async (req, res) => {
    const text = String(req.body?.text || "").slice(0, 500);
    if (!text.trim()) return res.status(400).json({ error: "Digite uma mensagem." });
    const brain = await loadBrain(true);
    const u = understand(text, brain.defs, brain.systems, req.body?.system || null);
    const def = u.intent?.def;
    const ctx = newBrainCtx("Cliente");
    res.json({
      decision: u.decision, confidence: Math.round(u.confidence * 100),
      intent: def ? { id: def.id, label: def.label, action: def.action ?? "reply", custom: !!def.custom } : null,
      candidates: u.candidates.map(c => ({ id: c.id, label: c.label, score: Math.round(c.score * 100) })),
      entities: u.entities, mood: u.mood, greetingOnly: u.greetingOnly,
      reply: def ? fill(pick(def.id, def.replies ?? [], ctx, true), ctx, u.entities.system ?? def.system) || null : null,
    });
  });

  // O que o bot não entendeu (para ensinar): mais recentes primeiro
  app.get("/api/admin/bot/nlu/unknown", async (_req, res) => {
    res.json(await prisma.wppBotNluLog.findMany({ where: { dismissed: false, outcome: { in: ["none", "ask"] } }, orderBy: { createdAt: "desc" }, take: 40 }));
  });
  app.post("/api/admin/bot/nlu/unknown/:id/dismiss", async (req, res) => {
    await rawPrisma.wppBotNluLog.update({ where: { id: req.params.id }, data: { dismissed: true } }).catch(() => {});
    res.json({ success: true });
  });
}

// Espia a intenção sem agir (usado para o cliente "escapar" de uma pergunta, ex.: pedir atendente enquanto o bot espera o CPF)
export async function peekIntent(text: string, hintSystem?: string | null): Promise<{ id: string; confidence: number } | null> {
  const brain = await loadBrain();
  const u = understand(text, brain.defs, brain.systems, hintSystem);
  return u.intent && u.decision === "act" ? { id: u.intent.def.id, confidence: u.confidence } : null;
}
