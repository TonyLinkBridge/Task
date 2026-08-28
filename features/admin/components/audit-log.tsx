import { Badge } from "@/components/ui/badge";
import type { AuditEventView } from "@/features/admin/history-types";

const actionLabels: Record<string, string> = {
  submitted: "提交检查",
  approved: "批准内容",
  changes_requested: "要求修改",
  resubmitted: "修改后重新提交",
  approval_invalidated: "旧批准失效",
  published: "确认已经发布",
  archived: "收起内容",
  sent: "Slack 发送成功",
  failed: "Slack 发送失败",
  manual_retry: "手动重新发送",
  notification_settings_updated: "修改通知设置",
  content_updated: "修改排期资料",
};

const timeFormatter = new Intl.DateTimeFormat("zh-MY", {
  timeZone: "Asia/Kuala_Lumpur",
  dateStyle: "medium",
  timeStyle: "short",
});

export function AuditLog({ events }: { events: AuditEventView[] }) {
  return (
    <section className="space-y-4 rounded-xl border bg-card p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold">重要操作记录</h2>
        <p className="text-sm text-muted-foreground">
          记录谁在什么时候提交、批准、退回、发布或重发。
        </p>
      </div>
      {events.length === 0 ? (
        <p className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
          目前还没有操作记录。
        </p>
      ) : (
        <div className="divide-y rounded-lg border">
          {events.map((event) => (
            <article key={event.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline">
                  {actionLabels[event.action] ?? event.action}
                </Badge>
                <div>
                  <p className="text-sm font-medium">
                    {event.actorName ?? "系统"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {event.entityType === "content" ? "内容" : "Slack 通知"}
                  </p>
                </div>
              </div>
              <time className="text-xs text-muted-foreground">
                {timeFormatter.format(new Date(event.createdAt))}
              </time>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
