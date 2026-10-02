// Avisos automáticos de cobrança por WhatsApp (vencimento, atraso e bloqueio de assinatura)
import { prisma } from "./db.js";
import { format } from "date-fns";
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
    where: { status: "active", nextDueDate: { not: null }, billingCycle: { not: "one_time" }, billingValue: { gt: 0 } },
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
    where: { status: "active", nextDueDate: { not: null }, phone: { not: null }, billingCycle: { not: "one_time" }, billingValue: { gt: 0 } }, // sem valor definido (teste/cortesia) não recebe cobrança
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
