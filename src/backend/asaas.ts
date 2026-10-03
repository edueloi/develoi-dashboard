// Integração com o Asaas: cria a assinatura do cliente, recebe os pagamentos pelo webhook
// e usa o bot do WhatsApp para mandar a fatura (link de pagamento) e o comprovante/extrato.
import type { Express, Request, Response } from "express";
import { prisma } from "./db.js";
import { getSessionInfo, sendMessage, sendDocument, registerClientActionHandler } from "./wa.js";
import type { ClientAction, ClientActionResult } from "./baileysManager.js";
import { registerClientPayment } from "./clientBilling.js";
import { sendThanksAndReceipt, buildStatementPdf } from "./receipts.js";
import { loadSubscriptionInfo, assinaturaTexto, nomeCurto } from "./clientInfo.js";
import { brtTodayUtc } from "./time.js";


export type BillingType = "UNDEFINED" | "PIX" | "BOLETO" | "CREDIT_CARD";
const BILLING_TYPES: BillingType[] = ["UNDEFINED", "PIX", "BOLETO", "CREDIT_CARD"];

// ─── Configuração (variáveis de ambiente) ────────────────────────────────────
//  ASAAS_API_KEY        chave da API (começa com $aact_…)
//  ASAAS_ENV            "sandbox" (padrão) ou "production"
//  ASAAS_WEBHOOK_TOKEN  senha que o Asaas envia no webhook (você inventa)
//  PUBLIC_BASE_URL      endereço público do sistema, ex.: https://painel.develoi.com.br

const cfg = () => ({
  key: process.env.ASAAS_API_KEY || "",
  env: process.env.ASAAS_ENV === "production" ? ("production" as const) : ("sandbox" as const),
  webhookToken: process.env.ASAAS_WEBHOOK_TOKEN || "",
  publicUrl: (process.env.PUBLIC_BASE_URL || process.env.APP_URL || "").replace(/\/$/, ""),
});
const baseUrl = () => (cfg().env === "production" ? "https://api.asaas.com/v3" : "https://api-sandbox.asaas.com/v3");

class AsaasError extends Error {}

async function asaas<T = any>(path: string, method = "GET", body?: unknown): Promise<T> {
  const { key } = cfg();
  if (!key) throw new AsaasError("Asaas não configurado: defina ASAAS_API_KEY no .env do servidor.");
  const res = await fetch(baseUrl() + path, {
    method,
    headers: { "Content-Type": "application/json", access_token: key, "User-Agent": "develoi-dashboard" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.errors?.[0]?.description || data?.message || `Erro ${res.status} do Asaas`;
    throw new AsaasError(msg);
  }
  return data as T;
}

// ─── Utilidades ──────────────────────────────────────────────────────────────

const digits = (v?: string | null) => String(v || "").replace(/\D/g, "");
const money = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDay = (d: Date) => d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
const firstName = (n: string) => n.trim().split(/\s+/)[0];
const dayOf = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00.000Z`); // "2026-10-15" → meia-noite UTC
const sameDay = (a: Date | null, b: Date | null) => !!a && !!b && a.getTime() === b.getTime();
const methodLabel = (t?: string, status?: string) =>
  status === "RECEIVED_IN_CASH" ? "Dinheiro" : t === "PIX" ? "Pix" : t === "BOLETO" ? "Boleto" : t === "CREDIT_CARD" ? "Cartão" : "Asaas";
const samePhone = (a: string, b: string) => { const x = digits(a), y = digits(b); return x.length >= 8 && y.length >= 8 && x.slice(-8) === y.slice(-8); };

async function clientBotReady() {
  const config = await prisma.wppBotConfig.findFirst();
  return config?.botEnabled === true && getSessionInfo().status === "connected";
}

// ─── Cliente e assinatura no Asaas ───────────────────────────────────────────

async function ensureCustomer(client: { id: string; name: string; document: string | null; email: string | null; phone: string | null; asaasCustomerId: string | null }) {
  if (client.asaasCustomerId) return client.asaasCustomerId;
  const doc = digits(client.document);
  if (doc.length !== 11 && doc.length !== 14) {
    throw new AsaasError("Cadastre o CPF ou CNPJ do cliente antes de criar a cobrança no Asaas.");
  }
  let phone = digits(client.phone);
  if (phone.startsWith("55") && phone.length > 11) phone = phone.slice(2);
  const customer = await asaas<{ id: string }>("/customers", "POST", {
    name: client.name,
    cpfCnpj: doc,
    email: client.email || undefined,
    mobilePhone: phone.length >= 10 ? phone : undefined,
    externalReference: client.id,
    notificationDisabled: true, // quem avisa o cliente é o nosso bot
  });
  await prisma.client.update({ where: { id: client.id }, data: { asaasCustomerId: customer.id } });
  return customer.id;
}

async function upsertCharge(clientId: string, p: any) {
  const data = {
    clientId,
    value: Number(p.value) || 0,
    dueDate: dayOf(p.dueDate),
    status: String(p.status || "PENDING"),
    billingType: p.billingType ?? null,
    invoiceUrl: p.invoiceUrl ?? null,
    bankSlipUrl: p.bankSlipUrl ?? null,
    receiptUrl: p.transactionReceiptUrl ?? null,
    paidAt: p.paymentDate || p.clientPaymentDate ? dayOf(p.paymentDate || p.clientPaymentDate) : null,
  };
  return prisma.asaasCharge.upsert({ where: { asaasPaymentId: p.id }, create: { asaasPaymentId: p.id, ...data }, update: data });
}

// QR Code e copia-e-cola do Pix de uma cobrança
export const pixQrFor = (asaasPaymentId: string) =>
  asaas<{ encodedImage: string; payload: string; expirationDate?: string }>(`/payments/${asaasPaymentId}/pixQrCode`);

// Link da nossa página de fatura (no lugar da página padrão do Asaas)
export const publicInvoiceUrl = (chargeId: string) => `${cfg().publicUrl}/fatura/${chargeId}`;

// "Assinatura Store BoxSys — Doçaria Teste Edu": o sistema que o cliente assina e o nome do estabelecimento
async function invoiceDescription(c: { id: string; name: string; businessName: string | null }) {
  return `Assinatura ${nomeCurto(await loadSubscriptionInfo(c.id))} — ${c.businessName || c.name}`;
}

export async function createSubscription(clientId: string, billingType: BillingType, sendLink: boolean) {
  const c = await prisma.client.findUnique({ where: { id: clientId } });
  if (!c) throw new AsaasError("Cliente não encontrado.");
  if (c.asaasSubscriptionId) throw new AsaasError("Este cliente já tem uma assinatura no Asaas.");
  if (!c.nextDueDate) throw new AsaasError("Defina o próximo vencimento do cliente antes.");
  if (!(c.billingValue > 0)) throw new AsaasError("Defina o valor da assinatura antes.");
  if (c.nextDueDate < brtTodayUtc()) throw new AsaasError("O vencimento está no passado. Registre o recebimento ou ajuste a data para hoje ou depois.");
  if (!BILLING_TYPES.includes(billingType)) throw new AsaasError("Forma de pagamento inválida.");

  const customer = await ensureCustomer(c);
  const dueDay = c.nextDueDate.toISOString().slice(0, 10);
  const description = await invoiceDescription(c); // aparece na fatura do cliente
  let charges: any[] = [];
  let subscriptionId: string | null = null;

  if (c.billingCycle === "one_time") {
    const p = await asaas<any>("/payments", "POST", { customer, billingType, value: c.billingValue, dueDate: dueDay, description, externalReference: c.id });
    charges = [p];
  } else {
    const sub = await asaas<any>("/subscriptions", "POST", {
      customer, billingType, value: c.billingValue, nextDueDate: dueDay,
      cycle: c.billingCycle === "yearly" ? "YEARLY" : "MONTHLY", description, externalReference: c.id,
    });
    subscriptionId = sub.id;
    const list = await asaas<{ data: any[] }>(`/subscriptions/${sub.id}/payments?limit=12`);
    charges = list.data ?? [];
  }

  await prisma.client.update({ where: { id: c.id }, data: { asaasCustomerId: customer, asaasSubscriptionId: subscriptionId, asaasBillingType: billingType } });
  for (const p of charges) if (p.status !== "DELETED") await upsertCharge(c.id, p);

  let sent = false;
  if (sendLink) {
    try { sent = await sendInvoice(c.id, { welcome: true }); } catch { sent = false; }
  }
  return { subscriptionId, charges: charges.length, sent };
}

// Gera uma fatura avulsa que QUITA o vencimento atual do cliente (ex.: ciclo em atraso sem cobrança aberta).
// O Asaas não aceita vencimento no passado: a fatura vence hoje (ou na data de vencimento, se for futura) e,
// ao ser paga, o vencimento do cliente avança normalmente — a referência do ciclo vai em externalReference.
export async function createCycleCharge(clientId: string, billingType: BillingType, sendLink: boolean) {
  const c = await prisma.client.findUnique({ where: { id: clientId } });
  if (!c) throw new AsaasError("Cliente não encontrado.");
  if (!c.nextDueDate) throw new AsaasError("Defina o próximo vencimento do cliente antes.");
  if (!(c.billingValue > 0)) throw new AsaasError("Defina o valor da assinatura antes.");
  if (!BILLING_TYPES.includes(billingType)) throw new AsaasError("Forma de pagamento inválida.");
  if (await openCharge(clientId)) throw new AsaasError("Este cliente já tem uma fatura em aberto.");

  const customer = await ensureCustomer(c);
  const cycle = c.nextDueDate.toISOString().slice(0, 10);
  const today = brtTodayUtc();
  const dueDate = (c.nextDueDate > today ? c.nextDueDate : today).toISOString().slice(0, 10);
  const p = await asaas<any>("/payments", "POST", {
    customer, billingType, value: c.billingValue, dueDate,
    description: `${await invoiceDescription(c)} (vencimento ${fmtDay(c.nextDueDate)})`,
    externalReference: `${c.id}|ciclo:${cycle}`,
  });
  if (!c.asaasCustomerId) await prisma.client.update({ where: { id: c.id }, data: { asaasCustomerId: customer } });
  await upsertCharge(c.id, p);

  let sent = false;
  if (sendLink) { try { sent = await sendInvoice(c.id); } catch { sent = false; } }
  return { chargeId: p.id, dueDate, sent };
}

export async function cancelSubscription(clientId: string) {
  const c = await prisma.client.findUnique({ where: { id: clientId } });
  if (!c?.asaasSubscriptionId) throw new AsaasError("Este cliente não tem assinatura no Asaas.");
  await asaas(`/subscriptions/${c.asaasSubscriptionId}`, "DELETE");
  await prisma.client.update({ where: { id: c.id }, data: { asaasSubscriptionId: null } });
}

// ─── Mensagens do bot ────────────────────────────────────────────────────────

async function openCharge(clientId: string) {
  return prisma.asaasCharge.findFirst({
    where: { clientId, status: { in: ["PENDING", "OVERDUE"] } },
    orderBy: { dueDate: "asc" },
  });
}

// Texto da fatura em aberto (a mais antiga). null = não há fatura com link.
async function composeInvoice(clientId: string, opts: { welcome?: boolean } = {}) {
  const c = await prisma.client.findUnique({ where: { id: clientId } });
  if (!c) return null;
  const charge = await openCharge(clientId);
  if (!charge?.invoiceUrl) return { client: c, charge: null, text: null as string | null };

  const late = charge.dueDate < brtTodayUtc();
  const ass = assinaturaTexto(await loadSubscriptionInfo(clientId)); // ex.: "assinatura do sistema *Store BoxSys*"
  const text = [
    opts.welcome
      ? `Olá, ${firstName(c.name)}! 👋\n\nSua ${ass} foi criada. Segue a fatura:`
      : `Olá, ${firstName(c.name)}! 👋\n\nSegue a fatura da sua ${ass}${late ? " (em atraso)" : ""}:`,
    `💰 *${money(charge.value)}*\n📅 Vencimento: *${fmtDay(charge.dueDate)}*`,
    `💳 Pague por ${c.asaasBillingType && c.asaasBillingType !== "UNDEFINED" ? methodLabel(c.asaasBillingType) : "Pix, boleto ou cartão"} neste link:\n${publicInvoiceUrl(charge.id)}`,
    `Depois do pagamento, enviamos o comprovante por aqui. ✅`,
  ].join("\n\n");
  return { client: c, charge, text };
}

// Manda ao WhatsApp cadastrado do cliente o link da fatura em aberto
export async function sendInvoice(clientId: string, opts: { welcome?: boolean } = {}): Promise<boolean> {
  const inv = await composeInvoice(clientId, opts);
  if (!inv) throw new AsaasError("Cliente não encontrado.");
  if (!inv.client.phone) throw new AsaasError("O cliente não tem WhatsApp cadastrado.");
  if (!(await clientBotReady())) throw new AsaasError("O bot precisa estar ativado e com o WhatsApp conectado.");
  if (!inv.charge || !inv.text) throw new AsaasError("Não há fatura em aberto para este cliente.");

  const ok = await sendMessage(inv.client.phone, inv.text);
  if (ok) await prisma.asaasCharge.update({ where: { id: inv.charge.id }, data: { linkSentAt: new Date() } });
  return ok;
}

async function statementText(clientId: string) {
  const c = await prisma.client.findUnique({ where: { id: clientId }, include: { payments: { orderBy: { paidAt: "desc" }, take: 6 } } });
  if (!c) return null;
  const charge = await openCharge(clientId);
  const total = c.payments.reduce((a, p) => a + p.amount, 0);
  const info = await loadSubscriptionInfo(clientId);
  const parts = [`📄 *Extrato de pagamentos* — ${firstName(c.name)}\n🧩 ${assinaturaTexto(info).replace(/^assinatura/, "Assinatura")}`];
  parts.push(
    c.payments.length
      ? c.payments.map(p => `✅ ${fmtDay(p.paidAt)} — ${money(p.amount)}${p.method ? ` (${p.method})` : ""}`).join("\n") + `\n\n*Total dos últimos pagamentos:* ${money(total)}`
      : "Nenhum pagamento registrado ainda.",
  );
  if (charge) parts.push(`⏳ *Em aberto:* ${money(charge.value)} — vence em ${fmtDay(charge.dueDate)}${charge.invoiceUrl ? `\n💳 ${publicInvoiceUrl(charge.id)}` : ""}`);
  else if (c.nextDueDate) parts.push(`📅 Próximo vencimento: ${fmtDay(c.nextDueDate)} — ${money(c.billingValue)}`);
  const pdf = await buildStatementPdf({
    clientName: c.name, document: c.document, subscription: assinaturaTexto(info).replace(/^assinatura/, "Assinatura"),
    payments: c.payments.map(p => ({ paidAt: p.paidAt, amount: p.amount, method: p.method })), total,
    open: charge ? { value: charge.value, dueDate: charge.dueDate } : null,
    nextDue: !charge && c.nextDueDate ? { date: c.nextDueDate, value: c.billingValue } : null,
  }).catch(() => null);
  const file = pdf ? { buffer: pdf, fileName: `Extrato - ${firstName(c.name)}.pdf` } : undefined;
  return { client: c, text: parts.join("\n\n"), file };
}

export async function sendStatement(clientId: string): Promise<boolean> {
  const s = await statementText(clientId);
  if (!s) throw new AsaasError("Cliente não encontrado.");
  if (!s.client.phone) throw new AsaasError("O cliente não tem WhatsApp cadastrado.");
  if (!(await clientBotReady())) throw new AsaasError("O bot precisa estar ativado e com o WhatsApp conectado.");
  const ok = await sendMessage(s.client.phone, s.text);
  if (ok && s.file) await sendDocument(s.client.phone, s.file.buffer, s.file.fileName, "📎 Extrato de pagamentos em PDF");
  return ok;
}

// "Já sou cliente": a pessoa informa o CPF/CNPJ do cadastro e o bot responde na própria conversa.
// Só entrega para cadastro ativo cujo documento confere; a resposta vai para quem está conversando.
async function handleClientAction(kind: ClientAction, documentDigits: string): Promise<ClientActionResult> {
  const candidates = await prisma.client.findMany({ where: { status: { not: "cancelled" }, document: { not: null } }, select: { id: true, document: true } });
  const hit = candidates.find(c => digits(c.document) === documentDigits);
  if (!hit) return { status: "not_found" };

  if (kind === "statement") {
    const s = await statementText(hit.id);
    return s ? { status: "sent", text: s.text, file: s.file } : { status: "error" };
  }

  const inv = await composeInvoice(hit.id);
  if (!inv) return { status: "error" };
  if (!inv.charge || !inv.text) {
    const next = inv.client.nextDueDate ? ` Seu próximo vencimento é em *${fmtDay(inv.client.nextDueDate)}*.` : "";
    return { status: "no_open", text: `Olá, ${firstName(inv.client.name)}! No momento não há fatura em aberto para o seu cadastro. ✅${next}\n\nSe precisar de ajuda com a cobrança, digite *0* e escolha o setor *Financeiro*.` };
  }
  await prisma.asaasCharge.update({ where: { id: inv.charge.id }, data: { linkSentAt: new Date() } });
  return { status: "sent", text: inv.text };
}

// ─── Pagamentos (webhook e sincronização) ────────────────────────────────────

async function notifyTeam(text: string) {
  const recipients = await prisma.teamRecipient.findMany({ where: { active: true, notifyReceivables: true } });
  for (const r of recipients) await sendMessage(r.phone, text);
}

async function findClientFor(p: any) {
  const charge = await prisma.asaasCharge.findUnique({ where: { asaasPaymentId: p.id } });
  if (charge) return prisma.client.findUnique({ where: { id: charge.clientId } });
  if (p.externalReference) {
    const byRef = await prisma.client.findUnique({ where: { id: String(p.externalReference) } });
    if (byRef) return byRef;
  }
  if (p.customer) return prisma.client.findFirst({ where: { asaasCustomerId: String(p.customer) } });
  return null;
}

// "<clientId>|ciclo:2026-09-22" → "2026-09-22"
const cycleOf = (ref: unknown) => /\|ciclo:(\d{4}-\d{2}-\d{2})$/.exec(String(ref ?? ""))?.[1] ?? null;

const PAID_EVENTS = new Set(["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"]);
const PAID_STATUSES = new Set(["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"]);

export interface PaymentOutcome { outcome: string; clientName?: string }

// Trata uma cobrança do Asaas (vinda do webhook ou da sincronização). Idempotente.
// Para pagamentos, NÃO confia só no aviso: consulta a cobrança direto no Asaas e só dá baixa
// se ela estiver realmente paga (e usa o valor/data que o Asaas confirma).
export async function handlePayment(event: string, payload: any): Promise<PaymentOutcome> {
  let p = payload;
  const client = await findClientFor(p);
  if (!client) return { outcome: "ignorado: cobrança que não é de nenhum cliente deste sistema" };

  const isPaidEvent = PAID_EVENTS.has(event);
  if (isPaidEvent) {
    const fresh = await asaas<any>(`/payments/${encodeURIComponent(p.id)}`); // falha aqui => 500 => o Asaas reenvia
    if (!PAID_STATUSES.has(fresh.status)) {
      await upsertCharge(client.id, fresh);
      return { clientName: client.name, outcome: `ignorado: o Asaas informa status ${fresh.status}, não pago` };
    }
    p = fresh;
  }

  const charge = await upsertCharge(client.id, p);

  if (event === "PAYMENT_REFUNDED" || event === "PAYMENT_CHARGEBACK_REQUESTED") {
    await notifyTeam(`↩️ *Pagamento estornado* — ${client.name} (${money(charge.value)}). Confira no Asaas.`);
    return { clientName: client.name, outcome: "estorno avisado à equipe" };
  }
  if (!isPaidEvent) return { clientName: client.name, outcome: `cobrança atualizada (${p.status})` };

  const paidAt = p.paymentDate || p.clientPaymentDate ? dayOf(p.paymentDate || p.clientPaymentDate) : brtTodayUtc();
  const label = methodLabel(p.billingType, p.status);
  const result = await registerClientPayment(client.id, {
    amount: Number(p.value) || charge.value,
    paidAt,
    method: label,
    notes: "Recebido via Asaas",
    asaasPaymentId: p.id,
    dueDate: charge.dueDate,
    advance: sameDay(charge.dueDate, client.nextDueDate) || cycleOf(p.externalReference) === client.nextDueDate?.toISOString().slice(0, 10), // só avança se for a fatura do ciclo atual
  });
  if (!result) return { clientName: client.name, outcome: "ignorado: cliente não encontrado" };
  if (result.duplicate) return { clientName: client.name, outcome: "já registrado antes (duplicado ignorado)" };

  await prisma.asaasCharge.update({ where: { id: charge.id }, data: { paidAt } });

  // agradecimento + recibo em PDF ao cliente (uma vez só)
  let receipt = "sem WhatsApp para mandar o recibo";
  if (!charge.receiptSentAt && client.phone && (await clientBotReady())) {
    let ok = false;
    try { ok = await sendThanksAndReceipt({ clientPaymentId: result.payment.id }, { nextDue: result.client.nextDueDate, receiptUrl: p.transactionReceiptUrl }); } catch { ok = false; }
    if (ok) await prisma.asaasCharge.update({ where: { id: charge.id }, data: { receiptSentAt: new Date() } });
    receipt = ok ? "agradecimento e recibo em PDF enviados ao cliente" : "recibo NÃO enviado (WhatsApp falhou)";
  } else if (charge.receiptSentAt) receipt = "recibo já enviado antes";
  else if (!client.phone) receipt = "cliente sem WhatsApp";
  else receipt = "recibo não enviado (bot desligado ou desconectado)";

  await notifyTeam(`💰 *Pagamento recebido*\n${client.name} — *${money(Number(p.value) || charge.value)}* (${label})`);
  const adv = result.client.nextDueDate ? `vencimento avançou para ${fmtDay(result.client.nextDueDate)}` : "vencimento mantido";
  return { clientName: client.name, outcome: `recebimento registrado; ${adv}; ${receipt}` };
}

// Rede de segurança: confere as cobranças no Asaas caso algum webhook tenha falhado
export async function syncCharges(clientId?: string) {
  const clients = await prisma.client.findMany({ where: { asaasSubscriptionId: { not: null }, ...(clientId ? { id: clientId } : {}) } });
  let updated = 0;
  for (const c of clients) {
    // mantém o texto da fatura em dia com o sistema/estabelecimento atuais (inclui as cobranças ainda em aberto)
    await asaas(`/subscriptions/${c.asaasSubscriptionId}`, "PUT", { description: await invoiceDescription(c), updatePendingPayments: true }).catch(() => {});
    const list = await asaas<{ data: any[] }>(`/subscriptions/${c.asaasSubscriptionId}/payments?limit=24`);
    for (const p of list.data ?? []) {
      if (p.status === "DELETED") continue;
      await handlePayment(PAID_STATUSES.has(p.status) ? "PAYMENT_RECEIVED" : "SYNC", p);
      updated++;
    }
  }
  return updated;
}

// "extrato" / "fatura" no WhatsApp. Roda no processo que mantém o socket (o worker do WhatsApp).
export function registerAsaasKeywords() {
  registerClientActionHandler(handleClientAction);
}

export function startAsaasScheduler() {
  registerAsaasKeywords();
  if (!cfg().key) return;
  const tick = async () => { try { await syncCharges(); } catch (e) { console.error("[asaas] sincronização falhou:", e); } };
  setInterval(tick, 30 * 60 * 1000);
  setTimeout(tick, 2 * 60 * 1000);
}

// ─── Rotas ───────────────────────────────────────────────────────────────────

export function registerAsaasRoutes(app: Express) {
  const fail = (res: Response, e: any) => res.status(e instanceof AsaasError ? 400 : 500).json({ error: e.message });

  app.get("/api/asaas/status", (_req, res) => {
    const c = cfg();
    res.json({ configured: !!c.key, env: c.env, webhookTokenSet: !!c.webhookToken, webhookUrl: c.publicUrl ? `${c.publicUrl}/api/asaas/webhook` : null });
  });

  // ── Webhook: recebe os avisos do Asaas ──
  const logWebhook = (data: { event: string; asaasPaymentId?: string | null; clientName?: string | null; outcome: string; ok: boolean; payload?: unknown }) =>
    prisma.asaasWebhookLog.create({
      data: { event: data.event, asaasPaymentId: data.asaasPaymentId ?? null, clientName: data.clientName ?? null, ok: data.ok,
        outcome: data.outcome.slice(0, 160), payload: data.payload ? JSON.stringify(data.payload).slice(0, 8000) : null },
    }).catch(() => {});

  app.post("/api/asaas/webhook", async (req: Request, res: Response) => {
    const { webhookToken } = cfg();
    const { event, payment } = req.body ?? {};
    const evName = typeof event === "string" ? event : "?";
    if (!webhookToken || req.headers["asaas-access-token"] !== webhookToken) {
      await logWebhook({ event: evName, asaasPaymentId: payment?.id ?? null, outcome: "REJEITADO: token de autenticação inválido", ok: false });
      return res.status(401).json({ error: "Token inválido." });
    }
    try {
      let result: PaymentOutcome = { outcome: "sem cobrança no aviso" };
      if (payment?.id && typeof event === "string") result = await handlePayment(event, payment);
      await logWebhook({ event: evName, asaasPaymentId: payment?.id ?? null, clientName: result.clientName, outcome: result.outcome, ok: true, payload: payment });
      res.json({ received: true });
    } catch (e: any) {
      console.error("[asaas] erro no webhook:", e);
      await logWebhook({ event: evName, asaasPaymentId: payment?.id ?? null, outcome: `ERRO: ${e.message}`, ok: false, payload: payment });
      res.status(500).json({ error: e.message }); // o Asaas tenta de novo
    }
  });

  // Avisos recebidos (mais recentes primeiro)
  app.get("/api/asaas/events", async (req, res) => {
    try {
      const take = Math.min(100, Math.max(1, Number(req.query.limit) || 15));
      res.json(await prisma.asaasWebhookLog.findMany({ orderBy: { createdAt: "desc" }, take }));
    } catch (e) { fail(res, e); }
  });

  // Processa de novo um aviso (ex.: o que falhou por o WhatsApp estar fora do ar)
  app.post("/api/asaas/events/:id/reprocess", async (req, res) => {
    try {
      const ev = await prisma.asaasWebhookLog.findUnique({ where: { id: req.params.id } });
      if (!ev?.payload) throw new AsaasError("Este aviso não tem os dados guardados para reprocessar.");
      const payment = JSON.parse(ev.payload);
      const result = await handlePayment(ev.event, payment);
      await logWebhook({ event: ev.event, asaasPaymentId: ev.asaasPaymentId, clientName: result.clientName, outcome: `(reprocessado) ${result.outcome}`, ok: true, payload: payment });
      res.json(result);
    } catch (e) { fail(res, e); }
  });

  // ── Conexão e configuração no Asaas ──
  app.post("/api/asaas/test", async (_req, res) => {
    try {
      const info = await asaas<any>("/myAccount/commercialInfo");
      res.json({ ok: true, env: cfg().env, name: info?.tradingName || info?.companyName || info?.name || null });
    } catch (e: any) { res.status(400).json({ ok: false, error: e.message }); }
  });

  // Webhooks cadastrados na conta do Asaas, marcando o deste sistema
  app.get("/api/asaas/webhooks", async (_req, res) => {
    try {
      const url = `${cfg().publicUrl}/api/asaas/webhook`;
      const list = await asaas<{ data: any[] }>("/webhooks?limit=50");
      res.json((list.data ?? []).map(w => ({
        id: w.id, name: w.name, url: w.url, enabled: !!w.enabled, interrupted: !!w.interrupted,
        sendType: w.sendType, events: w.events ?? [], penalized: Number(w.penalizedRequestsCount) || 0, mine: w.url === url,
      })));
    } catch (e) { fail(res, e); }
  });

  // Cria o webhook deste sistema no Asaas (ou atualiza, se já existir). Precisa de PUBLIC_BASE_URL e ASAAS_WEBHOOK_TOKEN.
  app.post("/api/asaas/setup-webhook", async (_req, res) => {
    try {
      const c = cfg();
      if (!c.publicUrl || !c.webhookToken) throw new AsaasError("Defina PUBLIC_BASE_URL e ASAAS_WEBHOOK_TOKEN no .env do servidor.");
      const url = `${c.publicUrl}/api/asaas/webhook`;
      const body = {
        name: "Develoi Dashboard", url, email: process.env.ASAAS_WEBHOOK_EMAIL || "eduardo.santos@comexport.com.br",
        enabled: true, interrupted: false, apiVersion: 3, authToken: c.webhookToken, sendType: "SEQUENTIALLY",
        events: ["PAYMENT_CREATED", "PAYMENT_UPDATED", "PAYMENT_CONFIRMED", "PAYMENT_RECEIVED", "PAYMENT_OVERDUE", "PAYMENT_REFUNDED", "PAYMENT_DELETED", "PAYMENT_CHARGEBACK_REQUESTED"],
      };
      const existing = (await asaas<{ data: any[] }>("/webhooks?limit=50")).data?.find(w => w.url === url);
      res.json(existing ? await asaas(`/webhooks/${existing.id}`, "PUT", body) : await asaas("/webhooks", "POST", body));
    } catch (e) { fail(res, e); }
  });

  // O Asaas pausa a fila depois de várias falhas seguidas; isto liga de novo
  app.post("/api/asaas/webhooks/:id/resume", async (req, res) => {
    try { res.json(await asaas(`/webhooks/${encodeURIComponent(req.params.id)}`, "PUT", { enabled: true, interrupted: false })); }
    catch (e) { fail(res, e); }
  });

  // Confere todas as assinaturas no Asaas agora (a mesma conferência automática de 30 min)
  // Ao trocar do sandbox para a produção: os cadastros/assinaturas/cobranças criados no teste não existem na conta real.
  // Limpa esses vínculos (os clientes, pagamentos e recibos do sistema continuam intactos). Só roda em produção.
  app.post("/api/asaas/reset-sandbox-links", async (req, res) => {
    try {
      if (cfg().env !== "production") throw new AsaasError("Só é permitido depois de trocar para a produção (ASAAS_ENV=production).");
      if (req.body?.confirm !== "LIMPAR") throw new AsaasError('Envie { "confirm": "LIMPAR" } para confirmar.');
      const clients = await prisma.client.updateMany({ data: { asaasCustomerId: null, asaasSubscriptionId: null, asaasBillingType: null } });
      const charges = await prisma.asaasCharge.deleteMany({});
      const logs = await prisma.asaasWebhookLog.deleteMany({});
      res.json({ clientes: clients.count, cobrancas: charges.count, eventos: logs.count });
    } catch (e) { fail(res, e); }
  });

  app.post("/api/asaas/sync-all", async (_req, res) => {
    try { res.json({ updated: await syncCharges() }); } catch (e) { fail(res, e); }
  });

  app.post("/api/clients/:id/asaas/subscribe", async (req, res) => {
    try { res.json(await createSubscription(req.params.id, (req.body?.billingType || "UNDEFINED") as BillingType, req.body?.sendLink !== false)); }
    catch (e) { fail(res, e); }
  });
  app.post("/api/clients/:id/asaas/charge", async (req, res) => {
    try { res.json(await createCycleCharge(req.params.id, (req.body?.billingType || "UNDEFINED") as BillingType, req.body?.sendLink !== false)); }
    catch (e) { fail(res, e); }
  });
  app.delete("/api/clients/:id/asaas/subscription", async (req, res) => {
    try { await cancelSubscription(req.params.id); res.json({ success: true }); } catch (e) { fail(res, e); }
  });
  app.post("/api/clients/:id/asaas/send-invoice", async (req, res) => {
    try { res.json({ sent: await sendInvoice(req.params.id) }); } catch (e) { fail(res, e); }
  });
  app.post("/api/clients/:id/asaas/send-statement", async (req, res) => {
    try { res.json({ sent: await sendStatement(req.params.id) }); } catch (e) { fail(res, e); }
  });
  app.post("/api/clients/:id/asaas/sync", async (req, res) => {
    try { res.json({ updated: await syncCharges(req.params.id) }); } catch (e) { fail(res, e); }
  });
  app.get("/api/clients/:id/asaas/charges", async (req, res) => {
    try { res.json(await prisma.asaasCharge.findMany({ where: { clientId: req.params.id }, orderBy: { dueDate: "desc" }, take: 12 })); }
    catch (e) { fail(res, e); }
  });
}
