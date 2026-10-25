"use client";

import {useAppToast} from "@/components/feedback/app-toast";
import {ActionFeedback} from "@/components/feedback/action-feedback";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ConfirmActionDialog } from "@/components/feedback/confirm-action-dialog";

import { Button } from "@/components/ui/button";
import type { DeleteTaskResult } from "@/features/tasks/action-service";

export function DeleteTaskButton({
  taskId,
  redirectTo = "/tasks",
  deleteTaskAction,
}: {
  taskId: string;
  redirectTo?: "/tasks" | "/marketing/tasks";
  deleteTaskAction: (taskId: string) => Promise<DeleteTaskResult>;
}) {
  const {toast}=useAppToast();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function remove() {
    setIsDeleting(true);
    setMessage(null);
    try {
      const result = await deleteTaskAction(taskId);
      setConfirmOpen(false);
      if (!result.ok) { setMessage(result.message); return; }
      toast({type:"success",title:"任务已经删除。"});
      router.push(redirectTo);
      router.refresh();
    } catch {
      setConfirmOpen(false);
      setMessage("暂时无法删除任务，请稍后再试。");
    } finally { setIsDeleting(false); }
  }

  return (
    <div>
      <Button
        ref={trigger}
        type="button"
        variant="destructive"
        disabled={isDeleting}
        onClick={() => setConfirmOpen(true)}
      >
        {isDeleting ? "正在删除…" : "删除任务"}
      </Button>
      <ConfirmActionDialog open={confirmOpen} onOpenChange={setConfirmOpen}
        title="删除这个任务？" description="任务和留言都会消失，删除后不能恢复。" confirmLabel="永久删除任务"
        pendingLabel="正在删除…" pending={isDeleting} onConfirm={remove} returnFocus={trigger} />
      {message ? (
        <ActionFeedback message={message} type="error" className="mt-2 text-sm text-destructive"/>
      ) : null}
    </div>
  );
}
