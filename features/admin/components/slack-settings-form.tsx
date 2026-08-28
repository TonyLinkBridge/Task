"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  NotificationEvent,
  NotificationSettings,
} from "@/features/notifications/types";
import type { SlackChannel } from "@/lib/slack/client";

const visibleEvents: Array<{ key: NotificationEvent; label: string }> = [
  { key: "submitted", label: "员工提交内容" },
  { key: "first_approved", label: "第一位管理员批准" },
  { key: "all_approved", label: "全部批准完成" },
  { key: "changes_requested", label: "管理员要求修改" },
  { key: "resubmitted", label: "员工修改后重新提交" },
  { key: "publish_advance", label: "提前发布提醒" },
  { key: "publish_due", label: "到达发布时间" },
  { key: "published", label: "员工确认已经发布" },
];

type SettingsResult =
  | { ok: true; data: NotificationSettings }
  | { ok: false; message: string };

export function SlackSettingsForm({
  configured,
  channels,
  initialSettings,
  saveSettingsAction = async () => ({
    ok: false,
    message: "暂时无法保存 Slack 设置。",
  }),
}: {
  configured: boolean;
  channels: SlackChannel[];
  initialSettings: NotificationSettings;
  saveSettingsAction?: (input: unknown) => Promise<SettingsResult>;
}) {
  const [channelId, setChannelId] = useState(
    initialSettings.slackChannelId ?? channels[0]?.id ?? ""
  );
  const [reminderMinutes, setReminderMinutes] = useState(
    String(initialSettings.reminderMinutes)
  );
  const [events, setEvents] = useState(initialSettings.enabledEvents);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!configured) {
    return (
      <section className="space-y-3 rounded-xl border bg-card p-5 sm:p-6">
        <div>
          <h3 className="text-lg font-semibold">Slack 通知还没连接</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            平台管理已经能用；要发送频道提醒，还需要加入 Slack Bot 的密钥。
          </p>
        </div>
        <div className="rounded-lg bg-muted/60 p-4 text-sm text-muted-foreground">
          在 Vercel 加入 <code>SLACK_BOT_TOKEN</code>。Slack App 需要
          <code> channels:read</code>、<code> groups:read</code> 和
          <code> chat:write</code> 权限。
        </div>
      </section>
    );
  }

  function toggleEvent(key: NotificationEvent, checked: boolean) {
    setEvents((current) => ({
      ...current,
      [key]: checked,
      ...(key === "publish_due" ? { publish_due_unapproved: checked } : {}),
    }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    const result = await saveSettingsAction({
      channelId,
      reminderMinutes: Number(reminderMinutes),
      enabledEvents: events,
    });
    setIsSaving(false);
    setMessage(result.ok ? "Slack 设置已经保存。" : result.message);
  }

  return (
    <section className="space-y-5 rounded-xl border bg-card p-5 sm:p-6">
      <div>
        <h3 className="text-lg font-semibold">Slack 通知</h3>
        <p className="text-sm text-muted-foreground">
          选择通知频道、提前提醒时间，以及要发送哪些消息。
        </p>
      </div>

      <form className="space-y-5" onSubmit={save}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="slack-channel">Slack 通知频道</Label>
            <select
              id="slack-channel"
              value={channelId}
              onChange={(event) => setChannelId(event.target.value)}
              required
              className="h-9 rounded-md border border-input bg-background px-2.5 text-sm"
            >
              <option value="">请选择频道</option>
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  #{channel.name}{channel.isPrivate ? "（私人）" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reminder-minutes">提前多少分钟提醒</Label>
            <Input
              id="reminder-minutes"
              type="number"
              min={5}
              max={10080}
              value={reminderMinutes}
              onChange={(event) => setReminderMinutes(event.target.value)}
              required
            />
          </div>
        </div>

        <fieldset className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
          <legend className="px-1 text-sm font-medium">发送哪些通知</legend>
          {visibleEvents.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={events[key]}
                onChange={(event) => toggleEvent(key, event.target.checked)}
              />
              {label}
            </label>
          ))}
        </fieldset>

        {channels.length === 0 ? (
          <p className="text-sm text-destructive">
            找不到可用频道。私人频道要先邀请 Slack App。
          </p>
        ) : null}
        {message ? (
          <p role="status" className="text-sm text-muted-foreground">
            {message}
          </p>
        ) : null}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving || !channelId}>
            {isSaving ? "正在保存…" : "保存 Slack 设置"}
          </Button>
        </div>
      </form>
    </section>
  );
}
