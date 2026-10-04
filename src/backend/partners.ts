// Sociedade & Lucros: o que sobra de Contas a Receber menos Contas a Pagar vira o lucro, dividido entre os sócios pelas porcentagens.
// Duas bases de cálculo:
//   planned (padrão): tudo que vence no mês. Contas a receber (assinaturas + avulsas) menos contas a pagar, já recebidas ou ainda não.
//   cash: só o que já entrou e saiu no mês (data do recebimento/pagamento).
import type { Express } from "express";
import { prisma } from "./db.js";

const round2 = (n: number) => Math.round(n * 100) / 100;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const TYPE_LABEL: Record<string, string> = { fixed: "Custos fixos", variable: "Custos variáveis", normal: "Gastos avulsos", product: "Sistemas e produtos", reimbursement: "Reembolsos" };

// Datas "só dia" ficam à meia-noite UTC; recebimentos do Asaas são horários reais (vira o mês à meia-noite de Brasília)
const dayStart = (m: string) => { const [y, mo] = m.split("-").map(Number); return new Date(Date.UTC(y, mo - 1, 1, 0, 0)); };
const dayEnd = (m: string) => { const [y, mo] = m.split("-").map(Number); return new Date(Date.UTC(y, mo, 1, 0, 0)); };
const stampStart = (m: string) => new Date(dayStart(m).getTime() + 3 * 3600_000);
const stampEnd = (m: string) => new Date(dayEnd(m).getTime() + 3 * 3600_000);
const monthOfDay = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
const monthOfStamp = (d: Date) => monthOfDay(new Date(d.getTime() - 3 * 3600_000));

// a conta "pai" de uma série/parcelamento é só um agrupador (as contas reais são as de cada mês): não entra nas somas
const NOT_GROUP_PARENT = { OR: [{ recurrence: "none" }, { parentId: { not: null } }] };

type Basis = "planned" | "cash";
type Policy = "debt_first" | "expense" | "ignore";
interface Cfg { reservePercent: number; reimbursementsAsExpense: boolean; basis: Basis; policy: Policy }

async function config(): Promise<Cfg> {
  const c = (await prisma.profitConfig.findUnique({ where: { id: "main" } })) ?? (await prisma.profitConfig.create({ data: { id: "main" } }));
  const policy: Policy = c.reimbursementPolicy === "expense" || c.reimbursementPolicy === "ignore" ? c.reimbursementPolicy : "debt_first";
  // só a política "expense" põe o reembolso entre as despesas; em "debt_first" ele é uma dívida quitada com o lucro antes da divisão
  return { reservePercent: c.reservePercent, reimbursementsAsExpense: policy === "expense", basis: c.basis === "cash" ? "cash" : "planned", policy };
}

type Share = { partnerId: string; name: string; percent: number; amount: number; color?: string | null; paid?: boolean; paidAt?: string | null };
type PartnerLite = { id: string; name: string; sharePercent: number; color: string | null };

function divide(distributable: number, partners: PartnerLite[]): Share[] {
  return partners.map(p => ({ partnerId: p.id, name: p.name, percent: p.sharePercent, color: p.color, amount: distributable > 0 ? round2(distributable * p.sharePercent / 100) : 0 }));
}
// lucro = receita - despesas; do lucro sai primeiro a quitação das dívidas de reembolso, depois a reserva, e o resto é dos sócios
function figures(revenue: number, expenses: number, reservePercent: number, debtPaid = 0) {
  const profit = round2(revenue - expenses);
  const afterDebt = round2(profit - debtPaid);
  const reserve = afterDebt > 0 ? round2(afterDebt * reservePercent / 100) : 0;
  const distributable = afterDebt > 0 ? round2(afterDebt - reserve) : 0;
  return { revenue: round2(revenue), expenses: round2(expenses), profit, debtPaid: round2(debtPaid), reserve, distributable };
}

// dívidas com sócios: gastos tipo "Reembolso" (dinheiro que alguém adiantou) ainda não devolvidos
interface Debt { id: string; description: string; by: string | null; dueDate: Date | null; amount: number; remaining: number }
async function openDebts(): Promise<Debt[]> {
  const rows = await prisma.payable.findMany({ where: { type: "reimbursement", reimbursed: false, status: { not: "paid" }, ...NOT_GROUP_PARENT }, include: { payments: true } });
  return rows
    .map(p => ({ id: p.id, description: p.description, by: p.createdByName, dueDate: p.dueDate, amount: p.amount, remaining: round2(p.amount - p.payments.reduce((s, x) => s + x.amount, 0)) }))
    .filter(d => d.remaining > 0.004)
    .sort((a, b) => (a.dueDate?.getTime() ?? Infinity) - (b.dueDate?.getTime() ?? Infinity));
}
const activePartners = async (): Promise<PartnerLite[]> =>
  (await prisma.partner.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] })).map(p => ({ id: p.id, name: p.name, sharePercent: p.sharePercent, color: p.color }));

// ─── Um mês nas duas bases ───────────────────────────────────────────────────
interface Detail {
  revenueDone: number; revenuePending: number; expensesDone: number; expensesPending: number;
  revenueBy: { label: string; amount: number; done: number }[]; expensesBy: { label: string; amount: number; done: number }[];
  topClients: { label: string; amount: number }[]; topExpenses: { label: string; amount: number }[];
}
const top = (m: Map<string, number>, n = 6) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([label, amount]) => ({ label, amount: round2(amount) }));

// tudo que vence no mês: o que já foi pago/recebido e o que ainda falta
async function plannedDetail(month: string, cfg: Cfg): Promise<Detail> {
  const [pays, recs, clients, payables] = await Promise.all([
    prisma.clientPayment.findMany({ where: { dueDate: { gte: dayStart(month), lt: dayEnd(month) } }, include: { client: { select: { id: true, name: true, businessName: true } } } }),
    prisma.receivable.findMany({ where: { dueDate: { gte: dayStart(month), lt: dayEnd(month) } } }),
    prisma.client.findMany({ where: { status: "active", inTrial: false, billingValue: { gt: 0 }, nextDueDate: { not: null } }, select: { id: true, name: true, businessName: true, billingValue: true, billingCycle: true, nextDueDate: true } }),
    prisma.payable.findMany({ where: { dueDate: { gte: dayStart(month), lt: dayEnd(month) }, ...NOT_GROUP_PARENT }, include: { payments: true } }),
  ]);

  // assinaturas: recebidas (com vencimento no mês) + as que ainda vão entrar
  const paidClients = new Set(pays.map(p => p.clientId));
  const byClient = new Map<string, number>();
  let subsDone = 0, subsPending = 0;
  for (const p of pays) { subsDone += p.amount; const n = p.client?.businessName || p.client?.name || "Cliente"; byClient.set(n, (byClient.get(n) ?? 0) + p.amount); }
  for (const c of clients) {
    if (paidClients.has(c.id)) continue;
    const due = monthOfDay(c.nextDueDate as Date);
    const owes = c.billingCycle === "monthly" ? due <= month : due === month; // mensal se repete; anual/único só no mês do vencimento
    if (!owes) continue;
    subsPending += c.billingValue;
    const n = c.businessName || c.name; byClient.set(n, (byClient.get(n) ?? 0) + c.billingValue);
  }
  // contas avulsas a receber
  let avDone = 0, avPending = 0;
  for (const r of recs) { if (r.status === "received") avDone += r.receivedAmount ?? r.amount; else avPending += r.amount; }

  // contas a pagar
  const outs = payables.filter(p => cfg.reimbursementsAsExpense || p.type !== "reimbursement");
  const byType = new Map<string, { total: number; done: number }>();
  const byPayable = new Map<string, number>();
  let expDone = 0, expPending = 0;
  for (const p of outs) {
    const paid = p.payments.reduce((s, x) => s + x.amount, 0);
    const total = p.status === "paid" ? Math.max(p.amount, paid) : p.amount;
    const done = Math.min(paid, total);
    expDone += done; expPending += Math.max(total - done, 0);
    const t = byType.get(p.type) ?? { total: 0, done: 0 }; t.total += total; t.done += done; byType.set(p.type, t);
    byPayable.set(p.description, (byPayable.get(p.description) ?? 0) + total);
  }
  return {
    revenueDone: subsDone + avDone, revenuePending: subsPending + avPending, expensesDone: expDone, expensesPending: expPending,
    revenueBy: [{ label: "Assinaturas de clientes", amount: round2(subsDone + subsPending), done: round2(subsDone) }, { label: "Contas avulsas a receber", amount: round2(avDone + avPending), done: round2(avDone) }].filter(x => x.amount > 0),
    expensesBy: [...byType.entries()].map(([k, v]) => ({ label: TYPE_LABEL[k] ?? k, amount: round2(v.total), done: round2(v.done) })).sort((a, b) => b.amount - a.amount),
    topClients: top(byClient), topExpenses: top(byPayable),
  };
}

// só o que já entrou e saiu no mês
async function cashDetail(month: string, cfg: Cfg): Promise<Detail> {
  const [pays, recs, outs] = await Promise.all([
    prisma.clientPayment.findMany({ where: { paidAt: { gte: stampStart(month), lt: stampEnd(month) } }, include: { client: { select: { name: true, businessName: true } } } }),
    prisma.receivable.findMany({ where: { status: "received", receivedAt: { gte: dayStart(month), lt: dayEnd(month) } } }),
    prisma.payablePayment.findMany({ where: { date: { gte: dayStart(month), lt: dayEnd(month) } }, include: { payable: { select: { description: true, type: true } } } }),
  ]);
  const subs = pays.reduce((s, p) => s + p.amount, 0);
  const avulsas = recs.reduce((s, r) => s + (r.receivedAmount ?? r.amount), 0);
  const counted = outs.filter(o => cfg.reimbursementsAsExpense || o.payable?.type !== "reimbursement");
  const expenses = counted.reduce((s, o) => s + o.amount, 0);
  const byType = new Map<string, number>(), byClient = new Map<string, number>(), byPayable = new Map<string, number>();
  for (const o of counted) { const k = o.payable?.type ?? "normal"; byType.set(k, (byType.get(k) ?? 0) + o.amount); const n = o.payable?.description ?? "Despesa"; byPayable.set(n, (byPayable.get(n) ?? 0) + o.amount); }
  for (const p of pays) { const n = p.client?.businessName || p.client?.name || "Cliente"; byClient.set(n, (byClient.get(n) ?? 0) + p.amount); }
  return {
    revenueDone: subs + avulsas, revenuePending: 0, expensesDone: expenses, expensesPending: 0,
    revenueBy: [{ label: "Assinaturas de clientes", amount: round2(subs), done: round2(subs) }, { label: "Contas avulsas recebidas", amount: round2(avulsas), done: round2(avulsas) }].filter(x => x.amount > 0),
    expensesBy: [...byType.entries()].map(([k, v]) => ({ label: TYPE_LABEL[k] ?? k, amount: round2(v), done: round2(v) })).sort((a, b) => b.amount - a.amount),
    topClients: top(byClient), topExpenses: top(byPayable),
  };
}
const detailOf = (basis: Basis, month: string, cfg: Cfg) => (basis === "cash" ? cashDetail(month, cfg) : plannedDetail(month, cfg));
const totalOf = (d: Detail) => ({ revenue: d.revenueDone + d.revenuePending, expenses: d.expensesDone + d.expensesPending });

// Os 12 meses do ano em ordem: cada mês aberto usa parte do lucro para quitar a dívida de reembolsos que ainda existe
async function chainYear(year: number, cfg: Cfg) {
  const monthsList = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
  const [closings, partners, details, debts] = await Promise.all([
    prisma.profitClosing.findMany({ where: { month: { startsWith: `${year}-` } } }),
    activePartners(),
    Promise.all(monthsList.map(m => detailOf(cfg.basis, m, cfg))),
    cfg.policy === "debt_first" ? openDebts() : Promise.resolve([] as Debt[]),
  ]);
  const closed = new Map(closings.map(c => [c.month, c]));
  const nowMonth = monthOfStamp(new Date());
  const debtNow = round2(debts.reduce((s, d) => s + d.remaining, 0));
  let left = debtNow;
  const months = monthsList.map((m, i) => {
    const c = closed.get(m);
    const t = totalOf(details[i]);
    const before = left;
    if (c) {
      const f = { revenue: c.revenue, expenses: c.expenses, profit: c.profit, debtPaid: c.debtPaid, reserve: c.reserve, distributable: c.distributable };
      return { month: m, closed: true, future: m > nowMonth, ...f, debtBefore: before, debtAfter: before, shares: c.shares as unknown as Share[], detail: details[i] };
    }
    const profit0 = round2(t.revenue - t.expenses);
    const pay = cfg.policy === "debt_first" ? Math.min(Math.max(profit0, 0), left) : 0;
    left = round2(left - pay);
    const f = figures(t.revenue, t.expenses, cfg.reservePercent, pay);
    return { month: m, closed: false, future: m > nowMonth, ...f, debtBefore: before, debtAfter: left, shares: divide(f.distributable, partners), detail: details[i] };
  });
  return { months, partners, debts, debtNow };
}

// Aplica a quitação do fechamento nos próprios gastos de reembolso (mais antigos primeiro) e guarda como desfazer
async function applyDebtPayments(month: string, amount: number) {
  const done: { paymentId: string; payableId: string; prevStatus: string; prevReimbursed: boolean }[] = [];
  let left = amount;
  for (const d of await openDebts()) {
    if (left <= 0.004) break;
    const pay = round2(Math.min(left, d.remaining));
    const p = await prisma.payable.findUnique({ where: { id: d.id } });
    if (!p) continue;
    const payment = await prisma.payablePayment.create({ data: { payableId: d.id, amount: pay, date: new Date(dayEnd(month).getTime() - 86400000), method: "Quitação pela Sociedade", notes: `Fechamento ${month}` } });
    const full = pay >= d.remaining - 0.004;
    await prisma.payable.update({ where: { id: d.id }, data: { status: full ? "paid" : "partial", paidDate: full ? new Date() : p.paidDate, reimbursed: full ? true : p.reimbursed } });
    done.push({ paymentId: payment.id, payableId: d.id, prevStatus: p.status, prevReimbursed: p.reimbursed });
    left = round2(left - pay);
  }
  return done;
}
async function undoDebtPayments(list: { paymentId: string; payableId: string; prevStatus: string; prevReimbursed: boolean }[]) {
  for (const x of list) {
    await prisma.payablePayment.deleteMany({ where: { id: x.paymentId } });
    await prisma.payable.update({ where: { id: x.payableId }, data: { status: x.prevStatus, reimbursed: x.prevReimbursed, paidDate: null } }).catch(() => {});
  }
}

export function registerPartnerRoutes(app: Express) {
  const fail = (res: any, e: any, code = 500) => res.status(code).json({ error: e.message ?? String(e) });

  // ── sócios e regras
  app.get("/api/partners", async (_req, res) => {
    try { res.json({ partners: await prisma.partner.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }), config: await config() }); } catch (e) { fail(res, e); }
  });
  app.post("/api/partners", async (req, res) => {
    try {
      const name = String(req.body?.name ?? "").trim();
      if (!name) return fail(res, new Error("Informe o nome do sócio."), 400);
      const pct = Number(req.body?.sharePercent);
      if (!(pct >= 0 && pct <= 100)) return fail(res, new Error("A porcentagem deve ficar entre 0 e 100."), 400);
      res.json(await prisma.partner.create({ data: { name, sharePercent: pct, email: req.body?.email || null, role: req.body?.role || null, color: req.body?.color || null } }));
    } catch (e) { fail(res, e); }
  });
  app.patch("/api/partners/:id", async (req, res) => {
    try {
      const d: any = {};
      if (req.body?.name !== undefined) d.name = String(req.body.name).trim();
      if (req.body?.sharePercent !== undefined) { const p = Number(req.body.sharePercent); if (!(p >= 0 && p <= 100)) return fail(res, new Error("A porcentagem deve ficar entre 0 e 100."), 400); d.sharePercent = p; }
      for (const k of ["email", "role", "color"]) if (req.body?.[k] !== undefined) d[k] = req.body[k] || null;
      if (req.body?.active !== undefined) d.active = !!req.body.active;
      res.json(await prisma.partner.update({ where: { id: req.params.id }, data: d }));
    } catch (e) { fail(res, e); }
  });
  app.delete("/api/partners/:id", async (req, res) => {
    try { await prisma.partner.delete({ where: { id: req.params.id } }); res.json({ ok: true }); } catch (e) { fail(res, e); }
  });
  app.patch("/api/partners-config", async (req, res) => {
    try {
      const reserve = Number(req.body?.reservePercent);
      if (req.body?.reservePercent !== undefined && !(reserve >= 0 && reserve <= 100)) return fail(res, new Error("A reserva deve ficar entre 0 e 100."), 400);
      await config();
      await prisma.profitConfig.update({ where: { id: "main" }, data: {
        ...(req.body?.reservePercent !== undefined ? { reservePercent: reserve } : {}),
        ...(req.body?.reimbursementsAsExpense !== undefined ? { reimbursementsAsExpense: !!req.body.reimbursementsAsExpense } : {}),
        ...(req.body?.basis === "planned" || req.body?.basis === "cash" ? { basis: req.body.basis } : {}),
        ...(["debt_first", "expense", "ignore"].includes(req.body?.reimbursementPolicy) ? { reimbursementPolicy: req.body.reimbursementPolicy } : {}),
      } });
      res.json(await config());
    } catch (e) { fail(res, e); }
  });

  // ── um mês: a diferença entre o que entra e o que sai, de onde veio, para onde foi e quanto fica para cada sócio
  app.get("/api/partners/month/:month", async (req, res) => {
    try {
      const month = req.params.month;
      if (!MONTH_RE.test(month)) return fail(res, new Error("Mês inválido."), 400);
      const cfg = await config();
      const closing = await prisma.profitClosing.findUnique({ where: { month } });
      const useCfg: Cfg = closing ? { ...cfg, basis: closing.basis === "cash" ? "cash" : "planned" } : cfg;
      const chain = await chainYear(Number(month.slice(0, 4)), useCfg);
      const m = chain.months.find(x => x.month === month)!;
      const d = m.detail;
      const other = await detailOf(useCfg.basis === "cash" ? "planned" : "cash", month, cfg);
      const o = figures(totalOf(other).revenue, totalOf(other).expenses, cfg.reservePercent);
      res.json({
        month, basis: useCfg.basis, policy: cfg.policy, closed: m.closed, closedAt: closing?.closedAt ?? null, closedByName: closing?.closedByName ?? null, notes: closing?.notes ?? null,
        revenue: m.revenue, expenses: m.expenses, profit: m.profit, debtPaid: m.debtPaid, reserve: m.reserve, distributable: m.distributable, reservePercent: cfg.reservePercent,
        revenueDone: round2(d.revenueDone), revenuePending: round2(d.revenuePending), expensesDone: round2(d.expensesDone), expensesPending: round2(d.expensesPending),
        debtBefore: m.debtBefore, debtAfter: m.debtAfter, debts: chain.debts.map(x => ({ id: x.id, description: x.description, by: x.by, dueDate: x.dueDate, amount: x.amount, remaining: x.remaining })),
        compare: { basis: useCfg.basis === "cash" ? "planned" : "cash", revenue: o.revenue, expenses: o.expenses, profit: o.profit },
        revenueBy: d.revenueBy, expensesBy: d.expensesBy, topClients: d.topClients, topExpenses: d.topExpenses,
        shares: m.shares, percentTotal: round2(chain.partners.reduce((s, p) => s + p.sharePercent, 0)),
      });
    } catch (e) { fail(res, e); }
  });

  // ── o ano: mês a mês e o total de cada sócio
  app.get("/api/partners/year/:year", async (req, res) => {
    try {
      const year = Number(req.params.year);
      if (!(year >= 2000 && year <= 2100)) return fail(res, new Error("Ano inválido."), 400);
      const cfg = await config();
      const chain = await chainYear(year, cfg);
      const months = chain.months.map(({ detail: _d, ...rest }) => rest);
      const totalBy = new Map<string, { name: string; color: string | null; amount: number; paid: number }>();
      for (const m of months) for (const s of m.shares) {
        const x = totalBy.get(s.partnerId) ?? { name: s.name, color: s.color ?? null, amount: 0, paid: 0 };
        x.amount += s.amount; if (s.paid) x.paid += s.amount;
        totalBy.set(s.partnerId, x);
      }
      const sum = (k: "revenue" | "expenses" | "profit" | "reserve" | "distributable" | "debtPaid") => round2(months.reduce((s, m) => s + m[k], 0));
      res.json({
        year, basis: cfg.basis, policy: cfg.policy, debtNow: chain.debtNow, months,
        totals: { revenue: sum("revenue"), expenses: sum("expenses"), profit: sum("profit"), debtPaid: sum("debtPaid"), reserve: sum("reserve"), distributable: sum("distributable") },
        partners: [...totalBy.entries()].map(([id, v]) => ({ id, ...v, amount: round2(v.amount), paid: round2(v.paid) })),
      });
    } catch (e) { fail(res, e); }
  });

  // ── fechar o mês (guarda os valores e os percentuais daquele mês) / reabrir / marcar repasse
  app.post("/api/partners/closings", async (req, res) => {
    try {
      const month = String(req.body?.month ?? "");
      if (!MONTH_RE.test(month)) return fail(res, new Error("Mês inválido."), 400);
      if (await prisma.profitClosing.findUnique({ where: { month } })) return fail(res, new Error("Este mês já está fechado."), 400);
      const cfg = await config();
      const partners = await activePartners();
      if (!partners.length) return fail(res, new Error("Cadastre os sócios antes de fechar um mês."), 400);
      const total = partners.reduce((s, p) => s + p.sharePercent, 0);
      if (Math.abs(total - 100) > 0.01) return fail(res, new Error(`As porcentagens dos sócios somam ${round2(total)}%. Ajuste para fechar em 100%.`), 400);
      const m = (await chainYear(Number(month.slice(0, 4)), cfg)).months.find(x => x.month === month)!;
      const applied = m.debtPaid > 0 ? await applyDebtPayments(month, m.debtPaid) : [];
      const shares = m.shares.map(s => ({ ...s, paid: false, paidAt: null }));
      res.json(await prisma.profitClosing.create({
        data: { month, revenue: m.revenue, expenses: m.expenses, profit: m.profit, reserve: m.reserve, distributable: m.distributable, debtPaid: m.debtPaid, debtPayments: applied as any, basis: cfg.basis, shares: shares as any, notes: req.body?.notes || null, closedByName: req.body?.byName || null },
      }));
    } catch (e) { fail(res, e); }
  });
  app.delete("/api/partners/closings/:month", async (req, res) => {
    try {
      const c = await prisma.profitClosing.findUnique({ where: { month: req.params.month } });
      if (c?.debtPayments) await undoDebtPayments(c.debtPayments as any);
      await prisma.profitClosing.delete({ where: { month: req.params.month } });
      res.json({ ok: true });
    } catch (e) { fail(res, e); }
  });
  app.post("/api/partners/closings/:month/paid", async (req, res) => {
    try {
      const c = await prisma.profitClosing.findUnique({ where: { month: req.params.month } });
      if (!c) return fail(res, new Error("Mês não encontrado."), 404);
      const paid = req.body?.paid !== false;
      const shares = (c.shares as unknown as Share[]).map(s => (s.partnerId === req.body?.partnerId ? { ...s, paid, paidAt: paid ? new Date().toISOString() : null } : s));
      res.json(await prisma.profitClosing.update({ where: { month: c.month }, data: { shares: shares as any } }));
    } catch (e) { fail(res, e); }
  });
}
