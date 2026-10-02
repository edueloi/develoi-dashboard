// Horário de Brasília independente do fuso do servidor (a VPS costuma rodar em UTC)
export const TZ = "America/Sao_Paulo";

export function brtParts(date: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false,
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find(p => p.type === t)?.value);
  const y = get("year"), m = get("month"), d = get("day");
  return {
    year: y, month: m, day: d,
    hour: get("hour") % 24, // algumas versões devolvem "24" à meia-noite
    dateKey: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
  };
}

// Meia-noite UTC do dia de hoje em Brasília (mesmo formato das datas de vencimento guardadas no banco)
export function brtTodayUtc(date: Date = new Date()): Date {
  const { year, month, day } = brtParts(date);
  return new Date(Date.UTC(year, month - 1, day));
}

export const DAY_MS = 24 * 60 * 60 * 1000;

// Dias entre hoje (Brasília) e uma data de vencimento guardada como meia-noite UTC
export function daysFromToday(dueUtc: Date, date: Date = new Date()): number {
  return Math.round((dueUtc.getTime() - brtTodayUtc(date).getTime()) / DAY_MS);
}

export const fmtDueDate = (d: Date) =>
  d.toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit" });

export const fmtDateTimeBrt = (d: Date) =>
  d.toLocaleString("pt-BR", { timeZone: TZ, weekday: "long", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
