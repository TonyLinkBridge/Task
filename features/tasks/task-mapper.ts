import type {
  AssignableUser,
  TaskCommentView,
  TaskRecord,
} from "@/features/tasks/types";

export type TaskRow = {
  id: string;
  title: string;
  description: string;
  status: TaskRecord["status"];
  priority: TaskRecord["priority"];
  kind: TaskRecord["kind"];
  assignee_id: string;
  creator_id: string;
  due_at: string;
  position: string | number;
  linked_content_id: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export function mapTaskRow(row: TaskRow): TaskRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    kind: row.kind,
    assigneeId: row.assignee_id,
    creatorId: row.creator_id,
    dueAt: row.due_at,
    position: Number(row.position),
    linkedContentId: row.linked_content_id,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type AssignableUserRow = {
  clerk_user_id: string;
  role: AssignableUser["role"];
  display_name: string;
  avatar_url: string | null;
};

export function mapAssignableUserRow(row: AssignableUserRow): AssignableUser {
  return {
    id: row.clerk_user_id,
    role: row.role,
    name: row.display_name,
    imageUrl: row.avatar_url,
  };
}

export type TaskCommentRow = {
  id: string;
  task_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author: { display_name: string; avatar_url: string | null };
};

export function mapTaskCommentRow(row: TaskCommentRow): TaskCommentView {
  return {
    id: row.id,
    taskId: row.task_id,
    authorId: row.author_id,
    body: row.body,
    createdAt: row.created_at,
    authorName: row.author.display_name,
    authorImageUrl: row.author.avatar_url,
  };
}
