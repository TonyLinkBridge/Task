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
import { clearResolvedComments } from "@/features/content/actions/inline-threads";
import { SnapshotViewer } from "@/features/content/components/snapshot-viewer";
import { documentForReview } from "@/features/content/review-document";
import type { ContentRecord } from "@/features/content/types";
import type { AssignableUser } from "@/features/tasks/types";
import type { VerifiedUser } from "@/lib/auth/types";

export function ContentEditorReview({
  content,
  approvals,
  currentUser,
  admins,
  snapshotDocument,
}: {
  content: ContentRecord;
  approvals: ContentApproval[];
  currentUser: VerifiedUser;
  admins: AssignableUser[];
  snapshotDocument: unknown | null;
}) {
  const router = useRouter();
  const [document, setDocument] = useState<unknown>(null);
  const [synchronized, setSynchronized] = useState(false);
  const refresh = useCallback(() => router.refresh(), [router]);
  const editable =
    content.status === "draft" || content.status === "changes_requested";

  return (
    <div className="space-y-5">
      <section className="rounded-xl border bg-card p-5">
        <div className="mb-4">
          <h2 className="font-medium">内容正文</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {editable
              ? "可以选中文字直接留言；送审前会先确认内容已经同步。"
              : "这是送审时保存的固定版本，也是管理员批准的依据。"}
          </p>
        </div>
        {editable ? (
          <BlockNoteEditor
            canClearResolved={currentUser.role === "admin"}
            contentId={content.id}
            editable
            onClearResolved={() => clearResolvedComments(content.id)}
            onDocumentChange={setDocument}
            onSyncChange={setSynchronized}
          />
        ) : (
          <SnapshotViewer document={snapshotDocument} />
        )}
      </section>
      {!editable ? (
        <details className="rounded-xl border bg-card p-5" open>
          <summary className="cursor-pointer font-medium">指定文字留言</summary>
          <p className="mb-4 mt-2 text-xs text-muted-foreground">
            这里的同步副本只用来查看、回复或新增指定文字留言，不能修改正文。
          </p>
          <BlockNoteEditor
            canClearResolved={currentUser.role === "admin"}
            contentId={content.id}
            editable={false}
            onClearResolved={() => clearResolvedComments(content.id)}
          />
        </details>
      ) : null}
      <ReviewActions
        content={content}
        approvals={approvals}
        currentUser={currentUser}
        admins={admins}
        document={documentForReview({
          editable,
          synchronized,
          liveDocument: document,
          snapshotDocument,
        })}
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
