// Avisos internos da equipe por WhatsApp: resumo diário de contas a pagar / a receber
// e lembrete de reunião 24h antes. Também registra as rotas de destinatários e reuniões.
import type { Express } from "express";
import { prisma } from "./db.js";
import { getSessionInfo, sendMessage } from "./wa.js";
import { brtParts, brtTodayUtc, daysFromToday, fmtDueDate, fmtDateTimeBrt, DAY_MS } from "./time.js";


const DIGEST_FROM_HOUR = 9;   // resumos a partir das 9h (Brasília)
const SEND_UNTIL_HOUR = 19;
const MEETING_FROM_HOUR = 7;  // lembretes de reunião entre 7h e 22h
const MEETING_UNTIL_HOUR = 22;
const CHECK_EVERY_MS = 10 * 60 * 1000;
const GAP_MS = 4000;
const MAX_LINES = 10;

const money = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const digits = (v: string) => String(v || "").replace(/\D/g, "");
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export interface TeamNoticeResult { recipient: string; kind: "payables" | "receivables" | "meeting" | "birthdays"; sent: boolean; detail?: string }

function lines(items: string[]) {
  const shown = items.slice(0, MAX_LINES);
  return shown.join("\n") + (items.length > MAX_LINES ? `\n… e mais ${items.length - MAX_LINES}` : "");
}

// ─── Resumos ─────────────────────────────────────────────────────────────────

async function buildPayablesDigest(): Promise<string | null> {
  const limit = new Date(brtTodayUtc().getTime() + 2 * DAY_MS); // atrasadas, hoje e amanhã
  const rows = await prisma.payable.findMany({
    where: {
      status: { not: "paid" },
      dueDate: { not: null, lt: limit },
      NOT: { parentId: null, recurrence: { not: "none" } }, // ignora a linha-mãe de séries
    },
    include: { payments: true },
    orderBy: { dueDate: "asc" },
  });
  const open = rows
    .map(p => ({ p, left: Math.max(0, p.amount - p.payments.reduce((a, x) => a + x.amount, 0)), days: daysFromToday(p.dueDate as Date) }))
    .filter(x => x.left > 0);
  if (!open.length) return null;

  const section = (title: string, list: typeof open, withDate: boolean) =>
    list.length
      ? `${title} (${list.length}):\n${lines(list.map(x => `• ${x.p.description} — ${money(x.left)}${withDate ? ` (venceu ${fmtDueDate(x.p.dueDate as Date)})` : ""}`))}`
      : null;

  const total = open.reduce((a, x) => a + x.left, 0);
  return [
    `💸 *Contas a pagar* — resumo do dia`,
    section("🔴 *Atrasadas*", open.filter(x => x.days < 0), true),
    section("🟠 *Vencem hoje*", open.filter(x => x.days === 0), false),
    section("🟡 *Vencem amanhã*", open.filter(x => x.days === 1), false),
    `*Total em aberto:* ${money(total)}`,
  ].filter(Boolean).join("\n\n");
}

async function buildReceivablesDigest(): Promise<string | null> {
  const limit = new Date(brtTodayUtc().getTime() + 2 * DAY_MS);
  const [clients, manual] = await Promise.all([
    prisma.client.findMany({
      where: { status: { not: "cancelled" }, nextDueDate: { not: null, lt: limit } },
      orderBy: { nextDueDate: "asc" },
    }),
    prisma.receivable.findMany({ where: { status: "pending", dueDate: { lt: limit } }, orderBy: { dueDate: "asc" } }),
  ]);
  // assinaturas de clientes e contas avulsas na mesma lista
  const items = [
    ...clients.map(c => ({ label: `${c.name}${c.status === "paused" ? " — bloqueado" : ""}`, value: c.billingValue || 0, due: c.nextDueDate as Date })),
    ...manual.map(r => ({ label: r.payerName ? `${r.description} (${r.payerName})` : r.description, value: r.amount, due: r.dueDate })),
  ].map(x => ({ ...x, days: daysFromToday(x.due) }));
  if (!items.length) return null;

  const section = (title: string, list: typeof items, withDate: boolean) =>
    list.length
      ? `${title} (${list.length}):\n${lines(list.map(x => `• ${x.label} — ${money(x.value)}${withDate ? ` (venceu ${fmtDueDate(x.due)})` : ""}`))}`
      : null;

  const total = items.reduce((a, x) => a + x.value, 0);
  return [
    `💰 *Contas a receber* — resumo do dia`,
    section("🔴 *Atrasados*", items.filter(x => x.days < 0), true),
    section("🟠 *Vencem hoje*", items.filter(x => x.days === 0), false),
    section("🟡 *Vencem amanhã*", items.filter(x => x.days === 1), false),
    `*Total a receber:* ${money(total)}`,
  ].filter(Boolean).join("\n\n");
}

async function buildBirthdaysDigest(): Promise<string | null> {
  const { month: tm, day: td } = brtParts();
  const tomorrow = new Date(brtTodayUtc().getTime() + DAY_MS);
  const tmw = tomorrow.getUTCMonth() + 1, tdw = tomorrow.getUTCDate();
  const match = (b: Date | null, m: number, d: number) => !!b && b.getUTCMonth() + 1 === m && b.getUTCDate() === d;

  const [clients, partners] = await Promise.all([
    prisma.client.findMany({ where: { birthDate: { not: null }, status: { not: "cancelled" } }, select: { name: true, birthDate: true } }),
    prisma.partner.findMany({ where: { birthDate: { not: null }, active: true }, select: { name: true, birthDate: true } }),
  ]);
  const listFor = (m: number, d: number) => [
    ...clients.filter(c => match(c.birthDate, m, d)).map(c => `• ${c.name} (cliente)`),
    ...partners.filter(p => match(p.birthDate, m, d)).map(p => `• ${p.name} (sócio)`),
  ];
  const today = listFor(tm, td);
  const tomorrowList = listFor(tmw, tdw);
  if (!today.length && !tomorrowList.length) return null;

  return [
    `🎂 *Aniversários*`,
    today.length ? `🎉 *Hoje:*\n${lines(today)}` : null,
    tomorrowList.length ? `🔔 *Amanhã:*\n${lines(tomorrowList)}` : null,
  ].filter(Boolean).join("\n\n");
}

function meetingMessage(m: { title: string; startsAt: Date; location: string | null; notes: string | null; attendees: { recipient: { name: string } }[] }) {
  const hoursLeft = Math.max(0, Math.round((m.startsAt.getTime() - Date.now()) / 3_600_000));
  const when = hoursLeft >= 20 ? "amanhã" : hoursLeft <= 1 ? "em breve" : `em ${hoursLeft}h`;
  return [
    `📅 *Lembrete de reunião* — ${when}`,
    `*${m.title}*`,
    `🕒 ${fmtDateTimeBrt(m.startsAt)}`,
    m.location ? `📍 ${m.location}` : null,
    m.attendees.length ? `👥 ${m.attendees.map(a => a.recipient.name).join(", ")}` : null,
    m.notes ? `📝 ${m.notes}` : null,
  ].filter(Boolean).join("\n");
}

// ─── Execução ────────────────────────────────────────────────────────────────

export async function runTeamNotices(opts: { dryRun?: boolean; ignoreHours?: boolean } = {}): Promise<TeamNoticeResult[]> {
  const results: TeamNoticeResult[] = [];
  const dryRun = !!opts.dryRun;
  if (!dryRun && getSessionInfo().status !== "connected") return results;

  const { hour, dateKey } = brtParts();
  const inDigestWindow = opts.ignoreHours || (hour >= DIGEST_FROM_HOUR && hour < SEND_UNTIL_HOUR);
  const inMeetingWindow = opts.ignoreHours || (hour >= MEETING_FROM_HOUR && hour < MEETING_UNTIL_HOUR);

  const recipients = await prisma.teamRecipient.findMany({ where: { active: true } });

  // 1) resumos diários
  if (inDigestWindow) {
    const [payables, receivables, birthdays] = await Promise.all([buildPayablesDigest(), buildReceivablesDigest(), buildBirthdaysDigest()]);
    for (const r of recipients) {
      for (const [kind, flag, text] of [
        ["payables", r.notifyPayables, payables],
        ["receivables", r.notifyReceivables, receivables],
        ["birthdays", r.notifyBirthdays, birthdays],
      ] as const) {
        if (!flag || !text) continue;
        const key = `${kind}:${r.id}:${dateKey}`;
        if (await prisma.teamNoticeLog.findUnique({ where: { key } })) continue;
        const entry: TeamNoticeResult = { recipient: r.name, kind, sent: false };
        results.push(entry);
        if (dryRun) continue;
        if (await sendMessage(r.phone, text)) {
          await prisma.teamNoticeLog.create({ data: { key } });
          entry.sent = true;
          await sleep(GAP_MS);
        } else entry.detail = "falha no envio";
      }
    }
  }

  // 2) reuniões: lembrete quando faltam 24h ou menos
  if (inMeetingWindow) {
    const now = new Date();
    const meetings = await prisma.meeting.findMany({
      where: { reminderSentAt: null, startsAt: { gt: now, lte: new Date(now.getTime() + DAY_MS) } },
      include: { attendees: { include: { recipient: true } } },
    });
    for (const m of meetings) {
      const targets = m.attendees.map(a => a.recipient).filter(r => r.active && r.notifyMeetings);
      let okAny = targets.length === 0; // sem ninguém para avisar: marca como tratado
      for (const r of targets) {
        const entry: TeamNoticeResult = { recipient: r.name, kind: "meeting", sent: false, detail: m.title };
        results.push(entry);
        if (dryRun) continue;
        if (await sendMessage(r.phone, meetingMessage(m))) { entry.sent = true; okAny = true; await sleep(GAP_MS); }
        else entry.detail = `${m.title}: falha no envio`;
      }
      if (!dryRun && okAny) await prisma.meeting.update({ where: { id: m.id }, data: { reminderSentAt: new Date() } });
    }
  }
  return results;
}

export function startTeamNoticeScheduler() {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const r = await runTeamNotices();
      const sent = r.filter(x => x.sent).length;
      if (sent) console.log(`[avisos da equipe] ${sent} mensagem(ns) enviada(s)`);
    } catch (e) {
      console.error("[avisos da equipe] erro:", e);
    } finally { running = false; }
  };
  setInterval(tick, CHECK_EVERY_MS);
  setTimeout(tick, 90 * 1000);
}

// ─── Rotas ───────────────────────────────────────────────────────────────────

export function registerTeamNoticeRoutes(app: Express) {
  const fail = (res: any, e: any) => res.status(500).json({ error: e.message });
  const recipientData = (b: any) => ({
    ...(b.name !== undefined && { name: String(b.name).trim() }),
    ...(b.phone !== undefined && { phone: digits(b.phone) }),
    ...(b.userId !== undefined && { userId: b.userId || null }),
    ...(b.notifyPayables !== undefined && { notifyPayables: !!b.notifyPayables }),
    ...(b.notifyReceivables !== undefined && { notifyReceivables: !!b.notifyReceivables }),
    ...(b.notifyMeetings !== undefined && { notifyMeetings: !!b.notifyMeetings }),
    ...(b.notifyBirthdays !== undefined && { notifyBirthdays: !!b.notifyBirthdays }),
    ...(b.active !== undefined && { active: !!b.active }),
  });

  // Destinatários
  app.get("/api/team-notices/recipients", async (_req, res) => {
    try { res.json(await prisma.teamRecipient.findMany({ orderBy: { createdAt: "asc" } })); } catch (e) { fail(res, e); }
  });
  app.post("/api/team-notices/recipients", async (req, res) => {
    try {
      const data = recipientData(req.body) as any;
      if (!data.name || !data.phone || data.phone.length < 10) return res.status(400).json({ error: "Informe nome e WhatsApp com DDD." });
      res.json(await prisma.teamRecipient.create({ data }));
    } catch (e) { fail(res, e); }
  });
  app.patch("/api/team-notices/recipients/:id", async (req, res) => {
    try {
      const data = recipientData(req.body) as any;
      if (data.phone !== undefined && data.phone.length < 10) return res.status(400).json({ error: "WhatsApp inválido." });
      res.json(await prisma.teamRecipient.update({ where: { id: req.params.id }, data }));
    } catch (e) { fail(res, e); }
  });
  app.delete("/api/team-notices/recipients/:id", async (req, res) => {
    try { await prisma.teamRecipient.delete({ where: { id: req.params.id } }); res.json({ success: true }); } catch (e) { fail(res, e); }
  });
  app.post("/api/team-notices/recipients/:id/test", async (req, res) => {
    try {
      const r = await prisma.teamRecipient.findUnique({ where: { id: req.params.id } });
      if (!r) return res.status(404).json({ error: "Destinatário não encontrado." });
      const ok = await sendMessage(r.phone, `✅ *Teste de aviso*\nOlá, ${r.name.split(" ")[0]}! Você vai receber por aqui os avisos de contas a pagar, contas a receber e reuniões que ativou.`);
      if (!ok) return res.status(503).json({ error: "WhatsApp desconectado. Conecte o bot e tente de novo." });
      res.json({ success: true });
    } catch (e) { fail(res, e); }
  });

  // Dispara agora (dryRun=1 só simula)
  app.post("/api/team-notices/run", async (req, res) => {
    try { res.json(await runTeamNotices({ dryRun: req.query.dryRun === "1", ignoreHours: true })); } catch (e) { fail(res, e); }
  });

  // Reuniões
  const meetingInclude = { attendees: { include: { recipient: { select: { id: true, name: true, phone: true } } } } };

  app.get("/api/meetings", async (_req, res) => {
    try { res.json(await prisma.meeting.findMany({ orderBy: { startsAt: "asc" }, include: meetingInclude })); } catch (e) { fail(res, e); }
  });
  app.post("/api/meetings", async (req, res) => {
    try {
      const { title, startsAt, location, notes, attendeeIds, createdById, createdByName } = req.body;
      if (!title?.trim() || !startsAt || Number.isNaN(new Date(startsAt).getTime())) return res.status(400).json({ error: "Informe o título e a data da reunião." });
      const ids: string[] = Array.isArray(attendeeIds) ? attendeeIds : [];
      const meeting = await prisma.meeting.create({
        data: {
          title: title.trim(), startsAt: new Date(startsAt), location: location?.trim() || null, notes: notes?.trim() || null,
          createdById, createdByName,
          attendees: { create: ids.map(recipientId => ({ recipientId })) },
        },
        include: meetingInclude,
      });
      res.json(meeting);
    } catch (e) { fail(res, e); }
  });
  app.patch("/api/meetings/:id", async (req, res) => {
    try {
      const { title, startsAt, location, notes, attendeeIds } = req.body;
      const current = await prisma.meeting.findUnique({ where: { id: req.params.id } });
      if (!current) return res.status(404).json({ error: "Reunião não encontrada." });
      const newStart = startsAt ? new Date(startsAt) : current.startsAt;
      const rescheduled = newStart.getTime() !== current.startsAt.getTime();
      await prisma.$transaction(async tx => {
        await tx.meeting.update({
          where: { id: current.id },
          data: {
            ...(title !== undefined && { title: String(title).trim() }),
            startsAt: newStart,
            ...(location !== undefined && { location: location?.trim() || null }),
            ...(notes !== undefined && { notes: notes?.trim() || null }),
            ...(rescheduled && { reminderSentAt: null }), // remarcou: avisa de novo 24h antes
          },
        });
        if (Array.isArray(attendeeIds)) {
          await tx.meetingAttendee.deleteMany({ where: { meetingId: current.id } });
          await tx.meetingAttendee.createMany({ data: attendeeIds.map((recipientId: string) => ({ meetingId: current.id, recipientId })) });
        }
      });
      res.json(await prisma.meeting.findUnique({ where: { id: current.id }, include: meetingInclude }));
    } catch (e) { fail(res, e); }
  });
  app.delete("/api/meetings/:id", async (req, res) => {
    try { await prisma.meeting.delete({ where: { id: req.params.id } }); res.json({ success: true }); } catch (e) { fail(res, e); }
  });
}
