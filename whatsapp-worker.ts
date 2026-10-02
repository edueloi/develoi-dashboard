// Processo do WhatsApp (PM2: "develoi-wpp"). Mantém a conexão do bot viva e independente da API:
// atualizar/reiniciar o develoi-api não derruba o WhatsApp. A API fala com este processo por
// HTTP local (127.0.0.1) usando o módulo src/backend/wa.ts.
process.env.WA_ROLE = "worker";
process.env.TZ = "America/Sao_Paulo"; // horário de Brasília, independente do fuso do servidor

import "dotenv/config";
import express from "express";
import {
  getSessionInfo, sendMessage, sendDocument, sendChoice, offerConversation, acceptWaitingConversation,
  closeActiveConversation, setClientConversation, releaseClient, connectSession, disconnectSession, resumeSession,
} from "./src/backend/wa.js";
import { registerAsaasKeywords } from "./src/backend/asaas.js";

const PORT = Number(process.env.WA_WORKER_PORT) || 3007;
const TOKEN = process.env.WA_INTERNAL_TOKEN || "";

// Só estas funções podem ser chamadas pela API
const allowed: Record<string, (...args: any[]) => any> = {
  sendMessage, sendDocument, sendChoice, offerConversation, acceptWaitingConversation,
  closeActiveConversation, setClientConversation, releaseClient, connectSession, disconnectSession,
};

const app = express();
app.use(express.json({ limit: "30mb" }));

app.use((req, res, next) => {
  if (TOKEN && req.headers["x-wa-token"] !== TOKEN) return res.status(401).json({ error: "não autorizado" });
  next();
});

app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/status", (_req, res) => res.json(getSessionInfo()));

app.post("/rpc", async (req, res) => {
  const { fn, args = [] } = req.body ?? {};
  const f = allowed[fn];
  if (!f) return res.status(404).json({ error: `função desconhecida: ${fn}` });
  try {
    // arquivos chegam em base64: { __buffer: "..." }
    const decoded = (args as any[]).map(a => (a && typeof a === "object" && typeof a.__buffer === "string" ? Buffer.from(a.__buffer, "base64") : a));
    res.json({ result: (await f(...decoded)) ?? null });
  } catch (e: any) {
    console.error(`[wpp-worker] erro em ${fn}:`, e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`[wpp-worker] ouvindo em 127.0.0.1:${PORT}`);
  registerAsaasKeywords();                    // "extrato" / "fatura" respondidos pelo bot
  setTimeout(() => { void resumeSession(); }, 2000); // volta sozinho com a sessão salva, sem QR
});

for (const sig of ["SIGINT", "SIGTERM"] as const) process.on(sig, () => process.exit(0));
