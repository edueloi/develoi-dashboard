// Troca as mensagens prontas PADRÃO pelas versões em tom de conversa. Mensagens criadas por usuários não são tocadas.
// Uso (no servidor): npx tsx scripts/reseed-messages.ts
import "dotenv/config";
import { randomUUID } from "crypto";
import { rawPrisma } from "../src/backend/db.js";
import { DEFAULT_MESSAGES } from "../src/components/dashboard/defaultMessages.js";

const removed = await rawPrisma.readyMessage.deleteMany({ where: { isDefault: true } });
for (const m of DEFAULT_MESSAGES) {
  await rawPrisma.readyMessage.create({ data: { id: randomUUID(), title: m.title, category: m.category, body: m.body, tags: m.tags ?? [], isDefault: true, isFavorite: false } });
}
console.log(`removidas ${removed.count} antigas, criadas ${DEFAULT_MESSAGES.length} novas`);
await rawPrisma.$disconnect();
