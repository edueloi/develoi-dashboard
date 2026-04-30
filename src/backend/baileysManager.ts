// Bot Baileys Manager
import { Boom } from "@hapi/boom";
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  Browsers,
  isJidGroup,
  isJidBroadcast,
} from "@whiskeysockets/baileys";
import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type WppStatus = "not_configured" | "disconnected" | "qr_pending" | "connecting" | "connected";

export interface SessionInfo {
  status: WppStatus;
  phone: string | null;
  qrDataUrl: string | null;
}

interface ActiveSession {
  sock: any;
  status: WppStatus;
  phone: string | null;
  qrDataUrl: string | null;
  qrRaw: string | null;
  listeners: Set<(info: SessionInfo) => void>;
}

const clientStates = new Map<string, any>(); // Map<clientKey, ClientState>
const attToClient = new Map<string, string>(); // Map<attJid, clientKey>
const sectorQueues = new Map<string, string[]>(); // Map<sectorId, clientKey[]>

const INACTIVITY_WARN_MS = 15 * 60 * 1000;
const INACTIVITY_CLOSE_MS = 20 * 60 * 1000;
const EXIT_CMD   = /^&sair$/i;
const BACK_CMD   = /^(0|menu|inicio|início|voltar|cancelar|sair)$/i;

let session: ActiveSession | null = null;
const SESSIONS_DIR = path.join(process.cwd(), "wpp-sessions");

function jidToPhone(jid: string): string {
  return jid.replace(/@.*/, "").replace(/:[0-9]+$/, "");
}

function phoneToJid(phone: string): string {
  const d = String(phone).replace(/\D/g, "");
  return `${d.startsWith("55") ? d : `55${d}`}@s.whatsapp.net`;
}

function normalizeForKey(jid: string): string {
  return jid.replace(/@.*/, "").replace(/:[0-9]+$/, "");
}

async function qrToDataUrl(q: string): Promise<string | null> {
  try { const QR = await import("qrcode"); return await QR.default.toDataURL(q, { width: 300, margin: 2 }); }
  catch { return null; }
}

function makeLogger(): any {
  const noop = () => {};
  const l: any = { level: "silent", trace: noop, debug: noop, info: noop, warn: noop, error: noop };
  l.child = () => makeLogger(); return l;
}

async function updateDb(status: WppStatus, phone: string | null, qrCode: string | null) {
  try {
    let instance = await prisma.wppInstance.findFirst();
    if (!instance) {
      instance = await prisma.wppInstance.create({
        data: { instanceName: "Meu Bot", status }
      });
    }
    await prisma.wppInstance.update({
      where: { id: instance.id },
      data: { status, phone, isActive: status === "connected", qrCode: status === "connected" ? null : qrCode },
    });
  } catch {}
}

export function getSessionInfo(): SessionInfo {
  if (!session) return { status: "not_configured", phone: null, qrDataUrl: null };
  return { status: session.status, phone: session.phone, qrDataUrl: session.qrDataUrl };
}

export async function sendMessage(phone: string, text: string): Promise<boolean> {
  if (!session || session.status !== "connected") return false;
  try {
    await session.sock.sendMessage(phoneToJid(phone), { text });
    return true;
  } catch (e) {
    console.error("Erro ao enviar msg:", e);
    return false;
  }
}

async function handleMessage(msg: any, sock: any) {
  if (!msg.message || msg.key.fromMe || isJidGroup(msg.key.remoteJid!) || isJidBroadcast(msg.key.remoteJid!)) return;
  
  const textMsg = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
  if (!textMsg) return;

  const rawJid = msg.key.remoteJid!;
  const key = normalizeForKey(rawJid);
  const clientPhone = jidToPhone(key);

  // Aqui é a máquina de estados baseada nos nós do banco
  // Para ser simples e prático, vamos consultar o banco e navegar.
  
  let state = clientStates.get(key);

  if (!state) {
    // Nova conversa, checa se bot está ativado
    const config = await prisma.wppBotConfig.findFirst();
    if (!config?.botEnabled) return;

    // Busca o nó inicial
    const startNode = await prisma.wppBotFlowNode.findFirst({ where: { isStart: true, isActive: true } });
    if (!startNode) return;

    state = { currentNodeId: startNode.id, remoteJid: rawJid, lastActivity: Date.now() };
    clientStates.set(key, state);

    await processNode(startNode, state, textMsg, sock, clientPhone);
  } else {
    state.lastActivity = Date.now();

    if (BACK_CMD.test(textMsg.trim())) {
      const startNode = await prisma.wppBotFlowNode.findFirst({ where: { isStart: true, isActive: true } });
      if (startNode) {
        state.currentNodeId = startNode.id;
        await processNode(startNode, state, textMsg, sock, clientPhone);
      }
      return;
    }

    if (state.status === "waiting" || state.status === "in_chat") {
      // Cliente na fila ou falando com atendente - apenas reencaminha a msg
      if (state.conversationId) {
        await prisma.wppConversationMessage.create({
          data: { conversationId: state.conversationId, fromRole: "client", fromPhone: clientPhone, body: textMsg }
        });
        await prisma.wppConversation.update({ where: { id: state.conversationId }, data: { updatedAt: new Date() } });
      }
      return; // O atendente vê no painel
    }

    // Processa a opção selecionada ou o input
    const currentNode = await prisma.wppBotFlowNode.findUnique({ where: { id: state.currentNodeId } });
    if (!currentNode) return;

    let nextNodeId = currentNode.nextNodeId;

    if (currentNode.options && currentNode.options !== "[]") {
      try {
        const options = JSON.parse(currentNode.options);
        const selected = options.find((o: any) => o.key.toLowerCase() === textMsg.trim().toLowerCase());
        if (selected) {
          nextNodeId = selected.nextNodeId;
        } else {
          await sock.sendMessage(rawJid, { text: "⚠️ Opção inválida. Digite novamente." });
          return;
        }
      } catch (e) {}
    }

    if (nextNodeId) {
      const nextNode = await prisma.wppBotFlowNode.findUnique({ where: { id: nextNodeId } });
      if (nextNode) {
        state.currentNodeId = nextNode.id;
        await processNode(nextNode, state, textMsg, sock, clientPhone);
      }
    }
  }
}

async function processNode(node: any, state: any, textMsg: string, sock: any, clientPhone: string) {
  let text = node.content || "";

  if (node.options && node.options !== "[]") {
    try {
      const options = JSON.parse(node.options);
      text += "\n\n" + options.map((o: any) => `*${o.key}* - ${o.label}`).join("\n");
      text += "\n\n_Digite a opção desejada:_";
    } catch (e) {}
  }

  if (node.type === "sector") {
    const sector = await prisma.wppBotSector.findUnique({ where: { id: node.sectorId } });
    if (sector) {
      text += `\n\nTransferindo para o setor *${sector.name}*... Aguarde um momento.`;
      
      // Cria a conversa no banco
      const conv = await prisma.wppConversation.create({
        data: {
          sectorId: sector.id,
          clientPhone,
          firstMessage: textMsg,
          status: "waiting"
        }
      });
      state.status = "waiting";
      state.conversationId = conv.id;
    } else {
      text += "\n\nSetor indisponível no momento.";
    }
  }

  if (text) {
    await sock.sendMessage(state.remoteJid, { text });
  }
}

export async function connectSession() {
  const tenantId = "default"; // Single-tenant
  const dir = path.join(SESSIONS_DIR, tenantId);
  fs.mkdirSync(dir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(dir);
  
  let version;
  try {
    const latest = await fetchLatestBaileysVersion();
    version = latest.version;
  } catch (e) {
    version = [2, 3000, 1015901307]; // Fallback if GitHub is unreachable
  }

  // Se makeWASocket for importado como default, em alguns ambientes ESM/TS ele é a própria função,
  // em outros (CJS interop) pode precisar de .default.
  const makeWASocketFn = (makeWASocket as any).default || makeWASocket;

  const sock = makeWASocketFn({
    version,
    logger: makeLogger(),
    printQRInTerminal: false,
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, makeLogger()) },
    browser: Browsers.macOS("Desktop"),
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
  });

  if (!session) {
    session = { sock, status: "connecting", phone: null, qrDataUrl: null, qrRaw: null, listeners: new Set() };
  } else {
    session.sock = sock;
    session.status = "connecting";
  }

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update: any) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      session!.status = "qr_pending";
      session!.qrRaw = qr;
      session!.qrDataUrl = await qrToDataUrl(qr);
      await updateDb("qr_pending", null, session!.qrDataUrl);
    }

    if (connection === "close") {
      const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
      if (reason === DisconnectReason.loggedOut) {
        fs.rmSync(dir, { recursive: true, force: true });
        session!.status = "disconnected";
        session!.qrDataUrl = null;
        session!.phone = null;
        await updateDb("disconnected", null, null);
      } else {
        setTimeout(() => connectSession(), 5000);
      }
    }

    if (connection === "open") {
      const me = sock.user?.id || "";
      const phone = jidToPhone(me);
      session!.status = "connected";
      session!.phone = phone;
      session!.qrDataUrl = null;
      session!.qrRaw = null;
      await updateDb("connected", phone, null);
      console.log(`Baileys conectado: ${phone}`);
    }
  });

  sock.ev.on("messages.upsert", async (m: any) => {
    if (m.type === "notify") {
      for (const msg of m.messages) {
        await handleMessage(msg, sock);
      }
    }
  });
}

export async function disconnectSession() {
  if (session && session.sock) {
    try {
      session.sock.logout();
    } catch (e) {}
  }
}
