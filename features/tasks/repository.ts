import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  TaskActionRepository,
  TaskCommentRecord,
} from "@/features/tasks/action-service";
import type { TaskInput } from "@/features/tasks/schema";
import { mapTaskRow } from "@/features/tasks/task-mapper";
import type { TaskRow } from "@/features/tasks/task-mapper";
import type { TaskPriority, TaskRecord, TaskStatus } from "@/features/tasks/types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type TaskCommentRow = {
  id: string;
  task_id: string;
  author_id: string;
  body: string;
  created_at: string;
};

export type TaskFilters = {
  search?: string;
  priority?: TaskPriority;
  assigneeId?: string;
};

export type TaskRepository = TaskActionRepository & {
  list(filters?: TaskFilters): Promise<TaskRecord[]>;
};

function taskWrite(input: TaskInput) {
  return {
    title: input.title,
    description: input.description,
    priority: input.priority,
    assignee_id: input.assigneeId,
    due_at: input.dueAt,
  };
}

function assertData<T>(data: T | null, error: { message: string } | null): T {
  if (error || !data) {
    throw new Error(`TASK_DATABASE_ERROR:${error?.message ?? "NO_DATA"}`);
  }
  return data;
}

export function createTaskRepository(
  providedClient?: SupabaseClient
): TaskRepository {
  const client = () => providedClient ?? getSupabaseAdmin();

  return {
    async list(filters = {}) {
      let query = client()
        .from("tasks")
        .select("*")
        .is("archived_at", null)
        .order("status")
        .order("position")
        .order("created_at");

      if (filters.search) query = query.ilike("title", `%${filters.search}%`);
      if (filters.priority) query = query.eq("priority", filters.priority);
      if (filters.assigneeId) query = query.eq("assignee_id", filters.assigneeId);

      const { data, error } = await query;
      if (error) throw new Error(`TASK_DATABASE_ERROR:${error.message}`);
      return ((data ?? []) as TaskRow[]).map(mapTaskRow);
    },

    async create(input, creatorId) {
      const { data, error } = await client()
        .from("tasks")
        .insert({ ...taskWrite(input), creator_id: creatorId })
        .select("*")
        .single();
      return mapTaskRow(assertData(data as TaskRow | null, error));
    },

    async update(id, input) {
      const { data, error } = await client()
        .from("tasks")
        .update({ ...taskWrite(input), updated_at: new Date().toISOString() })
        .eq("id", id)
        .is("archived_at", null)
        .select("*")
        .single();
      return mapTaskRow(assertData(data as TaskRow | null, error));
    },

    async move(id, status: TaskStatus, position) {
      const { data, error } = await client()
        .from("tasks")
        .update({ status, position, updated_at: new Date().toISOString() })
        .eq("id", id)
        .is("archived_at", null)
        .select("*")
        .single();
      return mapTaskRow(assertData(data as TaskRow | null, error));
    },

    async archive(id, archivedAt) {
      const { data, error } = await client()
        .from("tasks")
        .update({ archived_at: archivedAt, updated_at: archivedAt })
        .eq("id", id)
        .is("archived_at", null)
        .select("*")
        .single();
      return mapTaskRow(assertData(data as TaskRow | null, error));
    },

    async addComment(taskId, body, authorId) {
      const { data, error } = await client()
        .from("task_comments")
        .insert({ task_id: taskId, author_id: authorId, body })
        .select("*")
        .single();
      const row = assertData(data as TaskCommentRow | null, error);
      const comment: TaskCommentRecord = {
        id: row.id,
        taskId: row.task_id,
        authorId: row.author_id,
        body: row.body,
        createdAt: row.created_at,
      };
      return comment;
    },
  };
}

export const taskRepository = createTaskRepository();
