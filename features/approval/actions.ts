import { revalidatePath } from "next/cache";

import { makeApprovalActions } from "@/features/approval/action-service";
import { approvalRepository } from "@/features/approval/repository";
import { getVerifiedUser } from "@/lib/auth/get-verified-user";

const approvalActions = makeApprovalActions({
  getVerifiedUser,
  repository: approvalRepository,
  revalidatePath,
});

export async function submitForReview(
  contentId: string,
  blocknoteJson: unknown,
  requestedReviewerId?: string
) {
  "use server";
  return approvalActions.submitForReview(
    contentId,
    blocknoteJson,
    requestedReviewerId
  );
}

export async function approveContent(contentId: string, version: number) {
  "use server";
  return approvalActions.approveContent(contentId, version);
}

export async function requestChanges(
  contentId: string,
  version: number,
  message: string
) {
  "use server";
  return approvalActions.requestChanges(contentId, version, message);
}

export async function unlockApprovedContent(contentId: string) {
  "use server";
  return approvalActions.unlockApprovedContent(contentId);
}

export async function markPublished(contentId: string) {
  "use server";
  return approvalActions.markPublished(contentId);
}

export async function archiveContent(contentId: string) {
  "use server";
  return approvalActions.archiveContent(contentId);
}
