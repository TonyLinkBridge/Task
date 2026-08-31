"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { ContentDeleteResult } from "@/features/content/action-service";

export function DeleteContentButton({
  contentId,
  deleteAction,
}: {
  contentId: string;
  deleteAction: (contentId: string) => Promise<ContentDeleteResult>;
}) {
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
    router.push("/content");
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
        <p role="alert" className="mt-2 text-sm text-destructive">
          {message}
        </p>
      ) : null}
    </div>
  );
}
