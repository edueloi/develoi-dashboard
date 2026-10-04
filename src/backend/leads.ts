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

const SALE_OF_STAGE: Record<string, string> = { meeting: "lead", proposal: "negotiation", won: "won", lost: "lost" };
const SALE_NAME = (l: { name: string; company: string | null }) => (l.company ? `${l.company} (${l.name})` : l.name);

// Cria (ou atualiza) a venda do lead em Vendas: reunião vira "lead", proposta vira "negociação", ganho vira "fechada"
async function ensureSale(lead: any, saleStatus: string) {
  let sale = lead.saleId ? await prisma.sale.findUnique({ where: { id: lead.saleId } }) : null;
  if (!sale) {
    const product = lead.product ? await prisma.product.findFirst({ where: { name: lead.product } }) : null;
    sale = await prisma.sale.create({
      data: {
        clientName: SALE_NAME(lead), clientEmail: lead.email, clientPhone: lead.phone,
        productId: product?.id ?? lead.product ?? "", productName: product?.name ?? lead.product ?? "A definir",
        value: lead.value || 0, status: saleStatus, origin: "Prospecção", notes: `Veio da Prospecção${lead.city ? ` (${lead.city})` : ""}.`,
        closedAt: saleStatus === "won" ? new Date() : null,
      },
    });
    await prisma.lead.update({ where: { id: lead.id }, data: { saleId: sale.id } });
  } else if (sale.status !== saleStatus && sale.status !== "won") {
    sale = await prisma.sale.update({ where: { id: sale.id }, data: { status: saleStatus, closedAt: saleStatus === "won" ? new Date() : sale.closedAt } });
  } else if (saleStatus === "won" && sale.status !== "won") {
    sale = await prisma.sale.update({ where: { id: sale.id }, data: { status: "won", closedAt: new Date() } });
  }
  return sale;
}

// Desfaz um avanço errado: o negócio volta para a Prospecção (etapa Proposta), a venda volta para negociação
// e o cliente criado na conversão é removido, a menos que já tenha recebimentos, cobranças ou loja (aí fica e o aviso explica).
export async function revertToProspecting(opts: { leadId?: string; saleId?: string; clientId?: string }) {
  let lead = opts.leadId ? await prisma.lead.findUnique({ where: { id: opts.leadId } }) : null;
  let sale = opts.saleId ? await prisma.sale.findUnique({ where: { id: opts.saleId } }) : null;
  let client = opts.clientId ? await prisma.client.findUnique({ where: { id: opts.clientId } }) : null;

  if (!lead && sale) lead = await prisma.lead.findFirst({ where: { saleId: sale.id } });
  if (!lead && client) lead = await prisma.lead.findFirst({ where: { OR: [{ clientId: client.id }, ...(client.saleId ? [{ saleId: client.saleId }] : [])] } });
  if (!sale && lead?.saleId) sale = await prisma.sale.findUnique({ where: { id: lead.saleId } });
  if (!sale && client?.saleId) sale = await prisma.sale.findUnique({ where: { id: client.saleId } });
  if (!client && lead?.clientId) client = await prisma.client.findUnique({ where: { id: lead.clientId } });
  if (!client && sale) client = await prisma.client.findFirst({ where: { saleId: sale.id } });
  if (!lead && !sale && !client) throw new Error("Não encontrei nada para voltar.");

  // sem lead ainda (venda ou cliente que nasceram direto): cria o lead com os dados que existem
  if (!lead) {
    lead = await prisma.lead.create({
      data: {
        name: client?.name ?? sale!.clientName, company: client?.businessName ?? null, phone: client?.phone ?? sale?.clientPhone ?? null, email: client?.email ?? sale?.clientEmail ?? null,
        source: "outro", product: sale?.productName && sale.productName !== "A definir" ? sale.productName : null, value: client?.billingValue ?? sale?.value ?? 0, status: "proposal",
      },
    });
    await prisma.leadActivity.create({ data: { leadId: lead.id, type: "status", text: "Lead recriado a partir de uma venda/cliente que voltou para a Prospecção" } });
  }

  if (sale && (sale.status === "won" || sale.status === "lost" || sale.status === "cancelled")) {
    sale = await prisma.sale.update({ where: { id: sale.id }, data: { status: "negotiation", closedAt: null } });
  }

  let clientRemoved = false, clientKept: string | null = null;
  if (client) {
    const [pays, charges, recs] = await Promise.all([
      prisma.clientPayment.count({ where: { clientId: client.id } }),
      prisma.asaasCharge.count({ where: { clientId: client.id } }),
      prisma.receivable.count({ where: { clientId: client.id } }),
    ]);
    if (pays || charges || recs || client.boxsysTenantId || client.asaasSubscriptionId) {
      clientKept = pays || charges || recs ? "ele já tem recebimentos ou cobranças registrados" : "ele já tem loja no BoxSys ou assinatura no Asaas";
    } else {
      await prisma.client.delete({ where: { id: client.id } });
      clientRemoved = true;
    }
  }

  const updated = await prisma.lead.update({
    where: { id: lead.id },
    data: { status: "proposal", clientId: clientRemoved ? null : (clientKept ? client!.id : null), saleId: sale?.id ?? lead.saleId, lostReason: null },
  });
  await prisma.leadActivity.create({ data: { leadId: lead.id, type: "status", text: `Voltou para a Prospecção (Proposta).${clientRemoved ? " O cliente criado por engano foi removido." : clientKept ? ` O cliente foi mantido porque ${clientKept}.` : ""}` } });
  return { lead: updated, clientRemoved, clientKept };
}

// Quando a venda muda lá em Vendas, o lead da Prospecção acompanha
export async function syncLeadFromSale(sale: { id: string; status: string }) {
  const lead = await prisma.lead.findFirst({ where: { saleId: sale.id } });
  if (!lead) return;
  const map: Record<string, string> = { lead: "meeting", negotiation: "proposal", won: "won", lost: "lost", cancelled: "lost" };
  const next = map[sale.status];
  if (!next || next === lead.status) return;
  if (next === "meeting" && lead.status !== "new" && lead.status !== "contacted") return; // não rebaixa quem já está mais adiante
  const client = next === "won" ? await prisma.client.findFirst({ where: { saleId: sale.id }, select: { id: true } }) : null;
  await prisma.lead.update({ where: { id: lead.id }, data: { status: next, ...(client ? { clientId: client.id } : {}), ...(next === "won" || next === "lost" ? { nextFollowUp: null } : {}) } });
  await prisma.leadActivity.create({ data: { leadId: lead.id, type: "status", text: `Atualizado pela tela de Vendas: ${STATUS_LABEL[next]}` } });
}

export function registerLeadRoutes(app: Express) {
  const fail = (res: any, e: any, code = 500) => res.status(code).json({ error: e.message ?? String(e) });
  const log = (leadId: string, type: string, text: string) => prisma.leadActivity.create({ data: { leadId, type, text } });

  // Opções de "produto de interesse": projetos/sistemas cadastrados + produtos & planos, sem repetir
  app.get("/api/leads/options", async (_req, res) => {
    try {
      const [projects, products] = await Promise.all([
        prisma.project.findMany({ select: { name: true, description: true }, orderBy: { name: "asc" } }),
        prisma.product.findMany({ where: { active: true }, select: { name: true, description: true }, orderBy: { name: "asc" } }),
      ]);
      const seen = new Set<string>();
      const all = [...projects, ...products].map(p => ({ name: p.name.replace(/\s+/g, " ").trim(), description: p.description ?? "" }));
      const items = all.filter(p => { const k = p.name.toLowerCase(); if (!p.name || seen.has(k)) return false; seen.add(k); return true; });
      res.json({ products: items.map(p => p.name), items });
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
      const lead = await prisma.lead.update({ where: { id: req.params.id }, data: data as any });
      if (lead.saleId) {
        const sale = await prisma.sale.findUnique({ where: { id: lead.saleId } });
        if (sale && sale.status !== "won") {
          await prisma.sale.update({ where: { id: sale.id }, data: { clientName: SALE_NAME(lead), clientEmail: lead.email, clientPhone: lead.phone, value: lead.value || 0, ...(lead.product ? { productName: lead.product } : {}) } });
        }
      }
      res.json(lead);
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
      // reunião e proposta abrem a venda em Vendas; perdido encerra a venda; voltar para o começo devolve a venda para "lead"
      const target = SALE_OF_STAGE[status] ?? (lead.saleId ? "lead" : undefined);
      if (target && (target !== "won")) {
        if (target === "lost" && !lead.saleId) { /* nada vendido ainda: não cria venda perdida */ }
        else {
          const sale = await ensureSale(lead, target);
          if (!before.saleId) await log(lead.id, "status", `Venda criada em Vendas (${target === "negotiation" ? "negociação" : "lead"})`);
          if (sale.status !== target && sale.status !== "won") await prisma.sale.update({ where: { id: sale.id }, data: { status: target } });
        }
      }
      res.json(await prisma.lead.findUnique({ where: { id: lead.id } }));
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

  // Ganho: fecha a venda em Vendas e cria o cliente (ou liga a um que já existe com o mesmo telefone)
  app.post("/api/leads/:id/convert", async (req, res) => {
    try {
      const lead = await prisma.lead.findUnique({ where: { id: req.params.id } });
      if (!lead) return fail(res, new Error("Lead não encontrado"), 404);
      if (lead.clientId) return res.json({ lead, clientId: lead.clientId });
      const sale = await ensureSale(lead, "won");
      const ph = digits(lead.phone);
      const existing = ph ? (await prisma.client.findMany({ select: { id: true, phone: true, saleId: true } })).find(c => digits(c.phone) === ph) : undefined;
      const byInSale = await prisma.client.findFirst({ where: { saleId: sale.id }, select: { id: true } });
      let clientId = existing?.id ?? byInSale?.id;
      if (!clientId) {
        clientId = (await prisma.client.create({
          data: { name: lead.name, businessName: lead.company, phone: lead.phone, email: lead.email, status: "active", billingValue: lead.value, startDate: new Date(), saleId: sale.id },
        })).id;
      } else if (existing && !existing.saleId) {
        await prisma.client.update({ where: { id: existing.id }, data: { saleId: sale.id } });
      }
      const updated = await prisma.lead.update({ where: { id: lead.id }, data: { status: "won", clientId, saleId: sale.id, lostReason: null, nextFollowUp: null } });
      await log(lead.id, "status", existing ? "Ganho: venda fechada e ligada a um cliente que já existia" : "Ganho: venda fechada e cliente criado");
      res.json({ lead: updated, clientId, reused: !!existing });
    } catch (e) { fail(res, e); }
  });

  app.post("/api/leads/:id/revert", async (req, res) => { try { res.json(await revertToProspecting({ leadId: req.params.id })); } catch (e) { fail(res, e); } });
  app.post("/api/sales/:id/revert-to-prospecting", async (req, res) => { try { res.json(await revertToProspecting({ saleId: req.params.id })); } catch (e) { fail(res, e); } });
  app.post("/api/clients/:id/revert-to-prospecting", async (req, res) => { try { res.json(await revertToProspecting({ clientId: req.params.id })); } catch (e) { fail(res, e); } });

  app.delete("/api/leads/:id", async (req, res) => {
    try { await prisma.lead.delete({ where: { id: req.params.id } }); res.json({ ok: true }); } catch (e) { fail(res, e); }
  });
}
