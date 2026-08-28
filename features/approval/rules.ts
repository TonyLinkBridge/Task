import type { AppRole } from "@/lib/auth/types";
import type { ContentStatus } from "@/features/content/types";
import type { ApprovalProgress } from "@/features/approval/types";

export function requiredApprovals(role: AppRole): 1 | 2 {
  return role === "admin" ? 1 : 2;
}

export function approvalProgress(
  required: 1 | 2,
  adminIds: readonly string[]
): ApprovalProgress {
  const count = new Set(adminIds).size;
  return { count, complete: count >= required };
}

export function canEditBody(status: ContentStatus): boolean {
  return status === "draft" || status === "changes_requested";
}

export function canPublish(status: ContentStatus): boolean {
  return status === "approved" || status === "due";
}
