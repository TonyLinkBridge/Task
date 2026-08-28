import type { ContentStatus } from "@/features/content/types";

export type ApprovalProgress = {
  count: number;
  complete: boolean;
};

export type ContentApproval = {
  id: string;
  contentId: string;
  version: number;
  adminId: string;
  approvedAt: string;
  invalidatedAt: string | null;
};

export const REVIEW_EVENT_TYPES = [
  "submitted",
  "approved",
  "changes_requested",
  "resubmitted",
  "approval_invalidated",
  "published",
  "archived",
] as const;

export type ReviewEventType = (typeof REVIEW_EVENT_TYPES)[number];

export type ContentReviewEvent = {
  id: string;
  contentId: string;
  version: number;
  eventType: ReviewEventType;
  actorId: string;
  message: string | null;
  createdAt: string;
};

export type PublishableContentStatus = Extract<
  ContentStatus,
  "approved" | "due"
>;
