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

  const goalInclude = { partner: { select: { id: true, name: true, color: true } } };
  const toDate = (v: any) => (v ? new Date(v) : null);
  const num = (v: any) => (v === "" || v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v));
  const jsonList = (v: any) => (Array.isArray(v) ? v : []);
  const uid = () => Math.random().toString(36).slice(2, 10);

  // progresso calculado: pelo indicador (valor atual entre o de partida e a meta) ou pelos passos concluídos
  const autoProgress = (g: { startValue?: number | null; currentValue?: number | null; targetValue?: number | null; steps?: any }, fallback: number) => {
    if (g.targetValue != null && g.currentValue != null) {
      const from = g.startValue ?? 0, span = g.targetValue - from;
      if (span !== 0) return Math.max(0, Math.min(100, Math.round(((g.currentValue - from) / span) * 100)));
    }
    const steps = jsonList(g.steps);
    if (steps.length) return Math.round((steps.filter((x: any) => x.done).length / steps.length) * 100);
    return fallback;
  };
  const logEntry = (by: string | null | undefined, text: string, extra: Record<string, any> = {}) => ({ id: uid(), at: new Date().toISOString(), by: by || null, text, ...extra });

  app.post("/api/business-goals", async (req, res) => {
    try {
      const b = req.body ?? {};
      const title = String(b.title ?? "").trim();
      if (!title) return fail(res, new Error("Informe o título da meta."), 400);
      const scope = b.scope === "partner" ? "partner" : "company";
      const base = { startValue: num(b.startValue), currentValue: num(b.currentValue), targetValue: num(b.targetValue), steps: jsonList(b.steps) };
      const status = ["not_started", "in_progress", "done", "at_risk"].includes(b.status) ? b.status : "not_started";
      const progress = status === "done" ? 100 : autoProgress(base, Number(b.progress) || 0);
      res.json(await prisma.businessGoal.create({
        data: {
          title, description: b.description || null, scope, partnerId: scope === "partner" ? (b.partnerId || null) : null,
          targetDate: toDate(b.targetDate), startDate: toDate(b.startDate) ?? (status === "in_progress" ? new Date() : null),
          status, progress, priority: ["low", "medium", "high"].includes(b.priority) ? b.priority : "medium",
          category: b.category || null, metricLabel: b.metricLabel || null, metricUnit: b.metricUnit || null, ...base,
          updates: [logEntry(b.byName, "Meta criada", { progress })],
          completedAt: status === "done" ? new Date() : null,
        },
        include: goalInclude,
      }));
    } catch (e) { fail(res, e); }
  });

  app.patch("/api/business-goals/:id", async (req, res) => {
    try {
      const { targetDate, startDate, byName, ...rest } = req.body ?? {};
      const data: any = { ...rest };
      delete data.id; delete data.partner; delete data.updates; delete data.createdAt; delete data.updatedAt; delete data.completedAt;
      if (targetDate !== undefined) data.targetDate = toDate(targetDate);
      if (startDate !== undefined) data.startDate = toDate(startDate);
      for (const k of ["startValue", "currentValue", "targetValue"]) if (k in data) data[k] = num(data[k]);
      if ("steps" in data) data.steps = jsonList(data.steps);
      if (data.progress !== undefined) data.progress = Math.max(0, Math.min(100, Number(data.progress) || 0));
      const before = await prisma.businessGoal.findUnique({ where: { id: req.params.id } });
      if (!before) return fail(res, new Error("Meta não encontrada."), 404);
      // se mexeu em indicador ou passos e não mandou o progresso, recalcula
      if (data.progress === undefined && ("currentValue" in data || "targetValue" in data || "startValue" in data || "steps" in data)) {
        data.progress = autoProgress({ ...before, ...data }, before.progress);
      }
      if (data.status && data.status !== before.status) {
        if (data.status === "done") { data.progress = 100; data.completedAt = new Date(); }
        else if (before.status === "done") data.completedAt = null;
        if (data.status === "in_progress" && !before.startDate && !data.startDate) data.startDate = new Date();
        const labels: any = { not_started: "Não começou", in_progress: "Em andamento", done: "Concluída", at_risk: "Em risco" };
        data.updates = [...jsonList(before.updates), logEntry(byName, `Situação: ${labels[before.status] ?? before.status} para ${labels[data.status]}`, { progress: data.progress ?? before.progress, status: data.status })];
      }
      res.json(await prisma.businessGoal.update({ where: { id: req.params.id }, data, include: goalInclude }));
    } catch (e) { fail(res, e); }
  });

  // iniciar: a meta passa a "em andamento" e registra a data de início
  app.post("/api/business-goals/:id/start", async (req, res) => {
    try {
      const g = await prisma.businessGoal.findUnique({ where: { id: req.params.id } });
      if (!g) return fail(res, new Error("Meta não encontrada."), 404);
      res.json(await prisma.businessGoal.update({
        where: { id: g.id }, include: goalInclude,
        data: { status: "in_progress", startDate: g.startDate ?? new Date(), updates: [...jsonList(g.updates), logEntry(req.body?.byName, "Meta iniciada", { progress: g.progress, status: "in_progress" })] },
      }));
    } catch (e) { fail(res, e); }
  });

  // registrar uma atualização: texto, novo valor do indicador e/ou novo progresso, e (opcional) nova situação
  app.post("/api/business-goals/:id/update", async (req, res) => {
    try {
      const g = await prisma.businessGoal.findUnique({ where: { id: req.params.id } });
      if (!g) return fail(res, new Error("Meta não encontrada."), 404);
      const b = req.body ?? {};
      const data: any = {};
      const value = num(b.currentValue);
      if (value !== null) data.currentValue = value;
      let progress = b.progress !== undefined && b.progress !== "" ? Math.max(0, Math.min(100, Number(b.progress) || 0)) : null;
      if (progress === null && value !== null) progress = autoProgress({ ...g, currentValue: value }, g.progress);
      if (progress !== null) data.progress = progress;
      let status = ["not_started", "in_progress", "done", "at_risk"].includes(b.status) ? b.status : g.status;
      if (status === "not_started" && (progress ?? g.progress) > 0) status = "in_progress";
      if (status !== g.status) {
        if (status === "done") { data.progress = 100; data.completedAt = new Date(); }
        if (status === "in_progress" && !g.startDate) data.startDate = new Date();
        data.status = status;
      }
      if (!g.startDate && status !== "not_started") data.startDate = new Date();
      const text = String(b.text ?? "").trim() || (value !== null ? `Indicador atualizado para ${value}` : "Atualização");
      data.updates = [...jsonList(g.updates), logEntry(b.byName, text, { progress: data.progress ?? g.progress, value, status })];
      res.json(await prisma.businessGoal.update({ where: { id: g.id }, data, include: goalInclude }));
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
        data: {
          title,
          description: req.body?.description || null,
          photoUrl: req.body?.photoUrl || null,
          achievedAt: req.body?.achievedAt ? new Date(req.body.achievedAt) : new Date(),
        },
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

  // Clientes novos e contatos feitos, mês a mês (últimos 12 meses) — para o gráfico da aba Conquistas
  app.get("/api/achievements/monthly-stats", async (_req, res) => {
    try {
      const [clients, outreach] = await Promise.all([
        prisma.client.findMany({ select: { createdAt: true } }),
        prisma.outreachLog.findMany({ select: { createdAt: true } }),
      ]);
      const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const now = new Date();
      const months: string[] = [];
      for (let i = 11; i >= 0; i--) months.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));

      const count = (rows: { createdAt: Date }[]) => {
        const m: Record<string, number> = {};
        for (const r of rows) { const k = monthKey(new Date(r.createdAt)); m[k] = (m[k] ?? 0) + 1; }
        return m;
      };
      const clientsByMonth = count(clients);
      const contactsByMonth = count(outreach);

      res.json(months.map(m => ({
        month: m,
        newClients: clientsByMonth[m] ?? 0,
        contacts: contactsByMonth[m] ?? 0,
      })));
    } catch (e) { fail(res, e); }
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
