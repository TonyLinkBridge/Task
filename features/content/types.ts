export const CONTENT_STATUSES = [
  "draft",
  "in_review",
  "changes_requested",
  "approved",
  "due",
  "published",
  "archived",
] as const;

export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export type ContentRecord = {
  id: string;
  title: string;
  status: ContentStatus;
  authorId: string;
  assigneeId: string;
  publishAt: string;
  liveblocksRoomId: string;
  currentVersion: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ContentPlatform = {
  id: string;
  name: string;
  color: string;
  archivedAt: string | null;
  createdAt: string;
};

export type ContentAttachment = {
  id: string;
  contentId: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
  uploaderId: string;
  createdAt: string;
};

export type ContentComment = {
  id: string;
  contentId: string;
  authorId: string;
  body: string;
  createdAt: string;
};
