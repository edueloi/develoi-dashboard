// Avisos automáticos de cobrança por WhatsApp (vencimento, atraso e bloqueio de assinatura)
import { PrismaClient } from "@prisma/client";
import { format } from "date-fns";
import { brtParts, daysFromToday } from "./time.js";
import { getSessionInfo, sendMessage } from "./baileysManager.js";

const prisma = new PrismaClient();

export type NoticeKind = "reminder" | "due_today" | "overdue" | "blocked";

const SEND_FROM_HOUR = 9;   // não manda mensagem de madrugada
const SEND_UNTIL_HOUR = 19;
const CHECK_EVERY_MS = 15 * 60 * 1000;
const GAP_BETWEEN_MESSAGES_MS = 5000;

const money = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const firstName = (n: string) => n.trim().split(/\s+/)[0];

interface Ctx { name: string; value: number; dueDate: Date; daysLeft: number; grace: number }

const TEMPLATES: Record<NoticeKind, (c: Ctx) => string> = {
  reminder: c =>
    `Olá, ${firstName(c.name)}! 👋\n\nPassando para avisar que a fatura da sua assinatura da *Develoi* de *${money(c.value)}* vence em *${format(c.dueDate, "dd/MM/yyyy")}* (${c.daysLeft === 1 ? "amanhã" : `em ${c.daysLeft} dias`}).\n\nSe já pagou, pode desconsiderar esta mensagem. Qualquer dúvida, é só responder por aqui.`,
  due_today: c =>
    `Olá, ${firstName(c.name)}! 👋\n\nHoje é o vencimento da fatura da sua assinatura da *Develoi* no valor de *${money(c.value)}*.\n\nPara manter tudo funcionando normalmente, realize o pagamento hoje. Se já pagou, obrigado! 🙏`,
  overdue: c =>
    `Olá, ${firstName(c.name)}.\n\nIdentificamos que a fatura de *${money(c.value)}* da sua assinatura da *Develoi*, com vencimento em *${format(c.dueDate, "dd/MM/yyyy")}*, está em atraso.\n\nRegularize em até *${c.grace} dias* após o vencimento para evitar o bloqueio da assinatura. Se já pagou, envie o comprovante por aqui.`,
  blocked: c =>
    `Olá, ${firstName(c.name)}.\n\nComo a fatura de *${money(c.value)}* (vencimento em *${format(c.dueDate, "dd/MM/yyyy")}*) não foi regularizada dentro do prazo, sua assinatura da *Develoi* foi *bloqueada*.\n\nAssim que o pagamento for confirmado, o acesso é liberado. Responda esta mensagem para falarmos sobre a regularização.`,
};

// Qual aviso o cliente deve receber agora, a partir dos dias até o vencimento
export function pickNotice(diff: number, reminderDaysBefore: number, graceDaysAfter: number): NoticeKind | null {
  if (diff > reminderDaysBefore) return null;
  if (diff > 0) return "reminder";
  if (diff === 0) return "due_today";
  if (-diff <= graceDaysAfter) return "overdue";
  return "blocked";
}

export interface NoticeResult { client: string; phone: string; kind: NoticeKind; sent: boolean; reason?: string }

export async function runBillingNotices(opts: { dryRun?: boolean } = {}): Promise<NoticeResult[]> {
  const dryRun = !!opts.dryRun;
  const results: NoticeResult[] = [];

  const config = await prisma.wppBotConfig.findFirst();
  if (!config?.botEnabled) return results;
  if (!dryRun && getSessionInfo().status !== "connected") return results;

  const clients = await prisma.client.findMany({
    where: { status: "active", nextDueDate: { not: null }, phone: { not: null }, billingCycle: { not: "one_time" } },
    include: { billingNotices: true },
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

    const text = TEMPLATES[kind]({
      name: c.name, value: c.billingValue, dueDate: due,
      daysLeft: daysFromToday(due), grace: c.graceDaysAfter,
    });
    const ok = await sendMessage(c.phone as string, text);
    if (!ok) { entry.reason = "falha no envio"; continue; }

    await prisma.clientBillingNotice.create({ data: { clientId: c.id, kind, dueDate: due } });
    if (kind === "blocked") await prisma.client.update({ where: { id: c.id }, data: { status: "paused" } });
    entry.sent = true;
    await new Promise(r => setTimeout(r, GAP_BETWEEN_MESSAGES_MS));
  }
  return results;
}

export function startBillingScheduler() {
  let running = false;
  const tick = async () => {
    const h = brtParts().hour; // horário de Brasília, não o do servidor
    if (running || h < SEND_FROM_HOUR || h >= SEND_UNTIL_HOUR) return;
    running = true;
    try {
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
