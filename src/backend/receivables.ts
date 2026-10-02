// Contas a receber avulsas (as assinaturas dos clientes ficam em /api/clients)
import type { Express } from "express";
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { brtTodayUtc } from "./time.js";

const prisma = new PrismaClient();

// Soma `n` meses mantendo o dia (31/01 + 1 mês = 28/02). Em UTC: datas de vencimento são meia-noite UTC.
function addMonthsClamped(date: Date, n: number): Date {
  const d = new Date(date.getTime());
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + n);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d;
}

const include = { client: { select: { id: true, name: true, phone: true } } };

export function registerReceivableRoutes(app: Express) {
  const fail = (res: any, e: any) => res.status(500).json({ error: e.message });

  app.get("/api/receivables", async (_req, res) => {
    try { res.json(await prisma.receivable.findMany({ orderBy: { dueDate: "asc" }, include })); } catch (e) { fail(res, e); }
  });

  // plan.mode: 'once' (padrão) | 'installments' (divide o total em N parcelas mensais)
  app.post("/api/receivables", async (req, res) => {
    try {
      const { plan, ...b } = req.body;
      if (!b.description?.trim() || !b.dueDate) return res.status(400).json({ error: "Informe a descrição e o vencimento." });
      const total = Number(b.amount) || 0;
      const first = new Date(b.dueDate);
      const common = {
        description: b.description.trim(),
        clientId: b.clientId || null,
        payerName: b.payerName?.trim() || null,
        notes: b.notes?.trim() || null,
        createdById: b.createdById, createdByName: b.createdByName,
      };

      if (plan?.mode === "installments" && Number(plan.count) >= 2) {
        const count = Math.min(120, Math.floor(Number(plan.count)));
        const cents = Math.round(total * 100);
        const each = Math.floor(cents / count);
        const groupId = randomUUID();
        await prisma.receivable.createMany({
          data: Array.from({ length: count }, (_, i) => ({
            ...common,
            amount: (i === count - 1 ? cents - each * (count - 1) : each) / 100, // a última absorve o arredondamento
            dueDate: addMonthsClamped(first, i),
            groupId, installmentNo: i + 1, installmentsTotal: count,
          })),
        });
        return res.json({ generated: count, groupId });
      }

      res.json(await prisma.receivable.create({ data: { ...common, amount: total, dueDate: first }, include }));
    } catch (e) { fail(res, e); }
  });

  // ?scope=following aplica descrição/valor/observação às próximas parcelas pendentes
  app.patch("/api/receivables/:id", async (req, res) => {
    try {
      const { dueDate, ...rest } = req.body;
      const allowed = ["description", "amount", "notes", "clientId", "payerName"];
      const data: any = {};
      for (const k of allowed) if (k in rest) data[k] = rest[k] === "" ? null : rest[k];
      if (data.amount !== undefined) data.amount = Number(data.amount) || 0;
      if (dueDate) data.dueDate = new Date(dueDate);
      const updated = await prisma.receivable.update({ where: { id: req.params.id }, data, include });

      if (req.query.scope === "following" && updated.groupId) {
        const { dueDate: _d, ...shared } = data;
        await prisma.receivable.updateMany({
          where: { groupId: updated.groupId, status: "pending", dueDate: { gt: updated.dueDate } },
          data: shared,
        });
      }
      res.json(updated);
    } catch (e) { fail(res, e); }
  });

  app.delete("/api/receivables/:id", async (req, res) => {
    try {
      const target = await prisma.receivable.findUnique({ where: { id: req.params.id } });
      if (!target) return res.json({ success: true });
      if (req.query.scope === "series" && target.groupId) {
        await prisma.receivable.deleteMany({ where: { groupId: target.groupId } });
      } else if (req.query.scope === "following" && target.groupId) {
        await prisma.receivable.deleteMany({ where: { groupId: target.groupId, status: "pending", dueDate: { gte: target.dueDate } } });
      } else {
        await prisma.receivable.delete({ where: { id: target.id } });
      }
      res.json({ success: true });
    } catch (e) { fail(res, e); }
  });

  app.post("/api/receivables/:id/receive", async (req, res) => {
    try {
      const cur = await prisma.receivable.findUnique({ where: { id: req.params.id } });
      if (!cur) return res.status(404).json({ error: "Conta não encontrada." });
      res.json(await prisma.receivable.update({
        where: { id: cur.id },
        data: {
          status: "received",
          receivedAt: req.body.receivedAt ? new Date(req.body.receivedAt) : brtTodayUtc(),
          receivedAmount: req.body.amount !== undefined ? Number(req.body.amount) || 0 : cur.amount,
          method: req.body.method || null,
          notes: req.body.notes ? req.body.notes : cur.notes,
        },
        include,
      }));
    } catch (e) { fail(res, e); }
  });

  app.post("/api/receivables/:id/undo", async (req, res) => {
    try {
      res.json(await prisma.receivable.update({
        where: { id: req.params.id },
        data: { status: "pending", receivedAt: null, receivedAmount: null, method: null },
        include,
      }));
    } catch (e) { fail(res, e); }
  });
}
