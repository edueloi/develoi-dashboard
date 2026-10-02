// Integração com o Store BoxSys (API externa dele, autenticada por x-api-key).
// O Develoi cobra o cliente; o BoxSys recebe o resultado: loja criada ao cadastrar, liberada quando paga,
// bloqueada quando passa da tolerância (ou quando o cliente é pausado/cancelado).
import type { Express } from "express";
import crypto from "crypto";
import { prisma } from "./db.js";
import { sendMessage } from "./wa.js";

//  BOXSYS_API_URL  endereço do BoxSys (padrão https://boxsys.com.br)
//  BOXSYS_API_KEY  a mesma chave EXTERNAL_API_KEY configurada no .env do BoxSys
const cfg = () => ({
  url: (process.env.BOXSYS_API_URL || "https://boxsys.com.br").replace(/\/$/, ""),
  key: process.env.BOXSYS_API_KEY || "",
});

class BoxsysError extends Error {}

async function boxsys<T = any>(path: string, method = "GET", body?: unknown): Promise<T> {
  const { url, key } = cfg();
  if (!key) throw new BoxsysError("BoxSys não configurado: defina BOXSYS_API_KEY no .env do servidor.");
  let res: globalThis.Response;
  try {
    res = await fetch(`${url}/api/external${path}`, {
      method, signal: AbortSignal.timeout(15_000),
      headers: { "Content-Type": "application/json", "x-api-key": key, "User-Agent": "develoi-dashboard" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e: any) {
    throw new BoxsysError(`Não consegui falar com o BoxSys (${e?.message || "sem resposta"}).`);
  }
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new BoxsysError(data?.error || `Erro ${res.status} do BoxSys`);
  return data as T;
}

const strongPassword = () => crypto.randomBytes(9).toString("base64").replace(/[+/=]/g, "x") + "9a"; // 12+ caracteres, letras e números

// ─── Sincronização de acesso ─────────────────────────────────────────────────
// Regra: cliente ATIVO → loja liberada; pausado/bloqueado/cancelado → loja bloqueada.
export async function syncBoxsysAccess(clientId: string): Promise<void> {
  const c = await prisma.client.findUnique({ where: { id: clientId } });
  if (!c?.boxsysTenantId || !cfg().key) return;
  const desired = c.status === "active" ? "active" : "suspended";
  if (c.boxsysStatus === desired && !c.boxsysError) return;
  try {
    await boxsys(`/tenants/${c.boxsysTenantId}/${desired === "active" ? "unblock" : "block"}`, "POST");
    await prisma.client.update({ where: { id: c.id }, data: { boxsysStatus: desired, boxsysSyncedAt: new Date(), boxsysError: null } });
    console.log(`[boxsys] ${c.name}: loja ${desired === "active" ? "liberada" : "bloqueada"}`);
  } catch (e: any) {
    await prisma.client.update({ where: { id: c.id }, data: { boxsysError: String(e.message).slice(0, 250) } }).catch(() => {});
    console.error(`[boxsys] não consegui sincronizar ${c.name}:`, e.message);
  }
}

export function startBoxsysScheduler() {
  if (!cfg().key) return;
  const tick = async () => {
    try {
      const linked = await prisma.client.findMany({ where: { boxsysTenantId: { not: null } }, select: { id: true } });
      for (const c of linked) await syncBoxsysAccess(c.id);
    } catch (e) { console.error("[boxsys] sincronização falhou:", e); }
  };
  setInterval(tick, 15 * 60 * 1000); // rede de segurança: reaplica se o BoxSys ficou fora do ar
  setTimeout(tick, 90 * 1000);
}

// ─── Rotas ───────────────────────────────────────────────────────────────────
export function registerBoxsysRoutes(app: Express) {
  const fail = (res: any, e: any) => res.status(e instanceof BoxsysError ? 400 : 500).json({ error: e.message });

  app.get("/api/boxsys/status", (_req, res) => res.json({ configured: !!cfg().key, url: cfg().url }));

  // planos cadastrados no BoxSys (para escolher ao criar a loja)
  app.get("/api/boxsys/plans", async (_req, res) => {
    try { res.json(await boxsys("/plans")); } catch (e) { fail(res, e); }
  });

  // Cria a loja do cliente no BoxSys e guarda o vínculo. A senha provisória é mostrada/enviada uma única vez.
  app.post("/api/clients/:id/boxsys/create", async (req, res) => {
    try {
      const c = await prisma.client.findUnique({ where: { id: req.params.id } });
      if (!c) throw new BoxsysError("Cliente não encontrado.");
      if (c.boxsysTenantId) throw new BoxsysError("Este cliente já tem uma loja no BoxSys.");

      const { storeName, subdomain, ownerName, ownerEmail, planId, trialDays, sendAccess } = req.body ?? {};
      const email = String(ownerEmail || c.email || "").trim().toLowerCase();
      if (!email) throw new BoxsysError("Informe o e-mail do responsável (ele será o login da loja).");
      const password = strongPassword();

      const tenant = await boxsys<any>("/tenants", "POST", {
        storeName: String(storeName || c.name).trim(),
        ownerName: String(ownerName || c.name).trim(),
        ownerEmail: email,
        ownerPassword: password,
        subdomain: subdomain ? String(subdomain).trim() : undefined,
        whatsapp: c.phone ? String(c.phone).replace(/\D/g, "") : undefined,
        planId: planId ? Number(planId) : undefined,
        trialDays: Number(trialDays) > 0 ? Number(trialDays) : 14, // teste padrão de 14 dias
        subscriptionAmount: c.billingValue || undefined, // só informativo: a cobrança é feita pelo Develoi
      });

      await prisma.client.update({
        where: { id: c.id },
        data: { boxsysTenantId: String(tenant.id), boxsysSubdomain: tenant.subdomain ?? null, boxsysUrl: tenant.accessUrl ?? null, boxsysStatus: "active", boxsysSyncedAt: new Date(), boxsysError: null },
      });

      let sent = false;
      if (sendAccess && c.phone) {
        sent = await sendMessage(c.phone, [
          `Olá, ${c.name.trim().split(/\s+/)[0]}! 👋`,
          `Seu acesso ao *Store BoxSys* foi criado:`,
          `🔗 ${tenant.accessUrl}\n📧 ${email}\n🔑 Senha provisória: *${password}*`,
          `Por segurança, altere a senha no primeiro acesso. Qualquer dúvida, é só responder por aqui.`,
        ].join("\n\n"));
      }
      res.json({ tenant, access: { url: tenant.accessUrl, email, password }, sent });
    } catch (e) { fail(res, e); }
  });

  // Estado real da loja no BoxSys
  app.get("/api/clients/:id/boxsys", async (req, res) => {
    try {
      const c = await prisma.client.findUnique({ where: { id: req.params.id } });
      if (!c?.boxsysTenantId) return res.json({ linked: false });
      const t = await boxsys<any>(`/tenants/${c.boxsysTenantId}`);
      await prisma.client.update({ where: { id: c.id }, data: { boxsysStatus: t.status === "suspended" ? "suspended" : "active", boxsysSyncedAt: new Date(), boxsysError: null } });
      res.json({ linked: true, tenant: t });
    } catch (e) { fail(res, e); }
  });

  // Bloqueio/liberação manual (a regra automática volta a valer na próxima sincronização)
  for (const action of ["block", "unblock"] as const) {
    app.post(`/api/clients/:id/boxsys/${action}`, async (req, res) => {
      try {
        const c = await prisma.client.findUnique({ where: { id: req.params.id } });
        if (!c?.boxsysTenantId) throw new BoxsysError("Este cliente não tem loja no BoxSys.");
        await boxsys(`/tenants/${c.boxsysTenantId}/${action}`, "POST");
        await prisma.client.update({ where: { id: c.id }, data: { boxsysStatus: action === "block" ? "suspended" : "active", boxsysSyncedAt: new Date(), boxsysError: null } });
        res.json({ success: true });
      } catch (e) { fail(res, e); }
    });
  }

  // Lojas que já existem no BoxSys, cruzadas com os clientes daqui (vinculada / sugestão por e-mail)
  app.get("/api/boxsys/tenants", async (_req, res) => {
    try {
      const tenants = await boxsys<any[]>("/tenants");
      const clients = await prisma.client.findMany({ select: { id: true, name: true, email: true, boxsysTenantId: true } });
      res.json(tenants.map(t => {
        const linked = clients.find(c => c.boxsysTenantId === String(t.id));
        const email = String(t.owner?.email || "").toLowerCase();
        const match = !linked && email ? clients.find(c => !c.boxsysTenantId && c.email?.toLowerCase() === email) : undefined;
        return { ...t, linkedClient: linked ? { id: linked.id, name: linked.name } : null, suggestedClient: match ? { id: match.id, name: match.name } : null };
      }));
    } catch (e) { fail(res, e); }
  });

  // Traz lojas do BoxSys para cá: cria o cliente (ou vincula a um já existente) com o estado atual da loja.
  // items: [{ tenantId, clientId? }]
  app.post("/api/boxsys/import", async (req, res) => {
    try {
      const items: { tenantId: string | number; clientId?: string }[] = Array.isArray(req.body?.items) ? req.body.items : [];
      if (!items.length) throw new BoxsysError("Escolha ao menos uma loja.");
      const tenants = await boxsys<any[]>("/tenants");
      let created = 0, linked = 0;
      for (const it of items) {
        const t = tenants.find(x => String(x.id) === String(it.tenantId));
        if (!t) continue;
        const already = await prisma.client.findFirst({ where: { boxsysTenantId: String(t.id) } });
        if (already || t.status !== "active") continue; // só ativas (inclui as em teste)
        const isActive = t.status === "active";
        const link = {
          boxsysTenantId: String(t.id), boxsysSubdomain: t.subdomain ?? null, boxsysUrl: t.accessUrl ?? null,
          boxsysStatus: isActive ? "active" : "suspended", boxsysSyncedAt: new Date(), boxsysError: null,
        };
        if (it.clientId) {
          await prisma.client.update({ where: { id: it.clientId }, data: link });
          linked++;
        } else {
          const trialEnd = t.trialEndsAt ? new Date(t.trialEndsAt) : null;
          await prisma.client.create({
            data: {
              name: String(t.name || t.owner?.name || "Loja BoxSys").trim(),
              email: t.owner?.email ?? null,
              status: isActive ? "active" : "paused",
              billingValue: Number(t.subscriptionAmount) || 0,
              startDate: t.createdAt ? new Date(t.createdAt) : null,
              nextDueDate: trialEnd && trialEnd.getTime() > Date.now() ? trialEnd : null,
              notes: "Importado do Store BoxSys.",
              ...link,
            },
          });
          created++;
        }
      }
      res.json({ created, linked });
    } catch (e) { fail(res, e); }
  });

  // Só desfaz o vínculo aqui; a loja continua existindo no BoxSys
  app.delete("/api/clients/:id/boxsys", async (req, res) => {
    try {
      await prisma.client.update({ where: { id: req.params.id }, data: { boxsysTenantId: null, boxsysSubdomain: null, boxsysUrl: null, boxsysStatus: null, boxsysSyncedAt: null, boxsysError: null } });
      res.json({ success: true });
    } catch (e) { fail(res, e); }
  });
}
