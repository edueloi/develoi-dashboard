// Webhooks de saída: avisam outros sistemas de TUDO que acontece aqui (criar/alterar/excluir em qualquer
// tabela). Também expõe o "o que mudou" usado pelas telas para se atualizarem sozinhas.
import type { Express } from "express";
import crypto from "crypto";
import dns from "dns/promises";
import net from "net";
import { Prisma } from "@prisma/client";
import { rawPrisma as db } from "./db.js";

const MAX_ATTEMPTS = 6;
const BACKOFF_MS = [60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000, 6 * 60 * 60_000]; // 1min, 5min, 15min, 1h, 6h
const TICK_MS = 5000;
const TIMEOUT_MS = 10_000;

// Tabelas que não geram evento (espelha db.ts)
const HIDDEN = new Set(["SystemEvent", "WebhookEndpoint", "WebhookDelivery", "AsaasWebhookLog", "TeamNoticeLog", "ClientBillingNotice", "BlogAnalytics", "WppInstance"]);

const LABELS: Record<string, string> = {
  Client: "Clientes", ClientPayment: "Recebimentos de clientes", Receivable: "Contas a receber (avulsas)", AsaasCharge: "Cobranças do Asaas",
  Payable: "Contas a pagar", PayablePayment: "Pagamentos de contas a pagar", Sale: "Vendas", Product: "Produtos e planos", ClientContact: "Contato com clientes",
  Project: "Projetos", Feature: "Tarefas (backlog)", Sprint: "Sprints", FeatureComment: "Comentários das tarefas", ProjectImage: "Imagens dos projetos", Message: "Chat dos projetos",
  WppConversation: "Atendimentos WhatsApp", WppConversationMessage: "Mensagens do atendimento", WppBotSector: "Setores do bot", WppBotFlowNode: "Menu do bot", WppBotConfig: "Configuração do bot",
  TeamRecipient: "Equipe que recebe avisos", Meeting: "Reuniões", MeetingAttendee: "Participantes das reuniões", ReadyMessage: "Mensagens prontas",
  BlogPost: "Posts do blog", BlogCategory: "Categorias do blog", BlogAuthor: "Autores do blog", BlogSubscriber: "Assinantes do blog", Case: "Cases", CaseCategory: "Categorias de cases",
  PortfolioItem: "Portfólio", TeamMember: "Nossa equipe (site)", SiteValues: "Missão e valores", User: "Usuários do sistema",
};

const eventName = (model: string, action: string) => `${model.charAt(0).toLowerCase()}${model.slice(1)}.${action}`;

function parsePatterns(raw: string): string[] {
  try { const v = JSON.parse(raw); return Array.isArray(v) ? v.map(String) : ["*"]; } catch { return ["*"]; }
}
const matches = (patterns: string[], model: string, action: string) => {
  const base = eventName(model, action).split(".")[0];
  return patterns.some(p => p === "*" || p === `${base}.*` || p === eventName(model, action));
};

// ─── Segurança: não aceitar destinos internos (SSRF) ─────────────────────────
function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  const v = ip.toLowerCase();
  return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80") || v.startsWith("::ffff:127.") || v.startsWith("::ffff:10.") || v.startsWith("::ffff:192.168.");
}

async function assertPublicUrl(raw: string): Promise<URL> {
  let u: URL;
  try { u = new URL(raw); } catch { throw new Error("Endereço inválido."); }
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("Use um endereço http:// ou https://.");
  if (process.env.WEBHOOK_ALLOW_PRIVATE === "1") return u;
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) throw new Error("Endereços internos não são permitidos.");
  const ips = net.isIP(host) ? [host] : (await dns.lookup(host, { all: true }).catch(() => [])).map(r => r.address);
  if (ips.length === 0) throw new Error("Não consegui resolver o endereço (domínio inexistente?).");
  if (ips.some(isPrivateIp)) throw new Error("Endereços internos não são permitidos.");
  return u;
}

const sign = (secret: string, body: string) => `sha256=${crypto.createHmac("sha256", secret).update(body).digest("hex")}`;

interface SendResult { ok: boolean; status: number | null; error: string | null; ms: number }

async function sendOnce(ep: { url: string; secret: string }, deliveryId: string, event: string, payload: unknown): Promise<SendResult> {
  const t0 = Date.now();
  try {
    await assertPublicUrl(ep.url);
    const body = JSON.stringify(payload);
    const res = await fetch(ep.url, {
      method: "POST", redirect: "manual", signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "Content-Type": "application/json", "User-Agent": "Develoi-Webhooks/1.0",
        "X-Develoi-Event": event, "X-Develoi-Delivery": deliveryId, "X-Develoi-Signature": sign(ep.secret, body),
      },
      body,
    });
    const ok = res.status >= 200 && res.status < 300;
    return { ok, status: res.status, error: ok ? null : `HTTP ${res.status}`, ms: Date.now() - t0 };
  } catch (e: any) {
    return { ok: false, status: null, error: String(e?.message || e).slice(0, 280), ms: Date.now() - t0 };
  }
}

// ─── Distribuição e entrega ──────────────────────────────────────────────────
async function fanOut() {
  const events = await db.systemEvent.findMany({ where: { dispatchedAt: null }, orderBy: { id: "asc" }, take: 200 });
  if (events.length === 0) return;
  const endpoints = (await db.webhookEndpoint.findMany({ where: { active: true } })).map(e => ({ id: e.id, patterns: parsePatterns(e.events) }));
  const now = new Date();
  const rows: Prisma.WebhookDeliveryCreateManyInput[] = [];
  for (const ev of events) {
    for (const ep of endpoints) {
      if (matches(ep.patterns, ev.model, ev.action)) {
        rows.push({ endpointId: ep.id, eventId: ev.id, event: eventName(ev.model, ev.action), status: "pending", nextAttemptAt: now });
      }
    }
  }
  if (rows.length) await db.webhookDelivery.createMany({ data: rows });
  await db.systemEvent.updateMany({ where: { id: { in: events.map(e => e.id) } }, data: { dispatchedAt: now } });
}

async function deliverDue() {
  const due = await db.webhookDelivery.findMany({
    where: { status: "pending", nextAttemptAt: { lte: new Date() } },
    orderBy: { createdAt: "asc" }, take: 25, include: { endpoint: true },
  });
  for (const d of due) {
    const ev = await db.systemEvent.findUnique({ where: { id: d.eventId } });
    if (!ev) { await db.webhookDelivery.update({ where: { id: d.id }, data: { status: "failed", lastError: "evento removido" } }); continue; }
    let data: unknown = null;
    try { data = ev.data ? JSON.parse(ev.data) : null; } catch { data = null; }
    const payload = { id: d.id, event: d.event, occurredAt: ev.createdAt.toISOString(), model: ev.model, action: ev.action, recordId: ev.recordId, data };
    const r = await sendOnce(d.endpoint, d.id, d.event, payload);
    const attempts = d.attempts + 1;
    await db.webhookDelivery.update({
      where: { id: d.id },
      data: {
        attempts, lastStatusCode: r.status, lastError: r.error, durationMs: r.ms,
        ...(r.ok ? { status: "success", deliveredAt: new Date(), nextAttemptAt: null }
          : attempts >= MAX_ATTEMPTS ? { status: "failed", nextAttemptAt: null }
          : { nextAttemptAt: new Date(Date.now() + BACKOFF_MS[attempts - 1]) }),
      },
    });
  }
}

async function purge() {
  const day = 24 * 60 * 60 * 1000;
  await db.systemEvent.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 14 * day) } } });
  await db.webhookDelivery.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 30 * day) } } });
}

export function startWebhookDispatcher() {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try { await fanOut(); await deliverDue(); } catch (e) { console.error("[webhooks] erro:", e); } finally { running = false; }
  };
  setInterval(tick, TICK_MS);
  setInterval(() => { purge().catch(() => {}); }, 6 * 60 * 60 * 1000);
  setTimeout(() => { purge().catch(() => {}); tick(); }, 20_000);
}

// ─── Rotas ───────────────────────────────────────────────────────────────────
export function registerWebhookOutRoutes(app: Express) {
  const fail = (res: any, e: any, code = 500) => res.status(code).json({ error: e.message });
  const newSecret = () => `whsec_${crypto.randomBytes(24).toString("hex")}`;
  const cleanEvents = (v: unknown): string[] => {
    const list = Array.isArray(v) ? v.map(String).filter(Boolean) : [];
    return list.length ? list : ["*"];
  };

  // Tabelas disponíveis para escolher nos webhooks
  app.get("/api/system/event-models", (_req, res) => {
    const names = Prisma.dmmf.datamodel.models.map(m => m.name).filter(n => !HIDDEN.has(n));
    res.json(names.map(n => ({ model: n, key: n.charAt(0).toLowerCase() + n.slice(1), label: LABELS[n] ?? n })));
  });

  // "O que mudou" desde o último id (as telas usam para se atualizar sozinhas)
  app.get("/api/events", async (req, res) => {
    try {
      const since = Number(req.query.since);
      if (!Number.isFinite(since)) {
        const last = await db.systemEvent.findFirst({ orderBy: { id: "desc" }, select: { id: true } });
        return res.json({ cursor: last?.id ?? 0, events: [] });
      }
      const events = await db.systemEvent.findMany({
        where: { id: { gt: since } }, orderBy: { id: "asc" }, take: 300,
        select: { id: true, model: true, action: true, recordId: true, createdAt: true },
      });
      res.json({ cursor: events.length ? events[events.length - 1].id : since, events });
    } catch (e) { fail(res, e); }
  });

  // ── Endereços de destino ──
  app.get("/api/webhook-endpoints", async (_req, res) => {
    try {
      const list = await db.webhookEndpoint.findMany({ orderBy: { createdAt: "asc" } });
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const stats = await db.webhookDelivery.groupBy({ by: ["endpointId", "status"], where: { createdAt: { gte: since } }, _count: { _all: true } });
      res.json(list.map(e => {
        const s = (st: string) => stats.find(x => x.endpointId === e.id && x.status === st)?._count._all ?? 0;
        return { id: e.id, name: e.name, url: e.url, active: e.active, events: parsePatterns(e.events), secretPreview: `••••${e.secret.slice(-4)}`,
          createdAt: e.createdAt, stats: { success: s("success"), failed: s("failed"), pending: s("pending") } };
      }));
    } catch (e) { fail(res, e); }
  });

  app.post("/api/webhook-endpoints", async (req, res) => {
    try {
      const { name, url, events, active } = req.body ?? {};
      if (!String(name || "").trim()) return fail(res, new Error("Informe um nome."), 400);
      await assertPublicUrl(String(url || ""));
      const secret = newSecret();
      const ep = await db.webhookEndpoint.create({ data: { name: String(name).trim(), url: String(url).trim(), secret, events: JSON.stringify(cleanEvents(events)), active: active !== false } });
      res.json({ id: ep.id, secret }); // a chave só aparece agora, na criação
    } catch (e) { fail(res, e, 400); }
  });

  app.patch("/api/webhook-endpoints/:id", async (req, res) => {
    try {
      const { name, url, events, active } = req.body ?? {};
      if (url !== undefined) await assertPublicUrl(String(url));
      await db.webhookEndpoint.update({
        where: { id: req.params.id },
        data: {
          ...(name !== undefined && { name: String(name).trim() }),
          ...(url !== undefined && { url: String(url).trim() }),
          ...(events !== undefined && { events: JSON.stringify(cleanEvents(events)) }),
          ...(active !== undefined && { active: !!active }),
        },
      });
      res.json({ success: true });
    } catch (e) { fail(res, e, 400); }
  });

  app.post("/api/webhook-endpoints/:id/regenerate-secret", async (req, res) => {
    try {
      const secret = newSecret();
      await db.webhookEndpoint.update({ where: { id: req.params.id }, data: { secret } });
      res.json({ secret });
    } catch (e) { fail(res, e); }
  });

  app.delete("/api/webhook-endpoints/:id", async (req, res) => {
    try { await db.webhookEndpoint.delete({ where: { id: req.params.id } }); res.json({ success: true }); } catch (e) { fail(res, e); }
  });

  // Envia um evento de teste agora e mostra o resultado
  app.post("/api/webhook-endpoints/:id/test", async (req, res) => {
    try {
      const ep = await db.webhookEndpoint.findUnique({ where: { id: req.params.id } });
      if (!ep) return fail(res, new Error("Webhook não encontrado."), 404);
      const del = await db.webhookDelivery.create({ data: { endpointId: ep.id, eventId: 0, event: "webhook.test", status: "pending", nextAttemptAt: null } });
      const payload = { id: del.id, event: "webhook.test", occurredAt: new Date().toISOString(), model: "Webhook", action: "test", recordId: null, data: { mensagem: "Teste de envio do Develoi Dashboard" } };
      const r = await sendOnce(ep, del.id, "webhook.test", payload);
      await db.webhookDelivery.update({
        where: { id: del.id },
        data: { attempts: 1, status: r.ok ? "success" : "failed", lastStatusCode: r.status, lastError: r.error, durationMs: r.ms, deliveredAt: r.ok ? new Date() : null },
      });
      res.json(r);
    } catch (e) { fail(res, e); }
  });

  // ── Histórico de envios ──
  app.get("/api/webhook-deliveries", async (req, res) => {
    try {
      const take = Math.min(100, Math.max(1, Number(req.query.limit) || 40));
      const rows = await db.webhookDelivery.findMany({
        where: req.query.endpointId ? { endpointId: String(req.query.endpointId) } : {},
        orderBy: { createdAt: "desc" }, take, include: { endpoint: { select: { name: true } } },
      });
      res.json(rows.map(d => ({ ...d, endpointName: d.endpoint.name, endpoint: undefined })));
    } catch (e) { fail(res, e); }
  });

  app.post("/api/webhook-deliveries/:id/retry", async (req, res) => {
    try {
      const d = await db.webhookDelivery.findUnique({ where: { id: req.params.id } });
      if (!d) return fail(res, new Error("Envio não encontrado."), 404);
      if (d.eventId === 0) return fail(res, new Error("Testes não são reenviados. Use o botão Testar."), 400);
      await db.webhookDelivery.update({ where: { id: d.id }, data: { status: "pending", nextAttemptAt: new Date(), attempts: Math.min(d.attempts, MAX_ATTEMPTS - 1) } });
      res.json({ success: true });
    } catch (e) { fail(res, e); }
  });
}
