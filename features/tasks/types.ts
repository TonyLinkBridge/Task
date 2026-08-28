export const TASK_STATUSES = ["todo", "in_progress", "review", "done"] as const;
export const TASK_PRIORITIES = ["low", "medium", "urgent"] as const;
export const TASK_KINDS = ["general", "content_publish"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type TaskKind = (typeof TASK_KINDS)[number];

export type TaskRecord = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  kind: TaskKind;
  assigneeId: string;
  creatorId: string;
  dueAt: string;
  position: number;
  linkedContentId: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
