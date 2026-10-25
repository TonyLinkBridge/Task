"use client";

import {useAppToast} from "@/components/feedback/app-toast";
import {ActionFeedback} from "@/components/feedback/action-feedback";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const [message, setMessage] = useState<string | null>(null);

  async function remove() {
    if (
      !window.confirm(
        "确定永久删除这个任务吗？任务和留言都会消失，而且不能恢复。"
      )
    ) {
      return;
    }
    setIsDeleting(true);
    setMessage(null);
    const result = await deleteTaskAction(taskId);
    setIsDeleting(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    toast({type:"success",title:"任务已经删除。"});
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div>
      <Button
        type="button"
        variant="destructive"
        disabled={isDeleting}
        onClick={() => void remove()}
      >
        {isDeleting ? "正在删除…" : "删除任务"}
      </Button>
      {message ? (
        <ActionFeedback message={message} type="error" className="mt-2 text-sm text-destructive"/>
      ) : null}
    </div>
  );
}
