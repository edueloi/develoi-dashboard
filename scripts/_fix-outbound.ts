import "dotenv/config";
import { rawPrisma } from "../src/backend/db.js";
const rows = await rawPrisma.wppConversationMessage.findMany({ where: { fromRole: "system", body: { contains: "iniciou a conversa" } }, select: { conversationId: true } });
const ids = [...new Set(rows.map(r => r.conversationId))];
const r = await rawPrisma.wppConversation.updateMany({ where: { id: { in: ids }, status: { in: ["active", "bot"] } }, data: { outbound: true } });
console.log("conversas marcadas como iniciadas por nós:", r.count);
await rawPrisma.$disconnect();
