import type { ContentReviewEventView } from "@/features/approval/types";

const labels = {
  submitted: "提交检查",
  approved: "批准内容",
  changes_requested: "要求修改",
  resubmitted: "修改后重新提交",
  approval_invalidated: "旧批准已经取消",
  published: "确认已经发布",
  archived: "收起内容",
} as const;

const timeFormatter = new Intl.DateTimeFormat("zh-MY", {
  timeZone: "Asia/Kuala_Lumpur",
  dateStyle: "medium",
  timeStyle: "short",
});

export function ReviewHistory({ events }: { events: ContentReviewEventView[] }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-medium">修改与审核记录</h2>
      <div className="mt-4 space-y-3">
        {events.map((event) => (
          <article key={event.id} className="rounded-lg bg-muted/50 px-3 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">
                {event.actorName} · {labels[event.eventType]}
              </p>
              <time className="text-xs text-muted-foreground">
                {timeFormatter.format(new Date(event.createdAt))}
              </time>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              内容版本 {event.version}
            </p>
            {event.message ? (
              <p className="mt-2 whitespace-pre-wrap text-sm">{event.message}</p>
            ) : null}
          </article>
        ))}
        {events.length === 0 ? (
          <p className="py-3 text-center text-sm text-muted-foreground">还没有记录</p>
        ) : null}
      </div>
    </section>
  );
}
