// Prospecção: busca de empresas por cidade e ramo no Google Places (API oficial) e importação como leads.
// Segurança de custo: contamos as consultas do mês e paramos antes de passar da cota gratuita (PLACES_MONTHLY_LIMIT, padrão 900).
import type { Express } from "express";
import { prisma } from "./db.js";
import { phoneKey } from "./outreach.js";

const KEY = () => (process.env.GOOGLE_PLACES_API_KEY ?? "").trim();
const LIMIT = () => Math.max(1, Number(process.env.PLACES_MONTHLY_LIMIT) || 900);
const monthNow = () => new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 7);

const FIELDS = [
  "places.id", "places.displayName", "places.formattedAddress", "places.nationalPhoneNumber", "places.internationalPhoneNumber",
  "places.websiteUri", "places.rating", "places.userRatingCount", "places.primaryTypeDisplayName", "places.businessStatus", "places.googleMapsUri", "nextPageToken",
].join(",");

async function usage() {
  const row = await prisma.placesUsage.findUnique({ where: { month: monthNow() } });
  return { used: row?.requests ?? 0, limit: LIMIT() };
}

export function registerPlacesRoutes(app: Express) {
  const fail = (res: any, e: any, code = 500) => res.status(code).json({ error: e.message ?? String(e) });

  app.get("/api/prospect/places/status", async (_req, res) => {
    try { res.json({ configured: !!KEY(), ...(await usage()) }); } catch (e) { fail(res, e); }
  });

  // Uma página de resultados (até 20 empresas). "pageToken" traz as próximas (a busca vai até 60).
  app.post("/api/prospect/places/search", async (req, res) => {
    try {
      if (!KEY()) return fail(res, new Error("A chave do Google Places ainda não foi configurada no servidor."), 400);
      const ramo = String(req.body?.ramo ?? "").trim();
      const city = String(req.body?.city ?? "").trim();
      if (!ramo || !city) return fail(res, new Error("Informe o ramo e a cidade."), 400);
      const u = await usage();
      if (u.used >= u.limit) return fail(res, new Error(`Limite de segurança do mês atingido (${u.used} de ${u.limit} consultas). Isso evita cobrança do Google. Aumente PLACES_MONTHLY_LIMIT no servidor se quiser continuar.`), 429);

      const body: Record<string, unknown> = { textQuery: `${ramo} em ${city}`, languageCode: "pt-BR", regionCode: "BR", pageSize: 20 };
      if (req.body?.pageToken) body.pageToken = String(req.body.pageToken);
      const r = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST", signal: AbortSignal.timeout(20_000),
        headers: { "Content-Type": "application/json", "X-Goog-Api-Key": KEY(), "X-Goog-FieldMask": FIELDS },
        body: JSON.stringify(body),
      });
      const data: any = await r.json().catch(() => ({}));
      if (!r.ok) {
        const msg = data?.error?.message || `Erro ${r.status} do Google`;
        return fail(res, new Error(r.status === 403 ? `O Google recusou a chave: ${msg}` : msg), 502);
      }
      await prisma.placesUsage.upsert({ where: { month: monthNow() }, create: { month: monthNow(), requests: 1 }, update: { requests: { increment: 1 } } });

      // marca quem já está cadastrado (pelo Google ID ou pelo telefone) em Prospecção, Clientes ou Vendas
      const [leads, clients] = await Promise.all([
        prisma.lead.findMany({ select: { placeId: true, phone: true } }),
        prisma.client.findMany({ select: { phone: true } }),
      ]);
      const known = new Set<string>([...leads.map(l => phoneKey(l.phone)), ...clients.map(c => phoneKey(c.phone))].filter(Boolean));
      const knownIds = new Set(leads.map(l => l.placeId).filter(Boolean) as string[]);

      const places = ((data.places as any[]) ?? []).map(p => {
        const phone = p.nationalPhoneNumber ?? p.internationalPhoneNumber ?? null;
        return {
          placeId: p.id as string,
          name: p.displayName?.text ?? "Sem nome",
          address: p.formattedAddress ?? null,
          phone,
          website: p.websiteUri ?? null,
          rating: p.rating ?? null,
          reviews: p.userRatingCount ?? 0,
          category: p.primaryTypeDisplayName?.text ?? null,
          status: p.businessStatus ?? null,
          mapsUrl: p.googleMapsUri ?? null,
          already: knownIds.has(p.id) || (!!phone && known.has(phoneKey(phone))),
        };
      });
      res.json({ places, nextPageToken: data.nextPageToken ?? null, ...(await usage()) });
    } catch (e) { fail(res, e); }
  });

  // Importa as empresas escolhidas como leads (origem "Google Maps")
  app.post("/api/prospect/places/import", async (req, res) => {
    try {
      const list: any[] = Array.isArray(req.body?.places) ? req.body.places.slice(0, 200) : [];
      const product = String(req.body?.product ?? "").trim().slice(0, 120) || null;
      const ramo = String(req.body?.ramo ?? "").trim();
      const city = String(req.body?.city ?? "").trim().slice(0, 100) || null;
      const [leads, clients] = await Promise.all([prisma.lead.findMany({ select: { placeId: true, phone: true } }), prisma.client.findMany({ select: { phone: true } })]);
      const known = new Set<string>([...leads.map(l => phoneKey(l.phone)), ...clients.map(c => phoneKey(c.phone))].filter(Boolean));
      const knownIds = new Set(leads.map(l => l.placeId).filter(Boolean) as string[]);
      let created = 0, skipped = 0;
      for (const p of list) {
        const name = String(p.name ?? "").trim().slice(0, 150);
        const pk = phoneKey(p.phone);
        if (!name || knownIds.has(p.placeId) || (pk && known.has(pk))) { skipped++; continue; }
        const notes = [
          p.category ? `Segmento: ${p.category}` : ramo ? `Segmento: ${ramo}` : null,
          p.address ? `Endereço: ${p.address}` : null,
          p.website ? `Site: ${p.website}` : null,
          p.rating ? `Google: nota ${p.rating} (${p.reviews ?? 0} avaliações)` : null,
          p.mapsUrl ? `Mapa: ${p.mapsUrl}` : null,
        ].filter(Boolean).join("\n");
        const lead = await prisma.lead.create({
          data: { name, company: name, phone: p.phone ? String(p.phone).slice(0, 40) : null, city, source: "google", product, placeId: String(p.placeId ?? "").slice(0, 80) || null, notes: notes || null },
        });
        await prisma.leadActivity.create({ data: { leadId: lead.id, type: "status", text: `Importado do Google Maps${ramo ? ` (busca: ${ramo})` : ""}` } });
        if (pk) known.add(pk);
        if (p.placeId) knownIds.add(p.placeId);
        created++;
      }
      res.json({ created, skipped });
    } catch (e) { fail(res, e); }
  });
}
