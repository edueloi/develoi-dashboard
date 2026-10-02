// Fachada do WhatsApp. Todo o sistema usa ESTE módulo (nunca o baileysManager direto).
//
//  • Em produção, o WhatsApp roda num processo próprio (whatsapp-worker.ts, PM2 "develoi-wpp"),
//    como no BoxSys e no Agendelle: reiniciar/atualizar a API NÃO derruba a conexão.
//    A API só fala com o worker por uma ponte local (HTTP em 127.0.0.1).
//  • Sem WA_WORKER_URL (desenvolvimento), tudo roda no mesmo processo, como antes.
import * as real from "./baileysManager.js";

export type { WppStatus, SessionInfo, ChoiceOption } from "./baileysManager.js";
type SessionInfo = real.SessionInfo;

// "local" = executa o baileysManager neste processo; "proxy" = pede ao worker
const isLocal = () => process.env.WA_ROLE === "worker" || !process.env.WA_WORKER_URL;
const baseUrl = () => (process.env.WA_WORKER_URL || "").replace(/\/$/, "");
const headers = () => ({ "content-type": "application/json", "x-wa-token": process.env.WA_INTERNAL_TOKEN || "" });

async function rpc<T>(fn: string, args: unknown[], fallback: T): Promise<T> {
  try {
    const res = await fetch(`${baseUrl()}/rpc`, {
      method: "POST", headers: headers(), body: JSON.stringify({ fn, args }), signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return ((await res.json()) as { result: T }).result;
  } catch (e: any) {
    console.error(`[wa] worker do WhatsApp indisponível (${fn}): ${e.message}`);
    return fallback;
  }
}

// Estado da conexão: no modo proxy é consultado ao worker a cada 3s (leitura síncrona do cache)
let cached: SessionInfo = { status: "disconnected", phone: null, qrDataUrl: null };
let polling = false;
function startPolling() {
  if (polling) return;
  polling = true;
  const tick = async () => {
    try {
      const res = await fetch(`${baseUrl()}/status`, { headers: headers(), signal: AbortSignal.timeout(4000) });
      cached = res.ok ? await res.json() : { status: "disconnected", phone: null, qrDataUrl: null };
    } catch {
      cached = { status: "disconnected", phone: null, qrDataUrl: null }; // worker fora do ar
    }
  };
  void tick();
  setInterval(tick, 3000).unref?.();
}

export function getSessionInfo(): SessionInfo {
  if (isLocal()) return real.getSessionInfo();
  startPolling();
  return cached;
}

export const sendMessage = (phone: string, text: string): Promise<boolean> =>
  isLocal() ? real.sendMessage(phone, text) : rpc("sendMessage", [phone, text], false);

export const sendDocument = (phone: string, file: Buffer, fileName: string, caption?: string): Promise<boolean> =>
  isLocal() ? real.sendDocument(phone, file, fileName, caption)
    : rpc("sendDocument", [phone, { __buffer: file.toString("base64") }, fileName, caption], false);

export const sendChoice = (...a: Parameters<typeof real.sendChoice>): Promise<boolean> =>
  isLocal() ? real.sendChoice(...a) : rpc("sendChoice", a, false);

export const offerConversation = (...a: Parameters<typeof real.offerConversation>): Promise<void> =>
  isLocal() ? real.offerConversation(...a) : rpc<void>("offerConversation", a, undefined);

export const acceptWaitingConversation = (...a: Parameters<typeof real.acceptWaitingConversation>) =>
  isLocal() ? real.acceptWaitingConversation(...a) : rpc<Awaited<ReturnType<typeof real.acceptWaitingConversation>>>("acceptWaitingConversation", a, null);

export const closeActiveConversation = (...a: Parameters<typeof real.closeActiveConversation>) =>
  isLocal() ? real.closeActiveConversation(...a) : rpc<Awaited<ReturnType<typeof real.closeActiveConversation>>>("closeActiveConversation", a, null);

export function setClientConversation(...a: Parameters<typeof real.setClientConversation>) {
  if (isLocal()) real.setClientConversation(...a); else void rpc<void>("setClientConversation", a, undefined);
}
export function releaseClient(...a: Parameters<typeof real.releaseClient>) {
  if (isLocal()) real.releaseClient(...a); else void rpc<void>("releaseClient", a, undefined);
}

export const connectSession = async (): Promise<void> => {
  if (isLocal()) await real.connectSession(); else await rpc<void>("connectSession", [], undefined);
};
export const disconnectSession = async (): Promise<void> => {
  if (isLocal()) await real.disconnectSession(); else await rpc<void>("disconnectSession", [], undefined);
};

// Retomar a sessão salva é trabalho do worker; no modo proxy não há o que fazer aqui
export const resumeSession = async (): Promise<void> => { if (isLocal()) await real.resumeSession(); };

// Respostas automáticas a clientes ("extrato", "fatura"): só quem tem o socket precisa registrar
export const registerClientKeywordHandler = (fn: Parameters<typeof real.registerClientKeywordHandler>[0]) => {
  if (isLocal()) real.registerClientKeywordHandler(fn);
};
