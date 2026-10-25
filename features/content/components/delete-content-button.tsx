"use client";

import {useAppToast} from "@/components/feedback/app-toast";
import {ActionFeedback} from "@/components/feedback/action-feedback";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ConfirmActionDialog } from "@/components/feedback/confirm-action-dialog";

import { Button } from "@/components/ui/button";
import type { ContentDeleteResult } from "@/features/content/action-service";

export function DeleteContentButton({
  contentId,
  deleteAction,
  redirectTo = '/content',
}: {
  contentId: string;
  deleteAction: (contentId: string) => Promise<ContentDeleteResult>;
  redirectTo?: '/content' | '/marketing' | '/marketing/calendar?view=list';
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
      const result = await deleteAction(contentId);
      setConfirmOpen(false);
      if (!result.ok) { setMessage(result.message); return; }
      toast({type:"success",title:"内容已经删除。"});
      router.push(redirectTo);
      router.refresh();
    } catch {
      setConfirmOpen(false);
      setMessage("暂时无法删除内容，请稍后再试。");
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
        {isDeleting ? "正在删除…" : "删除内容"}
      </Button>
      <ConfirmActionDialog open={confirmOpen} onOpenChange={setConfirmOpen}
        title="删除这篇内容？" description="相关 Slack 通知也会一起删除，删除后不能恢复。" confirmLabel="永久删除内容"
        pendingLabel="正在删除…" pending={isDeleting} onConfirm={remove} returnFocus={trigger} />
      {message ? (
        <ActionFeedback message={message} type="error" className="mt-2 text-sm text-destructive"/>
      ) : null}
    </div>
  );
}
