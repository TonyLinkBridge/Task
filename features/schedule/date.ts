const malaysiaDateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kuala_Lumpur",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function toMalaysiaDateKey(utcIso: string): string {
  return malaysiaDateKeyFormatter.format(new Date(utcIso));
}

function parseMonthKey(monthKey: string): { year: number; monthIndex: number } {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(monthKey);
  if (!match) throw new Error("CALENDAR_MONTH_INVALID");
  return { year: Number(match[1]), monthIndex: Number(match[2]) - 1 };
}

function utcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function calendarMonthDays(monthKey: string): string[] {
  const { year, monthIndex } = parseMonthKey(monthKey);
  const firstDay = new Date(Date.UTC(year, monthIndex, 1));
  const daysSinceMonday = (firstDay.getUTCDay() + 6) % 7;
  const gridStart = new Date(Date.UTC(year, monthIndex, 1 - daysSinceMonday));

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setUTCDate(gridStart.getUTCDate() + index);
    return utcDateKey(date);
  });
}

export function moveCalendarMonth(monthKey: string, difference: number): string {
  const { year, monthIndex } = parseMonthKey(monthKey);
  const date = new Date(Date.UTC(year, monthIndex + difference, 1));
  return date.toISOString().slice(0, 7);
}

export const malaysiaDateTimeFormatter = new Intl.DateTimeFormat("zh-MY", {
  timeZone: "Asia/Kuala_Lumpur",
  dateStyle: "medium",
  timeStyle: "short",
});
