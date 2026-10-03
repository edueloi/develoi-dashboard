// Contas simples para a BiIA ("quanto é 12 x 8", "10% de 250", "(5+3)*2"): avaliador próprio, sem eval.
const fmt = (n: number) => (Number.isInteger(n) ? n.toLocaleString("pt-BR") : n.toLocaleString("pt-BR", { maximumFractionDigits: 4 }));

type Tok = { t: "n"; v: number } | { t: "o"; v: string } | { t: "(" } | { t: ")" };

function tokenize(src: string): Tok[] | null {
  const s = src.replace(/,/g, ".").replace(/[x×]/gi, "*").replace(/[÷:]/g, "/").replace(/\s+/g, "");
  const out: Tok[] = [];
  for (let i = 0; i < s.length;) {
    const c = s[i];
    if (/[0-9.]/.test(c)) { let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++; const v = Number(s.slice(i, j)); if (Number.isNaN(v)) return null; out.push({ t: "n", v }); i = j; }
    else if ("+-*/^%".includes(c)) { out.push({ t: "o", v: c }); i++; }
    else if (c === "(") { out.push({ t: "(" }); i++; }
    else if (c === ")") { out.push({ t: ")" }); i++; }
    else return null;
  }
  return out;
}

const PREC: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2, "^": 3 };

function evaluate(tokens: Tok[]): number | null {
  const out: number[] = [], ops: string[] = [];
  const apply = (op: string): boolean => {
    const b = out.pop(), a = out.pop();
    if (a === undefined || b === undefined) return false;
    out.push(op === "+" ? a + b : op === "-" ? a - b : op === "*" ? a * b : op === "/" ? a / b : Math.pow(a, b));
    return true;
  };
  let prev: Tok | null = null;
  for (const tk of tokens) {
    if (tk.t === "n") out.push(tk.v);
    else if (tk.t === "(") ops.push("(");
    else if (tk.t === ")") { while (ops.length && ops[ops.length - 1] !== "(") if (!apply(ops.pop()!)) return null; if (!ops.length) return null; ops.pop(); }
    else if (tk.v === "%") { const a = out.pop(); if (a === undefined) return null; out.push(a / 100); }
    else {
      // sinal de menos/mais no começo ou depois de operador/parêntese
      if ((tk.v === "-" || tk.v === "+") && (!prev || prev.t === "o" || prev.t === "(")) { out.push(0); }
      while (ops.length && ops[ops.length - 1] !== "(" && PREC[ops[ops.length - 1]] >= PREC[tk.v]) if (!apply(ops.pop()!)) return null;
      ops.push(tk.v);
    }
    prev = tk;
  }
  while (ops.length) { const o = ops.pop()!; if (o === "(") return null; if (!apply(o)) return null; }
  return out.length === 1 && Number.isFinite(out[0]) ? out[0] : null;
}

// Devolve o texto da resposta se a mensagem for uma conta; senão null
export function mathAnswer(text: string): string | null {
  const t = text.trim().toLowerCase().replace(/[?=!]+$/g, "").trim();
  // "20% de 350"
  const pct = /^(?:quanto (?:e|é|fica|da|dá) )?(\d+(?:[.,]\d+)?)\s*%\s*de\s*(\d+(?:[.,]\d+)?)$/.exec(t);
  if (pct) { const p = Number(pct[1].replace(",", ".")), v = Number(pct[2].replace(",", ".")); return `${fmt(p)}% de ${fmt(v)} é *${fmt((p / 100) * v)}*.`; }
  const body = t.replace(/^(?:quanto (?:e|é|fica|da|dá|vale)|calcula|calcule|me ajuda com a conta|conta)\s*[:,]?\s*/, "");
  if (!/^[\d\s.,+\-*/x×÷:^()%]+$/.test(body)) return null;
  if (!/\d/.test(body) || !/[+\-*/x×÷:^%]/.test(body.replace(/^[\s-]+/, ""))) return null;
  const toks = tokenize(body);
  if (!toks) return null;
  const r = evaluate(toks);
  if (r === null) return null;
  return `${body.replace(/\s+/g, " ").replace(/\*/g, " x ").replace(/\s{2,}/g, " ").trim()} = *${fmt(Math.round(r * 1e6) / 1e6)}*`;
}
