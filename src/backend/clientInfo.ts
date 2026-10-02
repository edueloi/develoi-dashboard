// O que o cliente assina: o(s) sistema(s) vinculado(s) a ele. Usado em todas as mensagens ao cliente
// (fatura, extrato, avisos de vencimento, agradecimento e recibo) para ele saber a que se refere.
import { prisma } from "./db.js";

export interface SubscriptionInfo {
  systems: string[];        // nomes dos sistemas vinculados (Clientes > Sistemas)
  plan: string | null;      // plano da venda de origem, se houver
}

type WithSystems = { projects?: { project?: { name: string } | null }[]; sale?: { productName: string | null } | null; boxsysTenantId?: string | null };

export function subscriptionInfoOf(client: WithSystems): SubscriptionInfo {
  const systems = (client.projects ?? []).map(p => p.project?.name).filter((n): n is string => !!n);
  if (!systems.length && client.boxsysTenantId) systems.push("Store BoxSys"); // cliente com loja no BoxSys, sem sistema vinculado à mão
  return { systems, plan: client.sale?.productName ?? null };
}

export async function loadSubscriptionInfo(clientId: string): Promise<SubscriptionInfo> {
  const c = await prisma.client.findUnique({
    where: { id: clientId },
    include: { projects: { include: { project: { select: { name: true } } } }, sale: { select: { productName: true } } },
  });
  return c ? subscriptionInfoOf(c as WithSystems) : { systems: [], plan: null };
}

// "assinatura do sistema *Store BoxSys*" · "assinatura dos sistemas *A* e *B*" · "assinatura *Plano X*" · "assinatura da *Develoi*"
export function assinaturaTexto(info: SubscriptionInfo, bold = true): string {
  const b = (s: string) => (bold ? `*${s}*` : s);
  const { systems, plan } = info;
  if (systems.length === 1) return `assinatura do sistema ${b(systems[0])}`;
  if (systems.length > 1) return `assinatura dos sistemas ${systems.slice(0, -1).map(b).join(", ")} e ${b(systems[systems.length - 1])}`;
  if (plan) return `assinatura ${b(plan)}`;
  return `assinatura da ${b("Develoi")}`;
}

// Nome curto para descrições (ex.: cobrança no Asaas): "Store BoxSys" · "A + B" · "Develoi"
export const nomeCurto = (info: SubscriptionInfo) => info.systems.join(" + ") || info.plan || "Develoi";
