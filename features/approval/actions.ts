"use server";

import { revalidatePath } from "next/cache";

import { makeApprovalActions } from "@/features/approval/action-service";
import { approvalRepository } from "@/features/approval/repository";
import { getVerifiedUser } from "@/lib/auth/get-verified-user";
import { setContentRoomEditable } from "@/lib/liveblocks/server";

const approvalActions = makeApprovalActions({
  getVerifiedUser,
  repository: approvalRepository,
  setRoomEditable: setContentRoomEditable,
  revalidatePath,
});

export async function submitForReview(
  contentId: string,
  blocknoteJson: unknown,
  requestedReviewerId?: string
) {
  return approvalActions.submitForReview(
    contentId,
    blocknoteJson,
    requestedReviewerId
  );
}

export async function approveContent(contentId: string, version: number) {
  return approvalActions.approveContent(contentId, version);
}

export async function requestChanges(
  contentId: string,
  version: number,
  message: string
) {
  return approvalActions.requestChanges(contentId, version, message);
}

export async function unlockApprovedContent(contentId: string) {
  return approvalActions.unlockApprovedContent(contentId);
}

export async function markPublished(contentId: string) {
  return approvalActions.markPublished(contentId);
}

export async function archiveContent(contentId: string) {
  return approvalActions.archiveContent(contentId);
}
