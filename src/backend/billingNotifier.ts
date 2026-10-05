// Avisos automáticos de cobrança por WhatsApp (vencimento, atraso e bloqueio de assinatura)
import { prisma } from "./db.js";
// vencimentos ficam gravados como meia-noite UTC; formatar no fuso local (Brasília) mostrava o dia anterior
const format = (d: Date, _pattern: string) => d.toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" });
import { brtParts, daysFromToday } from "./time.js";
import { syncBoxsysAccess } from "./boxsys.js";
import { publicInvoiceUrl } from "./asaas.js";
import { assinaturaTexto, subscriptionInfoOf } from "./clientInfo.js";
import { getSessionInfo, sendMessage } from "./wa.js";


export type NoticeKind = "reminder" | "due_today" | "overdue" | "blocked";

const SEND_FROM_HOUR = 9;   // não manda mensagem de madrugada
const SEND_UNTIL_HOUR = 19;
const CHECK_EVERY_MS = 15 * 60 * 1000;
const GAP_BETWEEN_MESSAGES_MS = 5000;

const money = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const firstName = (n: string) => n.trim().split(/\s+/)[0];

interface Ctx { name: string; value: number; dueDate: Date; daysLeft: number; grace: number; link?: string | null; assinatura: string }

const payLine = (c: Ctx) => (c.link ? `

💳 *Pague aqui* (Pix, boleto ou cartão):
${c.link}` : "");

const TEMPLATES: Record<NoticeKind, (c: Ctx) => string> = {
  reminder: c =>
    `Olá, ${firstName(c.name)}! 👋\n\nPassando para avisar que a fatura da sua ${c.assinatura} de *${money(c.value)}* vence em *${format(c.dueDate, "dd/MM/yyyy")}* (${c.daysLeft === 1 ? "amanhã" : `em ${c.daysLeft} dias`}).\n\nSe já pagou, pode desconsiderar esta mensagem. Qualquer dúvida, é só responder por aqui.${payLine(c)}`,
  due_today: c =>
    `Olá, ${firstName(c.name)}! 👋\n\nHoje é o vencimento da fatura da sua ${c.assinatura} no valor de *${money(c.value)}*.\n\nPara manter tudo funcionando normalmente, realize o pagamento hoje. Se já pagou, obrigado! 🙏${payLine(c)}`,
  overdue: c =>
    `Olá, ${firstName(c.name)}.\n\nIdentificamos que a fatura de *${money(c.value)}* da sua ${c.assinatura}, com vencimento em *${format(c.dueDate, "dd/MM/yyyy")}*, está em atraso.\n\nRegularize em até *${c.grace} dias* após o vencimento para evitar o bloqueio da assinatura. Se já pagou, envie o comprovante por aqui.${payLine(c)}`,
  blocked: c =>
    `Olá, ${firstName(c.name)}.\n\nComo a fatura de *${money(c.value)}* (vencimento em *${format(c.dueDate, "dd/MM/yyyy")}*) não foi regularizada dentro do prazo, sua ${c.assinatura} foi *bloqueada*.\n\nAssim que o pagamento for confirmado, o acesso é liberado. Responda esta mensagem para falarmos sobre a regularização.${payLine(c)}`,
};

// Qual aviso o cliente deve receber agora, a partir dos dias até o vencimento
export function pickNotice(diff: number, reminderDaysBefore: number, graceDaysAfter: number): NoticeKind | null {
  if (diff > reminderDaysBefore) return null;
  if (diff > 0) return "reminder";
  if (diff === 0) return "due_today";
  if (-diff <= graceDaysAfter) return "overdue";
  return "blocked";
}

// Passou da tolerância → cliente pausado e loja bloqueada NA HORA, a qualquer hora e mesmo sem WhatsApp.
// O aviso "bloqueada" é só cortesia: fica pendente (block_pending) e sai na próxima janela de envio.
export async function enforceOverdueBlocks(): Promise<number> {
  const clients = await prisma.client.findMany({
    where: { status: "active", inTrial: false, nextDueDate: { not: null }, billingCycle: { not: "one_time" }, billingValue: { gt: 0 } },
  });
  let blocked = 0;
  for (const c of clients) {
    const due = c.nextDueDate as Date;
    if (pickNotice(daysFromToday(due), c.reminderDaysBefore, c.graceDaysAfter) !== "blocked") continue;
    await prisma.client.update({ where: { id: c.id }, data: { status: "paused" } });
    await prisma.clientBillingNotice.upsert({
      where: { clientId_kind_dueDate: { clientId: c.id, kind: "block_pending", dueDate: due } },
      create: { clientId: c.id, kind: "block_pending", dueDate: due }, update: {},
    });
    await syncBoxsysAccess(c.id); // bloqueia a loja no Store BoxSys
    console.log(`[cobrança] ${c.name}: passou da tolerância, cliente pausado e loja bloqueada`);
    blocked++;
  }
  return blocked;
}

// Envia o aviso de bloqueio que ficou pendente (só dentro da janela e com o bot pronto)
async function sendPendingBlockedNotices(results: NoticeResult[], dryRun: boolean) {
  const pending = await prisma.clientBillingNotice.findMany({ where: { kind: "block_pending" }, include: { client: { include: { projects: { include: { project: { select: { name: true } } } }, sale: { select: { productName: true } } } } } });
  for (const n of pending) {
    const c = n.client;
    const done = await prisma.clientBillingNotice.findUnique({ where: { clientId_kind_dueDate: { clientId: c.id, kind: "blocked", dueDate: n.dueDate } } });
    // já avisado, ou o cliente regularizou (vencimento mudou) → não precisa mais
    if (done || !c.phone || !c.nextDueDate || c.nextDueDate.getTime() !== n.dueDate.getTime()) {
      if (!done && (!c.nextDueDate || c.nextDueDate.getTime() !== n.dueDate.getTime())) await prisma.clientBillingNotice.delete({ where: { id: n.id } });
      continue;
    }
    const entry: NoticeResult = { client: c.name, phone: c.phone, kind: "blocked", sent: false };
    results.push(entry);
    if (dryRun) continue;
    const charge = await prisma.asaasCharge.findFirst({ where: { clientId: c.id, status: { in: ["PENDING", "OVERDUE"] }, dueDate: n.dueDate } });
    const text = TEMPLATES.blocked({
      name: c.name, value: c.billingValue, dueDate: n.dueDate, daysLeft: daysFromToday(n.dueDate), grace: c.graceDaysAfter,
      link: charge ? publicInvoiceUrl(charge.id) : null, assinatura: assinaturaTexto(subscriptionInfoOf(c)),
    });
    if (!(await sendMessage(c.phone, text))) { entry.reason = "falha no envio"; continue; }
    await prisma.clientBillingNotice.create({ data: { clientId: c.id, kind: "blocked", dueDate: n.dueDate } });
    entry.sent = true;
    await new Promise(r => setTimeout(r, GAP_BETWEEN_MESSAGES_MS));
  }
}

export interface NoticeResult { client: string; phone: string; kind: NoticeKind; sent: boolean; reason?: string }

export async function runBillingNotices(opts: { dryRun?: boolean } = {}): Promise<NoticeResult[]> {
  const dryRun = !!opts.dryRun;
  const results: NoticeResult[] = [];

  const config = await prisma.wppBotConfig.findFirst();
  if (!config?.botEnabled) return results;
  if (!dryRun && getSessionInfo().status !== "connected") return results;

  await sendPendingBlockedNotices(results, dryRun);

  const clients = await prisma.client.findMany({
    where: { status: "active", inTrial: false, nextDueDate: { not: null }, phone: { not: null }, billingCycle: { not: "one_time" }, billingValue: { gt: 0 } }, // sem valor definido (teste/cortesia) não recebe cobrança
    include: { billingNotices: true, projects: { include: { project: { select: { name: true } } } }, sale: { select: { productName: true } } },
  });

  for (const c of clients) {
    const due = c.nextDueDate as Date;
    const kind = pickNotice(daysFromToday(due), c.reminderDaysBefore, c.graceDaysAfter);
    if (!kind) continue;
    // um aviso por tipo e por vencimento
    if (c.billingNotices.some(n => n.kind === kind && n.dueDate.getTime() === due.getTime())) continue;

    const entry: NoticeResult = { client: c.name, phone: c.phone as string, kind, sent: false };
    results.push(entry);
    if (dryRun) continue;

    // se a assinatura está no Asaas, o aviso leva o link da fatura daquele vencimento
    const charge = await prisma.asaasCharge.findFirst({
      where: { clientId: c.id, status: { in: ["PENDING", "OVERDUE"] }, dueDate: due },
    });
    const text = TEMPLATES[kind]({
      name: c.name, value: c.billingValue, dueDate: due,
      daysLeft: daysFromToday(due), grace: c.graceDaysAfter, link: charge ? publicInvoiceUrl(charge.id) : null,
      assinatura: assinaturaTexto(subscriptionInfoOf(c)),
    });
    const ok = await sendMessage(c.phone as string, text);
    if (!ok) { entry.reason = "falha no envio"; continue; }

    await prisma.clientBillingNotice.create({ data: { clientId: c.id, kind, dueDate: due } });
    if (kind === "blocked") {
      await prisma.client.update({ where: { id: c.id }, data: { status: "paused" } });
      await syncBoxsysAccess(c.id); // bloqueia também a loja no Store BoxSys
    }
    entry.sent = true;
    await new Promise(r => setTimeout(r, GAP_BETWEEN_MESSAGES_MS));
  }
  return results;
}

export function startBillingScheduler() {
  let running = false;
  const tick = async () => {
    const h = brtParts().hour; // horário de Brasília, não o do servidor
    if (running) return;
    running = true;
    try {
      await enforceOverdueBlocks(); // bloqueio vale o dia todo
      if (h < SEND_FROM_HOUR || h >= SEND_UNTIL_HOUR) return; // mensagens só na janela
      const r = await runBillingNotices();
      const sent = r.filter(x => x.sent).length;
      if (sent) console.log(`[cobrança] ${sent} aviso(s) enviado(s)`);
    } catch (e) {
      console.error("[cobrança] erro:", e);
    } finally { running = false; }
  };
  setInterval(tick, CHECK_EVERY_MS);
  setTimeout(tick, 60 * 1000); // primeira checagem 1 min após subir
}

// Lembrete gentil disparado à mão (menu da conta a receber): sai na hora, em qualquer horário, e não conta como o aviso automático do vencimento
export async function sendGentleReminder(clientId: string): Promise<{ ok: boolean; error?: string; preview?: string }> {
  const c = await prisma.client.findUnique({
    where: { id: clientId },
    include: { projects: { include: { project: { select: { name: true } } } }, sale: { select: { productName: true } } },
  });
  if (!c) return { ok: false, error: "Cliente não encontrado." };
  if (!c.phone) return { ok: false, error: "Este cliente não tem telefone cadastrado." };
  if (c.inTrial) return { ok: false, error: "Este cliente está em período de teste e não tem cobrança." };
  if (!c.nextDueDate || !(c.billingValue > 0)) return { ok: false, error: "Este cliente não tem cobrança em aberto." };
  if (getSessionInfo().status !== "connected") return { ok: false, error: "O WhatsApp do bot não está conectado." };

  const due = c.nextDueDate;
  const diff = daysFromToday(due); // negativo = atrasado
  const charge = await prisma.asaasCharge.findFirst({ where: { clientId: c.id, status: { in: ["PENDING", "OVERDUE"] } }, orderBy: { dueDate: "asc" } });
  const link = charge ? publicInvoiceUrl(charge.id) : null;
  const assinatura = assinaturaTexto(subscriptionInfoOf(c));
  const valor = money(c.billingValue), data = format(due, "dd/MM/yyyy");
  const late = -diff;
  const when = diff < 0 ? `venceu em *${data}* (há ${late} ${late === 1 ? "dia" : "dias"})` : diff === 0 ? "vence *hoje*" : `vence em *${data}*`;
  const text =
    `Olá, ${firstName(c.name)}! Tudo bem? 😊\n\n` +
    `Aqui é a *BiIA*, assistente da Develoi. Passando com todo carinho para lembrar que a fatura da sua ${assinatura}, no valor de *${valor}*, ${when}.\n\n` +
    (diff < 0 ? "Sei que a correria do dia a dia faz a gente esquecer, então deixo o link para facilitar:" : "Para facilitar, deixo o link de pagamento:") +
    (link ? `\n\n💳 Pix, boleto ou cartão:\n${link}` : "\n\nSe quiser, é só me pedir a fatura por aqui que eu te envio.") +
    `\n\nSe você já pagou, é só desconsiderar e muito obrigada! 🙏 Qualquer dúvida, estou por aqui.`;
  const ok = await sendMessage(c.phone, text);
  return ok ? { ok: true, preview: text } : { ok: false, error: "Não consegui enviar a mensagem. Tente de novo." };
}
