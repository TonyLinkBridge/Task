"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ContentForm } from "@/features/content/components/content-form";
import type { ContentInput } from "@/features/content/schema";
import type { ContentPlatform, ContentRecord } from "@/features/content/types";
import type { AssignableUser } from "@/features/tasks/types";

type UpdateActionResult =
  | { ok: true; data: ContentRecord }
  | { ok: false; message: string };

const unavailable = async (): Promise<UpdateActionResult> => ({
  ok: false,
  message: "暂时无法保存修改，请稍后再试。",
});

export function ContentScheduleEditor({
  content,
  platformIds,
  platforms,
  assignees,
  updateAction = unavailable,
}: {
  content: ContentRecord;
  platformIds: string[];
  platforms: ContentPlatform[];
  assignees: AssignableUser[];
  updateAction?: (
    contentId: unknown,
    input: unknown
  ) => Promise<UpdateActionResult>;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const initialValues: ContentInput = {
    title: content.title,
    platformIds,
    assigneeId: content.assigneeId,
    publishAt: content.publishAt,
  };

  return (
    <section className="space-y-4 rounded-xl border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-medium">排期资料</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            修改标题、平台、负责人或发布时间。
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setEditing((current) => !current)}
        >
          {editing ? "取消编辑" : "编辑排期资料"}
        </Button>
      </div>

      {editing ? (
        <ContentForm
          platforms={platforms}
          assignees={assignees}
          initialValues={initialValues}
          submitLabel="保存修改"
          savingLabel="正在保存…"
          helperText="保存后会同步更新对应的发布任务。"
          saveContentAction={(input) => updateAction(content.id, input)}
          onSaved={() => {
            setEditing(false);
            router.refresh();
          }}
        />
      ) : null}
    </section>
  );
}
