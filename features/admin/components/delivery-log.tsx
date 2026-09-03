"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SlackDeliveryView } from "@/features/admin/history-types";

const statusLabels: Record<SlackDeliveryView["status"], string> = {
  pending: "等待发送",
  sending: "正在发送",
  sent: "发送成功",
  failed: "发送失败",
  cancelled: "已经取消",
};

const eventLabels: Record<string, string> = {
  submitted: "提交审核",
  first_approved: "第一位批准",
  all_approved: "全部批准",
  changes_requested: "要求修改",
  resubmitted: "重新提交",
  publish_advance: "提前提醒",
  publish_due: "到时提醒",
  publish_due_unapproved: "到时但未批准",
  published: "确认发布",
};

const timeFormatter = new Intl.DateTimeFormat("zh-MY", {
  timeZone: "Asia/Kuala_Lumpur",
  dateStyle: "medium",
  timeStyle: "short",
});

type RetryResult = { ok: true } | { ok: false; message: string };

export function DeliveryLog({
  deliveries,
  retryAction,
}: {
  deliveries: SlackDeliveryView[];
  retryAction: (id: string) => Promise<RetryResult>;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});

  async function retry(id: string) {
    setBusyId(id);
    const result = await retryAction(id);
    setMessages((current) => ({
      ...current,
      [id]: result.ok ? "已经排队重发。" : result.message,
    }));
    setBusyId(null);
  }

  return (
    <section className="space-y-4 rounded-xl border bg-card p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold">Slack 发送记录</h2>
        <p className="text-sm text-muted-foreground">
          可以看到成功、失败和重试次数；成功的消息不能重复发送。
        </p>
      </div>
      {deliveries.length === 0 ? (
        <p className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
          目前还没有 Slack 发送记录。
        </p>
      ) : (
        <div className="space-y-3">
          {deliveries.map((delivery) => (
            <article key={delivery.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">
                      {delivery.contentTitle ?? "系统通知"}
                    </p>
                    <Badge variant="outline">
                      {eventLabels[delivery.eventType] ?? delivery.eventType}
                    </Badge>
                    <Badge variant={delivery.status === "failed" ? "destructive" : "secondary"}>
                      {statusLabels[delivery.status]}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {timeFormatter.format(new Date(delivery.scheduledFor))} · 已尝试 {delivery.attemptCount} 次
                  </p>
                  {delivery.lastError ? (
                    <p className="mt-2 break-words text-sm text-destructive">
                      {delivery.lastError}
                    </p>
                  ) : null}
                  {messages[delivery.id] ? (
                    <p role="status" className="mt-2 text-sm text-muted-foreground">
                      {messages[delivery.id]}
                    </p>
                  ) : null}
                </div>
                {delivery.status === "failed" ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busyId === delivery.id}
                    onClick={() => void retry(delivery.id)}
                  >
                    {busyId === delivery.id ? "正在处理…" : "重新发送"}
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
