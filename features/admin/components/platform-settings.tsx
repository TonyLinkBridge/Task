"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ContentPlatform } from "@/features/content/types";

type PlatformResult =
  | { ok: true; data: ContentPlatform }
  | { ok: false; message: string };

const failedResult = async (): Promise<PlatformResult> => ({
  ok: false,
  message: "暂时无法保存平台，请稍后再试。",
});

export function PlatformSettings({
  initialPlatforms,
  createPlatformAction = failedResult,
  updatePlatformAction = failedResult,
  archivePlatformAction = failedResult,
  restorePlatformAction = failedResult,
}: {
  initialPlatforms: ContentPlatform[];
  createPlatformAction?: (input: unknown) => Promise<PlatformResult>;
  updatePlatformAction?: (id: string, input: unknown) => Promise<PlatformResult>;
  archivePlatformAction?: (id: string) => Promise<PlatformResult>;
  restorePlatformAction?: (id: string) => Promise<PlatformResult>;
}) {
  const [platforms, setPlatforms] = useState(initialPlatforms);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#64748b");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingColor, setEditingColor] = useState("#64748b");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const activeCount = platforms.filter((platform) => !platform.archivedAt).length;
  const archivedCount = platforms.length - activeCount;

  function replacePlatform(updated: ContentPlatform) {
    setPlatforms((current) =>
      current
        .map((platform) => (platform.id === updated.id ? updated : platform))
        .sort((a, b) => a.name.localeCompare(b.name))
    );
  }

  async function createPlatform(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    const result = await createPlatformAction({ name: newName, color: newColor });
    setIsSaving(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setPlatforms((current) =>
      [...current, result.data].sort((a, b) => a.name.localeCompare(b.name))
    );
    setNewName("");
    setNewColor("#64748b");
    setMessage("平台已经新增。");
  }

  function startEditing(platform: ContentPlatform) {
    setEditingId(platform.id);
    setEditingName(platform.name);
    setEditingColor(platform.color);
    setMessage(null);
  }

  async function saveEditing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;
    setIsSaving(true);
    setMessage(null);
    const result = await updatePlatformAction(editingId, {
      name: editingName,
      color: editingColor,
    });
    setIsSaving(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    replacePlatform(result.data);
    setEditingId(null);
    setMessage("平台已经更新。");
  }

  async function changeArchived(platform: ContentPlatform, archived: boolean) {
    setIsSaving(true);
    setMessage(null);
    const result = archived
      ? await archivePlatformAction(platform.id)
      : await restorePlatformAction(platform.id);
    setIsSaving(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    replacePlatform(result.data);
    setMessage(archived ? "平台已经停用。" : "平台已经重新启用。");
  }

  return (
    <section className="space-y-5 rounded-xl border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">发布平台</h3>
          <p className="text-sm text-muted-foreground">
            自己建立平台名称和颜色；停用后不会影响以前的内容。
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {activeCount} 个使用中
          {archivedCount > 0 ? ` · ${archivedCount} 个已停用` : ""}
        </p>
      </div>

      <form
        className="grid gap-3 rounded-xl border bg-muted/30 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end"
        onSubmit={createPlatform}
      >
        <div className="grid gap-2">
          <Label htmlFor="new-platform-name">新平台名称</Label>
          <Input
            id="new-platform-name"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="例如：Instagram、TikTok、LinkedIn"
            maxLength={80}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="new-platform-color">平台颜色</Label>
          <Input
            id="new-platform-color"
            aria-label="新平台颜色"
            type="color"
            className="w-full cursor-pointer px-1 sm:w-16"
            value={newColor}
            onChange={(event) => setNewColor(event.target.value)}
          />
        </div>
        <Button type="submit" disabled={isSaving || !newName.trim()}>
          新增平台
        </Button>
      </form>

      {message ? (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      ) : null}

      <div className="grid gap-3">
        {platforms.map((platform) => (
          <article
            key={platform.id}
            className="rounded-xl border p-4"
          >
            {editingId === platform.id ? (
              <form
                className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-end"
                onSubmit={saveEditing}
              >
                <div className="grid gap-2">
                  <Label htmlFor={`edit-platform-${platform.id}`}>
                    修改平台名称
                  </Label>
                  <Input
                    id={`edit-platform-${platform.id}`}
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    maxLength={80}
                    required
                  />
                </div>
                <Input
                  aria-label="修改平台颜色"
                  type="color"
                  className="w-full cursor-pointer px-1 sm:w-16"
                  value={editingColor}
                  onChange={(event) => setEditingColor(event.target.value)}
                />
                <Button type="submit" disabled={isSaving || !editingName.trim()}>
                  保存修改
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingId(null)}
                >
                  取消
                </Button>
              </form>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="size-4 rounded-full border"
                    style={{ backgroundColor: platform.color }}
                  />
                  <div>
                    <p className="font-medium">{platform.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {platform.archivedAt ? "已经停用" : "使用中"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!platform.archivedAt ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => startEditing(platform)}
                        aria-label={`修改 ${platform.name}`}
                      >
                        修改
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isSaving}
                        onClick={() => changeArchived(platform, true)}
                        aria-label={`停用 ${platform.name}`}
                      >
                        停用
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSaving}
                      onClick={() => changeArchived(platform, false)}
                      aria-label={`重新启用 ${platform.name}`}
                    >
                      重新启用
                    </Button>
                  )}
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
