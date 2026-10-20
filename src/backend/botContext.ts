// Contexto das mensagens programadas (avisos de cobrança) para a IA da BiIA.
// Quando o cliente responde a um aviso automático ("já paguei", "manda de novo", "por que bloquearam?"),
// a IA precisa saber o que o sistema já mandou e em que situação a assinatura está.
// Só lê dados; nada aqui executa ação nem expõe links ou documentos.
import { prisma } from "./db.js";
import { brtTodayUtc } from "./time.js";

const KIND_LABEL: Record<string, string> = {
  reminder: "lembrete antes do vencimento",
  due_today: "aviso de vencimento hoje",
  overdue: "aviso de fatura em atraso",
  block_pending: "aviso de bloqueio iminente por falta de pagamento",
  blocked: "aviso de bloqueio por falta de pagamento",
};

const digits = (value?: string | null) => String(value ?? "").replace(/\D/g, "");
const day = (date: Date) => date.toISOString().slice(0, 10).split("-").reverse().join("/");
const money = (value: number) => `R$ ${value.toFixed(2).replace(".", ",")}`;
const CYCLE: Record<string, string> = { monthly: "mensal", yearly: "anual", custom: "personalizada", one_time: "avulsa" };

async function findClient(phone?: string | null, document?: string | null) {
  const wantPhone = digits(phone).slice(-9);
  const wantDoc = digits(document);
  if (wantPhone.length < 8 && wantDoc.length < 11) return null;
  const candidates = await prisma.client.findMany({
    where: { OR: [{ phone: { not: null } }, { document: { not: null } }] },
    select: { id: true, name: true, phone: true, document: true, status: true, billingValue: true, billingCycle: true, nextDueDate: true, lastPaidAt: true, inTrial: true },
    take: 1000,
  });
  return candidates.find(c => (wantDoc.length >= 11 && digits(c.document) === wantDoc)
    || (wantPhone.length >= 8 && digits(c.phone).endsWith(wantPhone))) ?? null;
}

/** Linhas de contexto sobre a assinatura e os avisos automáticos já enviados a este contato. */
export async function programmedContext(phone?: string | null, document?: string | null): Promise<string[]> {
  try {
    const client = await findClient(phone, document);
    if (!client) return [];
    const lines: string[] = [];
    const today = brtTodayUtc();

    if (client.status === "cancelled") lines.push("Assinatura cancelada.");
    else {
      const parts = [`Cliente cadastrado${client.inTrial ? " (em período de teste)" : ""}`];
      if (client.billingValue > 0) parts.push(`assinatura ${CYCLE[client.billingCycle] ?? client.billingCycle} de ${money(client.billingValue)}`);
      if (client.nextDueDate) {
        const late = client.nextDueDate < today;
        parts.push(late
          ? `fatura de ${day(client.nextDueDate)} em atraso (${Math.max(1, Math.round((today.getTime() - client.nextDueDate.getTime()) / 86_400_000))} dia(s))`
          : `próximo vencimento em ${day(client.nextDueDate)}`);
      }
      if (client.status === "paused") parts.push("acesso pausado por falta de pagamento");
      if (client.lastPaidAt) parts.push(`último pagamento em ${day(client.lastPaidAt)}`);
      lines.push(`${parts.join("; ")}.`);
    }

    const notices = await prisma.clientBillingNotice.findMany({
      where: { clientId: client.id }, orderBy: { sentAt: "desc" }, take: 4,
      select: { kind: true, dueDate: true, sentAt: true },
    });
    if (notices.length) {
      lines.push("Avisos automáticos que o sistema já enviou a este cliente (do mais recente ao mais antigo): "
        + notices.map(n => `${KIND_LABEL[n.kind] ?? n.kind} em ${day(n.sentAt)} (referente ao vencimento de ${day(n.dueDate)})`).join("; ") + ".");
    }

    const openCharge = await prisma.asaasCharge.findFirst({
      where: { clientId: client.id, status: { in: ["PENDING", "OVERDUE"] } }, orderBy: { dueDate: "desc" },
      select: { value: true, dueDate: true, status: true },
    });
    if (openCharge) lines.push(`Há uma cobrança Pix em aberto de ${money(openCharge.value)} com vencimento em ${day(openCharge.dueDate)}.`);
    return lines;
  } catch (error) {
    console.error("[BiIA/contexto] não foi possível carregar as mensagens programadas:", error instanceof Error ? error.message : error);
    return [];
  }
}
