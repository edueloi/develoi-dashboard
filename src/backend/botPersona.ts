// Camada de "personalidade" da BiIA: guarda o que a pessoa conta sobre si (nome, ramo), reage ao jeito de falar
// (formal ou descontraído, animado ou chateado) e conduz o papo com naturalidade, sem sair do assunto da Develoi.
import { strip } from "./botNlu.js";

export interface Facts { nome?: string; ramo?: string }
export interface Style { formal: boolean; casual: number; msgs: number }

const NOT_NAMES = new Set(["cliente", "dono", "dona", "responsavel", "novo", "nova", "assinante", "usuario", "usuaria", "aqui", "um", "uma", "da", "do", "de", "o", "a", "e", "voce", "robo", "bot", "pessoa", "gerente", "funcionario", "funcionaria", "vendedor", "vendedora", "proprietario", "proprietaria", "socio", "socia", "financeiro", "comercial", "suporte"]);
const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();

const RAMOS = "loja|lojinha|mercadinho|mercearia|padaria|salao|barbearia|clinica|consultorio|restaurante|lanchonete|oficina|farmacia|pet ?shop|papelaria|boutique|distribuidora|escritorio|escola|academia|brecho|revenda|ecommerce|e-commerce|armarinho|conveniencia|floricultura|otica|autopecas|auto ?pecas|material de construcao|sorveteria|hamburgueria|pizzaria|confeitaria|cafeteria";

// Pega o que a pessoa conta de si: "meu nome é Carlos", "tenho uma loja de roupas"
export function extractFacts(text: string, facts: Facts): Facts {
  const out: Facts = { ...facts };
  const raw = text.trim();
  const flat = strip(raw);

  const nm = /\b(?:meu nome e|me chamo|pode me chamar de|podem me chamar de|aqui e|sou)\s+(?:a\s+|o\s+)?([a-z]{3,})/.exec(flat);
  if (nm) {
    const piece = raw.slice(nm.index + nm[0].length - nm[1].length).trim().split(/\s+/)[0]?.replace(/[.,!?]/g, "") ?? "";
    const w = strip(piece).replace(/[^a-z]/g, "");
    if (w.length >= 3 && !NOT_NAMES.has(w) && /^[A-Za-zÀ-ÿ'-]+$/.test(piece)) out.nome = cap(piece);
  }

  const rm = new RegExp(`\\b(?:tenho|possuo|minha|meu|trabalho com|trabalho em|sou dono de|sou dona de|dono de|dona de|abri|abrir)\\s+(?:uma?\\s+|o\\s+|a\\s+)?((?:${RAMOS})(?:\\s+d[aeo]s?\\s+[a-z]+)?)`).exec(flat);
  if (rm) out.ramo = rm[1].replace(/\s+/g, " ").slice(0, 40);
  return out;
}

const FORMAL = /\b(prezad[oa]s?|senhor[a]?|cordialmente|atenciosamente|solicito|venho por meio|gostaria de|poderiam|poderia|por gentileza|obrigad[oa] pela atencao|tudo bem com (?:o|a) senhor)/;
const CASUAL = /\b(kk+|rs+|haha+|mano|vei|veio|blz|vlw|tmj|fala|eae|eai|opa|tranquilo|suave|mds|vc|vcs|pq|tbm|q)\b/;

export function readStyle(text: string, style: Style): Style {
  const f = strip(text);
  const s = { ...style, msgs: style.msgs + 1 };
  if (FORMAL.test(f)) s.formal = true;
  if (CASUAL.test(f) || /[\u{1F600}-\u{1F64F}\u{1F900}-\u{1F9FF}]/u.test(text)) { s.casual += 1; if (s.casual >= 2) s.formal = false; }
  return s;
}

// Fala mais formal quando a pessoa fala assim (sem gírias e sem excesso de emoji)
export function adaptStyle(text: string, style: Style): string {
  if (!style.formal) return text;
  let out = text
    .replace(/\bTô\b/g, "Estou").replace(/\btô\b/g, "estou").replace(/\bpra\b/g, "para").replace(/\bPra\b/g, "Para")
    .replace(/\bvc\b/gi, "você").replace(/\bBeleza!\s*/g, "Certo. ").replace(/\bOpa!?\s*/g, "");
  let seen = 0;
  out = out.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, m => (++seen <= 1 ? m : ""));
  return out.replace(/\s{2,}/g, " ").trim();
}

const pickOf = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];

// Uma frase curta de reação antes da resposta (só às vezes, para não virar tique)
export function leadIn(text: string, angry: boolean): string | null {
  if (angry || Math.random() > 0.55) return null;
  const f = strip(text);
  const words = f.split(/\s+/).filter(Boolean).length;
  if (/\b(vendi|consegui|fechei|deu certo|funcionou|resolveu|resolvido|gostei|adorei|amei|bateu a meta|bombou)\b/.test(f)) {
    return pickOf(["Que notícia boa! 🎉", "Opa, que bom saber disso! 😊", "Fico muito feliz com isso!"]);
  }
  if (/\b(cansad[oa]|estressad[oa]|preocupad[oa]|aflit[oa]|nervos[oa]|desanimad[oa]|sobrecarregad[oa]|perdid[oa])\b/.test(f)) {
    return pickOf(["Imagino como está sendo corrido. 💙", "Entendo, vamos descomplicar isso juntos.", "Poxa, fica tranquilo(a) que eu te ajudo."]);
  }
  if (words >= 22) return pickOf(["Entendi, obrigada por explicar com tantos detalhes!", "Obrigada por contar tudo isso, ajuda muito.", "Show, agora ficou bem claro pra mim."]);
  if (words >= 10 && Math.random() < 0.35) return pickOf(["Entendi!", "Certo, vamos lá.", "Perfeito, deixa eu ver isso."]);
  return null;
}

// Quando o papo social se estende, devolve o foco com delicadeza
export const STEER = [
  "Mas me conta, posso te ajudar com alguma coisa da Develoi? Fatura, extrato, dúvidas sobre os sistemas ou suporte. 😉",
  "Adoro conversar, viu? Se precisar de algo da Develoi, como fatura, extrato ou ajuda com o sistema, é só falar. 🙌",
];

// Perguntas de curiosidade que puxam o assunto para a necessidade real da pessoa
export function curiosity(asked: string[], facts: Facts): { key: string; text: string } | null {
  if (!facts.ramo && !asked.includes("ramo")) return { key: "ramo", text: pickOf(["Por curiosidade, qual é o ramo do seu negócio? Assim eu te indico melhor. 🏪", "Me conta uma coisa: o que você vende ou faz no seu negócio? Quero te ajudar do jeito certo. 😊"]) };
  return null;
}
