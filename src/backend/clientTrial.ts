// Clientes em período de teste: não geram fatura, não recebem cobrança e não são bloqueados/pausados sozinhos
import type { Express } from "express";
import { prisma } from "./db.js";
import { brtTodayUtc } from "./time.js";
import { syncBoxsysAccess } from "./boxsys.js";

const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

export function registerTrialRoutes(app: Express) {
  const fail = (res: any, e: any, code = 500) => res.status(code).json({ error: e.message ?? String(e) });

  // estende (ou inicia) o teste: conta a partir do fim atual, se ainda não acabou, ou de hoje
  app.post("/api/clients/:id/trial/extend", async (req, res) => {
    try {
      const days = Math.min(Math.max(Number(req.body?.days) || 7, 1), 365);
      const c = await prisma.client.findUnique({ where: { id: req.params.id } });
      if (!c) return fail(res, new Error("Cliente não encontrado."), 404);
      const today = brtTodayUtc();
      const base = c.inTrial && c.trialEndsAt && c.trialEndsAt > today ? c.trialEndsAt : today;
      const client = await prisma.client.update({ where: { id: c.id }, data: { inTrial: true, trialEndsAt: addDays(base, days) } });
      syncBoxsysAccess(c.id).catch(() => {});
      res.json(client);
    } catch (e) { fail(res, e); }
  });

  // vira assinante: define o valor e o primeiro vencimento; a cobrança passa a valer a partir daí
  app.post("/api/clients/:id/trial/convert", async (req, res) => {
    try {
      const value = Number(req.body?.billingValue);
      if (!(value > 0)) return fail(res, new Error("Informe o valor da assinatura."), 400);
      const due = req.body?.dueDate ? new Date(req.body.dueDate) : brtTodayUtc();
      if (Number.isNaN(due.getTime())) return fail(res, new Error("Data de vencimento inválida."), 400);
      const cycle = ["monthly", "yearly"].includes(req.body?.billingCycle) ? req.body.billingCycle : "monthly";
      const client = await prisma.client.update({
        where: { id: req.params.id },
        data: { inTrial: false, trialEndsAt: null, status: "active", billingValue: value, billingCycle: cycle, nextDueDate: due, dueDay: due.getUTCDate(), startDate: new Date() },
      });
      syncBoxsysAccess(client.id).catch(() => {});
      res.json(client);
    } catch (e) { fail(res, e); }
  });
}
