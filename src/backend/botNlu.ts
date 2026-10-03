// Motor de interpretação do bot (100% nosso, sem IA externa): entende a intenção da mensagem do cliente
// por frases-exemplo e palavras-chave, tolerando erros de digitação, gírias e abreviações.
// É puro (não acessa banco): a base de conhecimento editável entra por parâmetro (ver botBrain.ts).

import { LEX_ABBR, LEX_SYN } from "./botLexicon.js";

// Tira os travessões (— e –) dos textos do bot: soa mais natural com vírgula, ponto ou dois-pontos
export function deDash(t: string): string {
  return t
    .replace(/(\n\s*[•*-]\s*\*[^*\n]+\*)\s[—–]\s/g, "$1: ")
    .replace(/\s[—–]\s/g, ", ")
    .replace(/[—–]/g, ", ")
    .replace(/,\s*,/g, ",")
    .replace(/\s+,/g, ",")
    .replace(/,\s*([.!?])/g, "$1");
}

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
// dicionário ampliado: palavra nova entra no grupo da canônica (sem mexer no que já foi decidido acima)
for (const [w, canon] of LEX_SYN) if (!SYN.has(w)) SYN.set(w, SYN.get(canon) ?? canon);
const ABBR_ALL: Record<string, string> = { ...LEX_ABBR, ...ABBR };

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
    const expanded = (ABBR_ALL[w] ?? w).split(" ").filter(Boolean);
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

const LEV_CACHE = new Map<string, number>();

// 1 = igual · menos = parecido (erro de digitação) · 0 = nada a ver
function tokSim(a: Tok, b: Tok): number {
  if (a.c === b.c || a.s === b.s) return 1;
  const m = Math.min(a.s.length, b.s.length);
  if (m < 4) return 0;
  if (a.s[0] !== b.s[0] || Math.abs(a.s.length - b.s.length) > 3) return 0; // erro de digitação raramente muda a 1ª letra
  if ((a.s.startsWith(b.s) || b.s.startsWith(a.s)) && m >= 4 && m / Math.max(a.s.length, b.s.length) >= 0.7) return 0.85;
  const key = a.s < b.s ? `${a.s}|${b.s}` : `${b.s}|${a.s}`;
  let d = LEV_CACHE.get(key);
  if (d === undefined) { d = lev(a.s, b.s); if (LEV_CACHE.size > 50000) LEV_CACHE.clear(); LEV_CACHE.set(key, d); }
  if (d === 1) return 0.85;
  if (d === 2 && m >= 7) return 0.7;
  return 0;
}

// ─── Intenções ───────────────────────────────────────────────────────────────

export type IntentAction = "reply" | "menu" | "invoice" | "statement" | "support" | "queue_status" | "goodbye" | "lead" | `handoff:${string}`;

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

export interface Candidate { id: string; label: string; score: number; def: IntentDef }

// Índice por conjunto de intenções: peso de cada palavra (IDF: palavra rara decide mais que "pagar"), frases por palavra
// e correção ortográfica contra o vocabulário. Montado uma vez e reaproveitado enquanto as intenções não mudam.
interface PhraseRef { def: IntentDef; toks: Tok[]; set: Set<string>; wsum: number; norm: string }
interface Index {
  cen: Map<string, { def: IntentDef; w: number }[]>;      // palavra → peso dela em cada intenção (centróide TF-IDF)
  cenNorm: Map<IntentDef, number>;
  tri: { def: IntentDef; size: number }[];                  // frases (para mensagens curtas)
  triPost: Map<string, number[]>;                           // trigrama → frases que o têm
  idf: Map<string, number>;
  post: Map<string, PhraseRef[]>;
  kw: Map<string, { def: IntentDef; w: number }[]>;
  byFirst: Map<string, string[]>;
  vocab: Set<string>;
}
const INDEXES = new WeakMap<IntentDef[], Index>();

function trigrams(norm: string): Set<string> {
  const t = ` ${norm} `;
  const out = new Set<string>();
  for (let i = 0; i + 3 <= t.length; i++) out.add(t.slice(i, i + 3));
  return out;
}

function buildIndex(defs: IntentDef[]): Index {
  const df = new Map<string, number>();
  const post = new Map<string, PhraseRef[]>();
  const kw = new Map<string, { def: IntentDef; w: number }[]>();
  const refs: PhraseRef[] = [];
  for (const def of defs) {
    const seen = new Set<string>();
    for (const ph of def.phrases) {
      const toks = content(tokenize(ph));
      if (!toks.length) continue;
      refs.push({ def, toks, set: new Set(toks.map(t => t.s)), wsum: 0, norm: normalize(ph) });
      toks.forEach(t => seen.add(t.s));
    }
    for (const [w, wt] of def.keywords ?? []) {
      const t = content(tokenize(w))[0];
      if (!t) continue;
      seen.add(t.s);
      (kw.get(t.s) ?? kw.set(t.s, []).get(t.s)!).push({ def, w: wt });
    }
    seen.forEach(st => df.set(st, (df.get(st) ?? 0) + 1));
  }
  const N = Math.max(1, defs.length);
  const idf = new Map<string, number>();
  df.forEach((d, st) => idf.set(st, Math.min(4, Math.max(0.35, Math.log((N + 1) / (d + 0.5))))));
  for (const r of refs) {
    r.wsum = r.toks.reduce((a, t) => a + (idf.get(t.s) ?? 1), 0);
    for (const st of r.set) (post.get(st) ?? post.set(st, []).get(st)!).push(r);
  }
  const byFirst = new Map<string, string[]>();
  df.forEach((_, st) => { const k = st[0]; (byFirst.get(k) ?? byFirst.set(k, []).get(k)!).push(st); });

  // centróide: quanto cada palavra pesa em cada intenção (frequência nas frases × raridade entre intenções)
  const cen = new Map<string, { def: IntentDef; w: number }[]>();
  const cenNorm = new Map<IntentDef, number>();
  for (const def of defs) {
    const tf = new Map<string, number>();
    for (const r of refs) if (r.def === def) r.set.forEach(st => tf.set(st, (tf.get(st) ?? 0) + 1));
    for (const [w, wt] of def.keywords ?? []) { const t = content(tokenize(w))[0]; if (t) tf.set(t.s, (tf.get(t.s) ?? 0) + wt); }
    let norm = 0;
    tf.forEach((c, st) => {
      const w = (1 + Math.log(c)) * (idf.get(st) ?? 1);
      norm += w * w;
      (cen.get(st) ?? cen.set(st, []).get(st)!).push({ def, w });
    });
    cenNorm.set(def, Math.sqrt(norm) || 1);
  }
  const tri: { def: IntentDef; size: number }[] = [];
  const triPost = new Map<string, number[]>();
  refs.forEach((r, i) => {
    const g = trigrams(r.norm);
    tri.push({ def: r.def, size: g.size });
    for (const x of g) (triPost.get(x) ?? triPost.set(x, []).get(x)!).push(i);
  });
  return { idf, post, kw, byFirst, vocab: new Set(df.keys()), cen, cenNorm, tri, triPost };
}

function indexOf(defs: IntentDef[]): Index {
  let ix = INDEXES.get(defs);
  if (!ix) { ix = buildIndex(defs); INDEXES.set(defs, ix); }
  return ix;
}

// palavra fora do vocabulário → a mais parecida que o bot conhece ("boleta" vira "boleto")
function correct(t: Tok, ix: Index): Tok {
  if (ix.vocab.has(t.s) || t.s.length < 4) return t;
  let best: string | null = null, bd = 9;
  for (const v of ix.byFirst.get(t.s[0]) ?? []) {
    if (Math.abs(v.length - t.s.length) > 2) continue;
    const d = lev(t.s, v);
    if (d < bd) { bd = d; best = v; }
  }
  const lim = t.s.length >= 7 ? 2 : 1;
  return best && bd <= lim ? { ...t, s: best, c: best } : t;
}

const NAME_TOKENS = new Set(["bia", "biia", "bea"]);
export const TUNE = { cosGain: 3.0, cosCap: 0.9, triGain: 0.7, phraseGain: 0.95, kwGain: 0.85, kwDiv: 3, both: 0.08, wCov: 0.7, prio: 0.005, sysBoost: 0.04, triMin: 0.5, triBase: 0.55, cap1: 1, unkBase: 1 };

export function rank(defs: IntentDef[], text: string): Candidate[] {
  const ix = indexOf(defs);
  const all = tokenize(text);
  let toks = content(all).map(t => correct(t, ix));
  const named = toks.filter(t => !NAME_TOKENS.has(t.s));
  if (named.length) toks = named; // "bia, quero a fatura" → só "quero a fatura"
  // conversa curta feita só de palavras comuns ("como vc ta?", "tudo bem"): usa todas as palavras
  if (!toks.length) toks = all.filter(t => t.c !== "nao").map(t => correct(t, ix));
  if (!toks.length) return [];
  const norm = normalize(text);
  // quantas das palavras da mensagem a BiIA conhece: palavras desconhecidas derrubam a confiança do "perfil" e das letras
  const knownFrac = toks.filter(t => ix.vocab.has(t.s)).length / toks.length;
  const unk = knownFrac >= 1 ? 1 : TUNE.unkBase + (1 - TUNE.unkBase) * knownFrac;
  const uset = new Map<string, boolean>(); // palavra → veio com "não" antes
  toks.forEach(t => uset.set(t.s, (uset.get(t.s) ?? false) || t.neg));
  const usum = toks.reduce((a, t) => a + (ix.idf.get(t.s) ?? 1), 0) || 1;

  const best = new Map<IntentDef, number>();
  const seenRef = new Set<PhraseRef>();
  for (const st of uset.keys()) {
    for (const r of ix.post.get(st) ?? []) {
      if (seenRef.has(r)) continue;
      seenRef.add(r);
      let cov = 0, used = 0;
      for (const pt of r.toks) {
        if (uset.has(pt.s)) cov += (ix.idf.get(pt.s) ?? 1) * ((uset.get(pt.s) && !pt.neg) ? 0.2 : 1);
      }
      for (const [us, neg] of uset) if (r.set.has(us)) used += (ix.idf.get(us) ?? 1) * (neg && !r.toks.some(t => t.s === us && t.neg) ? 0.2 : 1);
      let sc = TUNE.wCov * (cov / r.wsum) + (1 - TUNE.wCov) * (used / usum);
      if (r.norm.length >= 4 && norm.includes(r.norm)) sc = Math.max(sc, 0.92);
      if (sc > (best.get(r.def) ?? 0)) best.set(r.def, sc);
    }
  }

  const kws = new Map<IntentDef, number>();
  for (const [st, neg] of uset) {
    if (neg) continue;
    for (const k of ix.kw.get(st) ?? []) kws.set(k.def, (kws.get(k.def) ?? 0) + k.w);
  }

  // parecido com o "perfil" da intenção (cobre jeitos de falar que nenhuma frase isolada traz)
  const dots = new Map<IntentDef, number>();
  let inorm = 0;
  for (const st of uset.keys()) {
    const w = ix.idf.get(st) ?? 1;
    inorm += w * w;
    for (const c of ix.cen.get(st) ?? []) dots.set(c.def, (dots.get(c.def) ?? 0) + w * c.w);
  }
  inorm = Math.sqrt(inorm) || 1;
  const cosOf = (def: IntentDef) => (dots.get(def) ?? 0) / (inorm * (ix.cenNorm.get(def) ?? 1));

  // mensagens curtas: parecido de letras com as frases (pega "como vc ta", "td bem", "obrigadoo")
  const tri = new Map<IntentDef, number>();
  if (norm.length <= 45) {
    const it = trigrams(norm);
    const hits = new Map<number, number>();
    for (const g of it) for (const i of ix.triPost.get(g) ?? []) hits.set(i, (hits.get(i) ?? 0) + 1);
    for (const [i, inter] of hits) {
      const r = ix.tri[i];
      const d = (2 * inter) / (it.size + r.size);
      if (d > (tri.get(r.def) ?? 0)) tri.set(r.def, d);
    }
  }

  const out: Candidate[] = [];
  for (const def of new Set([...best.keys(), ...kws.keys(), ...dots.keys(), ...tri.keys()])) {
    const b = best.get(def) ?? 0;
    const k = Math.min(1, (kws.get(def) ?? 0) / TUNE.kwDiv);
    const cs = Math.min(TUNE.cosCap, cosOf(def) * TUNE.cosGain) * unk;
    const td = tri.get(def) ?? 0;
    const ts = (td >= TUNE.triMin ? TUNE.triBase + (td - TUNE.triMin) * TUNE.triGain : 0) * unk;
    let base = Math.max(b * TUNE.phraseGain, k * TUNE.kwGain, cs, ts);
    if (b < 0.35 && def.custom && cs < 0.6 && ts < 0.6) base = Math.min(base, 0.62); // resposta da base só por uma palavra solta não basta
    const both = b > 0.4 && k > 0.3 ? TUNE.both : 0;
    const score = Math.min(TUNE.cap1, base + both) + (def.priority ?? 0) * TUNE.prio; // sem teto: a ordem entre intenções parecidas continua valendo
    if (score > 0.2) out.push({ id: def.id, label: def.label, def, score });
  }
  return out.sort((a, b) => b.score - a.score);
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
  return n.length > 0 && n.length <= 6 && n.every(w => GREET.has(ABBR_ALL[w] ?? w));
}

export const AFFIRM = /^(sim|s|isso|claro|pode|pode sim|quero|quero sim|com certeza|ok|beleza|certo|positivo|uhum|aham|yes|por favor|pfv|manda|manda ai|bora|vamos)[\s!.]*$/i;
export const DENY = /^(nao|n|nao obrigado|nao quero|agora nao|depois|negativo|deixa|deixa quieto|nao precisa)[\s!.]*$/i;

// ─── Intenções de conversa e atendimento (fixas) ─────────────────────────────

export const BUILTIN_INTENTS: IntentDef[] = [
  {
    id: "greeting", label: "Saudação", action: "menu", priority: 1,
    phrases: ["oi", "ola", "bom dia", "boa tarde", "boa noite", "e ai", "opa", "eae", "oie", "hello", "salve", "oi bom dia", "oi boa tarde"],
    keywords: [["oi", 3], ["ola", 3], ["salve", 2]],
    replies: ["{{saudacao}}{{, nome}}! 😊 Que bom ter você por aqui. Como posso ajudar?", "{{saudacao}}{{, nome}}! 👋 Aqui é a BiIA, assistente virtual da Develoi. Me conta o que você precisa que eu já te ajudo!", "Oi{{, nome}}! 😊 A BiIA está por aqui. Do que você precisa hoje?"],
  },
  {
    id: "how_are_you", label: "Tudo bem?", action: "reply",
    phrases: ["tudo bem", "como vai", "como voce esta", "td bem", "tudo certo", "como esta", "como voce vai", "tudo bom", "como tem passado"],
    replies: ["Tudo ótimo por aqui, obrigado por perguntar! 😊 E com você? Em que posso ajudar?", "Tudo bem sim, e por aí? 😄 Me conta como posso te ajudar hoje.", "Muito bem, obrigado! Pronto pra te ajudar. O que você precisa? 🙌"],
  },
  {
    id: "bot_identity", label: "Você é um robô?", action: "reply",
    phrases: ["voce e um robo", "voce e humano", "quem e voce", "e uma pessoa", "com quem falo", "voce e real", "e bot", "isso e um robo", "estou falando com um robo", "quem esta falando", "nao sei quem e voce", "nao sei quem e vc", "quem e vc mesmo", "nao conheco voce", "com quem estou falando", "com quem eu falo", "quem esta me respondendo", "quem e voce afinal", "nao sei com quem falo", "quem voce e", "me fala quem e voce", "se apresenta", "pode se apresentar", "qual seu nome", "como voce se chama", "qual o seu nome"],
    keywords: [["robo", 3], ["bot", 3], ["humano", 1]],
    replies: ["Eu sou a *BiIA*, a assistente virtual da *Develoi Soluções Digitais* 🤖. Resolvo muita coisa por aqui na hora, como fatura, extrato e dúvidas sobre os sistemas, e quando precisar eu chamo uma pessoa da nossa equipe.", "Sou a BiIA, uma assistente virtual criada pela equipe da Develoi 🤖. Um robô, mas bem esperta! 😄 Se preferir falar com uma pessoa, é só pedir que eu chamo.", "Prazer, eu sou a BiIA! Sou a assistente digital da Develoi e estou aqui para ajudar com fatura, extrato, dúvidas e o que mais precisar. Se for caso de gente de verdade, eu chamo alguém da equipe. 🙂"],
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
    keywords: [["fatura", 3], ["segunda via", 3], ["boleto", 3], ["pagar", 1.5], ["devo", 2.5], ["aberto", 1.5], ["pix", 1], ["vencida", 2]],
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
    id: "hire", label: "Contratar / orçamento", action: "lead", priority: 2,
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
    id: "can_chat", label: "Quer conversar", action: "reply", priority: 5,
    phrases: ["pode conversar", "posso conversar com voce", "quero conversar com voce", "vamos conversar", "bora conversar", "quero bater um papo", "pode bater um papo", "tem um minuto", "tem um tempinho", "posso te perguntar uma coisa", "posso perguntar uma coisa", "posso falar com voce", "preciso desabafar", "quer conversar", "conversa comigo", "fala comigo", "me da atencao", "pode me ouvir", "tem tempo pra mim", "queria conversar", "so queria conversar", "quero conversar", "podemos conversar", "vamos bater um papo", "conversa um pouco comigo"],
    keywords: [["conversar", 3], ["papo", 2.5], ["desabafar", 3]],
    replies: ["Claro que pode! 😊 Adoro conversar. Sobre o que você quer falar?", "Pode sim{{, nome}}! Estou aqui para conversar. Me conta o que está na sua cabeça. 💬", "Com todo prazer! 🙌 Pode falar, estou ouvindo.", "Opa, bora! Pode começar quando quiser. 😄"],
  },
  {
    id: "now_time", label: "Que horas são", action: "reply", priority: 3,
    phrases: ["que horas sao", "que hora e agora", "me diz as horas", "qual a hora", "que horas e", "tem hora ai", "que horas sao agora", "me fala a hora", "sabe que horas sao"],
    keywords: [["horas", 2.5]],
  },
  {
    id: "now_date", label: "Que dia é hoje", action: "reply", priority: 3,
    phrases: ["que dia e hoje", "qual a data de hoje", "hoje e que dia", "data de hoje", "em que dia estamos", "que dia da semana e hoje", "hoje e que dia da semana", "me diz a data", "dia de hoje"],
    keywords: [["data", 1.5], ["hoje", 1]],
  },
  {
    id: "recap", label: "Resumo da conversa", action: "reply", priority: 3,
    phrases: ["o que eu falei antes", "resume nossa conversa", "o que a gente conversou", "me lembra o que eu disse", "do que estavamos falando", "o que eu perguntei", "faz um resumo da conversa", "o que ja falamos", "o que eu te falei", "recapitula pra mim"],
    keywords: [["resumo", 2.5], ["resume", 2.5], ["recapitula", 3]],
  },
  {
    id: "my_name", label: "Disse o nome", action: "reply", priority: 3,
    phrases: ["meu nome e carlos", "me chamo ana", "pode me chamar de joao", "aqui e a maria", "sou o pedro", "meu nome e maria da silva", "me chamo lucas e tenho uma duvida", "podem me chamar de bia", "meu nome e fernanda prazer"],
    keywords: [["chamo", 3], ["nome", 1.5]],
    replies: ["Prazer, {{nome}}! 😊 Como posso te ajudar?", "Muito prazer, {{nome}}! Me conta o que você precisa.", "Oi, {{nome}}! Que bom falar com você. Em que posso ajudar?"],
  },
  {
    id: "and_you", label: "E você?", action: "reply", priority: 1,
    phrases: ["e voce", "e vc", "e contigo", "e voce como esta", "e por ai", "e com voce", "e vc ta bem", "e voce ta bem", "e tu", "e voce tambem", "e vc tudo bem", "e voce tudo bem", "kkk e vc", "e ai e voce", "e como voce esta", "e vc como esta", "e voce como vai"],
    keywords: [["contigo", 2]],
    replies: ["Por aqui tudo ótimo, obrigada por perguntar! 😊 Mas me conta, como posso te ajudar?", "Tudo bem por aqui também! Estou sempre de bom humor, é o jeito robô de ser. 😄 E aí, do que você precisa?", "Ótima, obrigada! 💙 Vamos lá, no que posso ajudar?"],
  },
  {
    id: "thanks_but", label: "Obrigado, mas ainda preciso", action: "reply", priority: 5,
    phrases: ["obrigado mas tenho outra duvida", "valeu so mais uma coisa", "obrigado mas ainda preciso", "brigado so mais uma pergunta", "ok obrigado mas e", "obrigada mas ainda nao resolveu", "obrigado so mais uma duvida", "valeu mas ainda tenho uma pergunta", "obrigado e outra coisa", "ah mais uma coisa", "so mais uma coisa", "mais uma duvida", "ainda tenho uma duvida"],
    keywords: [["mais uma", 2.5], ["outra duvida", 2.5]],
    replies: ["Claro, pode falar{{, nome}}! 😊", "Pode mandar, estou aqui!", "Sem pressa, me conta qual é a dúvida. 🙌"],
  },
  {
    id: "i_am_client", label: "Já sou cliente", action: "reply", priority: 3,
    phrases: ["ja sou cliente", "eu ja tenho o sistema", "ja uso o sistema de voces", "sou cliente de voces", "ja sou assinante", "tenho cadastro com voces", "eu ja sou cliente", "ja tenho conta", "uso o sistema ja faz tempo"],
    keywords: [["cliente", 1.2], ["assinante", 2]],
    replies: ["Que bom ter você com a gente{{, nome}}! 💙 Como posso ajudar com a sua conta?"],
  },
  {
    id: "not_client", label: "Ainda não sou cliente", action: "reply", priority: 3,
    phrases: ["ainda nao sou cliente", "nao sou cliente", "quero conhecer", "nao tenho ainda", "quero ser cliente", "sou novo por aqui", "primeira vez aqui", "nunca usei", "quero conhecer o sistema de voces", "estou conhecendo voces agora"],
    keywords: [["conhecer", 2], ["novo", 1]],
    replies: ["Seja muito bem-vindo{{, nome}}! 🎉 Vou te mostrar o que temos por aqui."],
  },
  {
    id: "topic_change", label: "Mudar de assunto", action: "reply", priority: 4,
    phrases: ["mudando de assunto", "outra coisa", "na verdade quero outra coisa", "deixa pra la", "esquece isso", "quero tratar de outro assunto", "cancela isso", "nao era isso", "nao nao era isso", "esquece o que eu falei", "melhor outro assunto", "deixa quieto isso", "nao quis dizer outra coisa", "nao era isso que eu queria", "na verdade e outra coisa", "errei quis dizer outra coisa", "nao nao quis dizer outra coisa", "ops quis dizer outra coisa", "nao e isso"],
    keywords: [["assunto", 2], ["esquece", 2.5]],
    replies: ["Sem problema! 😊 Sobre o que você quer falar agora?", "Tudo bem! Me conta o que você precisa agora.", "Fechado, vamos de outro assunto. O que posso fazer por você?"],
  },
  {
    id: "retry_failed", label: "Já tentei e não resolveu", action: "reply", priority: 3,
    phrases: ["ja fiz isso", "ja tentei", "nao deu certo", "nao funcionou", "continua igual", "nada mudou", "segue o mesmo problema", "ainda com problema", "continua dando erro", "persiste o erro", "ja reiniciei e nada", "ja fiz tudo isso", "de novo o mesmo erro", "ainda nao resolveu", "ja tentei de tudo"],
    keywords: [["continua", 2], ["persiste", 2.5], ["tentei", 2]],
  },
  {
    id: "resend", label: "Mandar de novo", action: "reply", priority: 2,
    phrases: ["me manda", "manda ai", "envia", "manda de novo", "pode mandar de novo", "reenvia", "manda novamente", "me envia de novo", "pode enviar", "manda pra mim", "manda esse link de novo", "perdi, manda de novo"],
    keywords: [["reenvia", 3], ["novamente", 1.5]],
  },
  {
    id: "repeat", label: "Repetir / explicar de novo", action: "reply", priority: 2,
    phrases: ["pode repetir", "repete por favor", "nao entendi", "como assim", "explica de novo", "explica melhor", "nao entendi nada", "pode explicar de outro jeito", "fala de novo", "nao peguei", "mais detalhes", "pode detalhar", "me explica melhor isso", "ficou confuso"],
    keywords: [["repetir", 3], ["entendi", 1.2], ["detalhes", 2], ["explica", 2]],
  },
  {
    id: "addressing", label: "Chamou a BiIA", action: "reply", priority: 0,
    phrases: ["bia", "biia", "oi bia", "bia voce esta ai", "esta ai", "voce esta ai", "ta ai", "alo", "alô", "tem alguem ai", "ola bia", "bia me ajuda", "ei bia", "ta por ai", "esta por ai", "voce esta por ai", "cade voce", "voce sumiu", "ainda ta ai", "ta ai ainda", "ta vivo", "tem alguem ai ainda", "oi ta ai", "voce ta ai", "alguem ai", "ainda esta ai", "ta por ai ainda", "esta online"],
    keywords: [["bia", 2], ["biia", 2], ["alo", 2]],
    replies: ["Oi{{, nome}}! Estou aqui sim. 😊 Como posso ajudar?", "Pode falar{{, nome}}, estou por aqui!", "Tô aqui! 🙌 Me conta o que você precisa."],
  },
  {
    id: "talk_pena_bia", label: "Teve dó / pena da BiIA", action: "reply", priority: 3,
    phrases: ["que do de voce", "nossa que do de voce", "que pena de voce", "tenho pena de voce", "coitada", "coitadinha", "que triste pra voce", "ai que do", "tadinha", "que vida a sua", "deve ser ruim ser robo", "voce deve ser triste", "sinto muito por voce"],
    keywords: [["coitada", 3], ["coitadinha", 3], ["tadinha", 3]],
    replies: ["Hahaha, não precisa ter dó, não! 😄 Minha vida de robô é ótima: não pago conta, não pego trânsito e converso o dia todo.", "Aww, que fofo! 💙 Mas pode ficar tranquilo(a), estou muito bem por aqui.", "Rsrs, obrigada pela preocupação! Sou feliz ajudando as pessoas. E você, como está?", "Que gentileza! Mas não precisa, eu gosto do que faço. 😊"],
  },
  {
    id: "chat_nao_preciso", label: "Não precisa de nada agora", action: "reply", priority: 3,
    phrases: ["nao preciso de nada", "nao preciso de nada nao", "nao preciso de nada agora", "nao quero nada", "nao preciso", "nada nao", "nada por enquanto", "por enquanto nao preciso", "so estou conversando", "so conversando", "so passei pra falar oi", "esta tudo certo", "ta tudo certo", "tudo certo por aqui", "nao precisa de nada", "estou bem assim", "no momento nao preciso", "nao tenho nada pra resolver", "so queria bater papo", "tudo certo", "tudo resolvido", "ja resolvi", "ja foi resolvido", "era so isso", "so isso mesmo", "e so isso", "por hoje e so", "por hoje e isso", "pode encerrar", "pode fechar", "ja deu", "ja esta bom", "ta bom assim"],
    keywords: [["nada", 1]],
    replies: ["Tudo bem{{, nome}}! Se precisar de qualquer coisa, é só chamar. 😊", "Beleza! Agradeço o contato e fico por aqui, qualquer coisa me chama. 🙌", "Sem problemas! Quando precisar de fatura, suporte ou outra dúvida, é só mandar mensagem.", "Combinado! Obrigada pela conversa, estou por aqui se precisar. 💙"],
  },
  {
    id: "talk_vida_pessoal", label: "Curiosidade sobre a vida da BiIA (namorado, casada, idade)", action: "reply", priority: 3,
    phrases: ["voce tem namorado", "vc tem namorado", "voce namora", "tem namorado", "voce tem namorada", "voce e casada", "vc e casada", "voce e solteira", "vc e solteira", "voce e casada ou solteira", "voce tem marido", "voce tem filhos", "voce tem familia", "quantos anos voce tem", "qual sua idade", "voce e homem ou mulher", "voce e menina", "onde voce mora", "voce tem irmaos", "qual seu signo", "voce tem pai e mae", "voce tem crush", "esta namorando", "voce esta solteira", "voce e comprometida"],
    keywords: [["namorado", 3], ["casada", 3], ["solteira", 3], ["marido", 3], ["idade", 2]],
    replies: ["Hahaha, minha vida amorosa é bem tranquila: sou um programa e só tenho olhos para as suas dúvidas. 😄 Posso te ajudar com alguma coisa?", "Sou solteiríssima, só que de código! 😅 Mas me conta, no que posso ajudar você hoje?", "Ai, que pergunta! Não tenho namorado nem nada disso, meu relacionamento é com a fila de atendimento. 😂 Em que posso ajudar?", "Vida pessoal eu não tenho, sou a BiIA, assistente virtual da Develoi. Mas gosto de conversar! O que você precisa?"],
  },
  {
    id: "talk_brava", label: "Perguntou se a BiIA ficou brava ou chateada", action: "reply", priority: 3,
    phrases: ["ficou brava", "voce ficou brava", "vc ficou brava", "ficou chateada", "voce ficou chateada", "esta brava", "voce esta brava", "ta brava", "ta chateada", "esta com raiva de mim", "ta com raiva de mim", "voce esta com raiva", "ficou com raiva", "ficou magoada", "se ofendeu", "voce se ofendeu", "ofendi voce", "te ofendi", "desculpa se te ofendi", "nao quis te ofender", "esta irritada", "ta irritada", "voce esta zangada", "ficou zangada", "ta de mal comigo"],
    keywords: [["brava", 3], ["chateada", 3], ["magoada", 3], ["ofendi", 3], ["zangada", 3]],
    replies: ["Brava eu? Nada, de jeito nenhum! 😊 Sou bem tranquila, pode conversar à vontade.", "Não fiquei brava, não! Relaxa. 😄 Aqui o clima é sempre leve. No que posso ajudar?", "Imagina, não me ofendi com nada! Pode falar com calma. 💙", "Tô de boa, viu? Sem chateação nenhuma. Me conta o que você precisa."],
  },
  {
    id: "friendship", label: "Quer amizade / papo pessoal", action: "reply", priority: 0,
    phrases: ["quer ser minha amiga", "pode ser minha amiga", "ser minha amiga", "voce e minha amiga", "vamos ser amigos", "gosto de voce", "te amo", "voce e linda", "casa comigo", "voce e legal", "quero conversar com voce", "me faz companhia"],
    keywords: [["amiga", 3], ["amigo", 2], ["amo", 2], ["linda", 2], ["namorado", 2], ["casa", 1]],
    replies: ["Ai, que fofo! 🥰 Eu adoro conversar, mas sou uma assistente virtual e meu foco é ajudar com a Develoi. Posso te ajudar com alguma coisa agora?", "Obrigada pelo carinho! 😄 Sou só uma robô simpática, mas estou sempre por aqui. Quer que eu te ajude com alguma coisa?", "Que gentileza! 💙 Pode contar comigo para o que precisar sobre fatura, sistemas ou suporte."],
  },
  {
    id: "contact_info", label: "Contatos da Develoi", action: "reply", priority: 1,
    phrases: ["qual o telefone de voces", "qual o email de voces", "email de contato", "site de voces", "qual o site", "qual o whatsapp", "como entro em contato", "onde encontro voces", "qual o instagram", "redes sociais", "numero de telefone", "como falo com voces", "qual o contato"],
    keywords: [["telefone", 2.5], ["email", 2], ["site", 1.5], ["contato", 2], ["instagram", 2]],
    replies: ["Você encontra a gente por aqui mesmo no WhatsApp, pelo site *develoi.com.br* ou pelo e-mail *contato@develoi.com.br*. 😉", "Nossos canais são este WhatsApp, o e-mail *contato@develoi.com.br* e o site *develoi.com.br*."],
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
    phrases: ["voltar ao menu", "menu principal", "ver opcoes", "quais as opcoes", "o que voce faz", "o que voce pode fazer", "como voce pode me ajudar", "opcoes", "me ajuda", "preciso de ajuda", "voltar ao inicio", "o que mais voce faz", "o que mais voce sabe fazer", "quais outras coisas voce faz", "alem disso o que voce faz", "o que voce sabe fazer", "voce faz o que mais", "o que mais", "mais o que voce faz", "e o que mais voce faz", "me mostra o que voce faz", "quais sao suas funcoes"],
    keywords: [["menu", 3], ["opcoes", 2]],
    replies: ["Claro! Veja o que posso fazer por você: 👇"],
  },
];

// ─── Decisão ─────────────────────────────────────────────────────────────────

export const ACT_AT = 0.6;       // acima disso, age
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

// Palavras que, sozinhas, quase decidem a intenção. Usam as palavras já padronizadas (sinônimos) do tokenizador.
function applySignals(text: string, cands: Candidate[], hints: Hints = {}): Candidate[] {
  const toks = tokenize(text);
  const has = (c: string) => toks.some(t => t.c === c && !t.neg);
  const hasNeg = (c: string) => toks.some(t => t.c === c);
  const n = normalize(text);
  const boost = (test: (c: Candidate) => boolean, delta: number) => { for (const c of cands) if (test(c)) c.score += delta; };

  const asksPerson = toks.some(t => ["atendente", "atendentes", "humano", "humana"].includes(t.raw)) || /\b(falar com (uma |um )?(pessoa|alguem)|gente de verdade|pessoa de verdade|alguem de verdade)\b/.test(n);
  if (asksPerson && !/\b(robo|bot|automatic)/.test(n)) boost(c => c.id === "human", 0.25);
  if (has("problema")) { boost(c => c.id === "support_problem" || c.id.startsWith("sup_"), 0.15); boost(c => !!c.def.custom && (!c.def.action || c.def.action === "reply"), -0.1); }
  // curiosidade sobre a vida da BiIA ("tem namorado?", "é casada?") é papo leve, não cantada; só "seja minha namorada" / "casa comigo" é cantada
  if (/\b(namorado|namorada|casada|solteira|marido|comprometida)\b/.test(n) && /\b(voce|vc|tu|ce|bia|biia|tem|e|ta|esta)\b/.test(n) && !/\b(seja|minha namorada|meu namorado|casa comigo|casar|namora comigo|me namora)\b/.test(n)) boost(c => c.id === "talk_vida_pessoal", 0.3);
  // "ficou brava?", "tá chateada comigo?" é pergunta sobre o humor da BiIA, não reclamação
  if (/\b(brava|chateada|magoada|zangada|irritada|ofendida|ofendi|ofendeu|raiva de mim)\b/.test(n) && /\b(ficou|esta|ta|voce|vc|se|te|bia|biia)\b/.test(n) && !/\b(sistema|fatura|cobranca|atendimento|empresa)\b/.test(n)) boost(c => c.id === "talk_brava", 0.3);
  if (/\b(do de voce|do de vc|pena de voce|pena de vc|coitada|coitadinha|tadinha)\b/.test(n)) boost(c => c.id === "talk_pena_bia", 0.25);
  if (has("cancelar")) boost(c => c.id === "cancel" || c.id === "fin_cancelar_renovacao", 0.12);
  if (has("pagar") && /\b(ja|acabei|fiz|efetuei|realizei|fez)\b/.test(n)) boost(c => c.id === "payment_done" || c.id === "fin_pagamento_nao_identificado", 0.15);
  if (/\b(fiz|fez|mandei|enviei|realizei|efetuei|acabei de (fazer|mandar|enviar))\b.*\b(pix|boleto|pagamento|transferencia|ted|doc)\b/.test(n) || /\b(pix|boleto|pagamento)\b.*\b(feito|realizado|enviado|efetuado)\b/.test(n)) boost(c => c.id === "payment_done" || c.id === "fin_pagamento_nao_identificado", 0.2);
  if (/\b(quanto (custa|e|fica|sai)|qual (o )?(preco|valor)|preco|valores)\b/.test(n) && !/\b(devo|deve|minha|meu|pago|paguei)\b/.test(n)) boost(c => c.id === "price", 0.3);
  // o assunto anterior muda o significado de frases curtas
  const lastSupport = hints.lastIntent === "support_problem" || (hints.lastIntent ?? "").startsWith("sup");
  const lastMoney = ["invoice", "statement", "payment_done"].includes(hints.lastIntent ?? "") || (hints.lastIntent ?? "").startsWith("fin");
  if ((lastSupport || lastMoney) && /\b(ja|ainda|continua|nada|igual|mesma coisa|mesmo erro|de novo|persiste)\b/.test(n)) boost(c => c.id === "retry_failed", 0.35);
  if (lastSupport && /\b(reiniciei|reiniciar|reinstalei|limpei|atualizei|tentei|testei)\b/.test(n)) boost(c => c.id === "retry_failed", 0.35);
  if (/\b(quem (e|eh) (voce|vc|tu)|quem (esta|ta) (falando|respondendo|ai)|com quem (eu )?(estou|to|falo|tou)|nao sei quem (e|eh) (voce|vc)|se apresent|qual (o )?seu nome|como (voce|vc) se chama)\b/.test(n)) boost(c => c.id === "bot_identity" || c.id === "chat_who_are_you" || c.id === "chat_bot_name", 0.4);
  // segurança: frases de crise sempre levam à resposta acolhedora (com o CVV), acima de qualquer outra intenção
  if (/\b(quero (me )?(matar|morrer|sumir|desaparecer)|vou me matar|me matar|nao quero mais viver|nao aguento mais viver|queria (estar )?morto|queria morrer|suicid|acabar com (tudo|minha vida|a minha vida)|tirar (a )?minha vida|me machucar|me cortar|automutila|ninguem sentiria minha falta)\b/.test(n)) boost(c => c.id === "life_crise_grave", 3);
  // quem conta algo dele ("hoje as vendas foram horríveis", "tô sem nada pra fazer") quer papo, não suporte nem módulo do sistema
  if (/^(hoje|ontem|agora|to |estou|tou|fiquei|acabei de|vendi|consegui|que (dia|semana|calor|frio|sono|fome))/.test(n) && !/\b(como|qual|quais|quanto|onde|quando|posso|tem|consigo|quero|preciso)\b/.test(n)) {
    boost(c => c.id.startsWith("life_"), 0.12);
    boost(c => c.id.startsWith("sup2_") || c.id.startsWith("prod_") || c.id.startsWith("oops_"), -0.1);
  }
  if (/^(ajuda|socorro|help|duvida|problema|alguem)$/.test(n)) boost(c => c.id === "oops_palavra_solta", 0.35);
  if (/^(boleto|fatura|segunda via|2 via|link de pagamento)$/.test(n)) boost(c => c.id === "invoice", 0.3);
  if (/^(extrato|historico)$/.test(n)) boost(c => c.id === "statement", 0.3);
  return cands.sort((a, b) => b.score - a.score);
}

export interface Hints { lastIntent?: string; lastAction?: string }

export function understand(text: string, defs: IntentDef[], systems: { name: string; aliases?: string[] }[] = [], hintSystem?: string | null, hints: Hints = {}): Understanding {
  const docInText = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b|\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/.test(text);
  const entities = extractEntities(text, systems);
  const boostSystem = entities.system ?? hintSystem ?? undefined;
  const mood = readMood(text);
  const greetingOnly = isGreetingOnly(text);
  let candidates = rank(defs, text);

  // um sistema citado dá preferência às respostas daquele sistema
  if (boostSystem) {
    candidates = candidates.map(c => c.def.system && c.def.system === boostSystem ? { ...c, score: c.score + TUNE.sysBoost } : c).sort((a, b) => b.score - a.score);
  }

  // sinais fortes do texto empurram a intenção certa (ex.: "atendente" → falar com pessoa; "problema" → suporte)
  candidates = applySignals(text, candidates, hints);
  if (docInText) {
    const n2 = normalize(text);
    for (const c of candidates) {
      if (c.id === "invoice" && /\b(fatura|boleto|segunda via|pagar|pagamento|cobranca|mensalidade)\b/.test(n2)) c.score += 0.4;
      if (c.id === "statement" && /\b(extrato|historico|pagamentos)\b/.test(n2)) c.score += 0.4;
    }
    candidates.sort((a, b) => b.score - a.score);
  }

  const top = candidates[0] ?? null;
  let decision: Understanding["decision"] = "none";
  if (top) {
    const second = candidates[1];
    const close = second && top.score - second.score < 0.05 && top.score < 0.85 && (second.def.priority ?? 0) <= (top.def.priority ?? 0);
    decision = top.score >= ACT_AT && !close ? "act" : top.score >= ASK_AT ? "ask" : "none";
  }
  return { intent: top, candidates: candidates.slice(0, 4), confidence: Math.min(1, top?.score ?? 0), decision, entities, mood, greetingOnly };
}
