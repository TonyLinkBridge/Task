import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  TaskActionRepository,
  TaskCommentRecord,
} from "@/features/tasks/action-service";
import type { TaskInput } from "@/features/tasks/schema";
import {
  mapAssignableUserRow,
  mapTaskCommentRow,
  mapTaskRow,
} from "@/features/tasks/task-mapper";
import type { TaskCommentRow, TaskRow } from "@/features/tasks/task-mapper";
import type {
  AssignableUser,
  TaskFilters,
  TaskCommentView,
  TaskRecord,
  TaskStatus,
} from "@/features/tasks/types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type TaskRepository = TaskActionRepository & {
  list(filters?: TaskFilters): Promise<TaskRecord[]>;
  listAssignees(): Promise<AssignableUser[]>;
  get(id: string): Promise<TaskRecord | null>;
  listComments(taskId: string): Promise<TaskCommentView[]>;
};

function taskWrite(input: TaskInput) {
  const assigneeIds = Array.from(
    new Set([input.assigneeId, ...(input.assigneeIds ?? [])])
  );
  return {
    title: input.title,
    project: input.project,
    description: input.description,
    priority: input.priority,
    ...(input.status ? { status: input.status } : {}),
    assignee_id: input.assigneeId,
    assignee_ids: assigneeIds,
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

  async function assertEditableTask(id: string) {
    const { data, error } = await client()
      .from("tasks")
      .select("kind")
      .eq("id", id)
      .is("archived_at", null)
      .single();
    if (error) throw new Error(`TASK_DATABASE_ERROR:${error.message}`);
    if (data.kind === "content_publish") {
      throw new Error("CONTENT_PUBLISH_TASK_CANNOT_EDIT");
    }
  }

  return {
    async list(filters = {}) {
      let query = client()
        .from("tasks")
        .select("*")
        .is("archived_at", null)
        .order("status")
        .order("position")
        .order("created_at");

      if (filters.search) {
        const safeSearch = filters.search.replaceAll(",", " ");
        query = query.or(
          `title.ilike.%${safeSearch}%,project.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`
        );
      }
      if (filters.project) query = query.ilike("project", filters.project);
      if (filters.priority) query = query.eq("priority", filters.priority);
      if (filters.assigneeId) query = query.contains("assignee_ids", [filters.assigneeId]);

      const { data, error } = await query;
      if (error) throw new Error(`TASK_DATABASE_ERROR:${error.message}`);
      return ((data ?? []) as TaskRow[]).map(mapTaskRow);
    },

    async listAssignees() {
      const { data, error } = await client()
        .from("profiles")
        .select("clerk_user_id, role, display_name, avatar_url")
        .is("archived_at", null)
        .order("display_name");
      if (error) throw new Error(`TASK_DATABASE_ERROR:${error.message}`);
      return (data ?? []).map((row) =>
        mapAssignableUserRow(row as Parameters<typeof mapAssignableUserRow>[0])
      );
    },

    async get(id) {
      const { data, error } = await client()
        .from("tasks")
        .select("*")
        .eq("id", id)
        .is("archived_at", null)
        .maybeSingle();
      if (error) throw new Error(`TASK_DATABASE_ERROR:${error.message}`);
      return data ? mapTaskRow(data as TaskRow) : null;
    },

    async listComments(taskId) {
      const { data, error } = await client()
        .from("task_comments")
        .select(
          "id, task_id, author_id, body, created_at, author:profiles!task_comments_author_id_fkey(display_name, avatar_url)"
        )
        .eq("task_id", taskId)
        .order("created_at");
      if (error) throw new Error(`TASK_DATABASE_ERROR:${error.message}`);
      return (data ?? []).map((row) =>
        mapTaskCommentRow(row as unknown as TaskCommentRow)
      );
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
      await assertEditableTask(id);
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
      await assertEditableTask(id);
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
      const { data: existing, error: readError } = await client()
        .from("tasks")
        .select("kind")
        .eq("id", id)
        .is("archived_at", null)
        .single();
      if (readError) {
        throw new Error(`TASK_DATABASE_ERROR:${readError.message}`);
      }
      if (existing?.kind === "content_publish") {
        throw new Error("CONTENT_PUBLISH_TASK_CANNOT_ARCHIVE");
      }

      const { data, error } = await client()
        .from("tasks")
        .update({ archived_at: archivedAt, updated_at: archivedAt })
        .eq("id", id)
        .is("archived_at", null)
        .select("*")
        .single();
      return mapTaskRow(assertData(data as TaskRow | null, error));
    },

    async deleteOwned(id, actorId) {
      const { data, error } = await client().rpc("delete_owned_task", {
        p_task_id: id,
        p_actor_id: actorId,
      });
      if (error || data !== true) {
        throw new Error(`TASK_DATABASE_ERROR:${error?.message ?? "NO_DATA"}`);
      }
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
