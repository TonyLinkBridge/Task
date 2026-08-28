import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { toMalaysiaDateKey } from "@/features/schedule/date";
import type { ScheduledContent } from "@/features/schedule/types";

const dayFormatter = new Intl.DateTimeFormat("zh-MY", {
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

export function ContentCalendar({ contents }: { contents: ScheduledContent[] }) {
  const grouped = new Map<string, ScheduledContent[]>();
  for (const content of contents) {
    const key = toMalaysiaDateKey(content.publishAt);
    grouped.set(key, [...(grouped.get(key) ?? []), content]);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {[...grouped.entries()].map(([dateKey, items]) => (
        <section key={dateKey} className="rounded-xl border bg-card p-4">
          <h2 className="font-medium">
            {dayFormatter.format(new Date(`${dateKey}T00:00:00+08:00`))}
          </h2>
          <div className="mt-3 space-y-2">
            {items.map((content) => (
              <Link
                key={content.id}
                href={`/content/${content.id}`}
                className="block rounded-lg border bg-background p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium">{content.title}</p>
                  <time className="shrink-0 text-xs text-muted-foreground">
                    {timeFormatter.format(new Date(content.publishAt))}
                  </time>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {content.platforms.map((platform) => (
                    <Badge key={platform.id} variant="outline">
                      {platform.name}
                    </Badge>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
      {contents.length === 0 ? (
        <p className="col-span-full rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          这个筛选暂时没有内容
        </p>
      ) : null}
    </div>
  );
}
