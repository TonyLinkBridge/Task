"use client";
import {hasPermission} from "@/features/team/permissions";
import {ActionFeedback} from "@/components/feedback/action-feedback";
import {useAppToast} from "@/components/feedback/app-toast";
import { Select } from "@/components/ui/select";

import { useRef, useState } from "react";
import { ConfirmActionDialog } from "@/components/feedback/confirm-action-dialog";

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
  onCompleted?: (updatedContent: ContentRecord) => void;
}) {
  const [reviewerId, setReviewerId] = useState(
    content.requestedReviewerId ?? (hasPermission(currentUser,"content.approve") ? currentUser.id : admins.find(a=>hasPermission(a,"content.approve"))?.id ?? "")
  );
  const [changeMessage, setChangeMessage] = useState("");
  const {toast}=useAppToast();
  const [isSaving, setIsSaving] = useState(false);
  const [confirmUnlock, setConfirmUnlock] = useState(false);
  const unlockTrigger = useRef<HTMLButtonElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const editable =
    content.status === "draft" || content.status === "changes_requested";
  const canSubmit =
    hasPermission(currentUser,"content.write") && editable &&
    (content.requiredApprovals === 1
      ? content.authorId === currentUser.id
      : content.authorId === currentUser.id ||
        content.assigneeId === currentUser.id ||
        hasPermission(currentUser,"content.manage_all"));
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
    (content.requiredApprovals === 1 || content.authorId !== currentUser.id) &&
    hasPermission(currentUser,"content.approve") &&
    !chosenOtherAdmin &&
    !hasCurrentApproval;

  async function run(operation: () => Promise<ApprovalActionResult>) {
    setIsSaving(true);
    setMessage(null);
    try {
      const result = await operation();
      if (!result.ok) { setMessage(result.message); return; }
      toast({type:"success",title:"审核决定已经保存。"});
      onCompleted?.(result.data);
    } catch {
      setMessage("暂时无法保存审核决定，请稍后再试。");
    } finally { setIsSaving(false); }
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
            <Select label="由谁检查" value={reviewerId} onValueChange={setReviewerId} options={[...(hasPermission(currentUser,"content.approve")?[{value:currentUser.id,label:"我自己批准"}]:[]),...admins.filter(a=>a.id!==currentUser.id).map(a=>({value:a.id,label:`交给 ${a.name}`}))]} />
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
            disabled={isSaving || !hasPermission(currentUser,"content.publish")}
            onClick={() => void run(() => publishAction(content.id))}
          >
            确认已经发布
          </Button>
          <Button
            variant="outline"
            disabled={isSaving || !hasPermission(currentUser,"content.write")}
            ref={unlockTrigger}
            onClick={() => setConfirmUnlock(true)}
          >
            修改内容
          </Button>
        </div>
      ) : null}

      {hasPermission(currentUser,"content.manage_all") && content.status !== "archived" ? (
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

      <ConfirmActionDialog open={confirmUnlock} onOpenChange={setConfirmUnlock}
        title="重新修改内容？" description="修改后需要重新批准。要继续吗？"
        confirmLabel="确认修改" pendingLabel="正在处理…" destructive={false}
        pending={isSaving} returnFocus={unlockTrigger} onConfirm={async () => {
          await run(() => unlockAction(content.id));
          setConfirmUnlock(false);
        }} />
      {message ? (
        <ActionFeedback message={message} type="error" className="mt-3 text-sm text-muted-foreground"/>
      ) : null}
    </section>
  );
}
