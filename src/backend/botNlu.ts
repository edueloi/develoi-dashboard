// Motor de interpretação do bot (100% nosso, sem IA externa): entende a intenção da mensagem do cliente
// por frases-exemplo e palavras-chave, tolerando erros de digitação, gírias e abreviações.
// É puro (não acessa banco): a base de conhecimento editável entra por parâmetro (ver botBrain.ts).

// ─── Normalização ────────────────────────────────────────────────────────────

const ABBR: Record<string, string> = {
  vc: "voce", vcs: "voces", voce: "voce", voces: "voces", tb: "tambem", tbm: "tambem", pq: "porque", pk: "porque",
  q: "que", n: "nao", nn: "nao", naum: "nao", blz: "beleza", vlw: "valeu", vlww: "valeu", obg: "obrigado", obgd: "obrigado",
  obrigada: "obrigado", brigado: "obrigado", brigada: "obrigado", agr: "agora", hj: "hoje", msg: "mensagem", td: "tudo", tds: "todos",
  cmg: "comigo", pra: "para", pro: "para", ta: "esta", to: "estou", tou: "estou", flw: "falou", fds: "fim de semana",
  nf: "nota fiscal", nfe: "nota fiscal", nfce: "nota fiscal", cnpj: "cnpj", cpf: "cpf", sup: "suporte", fin: "financeiro",
  adm: "administrativo", plz: "por favor", pfv: "por favor", pf: "por favor", bd: "bom dia", bt: "boa tarde", bn: "boa noite",
  qro: "quero", qr: "quer", tem: "tem", ctz: "certeza", mto: "muito", mt: "muito", mta: "muita", oq: "o que", sdds: "saudades",
  qdo: "quando", qnd: "quando", dnv: "de novo", dps: "depois", ngm: "ninguem", alg: "alguem", app: "aplicativo", apps: "aplicativo",
};

// Palavras de mesmo sentido viram uma só (antes de cortar o final das palavras)
const SYN_GROUPS: string[][] = [
  ["atendente", "humano", "pessoa", "funcionario", "funcionaria", "consultor", "consultora", "vendedor", "vendedora", "operador", "gente"],
  ["preco", "valor", "valores", "custo", "custa", "custam", "cobram", "cobra", "investimento", "tarifa", "orcamento"],
  ["problema", "erro", "bug", "falha", "travou", "trava", "travando", "lento", "lenta", "bugado", "quebrou", "parou", "defeito", "pane", "caiu", "fora do ar"],
  ["cancelar", "cancelamento", "encerrar", "desistir", "rescindir", "rescisao", "desativar", "parar"],
  ["pagar", "paguei", "pago", "pagou", "pagando", "pagamento", "pagamentos", "quitar", "quitei", "quitado", "paga"],
  ["fatura", "boleto", "cobranca", "mensalidade", "parcela", "duplicata"],
  ["entrar", "acessar", "acesso", "logar", "login", "loga", "logar"],
  ["senha", "password", "credencial"],
  ["comprar", "contratar", "assinar", "adquirir", "fechar"],
  ["quero", "gostaria", "preciso", "necessito", "desejo", "queria"],
  ["ajuda", "ajudar", "auxilio", "socorro", "suporte"],
  ["rapido", "urgente", "urgencia", "imediato", "emergencia", "agora mesmo"],
  ["reclamacao", "reclamar", "insatisfeito", "insatisfeita", "pessimo", "horrivel", "absurdo", "vergonha", "descaso"],
];
const SYN = new Map<string, string>();
for (const g of SYN_GROUPS) for (const w of g) SYN.set(w, g[0]);

const STOP = new Set([
  "de", "da", "do", "das", "dos", "a", "o", "as", "os", "um", "uma", "uns", "umas", "para", "por", "com", "em", "no", "na", "nos", "nas",
  "que", "e", "eu", "me", "meu", "minha", "meus", "minhas", "seu", "sua", "se", "ao", "aos", "ou", "mas", "como", "la", "aqui", "isso",
  "esse", "essa", "este", "esta", "ai", "so", "ja", "ate", "pelo", "pela", "voce", "voces", "vou", "ser", "foi", "tenho", "estou",
  "favor", "poderia", "pode", "podem", "possivel", "gostaria", "ola", "bom", "boa", "dia", "tarde", "noite", "oi", "opa", "eae",
]);
// "ja", "bom", "dia"… saem da pontuação das frases, mas "oi/bom dia" continuam valendo para detectar saudação (GREET)

const GREET = new Set(["oi", "ola", "oie", "ei", "opa", "eae", "hello", "hi", "salve", "bom", "boa", "dia", "tarde", "noite", "e", "ai", "tudo", "bem", "td"]);

export interface Tok { raw: string; c: string; s: string; neg: boolean }

function stem(w: string): string {
  if (w.length <= 3) return w;
  let x = w.replace(/coes$/, "cao").replace(/aes$/, "ao").replace(/ais$/, "al").replace(/eis$/, "el").replace(/mente$/, "");
  x = x.replace(/(ando|endo|indo|aram|eram|iram|ados|idos|adas|idas|ado|ido|ada|ida|ar|er|ir|ou|ei|as|es|os|a|e|o|s)$/, "");
  return x.length >= 2 ? x : w;
}

export function strip(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function normalize(text: string): string {
  let t = strip(text);
  t = t.replace(/2\s*[ªao°]?\s*via/g, "segunda via").replace(/\bsegunda\s+via\b/g, "segunda via");
  t = t.replace(/\bfora do ar\b|\bnao (esta )?(abre|carrega|funciona)\b/g, "problema");
  t = t.replace(/(\w)\1{2,}/g, "$1$1"); // oiiiii → oii (mantém no máximo duas letras iguais)
  t = t.replace(/[^a-z0-9@\s./-]/g, " ").replace(/[./-](?!\d)/g, " ").replace(/\s+/g, " ").trim();
  return t;
}

export function tokenize(text: string): Tok[] {
  const words = normalize(text).split(" ").filter(Boolean);
  const out: Tok[] = [];
  let negAt = -10;
  words.forEach((w, i) => {
    if (w === "nao" || w === "nunca" || w === "jamais" || w === "sem") negAt = i;
    const expanded = (ABBR[w] ?? w).split(" ");
    for (const e of expanded) {
      const c = SYN.get(e) ?? e;
      out.push({ raw: e, c, s: stem(c), neg: i - negAt > 0 && i - negAt <= 2 });
    }
  });
  return out;
}

const content = (toks: Tok[]) => toks.filter(t => !STOP.has(t.c) && t.c !== "nao");

// Distância de edição (com troca de letras vizinhas)
function lev(a: string, b: string): number {
  if (a === b) return 0;
  const la = a.length, lb = b.length;
  if (Math.abs(la - lb) > 3) return 9;
  const d: number[][] = Array.from({ length: la + 1 }, (_, i) => [i, ...Array(lb).fill(0)]);
  for (let j = 0; j <= lb; j++) d[0][j] = j;
  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[la][lb];
}

// 1 = igual · menos = parecido (erro de digitação) · 0 = nada a ver
function tokSim(a: Tok, b: Tok): number {
  if (a.c === b.c || a.s === b.s) return 1;
  const m = Math.min(a.s.length, b.s.length);
  if (m < 4) return 0;
  if ((a.s.startsWith(b.s) || b.s.startsWith(a.s)) && m >= 4 && m / Math.max(a.s.length, b.s.length) >= 0.7) return 0.85;
  const d = lev(a.s, b.s);
  if (d === 1) return 0.85;
  if (d === 2 && m >= 7) return 0.7;
  return 0;
}

// ─── Intenções ───────────────────────────────────────────────────────────────

export type IntentAction = "reply" | "menu" | "invoice" | "statement" | "support" | "queue_status" | "goodbye" | `handoff:${string}`;

export interface IntentDef {
  id: string;
  label: string;
  phrases: string[];                 // exemplos de como o cliente escreve
  keywords?: [string, number][];     // palavra e peso (3 = decisiva, 2 = boa, 1 = fraca)
  replies?: string[];                // variações da resposta ({{nome}}, {{saudacao}}, {{sistema}})
  action?: IntentAction;
  followUp?: string;                 // pergunta/oferta depois da resposta
  priority?: number;                 // desempata (maior ganha)
  system?: string | null;            // sistema a que a resposta se refere
  custom?: boolean;                  // veio da base editável
  id2?: string;
}

interface Prepared extends IntentDef {
  p: Tok[][];
  k: { t: Tok; w: number }[];
}

const prepCache = new WeakMap<IntentDef, Prepared>();
function prepare(def: IntentDef): Prepared {
  let p = prepCache.get(def);
  if (!p) {
    p = {
      ...def,
      p: def.phrases.map(x => content(tokenize(x))).filter(x => x.length),
      k: (def.keywords ?? []).flatMap(([w, wt]) => content(tokenize(w)).slice(0, 1).map(t => ({ t, w: wt }))),
    };
    prepCache.set(def, p);
  }
  return p;
}

export interface Candidate { id: string; label: string; score: number; def: IntentDef }

function scoreIntent(def: IntentDef, input: Tok[], normalized: string): number {
  const d = prepare(def);
  const useful = content(input);
  if (!useful.length) return 0;

  // 1) parecido com alguma frase-exemplo (quanto da frase aparece na mensagem e quanto da mensagem é a frase)
  let best = 0;
  for (const phrase of d.p) {
    let cover = 0;
    for (const pt of phrase) {
      let m = 0;
      for (const it of useful) m = Math.max(m, tokSim(pt, it) * (it.neg && !pt.neg ? 0.2 : 1));
      cover += m;
    }
    const coverage = cover / phrase.length;
    let used = 0;
    for (const it of useful) { let m = 0; for (const pt of phrase) m = Math.max(m, tokSim(pt, it)); if (m >= 0.7) used++; }
    const precision = used / useful.length;
    let s = 0.7 * coverage + 0.3 * precision;
    if (def.phrases.some(x => normalized.includes(normalize(x)) && normalize(x).length >= 4)) s = Math.max(s, 0.92);
    best = Math.max(best, s);
  }

  // 2) palavras-chave (peso soma; "não" antes da palavra anula)
  let kw = 0;
  for (const k of d.k) {
    let m = 0;
    for (const it of useful) m = Math.max(m, it.neg ? 0 : tokSim(k.t, it));
    kw += m * k.w;
  }
  const kwScore = Math.min(1, kw / 3);

  let base = Math.max(best * 0.95, kwScore * 0.85);
  if (best < 0.35 && def.custom) base = Math.min(base, 0.62); // resposta da base só por uma palavra solta (ex.: o nome do sistema) não basta
  const both = best > 0.4 && kwScore > 0.3 ? 0.08 : 0;
  return Math.min(1, base + both);
}

export function rank(defs: IntentDef[], text: string): Candidate[] {
  const toks = tokenize(text);
  const norm = normalize(text);
  return defs
    .map(def => ({ id: def.id, label: def.label, def, score: scoreIntent(def, toks, norm) + (def.priority ?? 0) * 0.002 }))
    .filter(c => c.score > 0.2)
    .sort((a, b) => b.score - a.score);
}

// ─── Entidades e tom ─────────────────────────────────────────────────────────

export interface Entities {
  document?: string;       // CPF/CNPJ (só números)
  email?: string;
  phone?: string;
  system?: string;         // sistema citado
  sector?: "Financeiro" | "Comercial" | "Suporte";
  money?: number;
}

export function validCpf(d: string): boolean {
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const calc = (n: number) => { let s = 0; for (let i = 0; i < n; i++) s += Number(d[i]) * (n + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r; };
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
}

export function extractEntities(text: string, systems: { name: string; aliases?: string[] }[] = []): Entities {
  const e: Entities = {};
  const digits = text.replace(/[^\d]/g, " ").split(/\s+/).join("");
  const docMatch = text.match(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b|\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/);
  if (docMatch) { const d = docMatch[0].replace(/\D/g, ""); if (d.length === 14 || validCpf(d)) e.document = d; }
  else if (/^\d{11}$|^\d{14}$/.test(digits) && text.replace(/\D/g, "").length === digits.length) { if (digits.length === 14 || validCpf(digits)) e.document = digits; }
  const em = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  if (em) e.email = em[0].toLowerCase();
  const ph = text.match(/\(?\b\d{2}\)?\s?9?\d{4}[-\s]?\d{4}\b/);
  if (ph && !e.document) e.phone = ph[0].replace(/\D/g, "");
  const money = text.match(/r\$\s?(\d+(?:[.,]\d{1,2})?)/i);
  if (money) e.money = Number(money[1].replace(",", "."));

  const n = normalize(text);
  if (/\b(financeiro|cobranca|faturamento|contas)\b/.test(n)) e.sector = "Financeiro";
  else if (/\b(comercial|vendas|vendedor|contratar|orcamento|proposta)\b/.test(n)) e.sector = "Comercial";
  else if (/\b(suporte|tecnico|tecnica|ajuda tecnica)\b/.test(n)) e.sector = "Suporte";

  const compact = n.replace(/\s+/g, "");
  let bestSys = 0;
  for (const s of systems) {
    for (const name of [s.name, ...(s.aliases ?? [])]) {
      const key = normalize(name).replace(/\s+/g, "");
      if (key.length < 3) continue;
      let score = 0;
      if (compact.includes(key)) score = 1;
      else {
        // erro de digitação em uma palavra do texto (ex.: "boxsis", "agendele")
        for (const w of n.split(" ")) { if (w.length >= 4 && lev(w, key) <= (key.length >= 7 ? 2 : 1)) score = Math.max(score, 0.85); }
      }
      if (score > bestSys) { bestSys = score; e.system = s.name; }
    }
  }
  return e;
}

export interface Mood { angry: boolean; urgent: boolean; polite: boolean }
export function readMood(text: string): Mood {
  const raw = text, n = normalize(text);
  const letters = raw.replace(/[^A-Za-zÀ-ÿ]/g, "");
  const shouting = letters.length >= 8 && letters === letters.toUpperCase();
  return {
    angry: shouting || /\b(reclamacao|pessimo|horrivel|absurdo|vergonha|descaso|ridiculo|palhacada|cansado|inadmissivel|nunca resolvem|ninguem resolve|incompetente)\b/.test(n) || /!{3,}/.test(raw),
    urgent: /\b(urgente|urgencia|imediato|emergencia|agora mesmo|parado|parada|fora do ar|nao consigo trabalhar|sem acesso|perdendo vendas)\b/.test(n),
    polite: /\b(por favor|obrigado|agradeco|gentileza|desculpe)\b/.test(n),
  };
}

// Só uma saudação ("oi", "bom dia, tudo bem?")
export function isGreetingOnly(text: string): boolean {
  const n = normalize(text).split(" ").filter(Boolean);
  return n.length > 0 && n.length <= 6 && n.every(w => GREET.has(ABBR[w] ?? w));
}

export const AFFIRM = /^(sim|s|isso|claro|pode|pode sim|quero|quero sim|com certeza|ok|beleza|certo|positivo|uhum|aham|yes|por favor|pfv|manda|manda ai|bora|vamos)[\s!.]*$/i;
export const DENY = /^(nao|n|nao obrigado|nao quero|agora nao|depois|negativo|deixa|deixa quieto|nao precisa)[\s!.]*$/i;

// ─── Intenções de conversa e atendimento (fixas) ─────────────────────────────

export const BUILTIN_INTENTS: IntentDef[] = [
  {
    id: "greeting", label: "Saudação", action: "menu", priority: 1,
    phrases: ["oi", "ola", "bom dia", "boa tarde", "boa noite", "e ai", "opa", "eae", "oie", "hello", "salve", "oi tudo bem", "ola tudo bem", "oi bom dia", "oi boa tarde"],
    keywords: [["oi", 3], ["ola", 3], ["salve", 2]],
    replies: ["{{saudacao}}{{, nome}}! 😊 Que bom ter você por aqui. Como posso ajudar?", "{{saudacao}}{{, nome}}! 👋 Sou o assistente virtual da Develoi. Me conta o que você precisa que eu já te ajudo!"],
  },
  {
    id: "how_are_you", label: "Tudo bem?", action: "reply",
    phrases: ["tudo bem", "como vai", "como voce esta", "td bem", "tudo certo", "como esta", "como voce vai", "tudo bom", "como tem passado"],
    replies: ["Tudo ótimo por aqui, obrigado por perguntar! 😊 E com você? Em que posso ajudar?", "Tudo bem sim, e por aí? 😄 Me conta como posso te ajudar hoje.", "Muito bem, obrigado! Pronto pra te ajudar. O que você precisa? 🙌"],
  },
  {
    id: "bot_identity", label: "Você é um robô?", action: "reply",
    phrases: ["voce e um robo", "voce e humano", "quem e voce", "e uma pessoa", "com quem falo", "voce e real", "e bot", "isso e um robo", "estou falando com um robo", "quem esta falando"],
    keywords: [["robo", 3], ["bot", 3], ["humano", 1]],
    replies: ["Sou o assistente virtual da *Develoi Soluções Digitais* 🤖. Resolvo muita coisa por aqui na hora — fatura, extrato, dúvidas sobre os sistemas — e, quando precisar, chamo uma pessoa da nossa equipe.", "Eu sou o assistente virtual da Develoi 🤖 — um robô, mas bem esperto! 😄 Se você preferir falar com uma pessoa, é só pedir que eu chamo."],
  },
  {
    id: "thanks", label: "Agradecimento", action: "reply",
    phrases: ["obrigado", "valeu", "muito obrigado", "agradeco", "brigadao", "show obrigado", "perfeito obrigado", "obrigado pela ajuda", "valeu demais", "ajudou muito", "resolveu obrigado"],
    keywords: [["obrigado", 3], ["valeu", 3], ["agradeco", 3]],
    replies: ["Por nada! 😊 Sempre que precisar, é só chamar.", "Imagina, foi um prazer ajudar! 🙌 Qualquer coisa, estou por aqui.", "Disponha! Se surgir qualquer dúvida, é só me chamar. 💙"],
  },
  {
    id: "goodbye", label: "Despedida", action: "goodbye",
    phrases: ["tchau", "ate mais", "ate logo", "falou", "so isso", "era so isso", "nao preciso de mais nada", "pode encerrar", "encerrar atendimento", "ate amanha", "boa semana", "bom fim de semana", "e isso"],
    keywords: [["tchau", 3], ["encerrar", 2]],
    replies: ["Até mais! 👋 Foi um prazer atender você. Quando precisar, é só mandar uma mensagem.", "Até logo! 😊 Qualquer coisa, estou por aqui."],
  },
  {
    id: "compliment", label: "Elogio", action: "reply",
    phrases: ["voce e demais", "muito bom", "gostei", "otimo atendimento", "parabens", "excelente atendimento", "voces sao otimos", "adorei"],
    replies: ["Que bom ouvir isso! 🥰 Fico feliz em ajudar. Posso fazer mais alguma coisa por você?", "Muito obrigado pelo carinho! 💙 Se precisar de mais alguma coisa, é só falar."],
  },
  {
    id: "laugh", label: "Risada", action: "reply", priority: -1,
    phrases: ["kkk", "kkkk", "haha", "rsrs", "hahaha", "kkkkk"],
    replies: ["😄", "Haha! 😄 Posso ajudar em mais alguma coisa?"],
  },
  {
    id: "human", label: "Falar com atendente", action: "handoff:", priority: 3,
    phrases: ["quero falar com um atendente", "falar com uma pessoa", "atendimento humano", "chama um atendente", "quero um humano", "passa para um atendente", "falar com alguem", "preciso de um atendente", "atendente por favor", "me transfere para um atendente", "quero falar com o responsavel", "tem alguem ai", "falar com gente de verdade", "nao quero falar com robo"],
    keywords: [["atendente", 3], ["humano", 3], ["alguem", 1.5]],
    replies: ["Claro! 🙌 Vou chamar alguém da nossa equipe para falar com você."],
  },
  {
    id: "invoice", label: "Segunda via da fatura", action: "invoice", priority: 2,
    phrases: ["segunda via do boleto", "segunda via da fatura", "quero minha fatura", "me manda o boleto", "link de pagamento", "como pago minha mensalidade", "qual o pix para pagar", "preciso pagar", "enviar a fatura", "fatura em aberto", "onde eu pago", "quero pagar", "codigo pix", "pagar a assinatura", "me envia o link para pagar", "perdi o boleto", "nao recebi a fatura", "quanto devo", "tenho alguma conta em aberto", "minha fatura venceu"],
    keywords: [["fatura", 3], ["segunda via", 3], ["pagar", 1.5], ["devo", 2.5], ["aberto", 1.5], ["pix", 1], ["vencida", 2]],
    replies: ["Claro! Vou buscar a sua fatura agora mesmo. 🧾"],
  },
  {
    id: "statement", label: "Extrato e vencimento", action: "statement", priority: 2,
    phrases: ["extrato de pagamentos", "historico de pagamentos", "quero ver meus pagamentos", "o que ja paguei", "pagamentos realizados", "extrato", "ver meu extrato", "quando vence minha proxima fatura", "qual meu proximo vencimento", "quando vence", "meus pagamentos", "me manda o extrato"],
    keywords: [["extrato", 3], ["historico", 2], ["vencimento", 2], ["vence", 2]],
    replies: ["Perfeito! Vou preparar o seu extrato. 📄"],
  },
  {
    id: "payment_done", label: "Já paguei", action: "statement", priority: 3,
    phrases: ["ja paguei", "efetuei o pagamento", "fiz o pix", "fiz o pagamento", "paguei ontem", "acabei de pagar", "paguei mas continua bloqueado", "paguei e nao liberou", "enviei o comprovante", "segue o comprovante", "ja realizei o pagamento", "pagamento nao foi identificado", "meu pagamento nao aparece", "ja fiz o pix"],
    keywords: [["paguei", 1.2], ["comprovante", 2], ["efetuei", 2], ["liberou", 1.5], ["identificado", 2], ["bloqueado", 1.5]],
    replies: ["Obrigado por avisar! 🙏 O Pix é confirmado em instantes e o boleto pode levar até 2 dias úteis para compensar. Vou conferir no seu extrato:"],
  },
  {
    id: "support_problem", label: "Problema técnico", action: "support", priority: 2,
    phrases: ["nao consigo entrar", "deu erro", "esta com problema", "nao funciona", "travou", "esta dando erro", "sistema fora do ar", "nao carrega", "nao abre", "bug no sistema", "nao consigo acessar", "esqueci a senha", "nao consigo logar", "preciso de ajuda tecnica", "esta lento", "tela branca", "nao consigo emitir", "nao salva", "deu problema"],
    keywords: [["problema", 3], ["senha", 2], ["acessar", 1.5], ["carrega", 1.5], ["funciona", 1.5], ["abre", 1.2]],
    replies: ["Poxa, sinto muito por isso! 😕 Vamos resolver. Vou abrir um atendimento de suporte para você."],
  },
  {
    id: "cancel", label: "Cancelamento", action: "handoff:Financeiro", priority: 3,
    phrases: ["quero cancelar", "cancelar minha assinatura", "quero cancelar o plano", "como cancelo", "encerrar minha conta", "nao quero mais o sistema", "quero sair", "cancelamento de contrato", "desistir do plano"],
    keywords: [["cancelar", 3]],
    replies: ["Sinto muito que você esteja pensando em sair 😔. Vou encaminhar para a nossa equipe, que verifica tudo com você e, se houver algo que possamos melhorar, a gente resolve."],
  },
  {
    id: "complaint", label: "Reclamação", action: "handoff:", priority: 4,
    phrases: ["quero fazer uma reclamacao", "estou insatisfeito", "pessimo atendimento", "isso e um absurdo", "estou muito chateado", "ninguem resolve", "ja reclamei varias vezes", "isso e uma vergonha"],
    keywords: [["reclamacao", 3]],
    replies: ["Lamento muito pelo transtorno, e obrigado por nos contar. 🙏 Quero que isso seja resolvido: vou passar o seu caso para uma pessoa da equipe agora mesmo, com prioridade."],
  },
  {
    id: "hire", label: "Contratar / orçamento", action: "handoff:Comercial", priority: 2,
    phrases: ["quero contratar", "quero um orcamento", "preciso de um sistema", "quero um site", "quero criar um aplicativo", "voces fazem sistema sob medida", "quanto fica para fazer um site", "quero uma proposta", "gostaria de contratar", "preciso de um site para minha empresa", "desenvolvem aplicativo", "quero automatizar meu negocio", "quero conhecer os servicos para contratar"],
    keywords: [["contratar", 2.5], ["proposta", 2], ["sob medida", 2], ["desenvolver", 1.5], ["site", 1], ["aplicativo", 1]],
    replies: ["Que legal! 🚀 Vou passar você para o nosso time comercial, que monta a melhor proposta para o seu negócio."],
  },
  {
    id: "change_data", label: "Alterar dados / plano", action: "handoff:Financeiro", priority: 1,
    phrases: ["quero trocar o cartao", "mudar a data de vencimento", "alterar meu plano", "atualizar meus dados", "trocar o e-mail do cadastro", "mudar o dia de pagamento", "alterar forma de pagamento", "quero mudar de plano", "trocar o vencimento", "atualizar cadastro", "quero trocar a data de vencimento", "alterar o vencimento", "mudar o vencimento da fatura", "adiar o vencimento", "trocar o dia do vencimento"],
    keywords: [["trocar", 1.5], ["alterar", 1.5], ["mudar", 1.5], ["atualizar", 1.5]],
    replies: ["Claro! Para alterar isso com segurança, vou chamar o nosso time para te ajudar. 😊"],
  },
  {
    id: "queue_status", label: "Quanto tempo falta?", action: "queue_status", priority: 1,
    phrases: ["quanto tempo falta", "quanto falta para me atender", "quanto falta para ser atendido", "quanto tempo ate me atenderem", "alguem vai me atender", "demora muito", "ainda vai demorar", "quantas pessoas na frente", "minha vez", "ninguem me atende", "ja estou esperando ha muito tempo", "qual minha posicao"],
    keywords: [["demora", 2], ["posicao", 2], ["fila", 2], ["falta", 2]],
  },
  {
    id: "price", label: "Preços e planos", action: "reply", priority: 1,
    phrases: ["quanto custa", "qual o valor", "quais os planos", "qual o preco", "valores", "tabela de precos", "quanto fica", "quanto e", "planos e precos", "qual a mensalidade do sistema", "quanto cobram", "qual o investimento", "tem plano mais barato", "preco do sistema", "valor do plano"],
    keywords: [["preco", 3], ["plano", 1.5]],
  },
  {
    id: "systems_overview", label: "Conhecer as soluções", action: "reply", priority: 1,
    phrases: ["quais sistemas voces tem", "o que voces fazem", "quais solucoes", "quais servicos", "me fala dos produtos", "o que a develoi faz", "voces vendem sistemas", "conhecer solucoes", "portfolio", "o que voces oferecem", "que tipo de servico voces fazem", "quem e a develoi", "sobre a empresa", "quais produtos"],
    keywords: [["solucao", 2], ["servico", 1.5], ["produto", 1.5], ["sistema", 1], ["develoi", 1.5]],
  },
  {
    id: "menu", label: "Voltar ao menu", action: "menu", priority: 2,
    phrases: ["voltar ao menu", "menu principal", "ver opcoes", "quais as opcoes", "o que voce faz", "o que voce pode fazer", "como voce pode me ajudar", "opcoes", "me ajuda", "preciso de ajuda", "voltar ao inicio"],
    keywords: [["menu", 3], ["opcoes", 2]],
    replies: ["Claro! Veja o que posso fazer por você: 👇"],
  },
];

// ─── Decisão ─────────────────────────────────────────────────────────────────

export const ACT_AT = 0.56;       // acima disso, age
export const ASK_AT = 0.38;       // entre os dois, pergunta "você quis dizer…?"

export interface Understanding {
  intent: Candidate | null;
  candidates: Candidate[];
  confidence: number;
  decision: "act" | "ask" | "none";
  entities: Entities;
  mood: Mood;
  greetingOnly: boolean;
}

export function understand(text: string, defs: IntentDef[], systems: { name: string; aliases?: string[] }[] = [], hintSystem?: string | null): Understanding {
  const entities = extractEntities(text, systems);
  const boostSystem = entities.system ?? hintSystem ?? undefined;
  const mood = readMood(text);
  const greetingOnly = isGreetingOnly(text);
  let candidates = rank(defs, text);

  // um sistema citado dá preferência às respostas daquele sistema
  if (boostSystem) {
    candidates = candidates.map(c => c.def.system && c.def.system === boostSystem ? { ...c, score: Math.min(1, c.score + 0.04) } : c).sort((a, b) => b.score - a.score);
  }

  const top = candidates[0] ?? null;
  let decision: Understanding["decision"] = "none";
  if (top) {
    const second = candidates[1];
    const close = second && top.score - second.score < 0.07 && top.score < 0.8 && (second.def.priority ?? 0) <= (top.def.priority ?? 0);
    decision = top.score >= ACT_AT && !close ? "act" : top.score >= ASK_AT ? "ask" : "none";
  }
  return { intent: top, candidates: candidates.slice(0, 4), confidence: top?.score ?? 0, decision, entities, mood, greetingOnly };
}
