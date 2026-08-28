"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ApprovalProgress } from "@/features/approval/components/approval-progress";
import type { ApprovalActionResult } from "@/features/approval/action-service";
import type { ContentApproval } from "@/features/approval/types";
import type { ContentRecord } from "@/features/content/types";
import type { AssignableUser } from "@/features/tasks/types";
import type { VerifiedUser } from "@/lib/auth/types";

const unavailable = async (): Promise<ApprovalActionResult> => ({
  ok: false,
  message: "暂时无法保存，请稍后再试。",
});

export function ReviewActions({
  content,
  approvals,
  currentUser,
  admins,
  document,
  submitAction = unavailable,
  approveAction = unavailable,
  requestChangesAction = unavailable,
  unlockAction = unavailable,
  publishAction = unavailable,
  archiveAction = unavailable,
  onCompleted,
}: {
  content: ContentRecord;
  approvals: ContentApproval[];
  currentUser: VerifiedUser;
  admins: AssignableUser[];
  document: unknown;
  submitAction?: (
    contentId: string,
    document: unknown,
    reviewerId?: string
  ) => Promise<ApprovalActionResult>;
  approveAction?: (
    contentId: string,
    version: number
  ) => Promise<ApprovalActionResult>;
  requestChangesAction?: (
    contentId: string,
    version: number,
    message: string
  ) => Promise<ApprovalActionResult>;
  unlockAction?: (contentId: string) => Promise<ApprovalActionResult>;
  publishAction?: (contentId: string) => Promise<ApprovalActionResult>;
  archiveAction?: (contentId: string) => Promise<ApprovalActionResult>;
  onCompleted?: () => void;
}) {
  const [reviewerId, setReviewerId] = useState(
    content.requestedReviewerId ?? currentUser.id
  );
  const [changeMessage, setChangeMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const editable =
    content.status === "draft" || content.status === "changes_requested";
  const canSubmit =
    editable &&
    (content.requiredApprovals === 1
      ? content.authorId === currentUser.id
      : content.authorId === currentUser.id ||
        content.assigneeId === currentUser.id ||
        currentUser.role === "admin");
  const chosenOtherAdmin =
    content.requiredApprovals === 1 &&
    content.requestedReviewerId !== null &&
    content.requestedReviewerId !== currentUser.id;
  const hasCurrentApproval = approvals.some(
    (approval) =>
      approval.adminId === currentUser.id &&
      approval.version === content.currentVersion &&
      approval.invalidatedAt === null
  );
  const canReview =
    content.status === "in_review" &&
    currentUser.role === "admin" &&
    !chosenOtherAdmin &&
    !hasCurrentApproval;

  async function run(operation: () => Promise<ApprovalActionResult>) {
    setIsSaving(true);
    setMessage(null);
    const result = await operation();
    setIsSaving(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setMessage("已经保存。 ");
    onCompleted?.();
  }

  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-medium">审核与发布</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            每次重新提交，之前的批准都会取消。
          </p>
        </div>
        <ApprovalProgress
          required={content.requiredApprovals}
          approvals={approvals}
        />
      </div>

      {canSubmit ? (
        <div className="mt-4 space-y-3 border-t pt-4">
          {currentUser.role === "admin" && content.authorId === currentUser.id ? (
            <label className="grid gap-2 text-sm">
              由谁检查
              <select
                value={reviewerId}
                onChange={(event) => setReviewerId(event.target.value)}
                className="h-9 rounded-md border border-input bg-background px-2.5 text-sm"
              >
                <option value={currentUser.id}>我自己批准</option>
                {admins
                  .filter(({ id }) => id !== currentUser.id)
                  .map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      交给 {admin.name}
                    </option>
                  ))}
              </select>
            </label>
          ) : null}
          <Button
            disabled={isSaving || document === null}
            onClick={() =>
              void run(() =>
                submitAction(
                  content.id,
                  document,
                  currentUser.role === "admin" && content.authorId === currentUser.id
                    ? reviewerId
                    : undefined
                )
              )
            }
          >
            交给上司检查
          </Button>
          {document === null ? (
            <p className="text-xs text-amber-700">请等到正文显示“已经同步”再提交。</p>
          ) : null}
        </div>
      ) : null}

      {chosenOtherAdmin && content.status === "in_review" ? (
        <p className="mt-4 rounded-lg bg-muted p-3 text-sm">
          已经交给另一位管理员检查
        </p>
      ) : null}

      {hasCurrentApproval && content.status === "in_review" ? (
        <p className="mt-4 rounded-lg bg-muted p-3 text-sm">
          你已经批准，正在等待另一位管理员。
        </p>
      ) : null}

      {canReview ? (
        <div className="mt-4 grid gap-3 border-t pt-4">
          <textarea
            aria-label="需要修改的地方"
            value={changeMessage}
            onChange={(event) => setChangeMessage(event.target.value)}
            rows={3}
            maxLength={5000}
            placeholder="如果内容不合适，请写下要修改的地方"
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={isSaving}
              onClick={() =>
                void run(() => approveAction(content.id, content.currentVersion))
              }
            >
              批准内容
            </Button>
            <Button
              variant="outline"
              disabled={isSaving || !changeMessage.trim()}
              onClick={() =>
                void run(() =>
                  requestChangesAction(
                    content.id,
                    content.currentVersion,
                    changeMessage
                  )
                )
              }
            >
              要求修改
            </Button>
          </div>
        </div>
      ) : null}

      {content.status === "approved" || content.status === "due" ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
          <Button
            disabled={isSaving}
            onClick={() => void run(() => publishAction(content.id))}
          >
            确认已经发布
          </Button>
          <Button
            variant="outline"
            disabled={isSaving}
            onClick={() => {
              if (
                window.confirm("修改后需要重新批准。要继续吗？")
              ) {
                void run(() => unlockAction(content.id));
              }
            }}
          >
            修改内容
          </Button>
        </div>
      ) : null}

      {currentUser.role === "admin" && content.status !== "archived" ? (
        <div className="mt-4 border-t pt-4">
          <Button
            variant="destructive"
            disabled={isSaving}
            onClick={() => void run(() => archiveAction(content.id))}
          >
            收起内容
          </Button>
        </div>
      ) : null}

      {message ? (
        <p aria-live="polite" className="mt-3 text-sm text-muted-foreground">
          {message}
        </p>
      ) : null}
    </section>
  );
}
