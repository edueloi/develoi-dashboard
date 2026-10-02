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
  // o QR só vale enquanto está aguardando leitura; nunca mostrar um QR antigo
  return { status: session.status, phone: session.phone, qrDataUrl: session.status === "qr_pending" ? session.qrDataUrl : null };
}

// Ajusta o estado em memória do cliente (usado pelo painel ao aceitar/finalizar um atendimento)
export function setClientConversation(phone: string, conversationId: string, status: "waiting" | "in_chat") {
  const key = normalizeForKey(phoneToJid(phone));
  const state = clientStates.get(key) ?? { currentNodeId: null, remoteJid: phoneToJid(phone), lastActivity: Date.now() };
  state.conversationId = conversationId;
  state.status = status;
  clientStates.set(key, state);
}

// Libera o cliente: na próxima mensagem ele volta ao início do menu do bot
export function releaseClient(phone: string) {
  clientStates.delete(normalizeForKey(phoneToJid(phone)));
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


// Gancho para respostas automáticas a clientes cadastrados ("extrato", "fatura"…), registrado pelo Asaas
type ClientKeywordHandler = (phone: string, text: string) => Promise<boolean>;
let clientKeywordHandler: ClientKeywordHandler | null = null;
export function registerClientKeywordHandler(fn: ClientKeywordHandler) { clientKeywordHandler = fn; }

// ─── Atendentes pelo WhatsApp ────────────────────────────────────────────────
// Cada setor tem atendentes {name, phone}. Quando um cliente cai no setor, o bot avisa o atendente
// no WhatsApp dele; ele aceita (1) ou recusa (2) e passa a conversar COM O BOT, que repassa as
// mensagens ao cliente identificando o atendente em negrito. "&sair" encerra e o cliente volta ao bot.

interface Attendant { name: string; phone: string }

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
      .map((a: any) => ({ name: String(a?.name || "").trim(), phone: digits(a?.phone) }))
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

const clientLabel = (c: { clientName?: string | null; clientPhone: string }) => c.clientName || c.clientPhone;

// Avisa os atendentes do setor (ou só `onlyPhone`) que há um novo atendimento aguardando
export async function offerConversation(convId: string, onlyPhone?: string) {
  const conv = await prisma.wppConversation.findUnique({
    where: { id: convId },
    include: { sector: true, messages: { where: { fromRole: "client" }, orderBy: { sentAt: "asc" }, take: 6 } },
  });
  if (!conv || conv.status !== "waiting" || !conv.sector) return;

  const summary = conv.messages.length
    ? conv.messages.map(m => `• ${m.body.length > 160 ? m.body.slice(0, 157) + "…" : m.body}`).join("\n")
    : conv.firstMessage ? `• ${conv.firstMessage}` : "• (cliente ainda não descreveu o assunto)";

  for (const att of parseAttendants(conv.sector.attendants)) {
    if (onlyPhone && !samePhone(att.phone, onlyPhone)) continue;
    // atendente já em conversa não recebe oferta (as mensagens dele iriam para o cliente)
    const busy = await prisma.wppConversation.findFirst({ where: { status: "active", attendantPhone: att.phone } });
    if (busy) continue;
    const list = offers.get(att.phone) ?? [];
    if (!list.includes(convId)) offers.set(att.phone, [...list, convId]);
    await sendChoice(att.phone,
      `🔔 *Novo atendimento* — setor *${conv.sector.name}*\n` +
      `👤 Cliente: *${clientLabel(conv)}* (${conv.clientPhone})\n\n` +
      `💬 *Resumo:*\n${summary}`,
      [{ id: "1", text: "✅ Aceitar" }, { id: "2", text: "❌ Recusar" }],
      { footer: "Aceite ou recuse este atendimento.", hint: "Responda 1 para ACEITAR ou 2 para RECUSAR." });
  }
}

// Assume a conversa (atômico: só um atendente consegue). `phone` = atendente conversando pelo WhatsApp.
export async function acceptWaitingConversation(convId: string, who: { id?: string | null; name: string; phone?: string | null }) {
  const phone = who.phone ? digits(who.phone) : null;
  const claimed = await prisma.wppConversation.updateMany({
    where: { id: convId, status: "waiting" },
    data: { status: "active", attendantId: who.id ?? null, attendantName: who.name, attendantPhone: phone, acceptedAt: new Date() },
  });
  if (claimed.count === 0) return null;

  const conv = await prisma.wppConversation.findUniqueOrThrow({ where: { id: convId }, include: { sector: true } });
  await prisma.wppConversationMessage.create({
    data: { conversationId: convId, fromRole: "system", body: `${who.name} assumiu o atendimento.` },
  });
  setClientConversation(conv.clientPhone, convId, "in_chat");
  await sendMessage(conv.clientPhone, `*${who.name}* iniciou o seu atendimento. 👋\nComo posso ajudar?`);

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
  releaseClient(conv.clientPhone);
  const msg = closingMessage ?? `Atendimento encerrado por *${byName}*. Obrigado pelo contato! 😊\nSe precisar de algo, é só enviar uma mensagem.`;
  if (msg.trim()) await sendMessage(conv.clientPhone, msg.trim());
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
    if (!(await sendMessage(active.clientPhone, `*${att.name}:* ${text}`))) {
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
      const history = await prisma.wppConversationMessage.findMany({ where: { conversationId: conv.id, fromRole: "client" }, orderBy: { sentAt: "asc" }, take: 6 });
      await sendMessage(att.phone,
        `✅ Você está em atendimento com *${clientLabel(conv)}*.\n` +
        (history.length ? `\n💬 *Mensagens do cliente:*\n${history.map(m => `• ${m.body}`).join("\n")}\n` : "") +
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

async function handleMessage(msg: any, sock: any) {
  if (!msg.message || msg.key.fromMe || isJidGroup(msg.key.remoteJid!) || isJidBroadcast(msg.key.remoteJid!)) return;
  
  const textMsg = extractIncomingText(msg.message);
  if (!textMsg) return;

  const rawJid = msg.key.remoteJid!;
  const key = normalizeForKey(rawJid);
  const clientPhone = jidToPhone(key);

  // Mensagem de um atendente cadastrado (aceitar/recusar/conversar pelo bot)?
  // No Baileys v7 o remetente pode vir como @lid; remoteJidAlt traz o número real.
  const altJid: string | undefined = msg.key.remoteJidAlt;
  const senderPhone = altJid && altJid.endsWith("@s.whatsapp.net") ? jidToPhone(altJid) : clientPhone;
  const attendant = await findAttendantByPhone(senderPhone);
  if (attendant && (await handleAttendantMessage(attendant, textMsg))) return;

  // Aqui é a máquina de estados baseada nos nós do banco
  // Para ser simples e prático, vamos consultar o banco e navegar.
  
  let state = clientStates.get(key);

  // Cliente com conversa aberta (fila ou atendimento): só registra a mensagem para o atendente.
  // Também cobre reinício do servidor, quando o estado em memória foi perdido.
  if (!state || state.status === "waiting" || state.status === "in_chat") {
    const open = await prisma.wppConversation.findFirst({
      where: { clientPhone, status: { in: ["waiting", "active"] } },
      orderBy: { createdAt: "desc" },
    });
    if (open) {
      state = state ?? { currentNodeId: null, remoteJid: rawJid, lastActivity: Date.now() };
      state.conversationId = open.id;
      state.status = open.status === "active" ? "in_chat" : "waiting";
      state.lastActivity = Date.now();
      clientStates.set(key, state);
      await prisma.wppConversationMessage.create({
        data: { conversationId: open.id, fromRole: "client", fromPhone: clientPhone, body: textMsg }
      });
      await prisma.wppConversation.update({
        where: { id: open.id },
        data: { updatedAt: new Date(), ...(open.clientName ? {} : { clientName: msg.pushName || null }) }
      });
      // atendente conversando pelo WhatsApp: repassa a mensagem do cliente
      if (open.status === "active" && open.attendantPhone) {
        await sendMessage(open.attendantPhone, `*${open.clientName || open.clientPhone}:* ${textMsg}`);
      }
      return; // O atendente também vê no painel
    }
    if (state) { clientStates.delete(key); state = undefined; } // conversa já encerrada
  }

  // Cliente cadastrado pedindo extrato/fatura: o bot responde sozinho
  if (clientKeywordHandler && (await clientKeywordHandler(senderPhone, textMsg))) return;

  if (!state) {
    // Nova conversa, checa se bot está ativado
    const config = await prisma.wppBotConfig.findFirst();
    if (!config?.botEnabled) return;

    // Busca o nó inicial
    const startNode = await prisma.wppBotFlowNode.findFirst({ where: { isStart: true, isActive: true } });
    if (!startNode) return;

    state = { currentNodeId: startNode.id, remoteJid: rawJid, lastActivity: Date.now(), pushName: msg.pushName || null };
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
      text += `\n\nTransferindo para o setor *${sector.name}*... Aguarde um momento.\nEnquanto isso, pode escrever em uma mensagem o que você precisa. ✍️`;
      
      // Cria a conversa no banco
      const conv = await prisma.wppConversation.create({
        data: {
          sectorId: sector.id,
          clientPhone,
          clientName: state.pushName ?? null,
          firstMessage: textMsg,
          status: "waiting"
        }
      });
      state.status = "waiting";
      state.conversationId = conv.id;
      setTimeout(() => { offerConversation(conv.id).catch(e => console.error("Erro ao avisar atendentes:", e)); }, OFFER_DELAY_MS);
    } else {
      text += "\n\nSetor indisponível no momento.";
    }
  }

  if (choices.length) {
    // menu com botões clicáveis (ou texto numerado, se desativado/indisponível)
    await sendChoice(state.remoteJid, text || "Escolha uma opção:", choices, { hint: "Digite a opção desejada." });
  } else if (text) {
    await sock.sendMessage(state.remoteJid, { text });
  }
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
    if (!creds?.registered) return; // QR nunca foi lido; espera o usuário clicar em Conectar
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
