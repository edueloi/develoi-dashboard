// Prospecção: funil de leads (cadastro, andamento, follow-up e conversão em cliente)
import type { Express } from "express";
import { prisma } from "./db.js";

export const LEAD_STATUSES = ["new", "contacted", "meeting", "proposal", "won", "lost"] as const;
const STATUS_LABEL: Record<string, string> = { new: "Novo", contacted: "Contatado", meeting: "Reunião", proposal: "Proposta", won: "Ganho", lost: "Perdido" };

const str = (v: any, max: number): string | null => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim().slice(0, max);
  return s || null;
};
const day = (v: any): Date | null => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};
const digits = (s?: string | null) => (s ?? "").replace(/\D/g, "");

// Campos aceitos no cadastro/edição (ignora o resto do corpo da requisição)
function pick(body: any, partial: boolean) {
  const out: Record<string, any> = {};
  const set = (k: string, v: any) => { if (!partial || body[k] !== undefined) out[k] = v; };
  set("name", str(body.name, 150));
  set("company", str(body.company, 150));
  set("phone", str(body.phone, 40));
  set("email", str(body.email, 150));
  set("city", str(body.city, 100));
  set("source", str(body.source, 40) ?? "manual");
  set("product", str(body.product, 120));
  set("priority", ["hot", "warm", "cold"].includes(body.priority) ? body.priority : "warm");
  set("value", Number(body.value) > 0 ? Number(body.value) : 0);
  set("nextFollowUp", day(body.nextFollowUp));
  set("notes", body.notes === undefined || body.notes === null ? null : String(body.notes));
  return out;
}

export function registerLeadRoutes(app: Express) {
  const fail = (res: any, e: any, code = 500) => res.status(code).json({ error: e.message ?? String(e) });
  const log = (leadId: string, type: string, text: string) => prisma.leadActivity.create({ data: { leadId, type, text } });

  // Opções de "produto de interesse": projetos/sistemas cadastrados + produtos & planos, sem repetir
  app.get("/api/leads/options", async (_req, res) => {
    try {
      const [projects, products] = await Promise.all([
        prisma.project.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
        prisma.product.findMany({ where: { active: true }, select: { name: true }, orderBy: { name: "asc" } }),
      ]);
      const seen = new Set<string>();
      const names = [...projects, ...products].map(p => p.name.trim()).filter(n => { const k = n.toLowerCase(); if (!n || seen.has(k)) return false; seen.add(k); return true; });
      res.json({ products: names });
    } catch (e) { fail(res, e); }
  });

  app.get("/api/leads", async (_req, res) => {
    try {
      res.json(await prisma.lead.findMany({ orderBy: { updatedAt: "desc" }, include: { activities: { orderBy: { createdAt: "desc" }, take: 30 } } }));
    } catch (e) { fail(res, e); }
  });

  app.post("/api/leads", async (req, res) => {
    try {
      const data = pick(req.body, false);
      if (!data.name) return fail(res, new Error("Informe o nome do contato"), 400);
      const lead = await prisma.lead.create({ data: data as any });
      await log(lead.id, "status", "Lead cadastrado");
      res.json(lead);
    } catch (e) { fail(res, e); }
  });

  // Importação em lote (planilha colada): ignora quem já está cadastrado pelo telefone
  app.post("/api/leads/import", async (req, res) => {
    try {
      const rows: any[] = Array.isArray(req.body?.rows) ? req.body.rows.slice(0, 1000) : [];
      const source = str(req.body?.source, 40) ?? "planilha";
      const product = str(req.body?.product, 120);
      const known = new Set((await prisma.lead.findMany({ select: { phone: true } })).map(l => digits(l.phone)).filter(Boolean));
      let created = 0, skipped = 0;
      for (const r of rows) {
        const d = pick({ ...r, source: r.source ?? source, product: r.product ?? product }, false);
        const ph = digits(d.phone as string | null);
        if (!d.name || (ph && known.has(ph))) { skipped++; continue; }
        if (ph) known.add(ph);
        const lead = await prisma.lead.create({ data: d as any });
        await log(lead.id, "status", "Importado da lista");
        created++;
      }
      res.json({ created, skipped });
    } catch (e) { fail(res, e); }
  });

  app.patch("/api/leads/:id", async (req, res) => {
    try {
      const data = pick(req.body, true);
      if (data.name === null) return fail(res, new Error("O nome não pode ficar vazio"), 400);
      res.json(await prisma.lead.update({ where: { id: req.params.id }, data: data as any }));
    } catch (e) { fail(res, e); }
  });

  // Muda a etapa do funil e registra no histórico
  app.post("/api/leads/:id/status", async (req, res) => {
    try {
      const status = String(req.body?.status ?? "");
      if (!(LEAD_STATUSES as readonly string[]).includes(status)) return fail(res, new Error("Etapa inválida"), 400);
      const before = await prisma.lead.findUnique({ where: { id: req.params.id } });
      if (!before) return fail(res, new Error("Lead não encontrado"), 404);
      const lostReason = status === "lost" ? str(req.body?.lostReason, 200) : null;
      const lead = await prisma.lead.update({
        where: { id: before.id },
        data: { status, lostReason, ...(status !== "new" && !before.lastContactAt ? { lastContactAt: new Date() } : {}) },
      });
      await log(lead.id, "status", `Etapa: ${STATUS_LABEL[before.status] ?? before.status} → ${STATUS_LABEL[status]}${lostReason ? ` (${lostReason})` : ""}`);
      res.json(lead);
    } catch (e) { fail(res, e); }
  });

  // Registra uma interação (ligação, WhatsApp, reunião…) e opcionalmente agenda o próximo contato
  app.post("/api/leads/:id/activity", async (req, res) => {
    try {
      const text = str(req.body?.text, 2000);
      if (!text) return fail(res, new Error("Escreva o que aconteceu"), 400);
      const type = ["note", "call", "whatsapp", "email", "meeting"].includes(req.body?.type) ? req.body.type : "note";
      const next = req.body?.nextFollowUp !== undefined ? day(req.body.nextFollowUp) : undefined;
      const lead = await prisma.lead.update({
        where: { id: req.params.id },
        data: { lastContactAt: type === "note" ? undefined : new Date(), ...(next !== undefined ? { nextFollowUp: next } : {}) },
      });
      await log(lead.id, type, text);
      res.json(lead);
    } catch (e) { fail(res, e); }
  });

  // Ganho: cria o cliente (ou reaproveita o que já existe com o mesmo telefone) e marca o lead como ganho
  app.post("/api/leads/:id/convert", async (req, res) => {
    try {
      const lead = await prisma.lead.findUnique({ where: { id: req.params.id } });
      if (!lead) return fail(res, new Error("Lead não encontrado"), 404);
      if (lead.clientId) return res.json({ lead, clientId: lead.clientId });
      const ph = digits(lead.phone);
      const existing = ph ? (await prisma.client.findMany({ select: { id: true, phone: true } })).find(c => digits(c.phone) === ph) : undefined;
      const clientId = existing?.id ?? (await prisma.client.create({
        data: { name: lead.name, businessName: lead.company, phone: lead.phone, email: lead.email, status: "active", billingValue: lead.value, startDate: new Date() },
      })).id;
      const updated = await prisma.lead.update({ where: { id: lead.id }, data: { status: "won", clientId, lostReason: null, nextFollowUp: null } });
      await log(lead.id, "status", existing ? "Ganho: ligado a um cliente que já existia" : "Ganho: cliente criado");
      res.json({ lead: updated, clientId, reused: !!existing });
    } catch (e) { fail(res, e); }
  });

  app.delete("/api/leads/:id", async (req, res) => {
    try { await prisma.lead.delete({ where: { id: req.params.id } }); res.json({ ok: true }); } catch (e) { fail(res, e); }
  });
}
