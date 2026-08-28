"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ContentInput } from "@/features/content/schema";
import type { ContentPlatform, ContentRecord } from "@/features/content/types";
import type { AssignableUser } from "@/features/tasks/types";

type ContentActionResult =
  | { ok: true; data: ContentRecord }
  | { ok: false; message: string };

function defaultPublishAt() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(Date.now() + 24 * 60 * 60 * 1000))
    .replace(" ", "T");
}

export function ContentForm({
  platforms,
  assignees,
  createContentAction = async () => ({
    ok: false,
    message: "暂时无法保存，请稍后再试。",
  }),
  onSaved,
}: {
  platforms: ContentPlatform[];
  assignees: AssignableUser[];
  createContentAction?: (input: unknown) => Promise<ContentActionResult>;
  onSaved?: (content: ContentRecord) => void;
}) {
  const [title, setTitle] = useState("");
  const [platformIds, setPlatformIds] = useState<string[]>([]);
  const [assigneeId, setAssigneeId] = useState(assignees[0]?.id ?? "");
  const [publishAt, setPublishAt] = useState(defaultPublishAt);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input: ContentInput = {
      title,
      platformIds,
      assigneeId,
      publishAt: new Date(`${publishAt}:00+08:00`).toISOString(),
    };
    setIsSaving(true);
    setMessage(null);
    const result = await createContentAction(input);
    setIsSaving(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    onSaved?.(result.data);
  }

  function togglePlatform(id: string, checked: boolean) {
    setPlatformIds((current) =>
      checked ? [...new Set([...current, id])] : current.filter((item) => item !== id)
    );
  }

  return (
    <form className="grid gap-6 rounded-xl border bg-card p-5 sm:p-6" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="content-title">标题</Label>
        <Input
          id="content-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={200}
          required
        />
      </div>

      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">发布平台</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {platforms.map((platform) => (
            <label key={platform.id} className="flex items-center gap-2 rounded-lg border p-3 text-sm">
              <input
                type="checkbox"
                checked={platformIds.includes(platform.id)}
                onChange={(event) => togglePlatform(platform.id, event.target.checked)}
              />
              <span className="size-2.5 rounded-full" style={{ backgroundColor: platform.color }} />
              {platform.name}
            </label>
          ))}
        </div>
        {platforms.length === 0 ? (
          <p className="text-sm text-destructive">请先让管理员建立至少一个发布平台。</p>
        ) : null}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="content-assignee">负责人</Label>
          <select
            id="content-assignee"
            value={assigneeId}
            onChange={(event) => setAssigneeId(event.target.value)}
            required
            className="h-9 rounded-md border border-input bg-background px-2.5 text-sm"
          >
            {assignees.map((assignee) => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="content-publish-at">发布时间</Label>
          <Input
            id="content-publish-at"
            type="datetime-local"
            value={publishAt}
            onChange={(event) => setPublishAt(event.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">使用马来西亚时间</p>
        </div>
      </div>

      <div className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
        建立后会马上产生发布任务。正文和文件会在下一页填写及上传。
      </div>
      {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSaving || !title.trim() || platformIds.length === 0 || !assigneeId}
        >
          {isSaving ? "正在建立…" : "建立内容"}
        </Button>
      </div>
    </form>
  );
}
