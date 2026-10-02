// Regras de vencimento e recebimento das assinaturas dos clientes (usado pelo servidor e pelo Asaas)
import { prisma } from "./db.js";
import { brtTodayUtc } from "./time.js";
import { syncBoxsysAccess } from "./boxsys.js";


// Calcula a próxima data de vencimento a partir de um dia-do-mês fixo,
// avançando ciclo(s) inteiros a partir de `from` até cair no futuro.
export function computeNextDueDate(dueDay: number, billingCycle: string, from: Date): Date {
  // trabalha em UTC: as datas de vencimento são guardadas como meia-noite UTC
  const clampDay = (year: number, month: number) => {
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return Math.min(dueDay, lastDay);
  };
  let year = from.getUTCFullYear();
  let month = from.getUTCMonth();
  let candidate = new Date(Date.UTC(year, month, clampDay(year, month)));
  const stepMonths = billingCycle === "yearly" ? 12 : 1; // custom/one_time tratados como mensal p/ rollover
  while (candidate <= from) {
    month += stepMonths;
    year += Math.floor(month / 12);
    month = month % 12;
    candidate = new Date(Date.UTC(year, month, clampDay(year, month)));
  }
  return candidate;
}

export interface PaymentInput {
  amount?: number;
  paidAt?: string | Date;
  method?: string;
  notes?: string;
  asaasPaymentId?: string;
  dueDate?: Date | null;     // vencimento a que o pagamento se refere (Asaas informa)
  advance?: boolean;         // false = só registra, sem avançar o vencimento do cliente
}

// O vencimento NÃO avança sozinho: só quando um recebimento é registrado
// (botão manual ou webhook do Asaas). Sem isso não dá para saber quem está em atraso.
// Idempotente por asaasPaymentId: o Asaas pode repetir o mesmo evento.
export async function registerClientPayment(clientId: string, input: PaymentInput = {}) {
  const c = await prisma.client.findUnique({ where: { id: clientId } });
  if (!c) return null;

  if (input.asaasPaymentId) {
    const already = await prisma.clientPayment.findUnique({ where: { asaasPaymentId: input.asaasPaymentId } });
    if (already) return { client: c, payment: already, duplicate: true as const };
  }

  const paidAt = input.paidAt ? new Date(input.paidAt) : brtTodayUtc(); // dia de hoje em Brasília
  const advance = input.advance !== false;
  let next: Date | null = c.nextDueDate;
  if (advance) {
    next = null;
    if (c.billingCycle !== "one_time" && c.nextDueDate) {
      const day = c.dueDay ?? c.nextDueDate.getUTCDate();
      next = computeNextDueDate(day, c.billingCycle, c.nextDueDate);
    }
  }
  // cliente que foi bloqueado por falta de pagamento volta a ficar ativo
  const wasBlocked = c.nextDueDate
    ? await prisma.clientBillingNotice.findFirst({ where: { clientId, kind: { in: ["blocked", "block_pending"] }, dueDate: c.nextDueDate } })
    : null;

  const payment = await prisma.clientPayment.create({
    data: {
      clientId,
      amount: input.amount !== undefined && !Number.isNaN(Number(input.amount)) ? Number(input.amount) : c.billingValue,
      dueDate: input.dueDate !== undefined ? input.dueDate : c.nextDueDate,
      paidAt,
      method: input.method || null,
      notes: input.notes || null,
      asaasPaymentId: input.asaasPaymentId || null,
    },
  });
  const client = await prisma.client.update({
    where: { id: clientId },
    data: {
      ...(advance ? { nextDueDate: next } : {}),
      lastPaidAt: paidAt,
      ...(wasBlocked ? { status: "active" } : {}),
    },
  });
  void syncBoxsysAccess(clientId); // cliente voltou a ficar ativo: libera a loja no Store BoxSys, se houver
  return { client, payment, duplicate: false as const };
}
