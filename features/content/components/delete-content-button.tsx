"use client";

import {useAppToast} from "@/components/feedback/app-toast";
import {ActionFeedback} from "@/components/feedback/action-feedback";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const [message, setMessage] = useState<string | null>(null);

  async function remove() {
    if (
      !window.confirm(
        "确定永久删除这个内容吗？相关 Slack 通知也会一起删除，而且不能恢复。"
      )
    ) {
      return;
    }

    setIsDeleting(true);
    setMessage(null);
    const result = await deleteAction(contentId);
    setIsDeleting(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    toast({type:"success",title:"内容已经删除。"});
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
        {isDeleting ? "正在删除…" : "删除内容"}
      </Button>
      {message ? (
        <ActionFeedback message={message} type="error" className="mt-2 text-sm text-destructive"/>
      ) : null}
    </div>
  );
}
