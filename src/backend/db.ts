// Cliente único do banco. Toda gravação (criar/alterar/excluir) em QUALQUER tabela passa por aqui e
// vira um SystemEvent, usado para: (1) atualizar as telas sozinhas e (2) entregar webhooks de saída.
// Todos os módulos devem importar `prisma` deste arquivo (nunca criar `new PrismaClient()`).
import { PrismaClient } from "@prisma/client";

// Cliente "cru", sem a escuta (usado para gravar os próprios eventos sem entrar em loop)
export const rawPrisma = new PrismaClient();

// Tabelas internas/ruidosas que não geram evento
const IGNORED_MODELS = new Set([
  "SystemEvent", "WebhookEndpoint", "WebhookDelivery", "AsaasWebhookLog", "TeamNoticeLog",
  "ClientBillingNotice", "BlogAnalytics", "WppInstance",
]);

const ACTION_OF: Record<string, "created" | "updated" | "deleted"> = {
  create: "created", createMany: "created", createManyAndReturn: "created",
  update: "updated", updateMany: "updated", upsert: "updated",
  delete: "deleted", deleteMany: "deleted",
};

const SECRET_KEYS = new Set(["passwordHash", "token", "authToken", "secret", "password"]);

// Remove segredos, corta textos longos e arquivos embutidos (data URL) e limita a profundidade
function sanitize(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value ?? null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") {
    if (value.startsWith("data:")) return "[arquivo]";
    return value.length > 300 ? `${value.slice(0, 300)}… (${value.length} caracteres)` : value;
  }
  if (typeof value !== "object") return value;
  if (depth >= 2) return "[objeto]";
  if (Array.isArray(value)) return value.slice(0, 20).map(v => sanitize(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (SECRET_KEYS.has(k)) continue;
    out[k] = sanitize(v, depth + 1);
  }
  return out;
}

const SOURCE = () => (process.env.WA_ROLE === "worker" ? "worker" : "api");

function record(model: string, operation: string, args: any, result: any) {
  const action = ACTION_OF[operation];
  if (!action) return;
  let recordId: string | null = null;
  let payload: unknown;

  if (operation.endsWith("Many")) {
    payload = { count: result?.count ?? null, where: sanitize(args?.where), data: sanitize(args?.data) };
  } else {
    recordId = result?.id !== undefined && result?.id !== null ? String(result.id) : null;
    payload = sanitize(result);
  }
  let data = JSON.stringify(payload);
  if (data.length > 15000) data = JSON.stringify({ aviso: "registro grande demais; consulte pelo id" });

  void rawPrisma.systemEvent
    .create({ data: { model, action, recordId, data, source: SOURCE() } })
    .catch(() => {});
}

export const prisma = rawPrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const result = await query(args);
        if (!IGNORED_MODELS.has(model) && ACTION_OF[operation]) record(model, operation, args, result);
        return result;
      },
    },
  },
});

export type Db = typeof prisma;
