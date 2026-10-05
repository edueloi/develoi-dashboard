// Plano de Negócio: documento vivo da empresa (missão, análise, modelo de negócio),
// metas da empresa e de cada sócio, conquistas e avaliações periódicas dos sócios.
import type { Express } from "express";
import { prisma } from "./db.js";

const fail = (res: any, e: any, code = 500) => res.status(code).json({ error: e.message ?? String(e) });

// Checklist de pontos jurídicos/societários comuns para uma empresa SaaS brasileira.
// São lembretes de temas a resolver com contador/advogado, não substituem orientação profissional.
const DEFAULT_LEGAL_CHECKLIST = [
  { id: "contrato-social", label: "Contrato social / acordo de sócios atualizado e assinado por todos", done: false },
  { id: "regime-tributario", label: "Regime tributário revisado com o contador (MEI, Simples Nacional, Lucro Presumido...)", done: false },
  { id: "distribuicao-lucros", label: "Forma de distribuição de lucros entre sócios formalizada (ver aba Sociedade & Lucros)", done: false },
  { id: "termos-de-uso", label: "Termos de Uso publicados e atualizados para cada sistema/produto", done: false },
  { id: "politica-privacidade", label: "Política de Privacidade publicada, alinhada com a LGPD", done: false },
  { id: "contratos-clientes", label: "Contrato padrão de prestação de serviço/assinatura com os clientes", done: false },
  { id: "protecao-dados", label: "Dados de clientes armazenados com segurança (backups, acesso restrito, criptografia de senhas)", done: false },
  { id: "marca-registrada", label: "Registro de marca (INPI) avaliado para o nome Develoi e produtos principais", done: false },
  { id: "nf-emissao", label: "Emissão de notas fiscais em dia para todos os recebimentos", done: false },
  { id: "pro-labore", label: "Pró-labore dos sócios definido e formalizado, se aplicável", done: false },
];

const FIELD_LABELS: Record<string, string> = {
  missionText: "Missão", visionText: "Visão", valuesText: "Valores",
  swotStrengths: "Forças", swotWeaknesses: "Fraquezas", swotOpportunities: "Oportunidades", swotThreats: "Ameaças",
  swotConclusion: "Conclusão da Análise SWOT",
  targetMarket: "Mercado-Alvo / Público", businessModel: "Modelo de Negócio",
  legalChecklist: "Checklist Jurídico", legalNotes: "Observações Jurídicas",
};

async function getOrCreatePlan() {
  const existing = await prisma.businessPlan.findUnique({ where: { id: "main" } });
  if (existing) return existing;
  return prisma.businessPlan.create({ data: { id: "main", legalChecklist: DEFAULT_LEGAL_CHECKLIST as any } });
}

export function registerBusinessPlanRoutes(app: Express) {
  // ── Plano de Negócio (documento único) ──────────────────────────────────────
  app.get("/api/business-plan", async (_req, res) => {
    try { res.json(await getOrCreatePlan()); } catch (e) { fail(res, e); }
  });

  app.patch("/api/business-plan", async (req, res) => {
    try {
      const current = await getOrCreatePlan();
      const allowed = [
        "missionText", "visionText", "valuesText",
        "swotStrengths", "swotWeaknesses", "swotOpportunities", "swotThreats", "swotConclusion",
        "targetMarket", "businessModel", "legalChecklist", "legalNotes", "updatedByName",
      ];
      const data: any = {};
      for (const k of allowed) if (k in req.body) data[k] = req.body[k];

      const changes: { field: string; label: string; before: string | null; after: string | null }[] = [];
      for (const k of Object.keys(data)) {
        if (k === "updatedByName") continue;
        if (k === "legalChecklist") {
          const before = JSON.stringify((current as any)[k] ?? null);
          const after = JSON.stringify(data[k] ?? null);
          if (before !== after) changes.push({ field: k, label: FIELD_LABELS[k] ?? k, before: null, after: null });
          continue;
        }
        const before = (current as any)[k] ?? null;
        const after = data[k] ?? null;
        if (before !== after) changes.push({ field: k, label: FIELD_LABELS[k] ?? k, before, after });
      }

      const updated = await prisma.businessPlan.update({ where: { id: "main" }, data });
      if (changes.length) {
        await prisma.businessPlanHistory.create({ data: { changedByName: req.body?.updatedByName || null, changes: changes as any } });
      }
      res.json(updated);
    } catch (e) { fail(res, e); }
  });

  app.get("/api/business-plan/history", async (_req, res) => {
    try {
      res.json(await prisma.businessPlanHistory.findMany({ orderBy: { changedAt: "desc" }, take: 100 }));
    } catch (e) { fail(res, e); }
  });

  // ── Metas (da empresa ou de um sócio) ───────────────────────────────────────
  app.get("/api/business-goals", async (req, res) => {
    try {
      const where: any = {};
      if (req.query.partnerId) where.partnerId = String(req.query.partnerId);
      if (req.query.scope) where.scope = String(req.query.scope);
      res.json(await prisma.businessGoal.findMany({
        where, orderBy: [{ status: "asc" }, { targetDate: "asc" }],
        include: { partner: { select: { id: true, name: true, color: true } } },
      }));
    } catch (e) { fail(res, e); }
  });

  app.post("/api/business-goals", async (req, res) => {
    try {
      const title = String(req.body?.title ?? "").trim();
      if (!title) return fail(res, new Error("Informe o título da meta."), 400);
      const scope = req.body?.scope === "partner" ? "partner" : "company";
      res.json(await prisma.businessGoal.create({
        data: {
          title,
          description: req.body?.description || null,
          scope,
          partnerId: scope === "partner" ? (req.body?.partnerId || null) : null,
          targetDate: req.body?.targetDate ? new Date(req.body.targetDate) : null,
          status: req.body?.status || "in_progress",
          progress: Number(req.body?.progress) || 0,
        },
        include: { partner: { select: { id: true, name: true, color: true } } },
      }));
    } catch (e) { fail(res, e); }
  });

  app.patch("/api/business-goals/:id", async (req, res) => {
    try {
      const { targetDate, ...rest } = req.body ?? {};
      const data: any = { ...rest };
      if (targetDate !== undefined) data.targetDate = targetDate ? new Date(targetDate) : null;
      if (data.progress !== undefined) data.progress = Number(data.progress) || 0;
      res.json(await prisma.businessGoal.update({
        where: { id: req.params.id }, data,
        include: { partner: { select: { id: true, name: true, color: true } } },
      }));
    } catch (e) { fail(res, e); }
  });

  app.delete("/api/business-goals/:id", async (req, res) => {
    try { await prisma.businessGoal.delete({ where: { id: req.params.id } }); res.json({ ok: true }); } catch (e) { fail(res, e); }
  });

  // ── Conquistas ───────────────────────────────────────────────────────────────
  app.get("/api/achievements", async (_req, res) => {
    try { res.json(await prisma.achievement.findMany({ orderBy: { achievedAt: "desc" } })); } catch (e) { fail(res, e); }
  });

  app.post("/api/achievements", async (req, res) => {
    try {
      const title = String(req.body?.title ?? "").trim();
      if (!title) return fail(res, new Error("Informe o título da conquista."), 400);
      res.json(await prisma.achievement.create({
        data: { title, description: req.body?.description || null, achievedAt: req.body?.achievedAt ? new Date(req.body.achievedAt) : new Date() },
      }));
    } catch (e) { fail(res, e); }
  });

  app.patch("/api/achievements/:id", async (req, res) => {
    try {
      const { achievedAt, ...rest } = req.body ?? {};
      const data: any = { ...rest };
      if (achievedAt !== undefined) data.achievedAt = new Date(achievedAt);
      res.json(await prisma.achievement.update({ where: { id: req.params.id }, data }));
    } catch (e) { fail(res, e); }
  });

  app.delete("/api/achievements/:id", async (req, res) => {
    try { await prisma.achievement.delete({ where: { id: req.params.id } }); res.json({ ok: true }); } catch (e) { fail(res, e); }
  });

  // ── Avaliação dos sócios ─────────────────────────────────────────────────────
  app.get("/api/partner-evaluations", async (req, res) => {
    try {
      const where: any = {};
      if (req.query.partnerId) where.partnerId = String(req.query.partnerId);
      res.json(await prisma.partnerEvaluation.findMany({
        where, orderBy: { createdAt: "desc" },
        include: { partner: { select: { id: true, name: true, color: true, role: true } } },
      }));
    } catch (e) { fail(res, e); }
  });

  app.post("/api/partner-evaluations", async (req, res) => {
    try {
      const partnerId = String(req.body?.partnerId ?? "");
      const period = String(req.body?.period ?? "").trim();
      if (!partnerId) return fail(res, new Error("Selecione o sócio."), 400);
      if (!period) return fail(res, new Error("Informe o período da avaliação (ex: 2026-T4)."), 400);
      res.json(await prisma.partnerEvaluation.create({
        data: {
          partnerId, period,
          score: req.body?.score !== undefined && req.body?.score !== null ? Number(req.body.score) : null,
          strengths: req.body?.strengths || null,
          improvements: req.body?.improvements || null,
          goalsNextPeriod: req.body?.goalsNextPeriod || null,
          evaluatedByName: req.body?.evaluatedByName || null,
        },
        include: { partner: { select: { id: true, name: true, color: true, role: true } } },
      }));
    } catch (e) { fail(res, e); }
  });

  app.patch("/api/partner-evaluations/:id", async (req, res) => {
    try {
      const allowed = ["period", "score", "strengths", "improvements", "goalsNextPeriod", "evaluatedByName"];
      const data: any = {};
      for (const k of allowed) if (k in (req.body ?? {})) data[k] = req.body[k];
      res.json(await prisma.partnerEvaluation.update({
        where: { id: req.params.id }, data,
        include: { partner: { select: { id: true, name: true, color: true, role: true } } },
      }));
    } catch (e) { fail(res, e); }
  });

  app.delete("/api/partner-evaluations/:id", async (req, res) => {
    try { await prisma.partnerEvaluation.delete({ where: { id: req.params.id } }); res.json({ ok: true }); } catch (e) { fail(res, e); }
  });
}
