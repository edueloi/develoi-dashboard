// Disparo de mensagens prontas pelo WhatsApp da Develoi (prospecção, relacionamento e cobrança gentil)
import type { Express } from "express";
import { prisma } from "./db.js";
import { sendOutreach, startConversation } from "./wa.js";
import { sendGentleReminder } from "./billingNotifier.js";

export function registerOutreachRoutes(app: Express) {
  // mode "bot": a BiIA envia e continua o papo se a pessoa responder · mode "attendant": abre a conversa em atendimento com quem enviou
  app.post("/api/outreach/send", async (req, res) => {
    try {
      const { mode, phone, name, message, leadId, contactId, attendantId, attendantName, sectorId } = req.body ?? {};
      const text = String(message ?? "").trim();
      const r = mode === "attendant"
        ? await startConversation({ phone: String(phone ?? ""), name, message: text, attendantId, attendantName: attendantName || "Atendente", sectorId })
        : await sendOutreach({ phone: String(phone ?? ""), name, message: text });
      if (!r.ok) return res.status(400).json({ error: r.error });

      // registra no funil / na lista de contatos de onde saiu
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
      res.json({ ok: true, conversationId: r.id });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Cobrança gentil de um cliente com conta a receber em aberto/atrasada
  app.post("/api/clients/:id/billing/remind", async (req, res) => {
    try {
      const r = await sendGentleReminder(req.params.id);
      if (!r.ok) return res.status(400).json({ error: r.error });
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
}
