"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import {
  approveContent,
  archiveContent,
  markPublished,
  requestChanges,
  submitForReview,
  unlockApprovedContent,
} from "@/features/approval/actions";
import { ReviewActions } from "@/features/approval/components/review-actions";
import type { ContentApproval } from "@/features/approval/types";
import { BlockNoteEditor } from "@/features/content/components/blocknote-editor";
import type { ContentRecord } from "@/features/content/types";
import type { AssignableUser } from "@/features/tasks/types";
import type { VerifiedUser } from "@/lib/auth/types";

export function ContentEditorReview({
  content,
  approvals,
  currentUser,
  admins,
}: {
  content: ContentRecord;
  approvals: ContentApproval[];
  currentUser: VerifiedUser;
  admins: AssignableUser[];
}) {
  const router = useRouter();
  const [document, setDocument] = useState<unknown>(null);
  const refresh = useCallback(() => router.refresh(), [router]);
  const editable =
    content.status === "draft" || content.status === "changes_requested";

  return (
    <div className="space-y-5">
      <section className="rounded-xl border bg-card p-5">
        <div className="mb-4">
          <h2 className="font-medium">内容正文</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            可以选中文字直接留言；等待审核时正文会锁住，但留言仍然可以使用。
          </p>
        </div>
        <BlockNoteEditor
          contentId={content.id}
          editable={editable}
          onDocumentChange={setDocument}
        />
      </section>
      <ReviewActions
        content={content}
        approvals={approvals}
        currentUser={currentUser}
        admins={admins}
        document={document}
        submitAction={submitForReview}
        approveAction={approveContent}
        requestChangesAction={requestChanges}
        unlockAction={unlockApprovedContent}
        publishAction={markPublished}
        archiveAction={archiveContent}
        onCompleted={refresh}
      />
    </div>
  );
}
