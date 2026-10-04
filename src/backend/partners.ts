// Sociedade & Lucros: lucro do mês = receitas recebidas - despesas pagas; o que sobra (depois da reserva) é dividido pelos sócios.
// Regime de caixa: conta o que entrou e o que saiu no mês (data do recebimento/pagamento), não o vencimento.
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

async function config() {
  return (await prisma.profitConfig.findUnique({ where: { id: "main" } })) ?? (await prisma.profitConfig.create({ data: { id: "main" } }));
}

type Share = { partnerId: string; name: string; percent: number; amount: number; color?: string | null; paid?: boolean; paidAt?: string | null };

function divide(distributable: number, partners: { id: string; name: string; sharePercent: number; color: string | null }[]): Share[] {
  return partners.map(p => ({ partnerId: p.id, name: p.name, percent: p.sharePercent, color: p.color, amount: distributable > 0 ? round2(distributable * p.sharePercent / 100) : 0 }));
}

function figures(revenue: number, expenses: number, reservePercent: number) {
  const profit = round2(revenue - expenses);
  const reserve = profit > 0 ? round2(profit * reservePercent / 100) : 0;
  const distributable = profit > 0 ? round2(profit - reserve) : 0;
  return { revenue: round2(revenue), expenses: round2(expenses), profit, reserve, distributable };
}

// totais de um ano inteiro, mês a mês
async function yearTotals(year: number, cfg: { reimbursementsAsExpense: boolean }) {
  const from = `${year}-01`, to = `${year + 1}-01`;
  const [pays, recs, outs] = await Promise.all([
    prisma.clientPayment.findMany({ where: { paidAt: { gte: stampStart(from), lt: stampStart(to) } }, select: { amount: true, paidAt: true } }),
    prisma.receivable.findMany({ where: { status: "received", receivedAt: { gte: dayStart(from), lt: dayStart(to) } }, select: { amount: true, receivedAmount: true, receivedAt: true } }),
    prisma.payablePayment.findMany({ where: { date: { gte: dayStart(from), lt: dayStart(to) } }, select: { amount: true, date: true, payable: { select: { type: true } } } }),
  ]);
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
  const t = new Map(months.map(m => [m, { revenue: 0, expenses: 0 }]));
  for (const p of pays) { const x = t.get(monthOfStamp(p.paidAt)); if (x) x.revenue += p.amount; }
  for (const r of recs) { const x = t.get(monthOfDay(r.receivedAt as Date)); if (x) x.revenue += r.receivedAmount ?? r.amount; }
  for (const o of outs) {
    if (!cfg.reimbursementsAsExpense && o.payable?.type === "reimbursement") continue;
    const x = t.get(monthOfDay(o.date)); if (x) x.expenses += o.amount;
  }
  return months.map(m => ({ month: m, revenue: t.get(m)!.revenue, expenses: t.get(m)!.expenses }));
}

export function registerPartnerRoutes(app: Express) {
  const fail = (res: any, e: any, code = 500) => res.status(code).json({ error: e.message ?? String(e) });

  // ── sócios
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
      res.json(await prisma.profitConfig.update({ where: { id: "main" }, data: {
        ...(req.body?.reservePercent !== undefined ? { reservePercent: reserve } : {}),
        ...(req.body?.reimbursementsAsExpense !== undefined ? { reimbursementsAsExpense: !!req.body.reimbursementsAsExpense } : {}),
      } }));
    } catch (e) { fail(res, e); }
  });

  // ── um mês: números, de onde veio, para onde foi e quanto fica para cada sócio
  app.get("/api/partners/month/:month", async (req, res) => {
    try {
      const month = req.params.month;
      if (!MONTH_RE.test(month)) return fail(res, new Error("Mês inválido."), 400);
      const cfg = await config();
      const closing = await prisma.profitClosing.findUnique({ where: { month } });

      const [pays, recs, outs] = await Promise.all([
        prisma.clientPayment.findMany({ where: { paidAt: { gte: stampStart(month), lt: stampEnd(month) } }, include: { client: { select: { name: true, businessName: true } } } }),
        prisma.receivable.findMany({ where: { status: "received", receivedAt: { gte: dayStart(month), lt: dayEnd(month) } } }),
        prisma.payablePayment.findMany({ where: { date: { gte: dayStart(month), lt: dayEnd(month) } }, include: { payable: { select: { description: true, type: true } } } }),
      ]);
      const subs = pays.reduce((s, p) => s + p.amount, 0);
      const avulsas = recs.reduce((s, r) => s + (r.receivedAmount ?? r.amount), 0);
      const outsCounted = outs.filter(o => cfg.reimbursementsAsExpense || o.payable?.type !== "reimbursement");
      const expenses = outsCounted.reduce((s, o) => s + o.amount, 0);

      const byType = new Map<string, number>();
      for (const o of outsCounted) byType.set(o.payable?.type ?? "normal", (byType.get(o.payable?.type ?? "normal") ?? 0) + o.amount);
      const byClient = new Map<string, number>();
      for (const p of pays) { const n = p.client?.businessName || p.client?.name || "Cliente"; byClient.set(n, (byClient.get(n) ?? 0) + p.amount); }
      const byPayable = new Map<string, number>();
      for (const o of outsCounted) { const n = o.payable?.description ?? "Despesa"; byPayable.set(n, (byPayable.get(n) ?? 0) + o.amount); }
      const top = (m: Map<string, number>, n = 6) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([label, amount]) => ({ label, amount: round2(amount) }));

      const partners = (await prisma.partner.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] })).map(p => ({ id: p.id, name: p.name, sharePercent: p.sharePercent, color: p.color }));
      const f = closing
        ? { revenue: closing.revenue, expenses: closing.expenses, profit: closing.profit, reserve: closing.reserve, distributable: closing.distributable }
        : figures(subs + avulsas, expenses, cfg.reservePercent);
      const shares: Share[] = closing ? (closing.shares as unknown as Share[]) : divide(f.distributable, partners);

      res.json({
        month, closed: !!closing, closedAt: closing?.closedAt ?? null, closedByName: closing?.closedByName ?? null, notes: closing?.notes ?? null,
        ...f, reservePercent: cfg.reservePercent,
        // detalhes sempre ao vivo (mesmo para mês fechado, para consulta)
        live: figures(subs + avulsas, expenses, cfg.reservePercent),
        revenueBy: [{ label: "Assinaturas de clientes", amount: round2(subs) }, { label: "Contas avulsas recebidas", amount: round2(avulsas) }].filter(x => x.amount > 0),
        expensesBy: [...byType.entries()].map(([k, v]) => ({ label: TYPE_LABEL[k] ?? k, amount: round2(v) })).sort((a, b) => b.amount - a.amount),
        topClients: top(byClient), topExpenses: top(byPayable),
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
      const [totals, closings, partnersAll] = await Promise.all([
        yearTotals(year, cfg),
        prisma.profitClosing.findMany({ where: { month: { startsWith: `${year}-` } } }),
        prisma.partner.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
      ]);
      const partners = partnersAll.map(p => ({ id: p.id, name: p.name, sharePercent: p.sharePercent, color: p.color }));
      const closed = new Map(closings.map(c => [c.month, c]));
      const nowMonth = monthOfStamp(new Date());
      const months = totals.map(t => {
        const c = closed.get(t.month);
        const f = c ? { revenue: c.revenue, expenses: c.expenses, profit: c.profit, reserve: c.reserve, distributable: c.distributable } : figures(t.revenue, t.expenses, cfg.reservePercent);
        const shares: Share[] = c ? (c.shares as unknown as Share[]) : divide(f.distributable, partners);
        return { month: t.month, closed: !!c, future: t.month > nowMonth, ...f, shares };
      });
      // total de cada sócio no ano (inclui quem saiu da sociedade se estava em um mês fechado)
      const totalBy = new Map<string, { name: string; color: string | null; amount: number; paid: number }>();
      for (const m of months) for (const s of m.shares) {
        const x = totalBy.get(s.partnerId) ?? { name: s.name, color: s.color ?? null, amount: 0, paid: 0 };
        x.amount += s.amount; if (s.paid) x.paid += s.amount;
        totalBy.set(s.partnerId, x);
      }
      const sum = (k: "revenue" | "expenses" | "profit" | "reserve" | "distributable") => round2(months.reduce((s, m) => s + m[k], 0));
      res.json({
        year, months,
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
      const partners = (await prisma.partner.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] })).map(p => ({ id: p.id, name: p.name, sharePercent: p.sharePercent, color: p.color }));
      if (!partners.length) return fail(res, new Error("Cadastre os sócios antes de fechar um mês."), 400);
      const total = partners.reduce((s, p) => s + p.sharePercent, 0);
      if (Math.abs(total - 100) > 0.01) return fail(res, new Error(`As porcentagens dos sócios somam ${round2(total)}%. Ajuste para fechar em 100%.`), 400);
      const t = (await yearTotals(Number(month.slice(0, 4)), cfg)).find(x => x.month === month)!;
      const f = figures(t.revenue, t.expenses, cfg.reservePercent);
      const shares = divide(f.distributable, partners).map(s => ({ ...s, paid: false, paidAt: null }));
      res.json(await prisma.profitClosing.create({ data: { month, ...f, shares: shares as any, notes: req.body?.notes || null, closedByName: req.body?.byName || null } }));
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
