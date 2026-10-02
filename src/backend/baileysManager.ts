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
  proto,
  generateWAMessageFromContent,
} from "@whiskeysockets/baileys";
import path from "path";
import fs from "fs";
import { prisma } from "./db.js";
import { brtParts } from "./time.js";


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

// Endereço de envio: aceita o JID original do contato (ex.: "2839…@lid") ou um telefone
function toJid(v: string): string {
  return v.includes("@") ? v : phoneToJid(v);
}

// Para onde responder uma conversa: o endereço original do contato; telefone só em conversas antigas
const targetOf = (c: { clientJid?: string | null; clientPhone: string }) => c.clientJid || c.clientPhone;

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
  // o QR só vale enquanto está aguardando leitura; nunca mostrar um QR antigo
  return { status: session.status, phone: session.phone, qrDataUrl: session.status === "qr_pending" ? session.qrDataUrl : null };
}

// Envia um arquivo (ex.: recibo em PDF) no WhatsApp
export async function sendDocument(phone: string, file: Buffer, fileName: string, caption?: string): Promise<boolean> {
  if (!session || session.status !== "connected") return false;
  try {
    await session.sock.sendMessage(toJid(phone), { document: file, mimetype: "application/pdf", fileName, caption });
    return true;
  } catch (e) {
    console.error("Erro ao enviar documento:", e);
    return false;
  }
}

// Ajusta o estado em memória do cliente (usado pelo painel ao aceitar/finalizar um atendimento)
export function setClientConversation(target: string, conversationId: string, status: "waiting" | "in_chat") {
  const key = normalizeForKey(toJid(target));
  const state = clientStates.get(key) ?? { currentNodeId: null, remoteJid: toJid(target), lastActivity: Date.now() };
  state.conversationId = conversationId;
  state.status = status;
  clientStates.set(key, state);
}

// Libera o cliente: na próxima mensagem ele volta ao início do menu do bot
export function releaseClient(target: string) {
  clientStates.delete(normalizeForKey(toJid(target)));
}

export async function sendMessage(phone: string, text: string): Promise<boolean> {
  if (!session || session.status !== "connected") return false;
  try {
    await session.sock.sendMessage(toJid(phone), { text });
    return true;
  } catch (e) {
    console.error("Erro ao enviar msg:", e);
    return false;
  }
}


// Gancho para respostas automáticas a clientes cadastrados ("extrato", "fatura"…), registrado pelo Asaas
type ClientKeywordHandler = (phone: string, text: string) => Promise<boolean>;
let clientKeywordHandler: ClientKeywordHandler | null = null;
export function registerClientKeywordHandler(fn: ClientKeywordHandler) { clientKeywordHandler = fn; }

// ─── Atendentes pelo WhatsApp ────────────────────────────────────────────────
// Cada setor tem atendentes {name, phone}. Quando um cliente cai no setor, o bot avisa o atendente
// no WhatsApp dele; ele aceita (1) ou recusa (2) e passa a conversar COM O BOT, que repassa as
// mensagens ao cliente identificando o atendente em negrito. "&sair" encerra e o cliente volta ao bot.

interface Attendant { name: string; phone: string; available: boolean }

const OFFER_ACCEPT = /^(1|aceitar|sim)$/i;
const OFFER_REFUSE = /^(2|recusar|nao|não)$/i;
const ATT_EXIT = /^&(sair|encerrar)$/i;
const OFFER_DELAY_MS = 20_000; // dá tempo do cliente descrever o que precisa antes de avisar o atendente

const digits = (v: string) => String(v || "").replace(/\D/g, "");
// Compara pelos 8 últimos dígitos (ignora DDI, DDD e o 9º dígito)
const samePhone = (a: string, b: string) => {
  const x = digits(a), y = digits(b);
  return x.length >= 8 && y.length >= 8 && x.slice(-8) === y.slice(-8);
};

// conversationIds oferecidos a cada atendente (chave = telefone só com dígitos)
const offers = new Map<string, string[]>();

export function parseAttendants(json: string | null | undefined): Attendant[] {
  try {
    const arr = JSON.parse(json || "[]");
    return (Array.isArray(arr) ? arr : [])
      .map((a: any) => ({ name: String(a?.name || "").trim(), phone: digits(a?.phone), available: a?.available !== false }))
      .filter(a => a.name && a.phone.length >= 8);
  } catch { return []; }
}

async function findAttendantByPhone(phone: string): Promise<Attendant | null> {
  const sectors = await prisma.wppBotSector.findMany({ where: { isActive: true } });
  for (const sec of sectors) {
    const hit = parseAttendants(sec.attendants).find(a => samePhone(a.phone, phone));
    if (hit) return hit;
  }
  return null;
}

const realPhone = (c: { clientPhone: string }) => (digits(c.clientPhone).length <= 13 ? c.clientPhone : null); // IDs internos (@lid) têm 14+ dígitos
const clientLabel = (c: { clientName?: string | null; clientPhone: string }) => c.clientName || realPhone(c) || "Cliente";

// Gravação do histórico da conversa
async function recordMsg(conversationId: string, fromRole: "client" | "bot" | "attendant" | "system", body: string, fromPhone?: string) {
  try {
    await prisma.wppConversationMessage.create({ data: { conversationId, fromRole, fromPhone: fromPhone ?? null, body } });
    await prisma.wppConversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
  } catch (e) { console.error("[whatsapp] não consegui gravar a mensagem:", e); }
}

// Mensagens do cliente depois de escolher o setor, sem os "1", "4", "0" do menu
async function clientSummaryLines(convId: string, since: Date, take = 6) {
  const rows = await prisma.wppConversationMessage.findMany({
    where: { conversationId: convId, fromRole: "client", sentAt: { gte: since } }, orderBy: { sentAt: "asc" }, take: 20,
  });
  return rows.map(m => m.body).filter(b => !/^\s*\d{1,2}\s*$/.test(b) && !GREETING.test(b.trim())).slice(0, take);
}

// Avisa os atendentes do setor (ou só `onlyPhone`) que há um novo atendimento aguardando
export async function offerConversation(convId: string, onlyPhone?: string) {
  const conv = await prisma.wppConversation.findUnique({ where: { id: convId }, include: { sector: true } });
  if (!conv || conv.status !== "waiting" || !conv.sector) return;

  const lines = await clientSummaryLines(convId, conv.queuedAt);
  const summary = lines.length
    ? lines.map(b => `• ${b.length > 160 ? b.slice(0, 157) + "…" : b}`).join("\n")
    : "• (cliente ainda não descreveu o assunto)";

  for (const att of parseAttendants(conv.sector.attendants)) {
    if (!att.available) continue; // atendente marcado como ausente não recebe oferta
    if (onlyPhone && !samePhone(att.phone, onlyPhone)) continue;
    // atendente já em conversa não recebe oferta (as mensagens dele iriam para o cliente)
    const busy = await prisma.wppConversation.findFirst({ where: { status: "active", attendantPhone: att.phone } });
    if (busy) continue;
    const list = offers.get(att.phone) ?? [];
    if (!list.includes(convId)) offers.set(att.phone, [...list, convId]);
    await sendChoice(att.phone,
      `🔔 *Novo atendimento* — setor *${conv.sector.name}*\n` +
      `👤 Cliente: *${clientLabel(conv)}*${realPhone(conv) && conv.clientName ? ` (${conv.clientPhone})` : ""}\n\n` +
      `💬 *Resumo:*\n${summary}`,
      [{ id: "1", text: "✅ Aceitar" }, { id: "2", text: "❌ Recusar" }],
      { footer: "Aceite ou recuse este atendimento.", hint: "Responda 1 para ACEITAR ou 2 para RECUSAR." });
  }
}

// Assume a conversa (atômico: só um atendente consegue). `phone` = atendente conversando pelo WhatsApp.
export async function acceptWaitingConversation(convId: string, who: { id?: string | null; name: string; phone?: string | null }) {
  const phone = who.phone ? digits(who.phone) : null;
  const claimed = await prisma.wppConversation.updateMany({
    where: { id: convId, status: { in: ["waiting", "bot"] } },
    data: { status: "active", attendantId: who.id ?? null, attendantName: who.name, attendantPhone: phone, acceptedAt: new Date() },
  });
  if (claimed.count === 0) return null;

  const conv = await prisma.wppConversation.findUniqueOrThrow({ where: { id: convId }, include: { sector: true } });
  await prisma.wppConversationMessage.create({
    data: { conversationId: convId, fromRole: "system", body: `${who.name} assumiu o atendimento.` },
  });
  setClientConversation(targetOf(conv), convId, "in_chat");
  const greeting = `*${who.name}* iniciou o seu atendimento. 👋\nComo posso ajudar?`;
  await sendMessage(targetOf(conv), greeting);
  await recordMsg(convId, "attendant", `${who.name} iniciou o seu atendimento. Como posso ajudar?`);

  // avisa os outros atendentes que ofertas desta conversa não valem mais
  for (const [attPhone, list] of offers) {
    if (!list.includes(convId)) continue;
    offers.set(attPhone, list.filter(id => id !== convId));
    if (!phone || !samePhone(attPhone, phone)) {
      await sendMessage(attPhone, `ℹ️ O atendimento de *${clientLabel(conv)}* já foi assumido por *${who.name}*.`);
    }
  }
  return conv;
}

// Encerra a conversa e devolve o cliente ao bot
export async function closeActiveConversation(convId: string, byName: string, closingMessage?: string) {
  const conv = await prisma.wppConversation.findUnique({ where: { id: convId } });
  if (!conv || conv.status === "closed") return null;
  await prisma.wppConversation.update({ where: { id: convId }, data: { status: "closed", closedBy: "attendant", closedAt: new Date() } });
  await prisma.wppConversationMessage.create({
    data: { conversationId: convId, fromRole: "system", body: `${byName} finalizou o atendimento.` },
  });
  releaseClient(targetOf(conv));
  const msg = closingMessage ?? `Atendimento encerrado por *${byName}*. Obrigado pelo contato! 😊\nSe precisar de algo, é só enviar uma mensagem.`;
  if (msg.trim()) {
    await sendMessage(targetOf(conv), msg.trim());
    await recordMsg(convId, "bot", msg.trim().replace(/\*/g, ""));
  }
  return conv;
}

// Mensagem de um atendente cadastrado. Retorna true se foi tratada como mensagem de atendente.
async function handleAttendantMessage(att: Attendant, text: string): Promise<boolean> {
  const active = await prisma.wppConversation.findFirst({
    where: { status: "active", attendantPhone: att.phone },
    orderBy: { acceptedAt: "desc" },
  });

  if (active) {
    if (ATT_EXIT.test(text.trim())) {
      await closeActiveConversation(active.id, att.name);
      await sendMessage(att.phone, `✅ Atendimento com *${clientLabel(active)}* encerrado. O cliente voltou ao bot.`);
      // oferece o que está na fila
      const waiting = await prisma.wppConversation.findMany({ where: { status: "waiting" }, orderBy: { queuedAt: "asc" }, take: 5 });
      for (const w of waiting) await offerConversation(w.id, att.phone);
      return true;
    }
    // repassa ao cliente com o nome do atendente em negrito
    if (!(await sendMessage(targetOf(active), `*${att.name}:* ${text}`))) {
      await sendMessage(att.phone, "⚠️ Não consegui entregar a mensagem ao cliente.");
      return true;
    }
    await prisma.wppConversationMessage.create({ data: { conversationId: active.id, fromRole: "attendant", body: text } });
    await prisma.wppConversation.update({ where: { id: active.id }, data: { updatedAt: new Date() } });
    return true;
  }

  // sem atendimento ativo: só reage a ofertas pendentes; fora disso trata como cliente comum
  const pendingIds = offers.get(att.phone) ?? [];
  if (!pendingIds.length) return false;
  const stillWaiting = await prisma.wppConversation.findMany({
    where: { id: { in: pendingIds }, status: "waiting" }, orderBy: { queuedAt: "asc" },
  });
  offers.set(att.phone, stillWaiting.map(c => c.id));
  const next = stillWaiting[0];
  if (!next) return false;

  if (OFFER_ACCEPT.test(text.trim())) {
    const conv = await acceptWaitingConversation(next.id, { name: att.name, phone: att.phone });
    if (!conv) {
      await sendMessage(att.phone, "ℹ️ Este atendimento já foi assumido por outra pessoa.");
    } else {
      const history = await clientSummaryLines(conv.id, conv.queuedAt);
      await sendMessage(att.phone,
        `✅ Você está em atendimento com *${clientLabel(conv)}*.\n` +
        (history.length ? `\n💬 *Mensagens do cliente:*\n${history.map(b => `• ${b}`).join("\n")}\n` : "") +
        `\nTudo que você escrever aqui será enviado ao cliente como *${att.name}*. Envie *&sair* para encerrar.`);
    }
    return true;
  }
  if (OFFER_REFUSE.test(text.trim())) {
    offers.set(att.phone, stillWaiting.slice(1).map(c => c.id));
    await sendMessage(att.phone, "👍 Recusado. A conversa continua na fila para os outros atendentes.");
    return true;
  }
  await sendChoice(att.phone, `Você tem ${stillWaiting.length} atendimento(s) aguardando.`,
    [{ id: "1", text: "✅ Aceitar" }, { id: "2", text: "❌ Recusar" }], { hint: "Responda 1 para ACEITAR ou 2 para RECUSAR." });
  return true;
}

// ─── Botões nativos do WhatsApp ──────────────────────────────────────────────
// Baileys não gera os nós binários que o WhatsApp exige para renderizar mensagens interativas
// (sem eles o cliente vê "Não foi possível carregar a mensagem"). O nó biz > interactive > native_flow
// e o nó bot (exigido em chats 1:1) resolvem. Mesmo método usado no psi-painel.

export interface ChoiceOption { id: string; text: string; description?: string }

const cut = (v: string, n: number) => (v.length > n ? v.slice(0, n - 1) + "…" : v);

function numberedMenu(body: string, options: ChoiceOption[], hint?: string) {
  return `${body}\n\n${options.map(o => `*${o.id}* - ${o.text}`).join("\n")}${hint ? `\n\n_${hint}_` : ""}`;
}

async function buttonsEnabled(): Promise<boolean> {
  try { return (await prisma.wppBotConfig.findFirst())?.useButtons !== false; } catch { return true; }
}

// Envia uma pergunta com opções clicáveis. Até 3 opções = botões de resposta rápida;
// mais que isso = lista (single_select). Em caso de falha, cai para o menu numerado em texto.
export async function sendChoice(jidOrPhone: string, body: string, options: ChoiceOption[], opts: { footer?: string; hint?: string } = {}): Promise<boolean> {
  if (!session || session.status !== "connected") return false;
  const jid = jidOrPhone.includes("@") ? jidOrPhone : phoneToJid(jidOrPhone);
  const hint = opts.hint ?? "Toque em uma opção ou digite o número.";

  if (await buttonsEnabled() && options.length) {
    try {
      const buttons = options.length <= 3
        ? options.map(o => ({ name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: cut(o.text, 20), id: o.id }) }))
        : [{
            name: "single_select",
            buttonParamsJson: JSON.stringify({
              title: "Ver opções",
              sections: [{ title: "Opções", rows: options.map(o => ({ id: o.id, title: cut(o.text, 24), description: o.description ? cut(o.description, 72) : "" })) }],
            }),
          }];

      const interactiveMessage = proto.Message.InteractiveMessage.create({
        body: proto.Message.InteractiveMessage.Body.create({ text: body }),
        footer: proto.Message.InteractiveMessage.Footer.create({ text: opts.footer ?? "Selecione uma opção para continuar." }),
        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({ buttons }),
      });
      const message = generateWAMessageFromContent(jid, proto.Message.fromObject({ interactiveMessage }), { userJid: session.sock.user?.id });
      const additionalNodes = [
        { tag: "biz", attrs: {}, content: [{ tag: "interactive", attrs: { type: "native_flow", v: "1" }, content: [{ tag: "native_flow", attrs: { v: "9", name: "mixed" } }] }] },
        { tag: "bot", attrs: { biz_bot: "1" } },
      ];
      await session.sock.relayMessage(jid, message.message, { messageId: message.key.id, additionalNodes });
      return true;
    } catch (e) {
      console.error("Falha ao enviar botões, usando texto:", e);
    }
  }

  try {
    await session.sock.sendMessage(jid, { text: numberedMenu(body, options, hint) });
    return true;
  } catch (e) {
    console.error("Erro ao enviar menu:", e);
    return false;
  }
}

// Texto de uma mensagem recebida, inclusive o clique em botão/lista (devolve o id da opção)
function extractIncomingText(message: any): string {
  const m = message?.ephemeralMessage?.message ?? message?.viewOnceMessage?.message ?? message ?? {};
  const params = m.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;
  let interactiveId = "";
  if (params) { try { interactiveId = String(JSON.parse(params)?.id ?? "").trim(); } catch {} }
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    interactiveId ||
    m.buttonsResponseMessage?.selectedButtonId ||
    m.listResponseMessage?.singleSelectReply?.selectedRowId ||
    m.templateButtonReplyMessage?.selectedId ||
    ""
  );
}

// ─── Saudação e textos do menu ───────────────────────────────────────────────
const GREETING = /^(oi+|olá|ola|oie|ei|opa|hello|hi|bom dia|boa tarde|boa noite|início|inicio|menu)[\s!.,?]*$/i;
const SESSION_IDLE_MS = 30 * 60 * 1000; // depois disso, quem volta a escrever recebe o menu de novo com a saudação do momento

// Bom dia / Boa tarde / Boa noite conforme o horário de Brasília
export function saudacao(date: Date = new Date()): string {
  const h = brtParts(date).hour;
  return h >= 5 && h < 12 ? "Bom dia" : h < 18 && h >= 12 ? "Boa tarde" : "Boa noite";
}

function firstNameOf(pushName?: string | null): string | null {
  const n = String(pushName || "").trim().split(/\s+/)[0];
  if (!n || !/^[\p{L}][\p{L}'-]{1,}$/u.test(n)) return null; // ignora apelidos com emoji/números
  return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
}

// {{saudacao}} e {{nome}} nos textos configurados
function fillPlaceholders(text: string, state: { pushName?: string | null }): string {
  const nome = firstNameOf(state.pushName);
  return text
    .replace(/\{\{\s*saudacao\s*\}\}/gi, saudacao())
    .replace(nome ? /\{\{\s*nome\s*\}\}/gi : /,?\s*\{\{\s*nome\s*\}\}/gi, nome ?? "");
}

// Telefone real do contato. O WhatsApp pode identificá-lo por um ID interno (@lid); tenta achar o número.
async function resolvePhone(sock: any, msg: any): Promise<string> {
  const rawJid: string = msg.key.remoteJid;
  const alt: string | undefined = msg.key.remoteJidAlt;
  if (alt && alt.endsWith("@s.whatsapp.net")) return jidToPhone(alt);
  if (rawJid.endsWith("@lid")) {
    try {
      const pn = await sock.signalRepository?.lidMapping?.getPNForLID?.(rawJid);
      if (pn) return jidToPhone(String(pn));
    } catch {}
  }
  return jidToPhone(rawJid);
}

// O bot fala e a fala fica no histórico da conversa
async function botSay(state: any, sock: any, text: string) {
  await sock.sendMessage(state.remoteJid, { text });
  if (state.conversationId) await recordMsg(state.conversationId, "bot", text);
}

async function closeBotConversation(id: string) {
  await prisma.wppConversation.update({ where: { id }, data: { status: "closed", closedBy: "system", closedAt: new Date() } });
}

async function handleMessage(msg: any, sock: any) {
  if (!msg.message || msg.key.fromMe || isJidGroup(msg.key.remoteJid!) || isJidBroadcast(msg.key.remoteJid!)) return;

  const textMsg = extractIncomingText(msg.message);
  if (!textMsg) return;

  const rawJid: string = msg.key.remoteJid!;
  const key = normalizeForKey(rawJid);
  const clientPhone = await resolvePhone(sock, msg);
  const pushName: string | null = msg.pushName || null;

  // Mensagem de um atendente cadastrado (aceitar/recusar/conversar pelo bot)?
  const attendant = await findAttendantByPhone(clientPhone);
  if (attendant && (await handleAttendantMessage(attendant, textMsg))) return;

  let state = clientStates.get(key);

  // Conversa aberta deste contato (pelo endereço original ou pelo telefone): bot, fila ou atendimento
  let conv = await prisma.wppConversation.findFirst({
    where: { status: { in: ["bot", "waiting", "active"] }, OR: [{ clientJid: rawJid }, { clientPhone }] },
    orderBy: { createdAt: "desc" },
  });

  // Conversa só com o bot, parada há muito tempo: encerra e começa outra
  if (conv?.status === "bot" && Date.now() - conv.updatedAt.getTime() > SESSION_IDLE_MS) {
    await closeBotConversation(conv.id);
    conv = null;
    clientStates.delete(key);
    state = undefined;
  }

  // Na fila ou em atendimento: só registra a mensagem para o atendente (o bot fica quieto)
  if (conv && (conv.status === "waiting" || conv.status === "active")) {
    state = state ?? { currentNodeId: null, remoteJid: rawJid, lastActivity: Date.now(), pushName };
    state.conversationId = conv.id;
    state.status = conv.status === "active" ? "in_chat" : "waiting";
    state.lastActivity = Date.now();
    clientStates.set(key, state);
    await recordMsg(conv.id, "client", textMsg, clientPhone);
    if (!conv.clientJid || (!conv.clientName && pushName)) {
      await prisma.wppConversation.update({ where: { id: conv.id }, data: { clientJid: conv.clientJid ?? rawJid, ...(conv.clientName ? {} : { clientName: pushName }) } });
    }
    // atendente conversando pelo WhatsApp: repassa a mensagem do cliente
    if (conv.status === "active" && conv.attendantPhone) {
      await sendMessage(conv.attendantPhone, `*${clientLabel(conv)}:* ${textMsg}`);
    }
    return; // O atendente também vê no painel
  }

  // Estado antigo sem conversa aberta (já encerrada): descarta
  if (!conv && state) { clientStates.delete(key); state = undefined; }

  // Cliente cadastrado pedindo extrato/fatura: o bot responde sozinho
  if (clientKeywordHandler && (await clientKeywordHandler(clientPhone, textMsg))) return;

  // Voltou depois de um tempo, ou cumprimentou: recomeça do menu com a saudação do momento
  if (state && (Date.now() - state.lastActivity > SESSION_IDLE_MS || GREETING.test(textMsg.trim()))) {
    clientStates.delete(key);
    state = undefined;
  }

  if (!state) {
    // Nova conversa, checa se bot está ativado
    const config = await prisma.wppBotConfig.findFirst();
    if (!config?.botEnabled) return;

    // Busca o nó inicial
    const startNode = await prisma.wppBotFlowNode.findFirst({ where: { isStart: true, isActive: true } });
    if (!startNode) return;

    if (!conv) {
      conv = await prisma.wppConversation.create({
        data: { clientPhone, clientJid: rawJid, clientName: pushName, firstMessage: textMsg.slice(0, 1000), status: "bot" },
      });
    }
    state = { currentNodeId: startNode.id, remoteJid: rawJid, lastActivity: Date.now(), pushName, conversationId: conv.id };
    clientStates.set(key, state);
    await recordMsg(conv.id, "client", textMsg, clientPhone);

    await processNode(startNode, state, textMsg, sock, clientPhone);
  } else {
    state.lastActivity = Date.now();
    if (!state.conversationId && conv) state.conversationId = conv.id;
    if (state.conversationId) await recordMsg(state.conversationId, "client", textMsg, clientPhone);

    if (BACK_CMD.test(textMsg.trim())) {
      const startNode = await prisma.wppBotFlowNode.findFirst({ where: { isStart: true, isActive: true } });
      if (startNode) {
        state.currentNodeId = startNode.id;
        await processNode(startNode, state, textMsg, sock, clientPhone);
      }
      return;
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
          await botSay(state, sock, "Desculpe, não compreendi a opção informada. 🙏\nPor favor, selecione uma das opções do menu ou digite *0* para voltar ao início.");
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
    } else {
      // ramo informativo sem próximo passo: não deixa o cliente sem resposta
      await botSay(state, sock, "Para continuar, digite *0* e retornaremos ao menu inicial. Será um prazer atendê-lo(a). 😊");
    }
  }
}

async function processNode(node: any, state: any, textMsg: string, sock: any, clientPhone: string) {
  let text = fillPlaceholders(node.content || "", state);
  let choices: ChoiceOption[] = [];

  if (node.options && node.options !== "[]") {
    try {
      const options = JSON.parse(node.options);
      choices = options.map((o: any) => ({ id: String(o.key), text: String(o.label) }));
    } catch (e) {}
  }

  if (node.type === "sector") {
    const sector = await prisma.wppBotSector.findUnique({ where: { id: node.sectorId } });
    if (sector) {
      text += `${text ? "\n\n" : ""}Certo! Estou encaminhando o seu atendimento ao setor *${sector.name}*. Em instantes um de nossos atendentes irá falar com você.\nEnquanto isso, se desejar, descreva em uma mensagem como podemos ajudá-lo(a). ✍️`;

      // A conversa (já gravada desde o primeiro "oi") entra na fila do setor
      const data = { sectorId: sector.id, status: "waiting", queuedAt: new Date(), firstMessage: `Escolheu o setor ${sector.name}` };
      let convId: string = state.conversationId;
      if (convId) {
        await prisma.wppConversation.update({ where: { id: convId }, data });
      } else {
        convId = (await prisma.wppConversation.create({ data: { clientPhone, clientJid: state.remoteJid, clientName: state.pushName ?? null, ...data } })).id;
        state.conversationId = convId;
      }
      await recordMsg(convId, "system", `Cliente encaminhado ao setor ${sector.name}.`);
      state.status = "waiting";
      setTimeout(() => { offerConversation(convId).catch(e => console.error("Erro ao avisar atendentes:", e)); }, OFFER_DELAY_MS);
    } else {
      text += "\n\nSetor indisponível no momento.";
    }
  }

  if (choices.length) {
    // menu com botões clicáveis (ou texto numerado, se desativado/indisponível)
    await sendChoice(state.remoteJid, text || "Escolha uma opção:", choices, { hint: "Digite a opção desejada." });
    if (state.conversationId) {
      await recordMsg(state.conversationId, "bot", `${text || "Escolha uma opção:"}\n\n${choices.map(c => `${c.id} - ${c.text}`).join("\n")}`);
    }
  } else if (text) {
    await botSay(state, sock, text);
  }
}

// Encerra sozinho as conversas só com o bot que ficaram paradas (o cliente sumiu)
export function startConversationSweeper() {
  const run = async () => {
    try {
      const old = await prisma.wppConversation.findMany({
        where: { status: "bot", updatedAt: { lt: new Date(Date.now() - SESSION_IDLE_MS) } },
        select: { id: true, clientJid: true, clientPhone: true },
      });
      for (const c of old) {
        await closeBotConversation(c.id);
        clientStates.delete(normalizeForKey(toJid(c.clientJid || c.clientPhone)));
      }
    } catch (e) { console.error("[whatsapp] varredura de conversas:", e); }
  };
  setInterval(run, 5 * 60 * 1000);
  setTimeout(run, 30_000);
}

// ─── Conexão com o WhatsApp ──────────────────────────────────────────────────
// Padrão do BoxSys/Agendelle: UM socket por vez (dois sockets com a mesma sessão se derrubam
// em loop), 515 reconecta na hora, quedas reconectam com espera crescente e a sessão volta
// sozinha quando o servidor reinicia.

let generation = 0;
let reconnectTimer: NodeJS.Timeout | null = null;

function closeSocket(sock: any) {
  try {
    sock.ev.removeAllListeners("connection.update");
    sock.ev.removeAllListeners("messages.upsert");
    sock.ev.removeAllListeners("creds.update");
    sock.end(undefined);
  } catch {}
}

export async function connectSession(attempt = 0) {
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  const gen = ++generation;
  if (session?.sock) closeSocket(session.sock); // nunca deixa dois sockets com a mesma sessão

  const dir = path.join(SESSIONS_DIR, "default"); // single-tenant
  fs.mkdirSync(dir, { recursive: true });
  const { state, saveCreds } = await useMultiFileAuthState(dir);

  // Versão atual do WhatsApp Web: uma versão antiga é recusada pelo servidor (erro 405).
  // Se não conseguir buscar, deixa a biblioteca usar a dela em vez de uma versão fixa velha.
  const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: undefined }));
  if (gen !== generation) return; // outra conexão foi pedida enquanto esta preparava

  // Se makeWASocket for importado como default, em alguns ambientes ESM/TS ele é a própria função,
  // em outros (CJS interop) pode precisar de .default.
  const makeWASocketFn = (makeWASocket as any).default || makeWASocket;
  const sock = makeWASocketFn({
    ...(version ? { version } : {}),
    logger: makeLogger(),
    auth: state,
    syncFullHistory: false,
  });

  if (!session) {
    session = { sock, status: "connecting", phone: null, qrDataUrl: null, qrRaw: null, listeners: new Set() };
  } else {
    session.sock = sock;
    session.status = "connecting";
    session.qrDataUrl = null;
    session.qrRaw = null;
  }

  let tries = attempt;
  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update: any) => {
    if (gen !== generation) return; // evento de um socket antigo
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      session!.status = "qr_pending";
      session!.qrRaw = qr;
      session!.qrDataUrl = await qrToDataUrl(qr);
      await updateDb("qr_pending", null, session!.qrDataUrl);
    }

    if (connection === "connecting" && session!.status !== "qr_pending") {
      session!.status = "connecting";
    }

    if (connection === "close") {
      const code = (lastDisconnect?.error as Boom | undefined)?.output?.statusCode;

      if (code === DisconnectReason.loggedOut) {
        console.warn("[whatsapp] sessão encerrada pelo celular; apagando sessão local");
        fs.rmSync(dir, { recursive: true, force: true });
        session!.status = "disconnected";
        session!.qrDataUrl = null;
        session!.phone = null;
        await updateDb("disconnected", null, null);
      } else if (code === DisconnectReason.restartRequired) {
        // o WhatsApp fecha com 515 logo após o QR ser lido; é parte do pareamento, reconecta já
        console.log("[whatsapp] reinício pedido após o pareamento; reconectando");
        void connectSession(0);
      } else if (code === DisconnectReason.connectionReplaced) {
        // outra instância abriu a mesma sessão; reconectar só entraria em loop
        console.warn("[whatsapp] conexão substituída por outra sessão; não vou reconectar sozinho");
        session!.status = "disconnected";
        session!.qrDataUrl = null;
        await updateDb("disconnected", session!.phone, null);
      } else {
        const delayMs = Math.min(2000 * (tries + 1), 30_000);
        console.warn(`[whatsapp] conexão caiu (código ${code ?? "?"}); reconectando em ${delayMs / 1000}s`);
        session!.status = "connecting";
        reconnectTimer = setTimeout(() => { void connectSession(tries + 1); }, delayMs);
      }
    }

    if (connection === "open") {
      tries = 0; // conexão estável: a próxima queda recomeça a espera do zero
      const phone = jidToPhone(sock.user?.id || "");
      session!.status = "connected";
      session!.phone = phone;
      session!.qrDataUrl = null;
      session!.qrRaw = null;
      await updateDb("connected", phone, null);
      console.log(`Baileys conectado: ${phone}`);
    }
  });

  sock.ev.on("messages.upsert", async (m: any) => {
    if (gen !== generation) return;
    if (m.type === "notify") {
      for (const msg of m.messages) {
        try { await handleMessage(msg, sock); } catch (e) { console.error("[whatsapp] erro ao tratar mensagem:", e); }
      }
    }
  });
}

// Ao subir o servidor, volta a conectar sozinho se já existe uma sessão pareada
export async function resumeSession() {
  try {
    const credsFile = path.join(SESSIONS_DIR, "default", "creds.json");
    if (!fs.existsSync(credsFile)) return;
    const creds = JSON.parse(fs.readFileSync(credsFile, "utf-8"));
    if (!creds?.me) return; // nunca pareou (QR não lido): espera o usuário clicar em Conectar
    console.log("[whatsapp] retomando a sessão salva");
    await connectSession();
  } catch (e) {
    console.error("[whatsapp] não consegui retomar a sessão:", e);
  }
}

export async function disconnectSession() {
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  if (session && session.sock) {
    try {
      session.sock.logout();
    } catch (e) {}
  }
}
