"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  calendarMonthDays,
  moveCalendarMonth,
  toMalaysiaDateKey,
} from "@/features/schedule/date";
import type { ScheduledContent } from "@/features/schedule/types";

const dateFormatter = new Intl.DateTimeFormat("zh-MY", {
  timeZone: "Asia/Kuala_Lumpur",
  year: "numeric",
  month: "long",
  day: "numeric",
});
const timeFormatter = new Intl.DateTimeFormat("zh-MY", {
  timeZone: "Asia/Kuala_Lumpur",
  hour: "2-digit",
  minute: "2-digit",
});

const weekDays = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"];

function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  return `${year}年${Number(month)}月`;
}

function dateLabel(dateKey: string): string {
  return dateFormatter.format(new Date(`${dateKey}T00:00:00+08:00`));
}

export function ContentCalendar({
  contents,
  initialMonth,
}: {
  contents: ScheduledContent[];
  initialMonth?: string;
}) {
  const todayKey = toMalaysiaDateKey(new Date().toISOString());
  const [month, setMonth] = useState(initialMonth ?? todayKey.slice(0, 7));
  const days = useMemo(() => calendarMonthDays(month), [month]);
  const grouped = useMemo(() => {
    const result = new Map<string, ScheduledContent[]>();
    for (const content of [...contents].sort((left, right) =>
      left.publishAt.localeCompare(right.publishAt)
    )) {
      const key = toMalaysiaDateKey(content.publishAt);
      result.set(key, [...(result.get(key) ?? []), content]);
    }
    return result;
  }, [contents]);
  const visibleCount = days.reduce(
    (count, day) => count + (grouped.get(day)?.length ?? 0),
    0
  );

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <h2 className="text-lg font-semibold">{monthLabel(month)}</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setMonth(moveCalendarMonth(month, -1))}>
            上个月
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMonth(todayKey.slice(0, 7))}>
            今天
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMonth(moveCalendarMonth(month, 1))}>
            下个月
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[980px] p-3">
          <div className="grid grid-cols-7 border-x border-t bg-muted/40" role="row">
            {weekDays.map((day) => (
              <div key={day} role="columnheader" className="border-b border-r px-3 py-2 text-center text-xs font-medium text-muted-foreground last:border-r-0">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 border-l" role="grid" aria-label={`${monthLabel(month)}内容排期`}>
            {days.map((dateKey) => {
              const items = grouped.get(dateKey) ?? [];
              const isCurrentMonth = dateKey.startsWith(month);
              const isToday = dateKey === todayKey;
              return (
                <section
                  key={dateKey}
                  role="gridcell"
                  aria-label={dateLabel(dateKey)}
                  className={`min-h-36 border-b border-r p-2 ${
                    isCurrentMonth ? "bg-background" : "bg-muted/20 text-muted-foreground"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className={`flex size-7 items-center justify-center rounded-full text-xs font-medium ${
                      isToday ? "bg-primary text-primary-foreground" : ""
                    }`}>
                      {Number(dateKey.slice(-2))}
                    </span>
                    {items.length > 0 ? (
                      <span className="text-[11px] text-muted-foreground">{items.length} 项</span>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    {items.map((content) => (
                      <Link
                        key={content.id}
                        href={`/content/${content.id}`}
                        className="block rounded-md border border-l-4 bg-card px-2 py-1.5 shadow-xs transition-colors hover:bg-muted/60"
                        style={{ borderLeftColor: content.platforms[0]?.color }}
                      >
                        <div className="flex items-start gap-2">
                          <time className="shrink-0 text-[11px] text-muted-foreground">
                            {timeFormatter.format(new Date(content.publishAt))}
                          </time>
                          <p className="min-w-0 truncate text-xs font-medium">{content.title}</p>
                        </div>
                        {content.platforms.length > 0 ? (
                          <div className="mt-1 flex min-w-0 gap-1 overflow-hidden">
                            {content.platforms.map((platform) => (
                              <Badge
                                key={platform.id}
                                variant="outline"
                                className="h-4 max-w-full px-1.5 text-[10px]"
                                style={{ borderColor: platform.color, color: platform.color }}
                              >
                                <span className="truncate">{platform.name}</span>
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>

      {visibleCount === 0 ? (
        <p className="border-t px-4 py-5 text-center text-sm text-muted-foreground">
          这个月份暂时没有排期内容
        </p>
      ) : null}
    </div>
  );
}
