// "Cérebro" da BiIA (assistente virtual da Develoi): junta o motor de interpretação (botNlu.ts), os dados de treino
// (botData.ts), a base de conhecimento editável e a memória da conversa, e decide o que responder e fazer.
// Não fala com o WhatsApp diretamente: as ações chegam por `BrainIO`, montado pelo baileysManager.
import type { Express } from "express";
import { prisma, rawPrisma } from "./db.js";
import { brtParts } from "./time.js";
import {
  BUILTIN_INTENTS, AFFIRM, DENY, strip, understand, deDash, type IntentDef, type Understanding, type Candidate,
} from "./botNlu.js";
import { EXTRA_INTENTS } from "./botData.js";

// ─── Memória e ações ─────────────────────────────────────────────────────────

type PendingChoice = { id: string; text: string; intentId?: string; handoff?: string };
type Offer = "lead" | "invoice" | "statement" | "support" | `handoff:${string}`;
interface LeadFlow { step: number; data: { ramo?: string; necessidade?: string }; system: string | null; first: string }

export interface BrainCtx {
  pushName?: string | null;
  client?: { name: string | null; document: string };   // quem o bot já identificou nesta conversa (CPF/CNPJ informado)
  lastIntent?: string;
  lastSystem?: string;
  lastAnswer?: string;
  fails: number;
  angry: number;
  seen: string[];                                       // respostas já mostradas (para sugerir só o que falta)
  leadDone?: boolean;
  flow?: LeadFlow;
  turns: number;                                        // quantas mensagens do cliente a BiIA já tratou
  recent: string[];                                     // últimas mensagens do cliente (resumo para o atendente)
  lastAction?: string;                                  // última ação executada (fatura, extrato…)
  helped?: boolean;                                     // já resolveu algo nesta conversa
  rated?: boolean;
  profile?: "client" | "lead";
  pending?: { type: "choices"; options: PendingChoice[] } | { type: "handoff"; sector: string } | { type: "offer"; action: Offer } | { type: "rating" };
  history: Record<string, number>;
}
export const newBrainCtx = (pushName?: string | null): BrainCtx => ({ pushName, fails: 0, angry: 0, seen: [], history: {}, turns: 0, recent: [] });

export interface BrainIO {
  say(text: string): Promise<void>;
  choose(text: string, options: { id: string; text: string }[]): Promise<void>;
  askDoc(kind: "invoice" | "statement", doc?: string): Promise<void>;
  support(system: string | null, subject: string): Promise<void>;
  handoff(sector: string, note?: string): Promise<void>;
  menu(kind?: "welcome" | "inline" | "client"): Promise<void>;
  queueStatus(): Promise<void>;
  goodbye(): Promise<void>;
  note(text: string): Promise<void>;                    // registro interno no histórico (ex.: avaliação)
}

// ─── Base de conhecimento (banco, com cache curto) ───────────────────────────

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
  const brain = { defs: [...BUILTIN_INTENTS, ...EXTRA_INTENTS, ...custom], systems, products };
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
const nameOf = (ctx: BrainCtx) => firstName(ctx.client?.name) ?? firstName(ctx.pushName);

function fill(text: string, ctx: BrainCtx, system?: string | null): string {
  const nome = nameOf(ctx);
  return deDash(text
    .replace(/\{\{\s*,\s*nome\s*\}\}/gi, nome ? `, ${nome}` : "")
    .replace(/\{\{\s*nome\s*\}\}/gi, nome ?? "")
    .replace(/\{\{\s*saudacao\s*\}\}/gi, saud())
    .replace(/\{\{\s*sistema\s*\}\}/gi, system ?? "o sistema"));
}

// escolhe uma variação sem repetir a anterior (a BiIA fica menos robótica)
function pick(key: string, arr: string[], ctx: BrainCtx, preview = false): string {
  if (!arr.length) return "";
  if (preview || arr.length === 1) return arr[0];
  let i = Math.floor(Math.random() * arr.length);
  if (i === ctx.history[key]) i = (i + 1) % arr.length;
  ctx.history[key] = i;
  return arr[i];
}

const FOLLOW_UPS = ["Posso ajudar em mais alguma coisa? 😊", "Quer saber mais algo? É só perguntar!", "Se precisar de mais alguma coisa, estou por aqui. 🙌", "Mais alguma dúvida? Pode mandar. 😉", "E aí, ajudou? Se ficou alguma dúvida, me fala."];
const FALLBACKS = [
  "Hmm, não consegui entender direitinho 🤔 Pode me explicar de outro jeito? Ou escolha uma das opções:",
  "Desculpe, essa eu não peguei 🙏 Me conta com outras palavras, ou veja as opções abaixo:",
  "Quero muito te ajudar, mas não entendi bem o que você precisa. Tenta escrever de outra forma? Se preferir, use o menu:",
  "Não captei essa, perdão! 😅 Pode reformular? Ou escolha uma das opções:",
];
const EMPATHY = ["Entendo a sua frustração e peço desculpas pelo transtorno. 🙏", "Sinto muito por isso, vamos resolver.", "Poxa, imagino como isso é chato. Já vou cuidar disso com você."];
const REPEAT_LEADS = ["Claro, vou explicar de outro jeito:", "Sem problema! Olha só:", "Deixa eu falar de forma mais simples:"];
const OTHER_POINT = ["E sobre o outro ponto que você citou:", "Aproveitando, sobre a outra dúvida:", "E quanto ao outro assunto:"];
const RELATED_LEADS = ["Quer ver também algum destes?", "Posso te mostrar mais:", "Tem mais coisa que pode te interessar:"];

const money = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

function systemsText(b: Brain): string {
  const intro = "A *Develoi Soluções Digitais* cria sistemas e soluções digitais para negócios. 🚀";
  if (!b.products.length) return `${intro}\n\nMe conta o que você precisa que eu te indico o melhor caminho.`;
  const list = b.products.slice(0, 8).map(p => `• *${p.name}*${p.description ? `: ${cut(p.description.replace(/\s+/g, " "), 90)}` : ""}`).join("\n");
  return `${intro}\n\nConheça o que temos hoje:\n${list}\n\nQuer saber mais de algum deles? É só dizer o nome. 😉`;
}

function priceText(b: Brain, system?: string | null): string {
  const prod = system ? b.products.find(p => strip(p.name).includes(strip(system)) || strip(system).includes(strip(p.name))) : undefined;
  if (prod && prod.price > 0) return `O *${prod.name}* custa a partir de *${money(prod.price)}*. O valor final pode variar conforme o plano e o que você precisa.`;
  const priced = b.products.filter(p => p.price > 0).slice(0, 6);
  if (!system && priced.length) {
    return `Estes são os valores que temos hoje:\n${priced.map(p => `• *${p.name}*: a partir de ${money(p.price)}`).join("\n")}\n\nO valor final depende do plano e do que você precisa.`;
  }
  return `${system ? `Os valores do *${system}* variam` : "Os valores variam"} conforme o plano e o que você precisa, assim você não paga por nada que não vai usar. 😉`;
}

// ─── Decisão ─────────────────────────────────────────────────────────────────

const GENERIC_ONLY = new Set(["greeting", "laugh", "how_are_you", "thanks", "thanks_but", "compliment", "goodbye", "menu", "repeat", "addressing", "friendship", "topic_change", "retry_failed", "resend", "i_am_client", "not_client"]);
const isChat = (d: IntentDef) => GENERIC_ONLY.has(d.id) || d.id.startsWith("chat_");
const isInfo = (d: IntentDef) => !isChat(d) && (!d.action || d.action === "reply") && !["price", "systems_overview", "queue_status", "human"].includes(d.id);

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

// "a", "1", "o primeiro", "a segunda"…
function choiceIndex(t: string, n: number): number {
  const x = strip(t).replace(/[^a-z0-9 ]/g, "").trim();
  const map: [RegExp, number][] = [[/^(a|1|um|primeir[oa]|o primeiro|a primeira)$/, 0], [/^(b|2|dois|segund[oa]|o segundo|a segunda)$/, 1], [/^(c|3|tres|terceir[oa]|o terceiro|a terceira)$/, 2]];
  for (const [re, i] of map) if (re.test(x) && i < n) return i;
  return -1;
}

// "Quer testar grátis?" → o "sim" seguinte sabe o que fazer
function inferOffer(followUp?: string, action?: string): Offer | null {
  const f = strip(followUp ?? "");
  if (!f) return null;
  if (/teste|demonstra|proposta|comercial|contratar|conhecer melhor/.test(f)) return "lead";
  if (/suporte|ajuda tecnica/.test(f)) return "support";
  if (/segunda via|fatura|boleto/.test(f)) return "invoice";
  if (/extrato/.test(f)) return "statement";
  if (/financeiro|ativar|configurar|pix automatico/.test(f)) return "handoff:Financeiro";
  return action && action.startsWith("handoff:") ? (action as Offer) : null;
}

// Resumo do contexto para quem atende: o que a pessoa já falou e o que a BiIA entendeu
function contextNote(ctx: BrainCtx): string {
  return ["Resumo da BiIA", ctx.client?.name ? `Cliente: ${ctx.client.name}` : null, ctx.client?.document ? `Documento informado: ${ctx.client.document}` : null,
    ctx.lastSystem ? `Sistema: ${ctx.lastSystem}` : null, ctx.lastIntent ? `Último assunto: ${ctx.lastIntent}` : null,
    ctx.recent.length ? `Últimas mensagens: ${ctx.recent.slice(-3).join(" / ")}` : null].filter(Boolean).join(" | ").slice(0, 900);
}

async function clientMenu(ctx: BrainCtx, io: BrainIO) {
  const opts: PendingChoice[] = [
    { id: "a", text: "Segunda via da fatura", intentId: "invoice" },
    { id: "b", text: "Extrato de pagamentos", intentId: "statement" },
    { id: "c", text: "Suporte técnico", handoff: "Suporte" },
    { id: "d", text: "Falar com o Financeiro", handoff: "Financeiro" },
  ];
  ctx.pending = { type: "choices", options: opts };
  await io.choose("Escolha uma das opções abaixo ou me conte o que precisa. 👇", opts.map(o => ({ id: o.id, text: o.text })));
}

async function startLead(ctx: BrainCtx, io: BrainIO, system: string | null, first: string) {
  if (ctx.leadDone) { await io.say("Já anotei as suas informações! 🙌 Vou chamar o time comercial para falar com você."); await io.handoff("Comercial", leadNote(ctx, system, first)); return; }
  ctx.flow = { step: 0, data: {}, system, first };
  await io.say("Para o time comercial te atender já com tudo em mãos, me conta rapidinho: qual é o *ramo do seu negócio*? 🏪");
}

function leadNote(ctx: BrainCtx, system: string | null, first: string): string {
  const d = ctx.flow?.data ?? {};
  return [`Contato comercial pela BiIA`, ctx.client?.name ? `Cliente: ${ctx.client.name}` : null, d.ramo ? `Ramo: ${d.ramo}` : null, d.necessidade ? `Precisa de: ${d.necessidade}` : null, system ? `Interesse: ${system}` : null, first ? `Mensagem: ${first.slice(0, 200)}` : null].filter(Boolean).join(" | ");
}

async function runOffer(offer: Offer, ctx: BrainCtx, io: BrainIO, system: string | null, text: string) {
  if (offer === "lead") return startLead(ctx, io, system, text);
  if (offer === "invoice" || offer === "statement") return io.askDoc(offer, ctx.client?.document);
  if (offer === "support") return io.support(system, text);
  return io.handoff(offer.slice(8) || "Suporte");
}

async function execute(def: IntentDef, u: Understanding, text: string, ctx: BrainCtx, io: BrainIO, brain: Brain, outro = true) {
  const system = u.entities.system ?? ctx.lastSystem ?? def.system ?? null;
  if (u.entities.system) ctx.lastSystem = u.entities.system;
  else if (def.system) ctx.lastSystem = def.system;
  if (def.id !== "repeat") ctx.lastIntent = def.id;
  ctx.fails = 0;
  if (!ctx.seen.includes(def.id)) ctx.seen.push(def.id);
  void remember(def);

  const reply = () => fill(pick(def.id, def.replies ?? [], ctx), ctx, system);
  if (u.mood.angry && def.id !== "complaint" && !isChat(def)) await io.say(pick("empathy", EMPATHY, ctx));

  switch (def.id) {
    case "greeting": case "menu": { await io.say(reply()); await (ctx.profile === "client" ? clientMenu(ctx, io) : io.menu(ctx.turns > 1 ? "inline" : "welcome")); return; }
    case "price": {
      await io.say(priceText(brain, system));
      ctx.pending = { type: "offer", action: "lead" };
      await io.say("Quer que eu chame o nosso time comercial para montar uma proposta? 😊");
      return;
    }
    case "systems_overview": { await io.say(systemsText(brain)); return; }
    case "i_am_client": { ctx.profile = "client"; await io.say(reply()); await clientMenu(ctx, io); return; }
    case "not_client": {
      ctx.profile = "lead";
      await io.say(reply());
      await io.say(systemsText(brain));
      ctx.pending = { type: "offer", action: "lead" };
      return;
    }
    case "topic_change": { ctx.pending = undefined; ctx.flow = undefined; await io.say(reply()); return; }
    case "retry_failed": {
      const sup = ctx.lastIntent === "support_problem" || (ctx.lastIntent ?? "").startsWith("sup_");
      const fin = ["invoice", "statement", "payment_done"].includes(ctx.lastIntent ?? "") || (ctx.lastIntent ?? "").startsWith("fin_");
      if (sup || fin) {
        await io.say(pick("retry", ["Poxa, obrigada por tentar. Vou passar para a equipe já com o que você me contou, para você não precisar repetir tudo. 🙏", "Entendi, então vamos chamar uma pessoa. Já deixo tudo anotado para ela. 🙌"], ctx));
        await io.handoff(sup ? "Suporte" : "Financeiro", `${contextNote(ctx)} | O cliente já tentou a orientação da BiIA e o problema continua.`);
      } else {
        await io.say("Poxa, sinto muito. 😕 Me conta com mais detalhes o que aconteceu ou escolha com quem prefere falar:");
        await askSector(ctx, io, "Qual setor pode te ajudar melhor?");
      }
      return;
    }
    case "resend": {
      if (ctx.lastAction === "invoice" || ctx.lastAction === "statement") { await io.say("Claro, vou enviar de novo. 😊"); await io.askDoc(ctx.lastAction, ctx.client?.document); return; }
      if (ctx.lastAnswer) { await io.say(ctx.lastAnswer); return; }
      await io.say("Me conta o que você quer que eu envie, que eu já mando! 😊");
      return;
    }
    case "thanks": {
      await io.say(reply());
      if (ctx.helped && !ctx.rated && !u.mood.angry) {
        ctx.rated = true;
        ctx.pending = { type: "rating" };
        await io.say("Antes de ir{{, nome}}, de 1 a 5, como foi o meu atendimento? ⭐".replace("{{, nome}}", nameOf(ctx) ? `, ${nameOf(ctx)}` : ""));
      }
      return;
    }
    case "queue_status": { await io.queueStatus(); return; }
    case "repeat": {
      if (ctx.lastAnswer) { await io.say(pick("repeat", REPEAT_LEADS, ctx)); await io.say(ctx.lastAnswer); }
      else await io.say("Claro! Sobre qual assunto você quer que eu explique melhor? 😊");
      return;
    }
    default: break;
  }

  const action = def.action ?? "reply";
  const say = reply();
  if (say) await io.say(say);
  if (!isChat(def) && def.id !== "repeat") { ctx.helped = true; ctx.lastAction = action; }

  if (action === "invoice" || action === "statement") { await io.askDoc(action, u.entities.document ?? ctx.client?.document); return; }
  if (action === "support") {
    if (u.mood.urgent) await io.say("Vou tratar isso com prioridade. ⚡");
    await io.support(system, text);
    return;
  }
  if (action === "lead") { await startLead(ctx, io, system, text); return; }
  if (action === "goodbye") { await io.goodbye(); return; }
  if (action === "menu") { await io.menu(); return; }
  if (typeof action === "string" && action.startsWith("handoff:")) {
    const sector = action.slice(8) || u.entities.sector || "";
    if (!sector) { await askSector(ctx, io, "Com qual setor você prefere falar?"); return; }
    await io.handoff(sector);
    return;
  }

  if (!outro || isChat(def)) return;

  // resposta informativa: oferece o próximo passo (ou outros assuntos do mesmo sistema)
  if (def.followUp) {
    await io.say(fill(def.followUp, ctx, system));
    const offer = inferOffer(def.followUp);
    if (offer) ctx.pending = { type: "offer", action: offer };
    return;
  }
  const related = brain.defs.filter(d => d.custom && d.system && d.system === def.system && d.id !== def.id && !ctx.seen.includes(d.id)).slice(0, 2);
  if (related.length) {
    const opts: PendingChoice[] = related.map((d, i) => ({ id: "ab"[i], text: d.label, intentId: d.id }));
    opts.push({ id: "x", text: "Por enquanto não, obrigado" });
    ctx.pending = { type: "choices", options: opts };
    await io.choose(pick("related", RELATED_LEADS, ctx), opts.map(o => ({ id: o.id, text: o.text })));
    return;
  }
  await io.say(pick("followup", FOLLOW_UPS, ctx));
}

// Devolve true se a BiIA tratou a mensagem (false = deixa o fluxo normal responder, ex.: só uma saudação)
export async function respondTo(text: string, ctx: BrainCtx, rawIo: BrainIO, opts: { inQueue?: boolean } = {}): Promise<boolean> {
  const brain = await loadBrain();
  const t = text.trim();

  // tudo que a BiIA fala passa pelo "humanizador" (sem travessões) e fica guardado para "pode repetir?"
  let spoken: string[] = [];
  const io: BrainIO = {
    ...rawIo,
    say: async (m: string) => { const x = deDash(m); spoken.push(x); await rawIo.say(x); },
    choose: async (m, o) => rawIo.choose(deDash(m), o.map(c => ({ ...c, text: deDash(c.text) }))),
    handoff: async (sector: string, note?: string) => rawIo.handoff(sector, note ?? contextNote(ctx)),
  };
  ctx.turns += 1;
  ctx.recent = [...ctx.recent, t.slice(0, 120)].slice(-4);
  const finish = (ok: boolean) => { if (ok && spoken.length && ctx.lastIntent !== "repeat") ctx.lastAnswer = spoken.slice(0, 2).join("\n\n"); return ok; };

  // 1) coleta de dados para o comercial em andamento
  if (ctx.flow) {
    const f = ctx.flow;
    const peek = understand(t, brain.defs, brain.systems, f.system);
    const id = peek.decision === "act" ? peek.intent?.def.id : undefined;
    if (id === "human") { await io.say("Sem problemas! Vou chamar alguém agora mesmo. 🙌"); const note = leadNote(ctx, f.system, f.first); ctx.flow = undefined; await io.handoff("Comercial", note); return finish(true); }
    if (id === "menu" || id === "goodbye") { ctx.flow = undefined; await execute(peek.intent!.def, peek, t, ctx, io, brain); return finish(true); }
    const answer = /^(pular|nao sei|depois|n\/a)$/i.test(strip(t)) ? "não informado" : t.slice(0, 300);
    if (f.step === 0) {
      f.data.ramo = answer; f.step = 1;
      await io.say(pick("lead2", ["Legal! E o que você gostaria de *resolver ou melhorar* com um sistema? Por exemplo: controlar estoque, emitir notas, vender online.", "Entendi! E qual é a sua maior necessidade hoje? Pode ser controle de estoque, nota fiscal, vendas online, o que vier à cabeça."], ctx));
      return finish(true);
    }
    f.data.necessidade = answer;
    const note = leadNote(ctx, f.system, f.first);
    ctx.leadDone = true;
    await io.say(`Perfeito, anotei tudo${nameOf(ctx) ? `, ${nameOf(ctx)}` : ""}! 🙌 Vou chamar o time comercial agora e já passo essas informações para eles.`);
    ctx.flow = undefined;
    await io.handoff("Comercial", note);
    return finish(true);
  }

  // 2) resposta a uma pergunta que a própria BiIA fez
  if (ctx.pending) {
    const pend = ctx.pending;
    ctx.pending = undefined;
    if (pend.type === "rating") {
      const n = Number((t.match(/^\s*([1-5])\b/) ?? [])[1]);
      if (n) {
        await io.note(`Avaliação do atendimento da BiIA: ${n}/5`);
        await io.say(n >= 4 ? "Que bom saber disso! 💙 Obrigada pela nota. Até a próxima!" : "Obrigada por contar, vou levar isso para a equipe melhorar. 🙏");
        return finish(true);
      }
    } else if (pend.type === "handoff") {
      if (AFFIRM.test(t)) { await io.say("Perfeito! Vou chamar alguém da equipe. 🙌"); await io.handoff(pend.sector); return finish(true); }
      if (DENY.test(t)) { await io.say("Tudo bem! Se mudar de ideia é só me avisar. Posso ajudar em mais alguma coisa? 😊"); return finish(true); }
    } else if (pend.type === "offer") {
      if (AFFIRM.test(t)) { await runOffer(pend.action, ctx, io, ctx.lastSystem ?? null, t); return finish(true); }
      if (DENY.test(t)) { await io.say(pick("deny", ["Sem problemas! Se precisar, estou por aqui. 😊", "Tudo bem, fica à vontade! Qualquer coisa é só chamar.", "Beleza! Se mudar de ideia, me avisa."], ctx)); return finish(true); }
    } else {
      const idx = choiceIndex(t, pend.options.length);
      const pickd = idx >= 0 ? pend.options[idx] : pend.options.find(o => strip(o.text).startsWith(strip(t)) && strip(t).length >= 4);
      const none = pickd?.id === "x" || /^(x|nenhuma|nenhum|nenhuma dessas|outra|outra coisa)$/i.test(t) || DENY.test(t);
      if (none) { await io.say(pickd?.id === "x" ? "Combinado! Qualquer coisa é só chamar. 😊" : "Sem problemas! Me conta com outras palavras o que você precisa que eu tento de novo. ✍️"); return finish(true); }
      if (pickd) {
        if (pickd.handoff) { await io.handoff(pickd.handoff); return finish(true); }
        const def = brain.defs.find(d => d.id === pickd.intentId);
        if (def) { await execute(def, understand(def.phrases[0] ?? t, brain.defs, brain.systems, ctx.lastSystem), t, ctx, io, brain); return finish(true); }
      }
    }
  }

  // só emojis/figurinha/pontuação ("👍", "😂", "..."): responde com leveza
  if (!/[\p{L}\p{N}]/u.test(t)) {
    const emoji = brain.defs.find(d => d.id === "chat_emoji_only");
    if (emoji?.replies?.length) { await io.say(fill(pick("emoji", emoji.replies, ctx), ctx)); return finish(true); }
  }

  const u = understand(t, brain.defs, brain.systems, ctx.lastSystem);
  if (u.greetingOnly) return false;

  // "sim"/"não" soltos
  if (AFFIRM.test(t) || DENY.test(t)) {
    await io.say(AFFIRM.test(t) ? "Certo! 😊 Em que posso ajudar?" : "Tudo bem! Se precisar de algo, é só falar. 🙌");
    return finish(true);
  }

  // dentro da fila, só reage a "quanto falta?"
  if (opts.inQueue && !(u.intent && u.decision === "act" && u.intent.def.id === "queue_status")) return false;

  // cliente irritado de novo: não insiste, chama uma pessoa
  if (u.mood.angry) ctx.angry += 1;
  if (u.mood.angry && ctx.angry >= 2) {
    ctx.angry = 0;
    await io.say(pick("empathy", EMPATHY, ctx));
    await io.say("Vou chamar agora alguém da equipe para resolver isso com você, com prioridade. 🙏");
    await io.handoff("Suporte", `Cliente irritado, pediu prioridade. Mensagem: ${t.slice(0, 200)}`);
    return finish(true);
  }

  if (u.decision === "act" && u.intent) {
    if (u.confidence < 0.7) await logUnknown(text, u);
    await execute(u.intent.def, u, t, ctx, io, brain);

    // duas dúvidas na mesma mensagem: responde também a segunda (quando as duas são só informação)
    const second = u.candidates[1];
    if (second && second.score >= 0.7 && isInfo(u.intent.def) && isInfo(second.def) && second.id !== u.intent.id) {
      await io.say(pick("other", OTHER_POINT, ctx));
      await execute(second.def, u, t, ctx, io, brain, false);
      await io.say(pick("followup", FOLLOW_UPS, ctx));
    }
    return finish(true);
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
      return finish(true);
    }
  }

  // não entendeu
  await logUnknown(text, u);
  ctx.fails += 1;
  if (ctx.fails >= 2) {
    ctx.fails = 0;
    await io.say("Pelo visto não estou conseguindo te ajudar do jeito certo. 😕");
    ctx.pending = { type: "handoff", sector: "Suporte" };
    await io.say("Quer que eu chame alguém da nossa equipe para falar com você?");
    return finish(true);
  }
  await io.say(pick("fallback", FALLBACKS, ctx));
  await (ctx.profile === "client" ? clientMenu(ctx, io) : io.menu(ctx.turns > 1 ? "inline" : "welcome"));
  return finish(true);
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
    `Como não tivemos retorno, vou encerrar o atendimento por aqui${hi}. 😊 Quando quiser retomar, é só mandar uma mensagem, estou sempre por perto!`,
    `Vou encerrar esta conversa por inatividade${hi}, mas fica à vontade para chamar de novo quando precisar. Até logo! 👋`,
    `Vou fechar por aqui${hi} já que ficou quietinho. 🙂 Se surgir qualquer coisa, me chama que eu volto na hora!`,
  ];
  const i = Math.floor(Math.random() * base.length);
  if (ctx.lastIntent === "invoice" || ctx.lastIntent === "statement") return `${base[i]}\n\nSe ainda precisar da sua fatura, é só pedir "segunda via". 🧾`;
  if (ctx.lastIntent === "support_problem") return `${base[i]}\n\nSe o problema continuar, escreva "suporte" que abrimos um atendimento na hora. 🛠️`;
  return base[i];
}

// ─── Base inicial (editável depois no painel) ────────────────────────────────

export const SEED = [
  {
    title: "O que é o Store BoxSys", system: "Store BoxSys", priority: 6,
    phrases: ["o que e o boxsys", "como funciona o store boxsys", "para que serve o boxsys", "me explica o boxsys", "sistema para loja", "sistema de estoque e vendas", "controle de estoque", "pdv para loja", "o que e store boxsys"],
    keywords: [["boxsys", 2.5], ["estoque", 1.5]],
    answer: "O *Store BoxSys* é um sistema de gestão para lojas: você controla vendas, estoque, caixa e catálogo em um só lugar, tudo online. 🛍️\n---\nO *Store BoxSys* junta o que a sua loja precisa no dia a dia: frente de caixa (PDV), estoque, pedidos, catálogo online e relatórios. Tudo em um só sistema. 😉\n---\nPensa num sistema que cuida das vendas, do estoque e do caixa da sua loja sem você precisar de planilha. É o *Store BoxSys*. 💙",
    followUp: "Quer ver as funcionalidades ou fazer um teste gratuito?",
  },
  {
    title: "Funcionalidades do Store BoxSys", system: "Store BoxSys", priority: 6,
    phrases: ["o que tem no boxsys", "funcionalidades do boxsys", "tem nota fiscal", "emite nfe", "tem pdv", "tem catalogo online", "tem controle de caixa", "tem crediario", "tem etiquetas", "tem ordem de servico", "faz orcamento", "tem loja virtual", "quais recursos tem", "o que o sistema faz"],
    keywords: [["funcionalidade", 2], ["recurso", 1.5], ["tem", 0.5]],
    answer: "No *Store BoxSys* você tem:\n\n• PDV e fluxo de caixa\n• Pedidos, orçamentos e ordens de serviço\n• Notas fiscais\n• Catálogo, estoque, categorias, fornecedores e etiquetas\n• Markup (formação de preço)\n• Crediário e consignação\n• Integração com maquininhas\n• Loja virtual para o seu cliente comprar online\n\nTudo no mesmo painel. 💙",
    followUp: "Quer testar gratuitamente por 14 dias?",
  },
  {
    title: "Teste grátis do Store BoxSys", system: "Store BoxSys", priority: 6,
    phrases: ["tem teste gratis", "posso testar", "quero fazer um teste", "periodo de teste", "como testar o sistema", "tem demonstracao", "quero ver funcionando", "teste gratuito"],
    keywords: [["teste", 2.5], ["demonstracao", 2], ["gratis", 2]],
    answer: "Tem sim! 🎉 Você pode testar o *Store BoxSys* gratuitamente por *14 dias*, sem compromisso, para ver se ele serve para o seu negócio.\n---\nClaro! O *Store BoxSys* tem um período de teste de *14 dias* para você conhecer tudo com calma. 😉",
    action: "lead",
  },
  {
    title: "Como acessar o Store BoxSys", system: "Store BoxSys", priority: 5,
    phrases: ["como acesso o boxsys", "qual o link do sistema", "onde eu entro", "como faco login", "qual o endereco do sistema", "link de acesso", "onde acesso minha loja"],
    keywords: [["link", 1.5], ["acesso", 1.5]],
    answer: "O acesso é pelo endereço da sua loja no BoxSys (*store.boxsys.com.br*), com o e-mail e a senha que enviamos quando o seu cadastro foi criado. 🔑",
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
    title: "Qual sistema serve para o meu negócio", priority: 5,
    phrases: ["qual sistema serve para minha loja", "tenho uma loja de roupas", "tenho um comercio qual sistema", "preciso de sistema para meu negocio", "qual o melhor sistema para mim", "meu negocio e uma loja", "tenho uma lojinha", "qual sistema voces indicam", "nao sei qual sistema escolher"],
    keywords: [["indicam", 1.5], ["serve", 1.5]],
    answer: "Se você tem *loja ou comércio* (vendas, estoque e caixa), o *Store BoxSys* costuma ser o ideal. Para outros tipos de negócio, a gente monta a solução certa com você. 😉\n---\nPara lojas e comércios o *Store BoxSys* é um ótimo caminho. Se o seu ramo for outro, o time conversa com você e indica a melhor solução.",
    action: "lead",
  },
  {
    title: "Horário de atendimento (preencha e ative)", priority: 5, enabled: false,
    phrases: ["qual o horario de atendimento", "que horas voces atendem", "funcionam no sabado", "atendem aos domingos", "ate que horas atendem", "horario de funcionamento"],
    keywords: [["horario", 2.5]],
    answer: "Nosso atendimento humano funciona de *segunda a sexta, das 9h às 18h*. Fora desse horário eu continuo por aqui para ajudar com fatura, extrato e dúvidas. 😊",
  },
] as { title: string; system?: string; priority: number; phrases: string[]; keywords?: [string, number][]; answer: string; followUp?: string; action?: string; enabled?: boolean }[];

export async function seedKnowledge() {
  try {
    const have = new Set((await prisma.wppBotKnowledge.findMany({ select: { title: true } })).map(r => r.title));
    let created = 0;
    for (const s of SEED) {
      if (have.has(s.title)) continue;
      await prisma.wppBotKnowledge.create({
        data: {
          title: s.title, system: s.system ?? null, priority: s.priority, phrases: JSON.stringify(s.phrases),
          keywords: s.keywords ? JSON.stringify(s.keywords) : null, answer: s.answer, followUp: s.followUp ?? null,
          action: s.action ?? "reply", enabled: s.enabled !== false,
        },
      });
      created++;
    }
    if (created) console.log(`[bot] ${created} resposta(s) inicial(is) criada(s) na base de conhecimento`);
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

  // Simulador: mostra o que a BiIA entenderia (sem enviar nada a ninguém)
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
      candidates: u.candidates.map(c => ({ id: c.id, label: c.label, score: Math.min(100, Math.round(c.score * 100)) })),
      entities: u.entities, mood: u.mood, greetingOnly: u.greetingOnly,
      reply: def ? fill(pick(def.id, def.replies ?? [], ctx, true), ctx, u.entities.system ?? def.system) || null : null,
    });
  });

  // O que a BiIA não entendeu (para ensinar): mais recentes primeiro
  app.get("/api/admin/bot/nlu/unknown", async (_req, res) => {
    res.json(await prisma.wppBotNluLog.findMany({ where: { dismissed: false, outcome: { in: ["none", "ask"] } }, orderBy: { createdAt: "desc" }, take: 40 }));
  });
  app.post("/api/admin/bot/nlu/unknown/:id/dismiss", async (req, res) => {
    await rawPrisma.wppBotNluLog.update({ where: { id: req.params.id }, data: { dismissed: true } }).catch(() => {});
    res.json({ success: true });
  });
}

// Espia a intenção sem agir (o cliente pode "escapar" de uma pergunta, ex.: pedir atendente enquanto o bot espera o CPF)
export async function peekIntent(text: string, hintSystem?: string | null): Promise<{ id: string; confidence: number } | null> {
  const brain = await loadBrain();
  const u = understand(text, brain.defs, brain.systems, hintSystem);
  return u.intent && u.decision === "act" ? { id: u.intent.def.id, confidence: u.confidence } : null;
}
