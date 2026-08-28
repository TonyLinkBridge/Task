const malaysiaDateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kuala_Lumpur",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function toMalaysiaDateKey(utcIso: string): string {
  return malaysiaDateKeyFormatter.format(new Date(utcIso));
}

export const malaysiaDateTimeFormatter = new Intl.DateTimeFormat("zh-MY", {
  timeZone: "Asia/Kuala_Lumpur",
  dateStyle: "medium",
  timeStyle: "short",
});
