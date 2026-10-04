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

type Basis = "planned" | "cash";
interface Cfg { reservePercent: number; reimbursementsAsExpense: boolean; basis: Basis }

async function config(): Promise<Cfg> {
  const c = (await prisma.profitConfig.findUnique({ where: { id: "main" } })) ?? (await prisma.profitConfig.create({ data: { id: "main" } }));
  return { reservePercent: c.reservePercent, reimbursementsAsExpense: c.reimbursementsAsExpense, basis: c.basis === "cash" ? "cash" : "planned" };
}

type Share = { partnerId: string; name: string; percent: number; amount: number; color?: string | null; paid?: boolean; paidAt?: string | null };
type PartnerLite = { id: string; name: string; sharePercent: number; color: string | null };

function divide(distributable: number, partners: PartnerLite[]): Share[] {
  return partners.map(p => ({ partnerId: p.id, name: p.name, percent: p.sharePercent, color: p.color, amount: distributable > 0 ? round2(distributable * p.sharePercent / 100) : 0 }));
}
function figures(revenue: number, expenses: number, reservePercent: number) {
  const profit = round2(revenue - expenses);
  const reserve = profit > 0 ? round2(profit * reservePercent / 100) : 0;
  const distributable = profit > 0 ? round2(profit - reserve) : 0;
  return { revenue: round2(revenue), expenses: round2(expenses), profit, reserve, distributable };
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
    prisma.payable.findMany({ where: { dueDate: { gte: dayStart(month), lt: dayEnd(month) } }, include: { payments: true } }),
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
      const basis: Basis = closing ? (closing.basis === "cash" ? "cash" : "planned") : cfg.basis;
      const [d, other] = await Promise.all([detailOf(basis, month, cfg), detailOf(basis === "cash" ? "planned" : "cash", month, cfg)]);
      const live = figures(totalOf(d).revenue, totalOf(d).expenses, cfg.reservePercent);
      const f = closing ? { revenue: closing.revenue, expenses: closing.expenses, profit: closing.profit, reserve: closing.reserve, distributable: closing.distributable } : live;
      const partners = await activePartners();
      const shares: Share[] = closing ? (closing.shares as unknown as Share[]) : divide(f.distributable, partners);
      const o = figures(totalOf(other).revenue, totalOf(other).expenses, cfg.reservePercent);
      res.json({
        month, basis, closed: !!closing, closedAt: closing?.closedAt ?? null, closedByName: closing?.closedByName ?? null, notes: closing?.notes ?? null,
        ...f, reservePercent: cfg.reservePercent,
        revenueDone: round2(d.revenueDone), revenuePending: round2(d.revenuePending), expensesDone: round2(d.expensesDone), expensesPending: round2(d.expensesPending),
        compare: { basis: basis === "cash" ? "planned" : "cash", revenue: o.revenue, expenses: o.expenses, profit: o.profit },
        revenueBy: d.revenueBy, expensesBy: d.expensesBy, topClients: d.topClients, topExpenses: d.topExpenses,
        shares, percentTotal: round2(partners.reduce((s, p) => s + p.sharePercent, 0)),
      });
    } catch (e) { fail(res, e); }
  });

  // ── o ano: mês a mês e o total de cada sócio
  app.get("/api/partners/year/:year", async (req, res) => {
    try {
      const year = Number(req.params.year);
      if (!(year >= 2000 && year <= 2100)) return fail(res, new Error("Ano inválido."), 400);
      const cfg = await config();
      const monthsList = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
      const [closings, partners, details] = await Promise.all([
        prisma.profitClosing.findMany({ where: { month: { startsWith: `${year}-` } } }),
        activePartners(),
        Promise.all(monthsList.map(m => detailOf(cfg.basis, m, cfg))),
      ]);
      const closed = new Map(closings.map(c => [c.month, c]));
      const nowMonth = monthOfStamp(new Date());
      const months = monthsList.map((m, i) => {
        const c = closed.get(m);
        const t = totalOf(details[i]);
        const f = c ? { revenue: c.revenue, expenses: c.expenses, profit: c.profit, reserve: c.reserve, distributable: c.distributable } : figures(t.revenue, t.expenses, cfg.reservePercent);
        const shares: Share[] = c ? (c.shares as unknown as Share[]) : divide(f.distributable, partners);
        return { month: m, closed: !!c, future: m > nowMonth, ...f, shares };
      });
      const totalBy = new Map<string, { name: string; color: string | null; amount: number; paid: number }>();
      for (const m of months) for (const s of m.shares) {
        const x = totalBy.get(s.partnerId) ?? { name: s.name, color: s.color ?? null, amount: 0, paid: 0 };
        x.amount += s.amount; if (s.paid) x.paid += s.amount;
        totalBy.set(s.partnerId, x);
      }
      const sum = (k: "revenue" | "expenses" | "profit" | "reserve" | "distributable") => round2(months.reduce((s, m) => s + m[k], 0));
      res.json({
        year, basis: cfg.basis, months,
        totals: { revenue: sum("revenue"), expenses: sum("expenses"), profit: sum("profit"), reserve: sum("reserve"), distributable: sum("distributable") },
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
      const d = await detailOf(cfg.basis, month, cfg);
      const f = figures(totalOf(d).revenue, totalOf(d).expenses, cfg.reservePercent);
      const shares = divide(f.distributable, partners).map(s => ({ ...s, paid: false, paidAt: null }));
      res.json(await prisma.profitClosing.create({ data: { month, ...f, basis: cfg.basis, shares: shares as any, notes: req.body?.notes || null, closedByName: req.body?.byName || null } }));
    } catch (e) { fail(res, e); }
  });
  app.delete("/api/partners/closings/:month", async (req, res) => {
    try { await prisma.profitClosing.delete({ where: { month: req.params.month } }); res.json({ ok: true }); } catch (e) { fail(res, e); }
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
