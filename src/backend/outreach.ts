// Disparo de mensagens prontas pelo WhatsApp da Develoi (prospecção, relacionamento e cobrança gentil),
// com registro de tudo que foi enviado e a lista unificada de contatos (prospecção, clientes, vendas e lista manual)
import type { Express } from "express";
import { prisma } from "./db.js";
import { sendOutreach, startConversation } from "./wa.js";
import { sendGentleReminder } from "./billingNotifier.js";

// só dígitos e sem o 55 do país: é a chave para juntar o mesmo contato vindo de telas diferentes
export const phoneKey = (v?: string | null) => {
  const d = String(v ?? "").replace(/\D/g, "");
  return d.length > 11 && d.startsWith("55") ? d.slice(2) : d;
};

const LEAD_STAGE: Record<string, string> = { new: "Novo", contacted: "Contatado", meeting: "Reunião", proposal: "Proposta", won: "Ganho", lost: "Perdido" };
const SALE_STAGE: Record<string, string> = { lead: "Lead", negotiation: "Negociação", won: "Fechada", lost: "Perdida", cancelled: "Cancelada" };
const CLIENT_STAGE: Record<string, string> = { active: "Ativo", paused: "Bloqueado", cancelled: "Cancelado" };
const CONTACT_STAGE: Record<string, string> = { new: "Novo", pending: "A contatar", callback: "Retornar", no_answer: "Não atendeu", interested: "Interessado", negotiation: "Negociação", won: "Cliente", lost: "Perdido" };

async function writeLog(d: { phone: string; name?: string | null; source?: string | null; refId?: string | null; via: string; message: string; byName?: string | null; byEmail?: string | null; byId?: string | null }) {
  try {
    await prisma.outreachLog.create({
      data: { phone: phoneKey(d.phone), name: d.name?.slice(0, 150) ?? null, source: d.source ?? "other", refId: d.refId ?? null, via: d.via, message: d.message, byName: d.byName?.slice(0, 100) ?? null, byEmail: d.byEmail?.slice(0, 150) ?? null, byId: d.byId?.slice(0, 64) ?? null },
    });
  } catch (e) { console.error("[outreach] não consegui gravar o registro:", e); }
}

export function registerOutreachRoutes(app: Express) {
  // mode "bot": a BiIA envia e continua o papo se a pessoa responder · mode "attendant": abre a conversa em atendimento com quem enviou
  app.post("/api/outreach/send", async (req, res) => {
    try {
      const { mode, phone, name, message, leadId, contactId, source, refId, attendantId, attendantName, attendantEmail, sectorId } = req.body ?? {};
      const text = String(message ?? "").trim();
      const r = mode === "attendant"
        ? await startConversation({ phone: String(phone ?? ""), name, message: text, attendantId, attendantName: attendantName || "Atendente", sectorId })
        : await sendOutreach({ phone: String(phone ?? ""), name, message: text });
      if (!r.ok) return res.status(400).json({ error: r.error });

      // registra no funil / na lista de contatos de onde saiu e no histórico geral
      const via = mode === "attendant" ? "Conversa iniciada pelo atendimento" : "Mensagem enviada pela BiIA";
      if (leadId) {
        const lead = await prisma.lead.findUnique({ where: { id: String(leadId) } });
        if (lead) {
          await prisma.lead.update({ where: { id: lead.id }, data: { lastContactAt: new Date(), ...(lead.status === "new" ? { status: "contacted" } : {}) } });
          await prisma.leadActivity.create({ data: { leadId: lead.id, type: "whatsapp", text: `${via}: ${text.slice(0, 300)}` } });
        }
      }
      if (contactId) {
        const c = await prisma.clientContact.findUnique({ where: { id: String(contactId) } });
        if (c) await prisma.clientContact.update({ where: { id: c.id }, data: { lastContactAt: new Date(), contactCount: c.contactCount + 1, ...(c.status === "new" ? { status: "contacted" } : {}) } });
      }
      await writeLog({ phone: String(phone), name, source: leadId ? "lead" : contactId ? "contact" : source, refId: leadId || contactId || refId, via: mode === "attendant" ? "attendant" : "bot", message: text, byName: attendantName, byEmail: attendantEmail, byId: attendantId });
      res.json({ ok: true, conversationId: r.id });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // abriu o WhatsApp pelo link (não dá para confirmar o envio, mas fica registrado que foi preparado)
  app.post("/api/outreach/log", async (req, res) => {
    try {
      const { phone, name, source, refId, via, message, byName, byEmail, byId } = req.body ?? {};
      if (!phone || !String(message ?? "").trim()) return res.status(400).json({ error: "Dados incompletos." });
      await writeLog({ phone, name, source, refId, via: "link", message: String(message), byName, byEmail, byId });
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/outreach/log", async (req, res) => {
    try {
      const phone = phoneKey(String(req.query.phone ?? ""));
      const rows = await prisma.outreachLog.findMany({
        where: phone ? { phone } : undefined,
        orderBy: { createdAt: "desc" },
        take: Math.min(Number(req.query.limit) || 500, 1000),
      });
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Todos os contatos que dá para chamar: prospecção, clientes, vendas e a lista manual de cada usuário, sem repetir quem aparece em mais de um lugar
  app.get("/api/outreach/contacts", async (req, res) => {
    try {
      const userId = String(req.query.userId ?? "");
      const [leads, clients, sales, manual, logs] = await Promise.all([
        prisma.lead.findMany({ select: { id: true, name: true, company: true, phone: true, city: true, status: true, lastContactAt: true } }),
        prisma.client.findMany({ select: { id: true, name: true, businessName: true, phone: true, status: true } }),
        prisma.sale.findMany({ select: { id: true, clientName: true, clientPhone: true, productName: true, status: true } }),
        userId ? prisma.clientContact.findMany({ where: { userId } }) : Promise.resolve([] as any[]),
        prisma.outreachLog.groupBy({ by: ["phone"], _count: { _all: true }, _max: { createdAt: true } }),
      ]);
      const logOf = new Map(logs.map(l => [l.phone, { n: l._count._all, at: l._max.createdAt }]));

      type Src = { type: "client" | "lead" | "sale" | "manual"; label: string; status: string; refId: string };
      type Row = { key: string; name: string; company: string | null; phone: string; city: string | null; sources: Src[]; lastContactAt: Date | null; contactCount: number; refs: Record<string, string> };
      const map = new Map<string, Row>();
      const rank = { client: 0, lead: 1, sale: 2, manual: 3 } as const;
      const touch = (phone: string | null | undefined, name: string, company: string | null | undefined, city: string | null | undefined, src: Src, last?: Date | null, count = 0) => {
        const key = phoneKey(phone);
        if (key.length < 8) return;
        let row = map.get(key);
        if (!row) { row = { key, name, company: company ?? null, phone: String(phone), city: city ?? null, sources: [], lastContactAt: null, contactCount: 0, refs: {} }; map.set(key, row); }
        // o nome vem da origem mais "forte" (cliente > prospecção > venda > manual)
        if (row.sources.length === 0 || rank[src.type] < Math.min(...row.sources.map(s => rank[s.type]))) { row.name = name; }
        if (!row.company && company) row.company = company;
        if (!row.city && city) row.city = city;
        row.sources.push(src);
        row.refs[`${src.type}Id`] = src.refId;
        if (last && (!row.lastContactAt || last > row.lastContactAt)) row.lastContactAt = last;
        row.contactCount = Math.max(row.contactCount, count);
      };
      for (const c of clients) touch(c.phone, c.name, c.businessName, null, { type: "client", label: "Cliente", status: CLIENT_STAGE[c.status] ?? c.status, refId: c.id });
      for (const l of leads) touch(l.phone, l.name, l.company, l.city, { type: "lead", label: "Prospecção", status: LEAD_STAGE[l.status] ?? l.status, refId: l.id }, l.lastContactAt);
      for (const s of sales) touch(s.clientPhone, s.clientName, null, null, { type: "sale", label: "Venda", status: `${s.productName} · ${SALE_STAGE[s.status] ?? s.status}`, refId: s.id });
      for (const m of manual) touch(m.clientPhone, m.ownerName || m.clientName, m.establishmentName, m.city, { type: "manual", label: "Manual", status: CONTACT_STAGE[m.status] ?? m.status, refId: m.id }, m.lastContactAt, m.contactCount ?? 0);

      const out = [...map.values()].map(r => {
        const lg = logOf.get(r.key);
        const last = [r.lastContactAt, lg?.at ?? null].filter(Boolean).sort((a, b) => b!.getTime() - a!.getTime())[0] ?? null;
        return { ...r, lastContactAt: last, contactCount: Math.max(r.contactCount, lg?.n ?? 0) };
      });
      res.json(out);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Cobrança gentil de um cliente com conta a receber em aberto/atrasada
  app.post("/api/clients/:id/billing/remind", async (req, res) => {
    try {
      const r = await sendGentleReminder(req.params.id);
      if (!r.ok) return res.status(400).json({ error: r.error });
      const c = await prisma.client.findUnique({ where: { id: req.params.id }, select: { id: true, name: true, phone: true } });
      if (c?.phone) await writeLog({ phone: c.phone, name: c.name, source: "client", refId: c.id, via: "billing", message: r.preview ?? "Lembrete de cobrança", byName: String(req.body?.byName ?? "") || null, byEmail: String(req.body?.byEmail ?? "") || null, byId: String(req.body?.byId ?? "") || null });
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
}
