export const TASK_STATUSES = [
  "draft",
  "todo",
  "in_progress",
  "review",
  "done",
] as const;
export const TASK_PRIORITIES = ["low", "medium", "urgent"] as const;
export const TASK_KINDS = ["general", "content_publish"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type TaskKind = (typeof TASK_KINDS)[number];

export type TaskRecord = {
  id: string;
  title: string;
  project: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  kind: TaskKind;
  assigneeId: string;
  assigneeIds?: string[];
  creatorId: string;
  dueAt: string;
  position: number;
  linkedContentId: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AssignableUser = {
  id: string;
  role: "employee" | "admin";
  name: string;
  imageUrl: string | null;
};

export type TaskFilters = {
  search?: string;
  project?: string;
  priority?: TaskPriority;
  assigneeId?: string;
};

export type TaskCommentRecord = {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: string;
};

export type TaskCommentView = TaskCommentRecord & {
  authorName: string;
  authorImageUrl: string | null;
};

export type TaskAttachment = {
  id: string;
  taskId: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
  uploaderId: string;
  createdAt: string;
};
