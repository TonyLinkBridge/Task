"use client";

import type { TaskKind, TaskRecord } from "@/features/tasks/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ArchiveResult =
  | { ok: true; data: TaskRecord }
  | { ok: false; message: string };

export function ArchiveTaskButton({
  taskId,
  taskKind,
  archiveTaskAction = async () => ({
    ok: false,
    message: "暂时无法收起，请稍后再试。",
  }),
}: {
  taskId: string;
  taskKind: TaskKind;
  archiveTaskAction?: (taskId: string) => Promise<ArchiveResult>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (taskKind === "content_publish") {
    return (
      <p className="text-xs text-muted-foreground">
        这是发布任务，要从内容排期里处理，不能在这里收起。
      </p>
    );
  }

  async function archive() {
    setIsSaving(true);
    setErrorMessage(null);
    const result = await archiveTaskAction(taskId);
    setIsSaving(false);
    if (!result.ok) {
      setErrorMessage(result.message);
      return;
    }
    setOpen(false);
    router.push("/tasks");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" />}>收起任务</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>确定要收起这个任务吗？</DialogTitle>
          <DialogDescription>
            收起后不会永久删除资料，但任务不会再出现在看板上。
          </DialogDescription>
        </DialogHeader>
        {errorMessage ? <p role="alert" className="text-sm text-destructive">{errorMessage}</p> : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
          <Button variant="destructive" onClick={archive} disabled={isSaving}>
            {isSaving ? "正在收起…" : "确认收起"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
