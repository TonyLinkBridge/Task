import { describe, expect, it } from "vitest";

import { makeTaskActions } from "@/features/tasks/action-service";
import type {
  TaskActionRepository,
  TaskCommentRecord,
} from "@/features/tasks/action-service";
import type { TaskInput } from "@/features/tasks/schema";
import type { TaskRecord, TaskStatus } from "@/features/tasks/types";

const validInput: TaskInput = {
  title: "准备周报",
  description: "汇总本周进度",
  assigneeId: "user_employee",
  priority: "medium",
  dueAt: "2026-08-29T02:00:00.000Z",
};

function createHarness(options?: { authenticated?: boolean }) {
  const tasks: TaskRecord[] = [];
  const comments: TaskCommentRecord[] = [];
  const revalidatedPaths: string[] = [];

  const repository: TaskActionRepository = {
    async create(input, creatorId) {
      const record: TaskRecord = {
        id: "11111111-1111-4111-8111-111111111111",
        ...input,
        status: "todo",
        kind: "general",
        creatorId,
        position: 1000,
        linkedContentId: null,
        archivedAt: null,
        createdAt: "2026-08-28T02:00:00.000Z",
        updatedAt: "2026-08-28T02:00:00.000Z",
      };
      tasks.push(record);
      return record;
    },
    async update(id, input) {
      const index = tasks.findIndex((task) => task.id === id);
      tasks[index] = { ...tasks[index], ...input };
      return tasks[index];
    },
    async move(id, status, position) {
      const index = tasks.findIndex((task) => task.id === id);
      tasks[index] = { ...tasks[index], status, position };
      return tasks[index];
    },
    async archive(id, archivedAt) {
      const index = tasks.findIndex((task) => task.id === id);
      if (tasks[index]?.kind === "content_publish") {
        throw new Error("CONTENT_PUBLISH_TASK_CANNOT_ARCHIVE");
      }
      tasks[index] = { ...tasks[index], archivedAt };
      return tasks[index];
    },
    async addComment(taskId, body, authorId) {
      const comment: TaskCommentRecord = {
        id: "22222222-2222-4222-8222-222222222222",
        taskId,
        authorId,
        body,
        createdAt: "2026-08-28T02:00:00.000Z",
      };
      comments.push(comment);
      return comment;
    },
  };

  const actions = makeTaskActions({
    getVerifiedUser: async () => {
      if (options?.authenticated === false) {
        throw new Error("UNAUTHENTICATED");
      }
      return {
        id: "user_admin",
        role: "admin",
        name: "Admin",
        imageUrl: null,
      };
    },
    repository,
    now: () => new Date("2026-08-28T03:00:00.000Z"),
    revalidatePath: (path) => revalidatedPaths.push(path),
  });

  return { actions, tasks, comments, revalidatedPaths };
}

describe("task actions", () => {
  it("does not create a task without a verified user", async () => {
    const { actions, tasks } = createHarness({ authenticated: false });

    await expect(actions.createTask(validInput)).rejects.toThrow(
      "UNAUTHENTICATED"
    );
    expect(tasks).toEqual([]);
  });

  it("creates a task with the verified user as creator", async () => {
    const { actions, tasks, revalidatedPaths } = createHarness();

    const result = await actions.createTask({ ...validInput, title: "  准备周报  " });

    expect(result).toMatchObject({ ok: true, data: { creatorId: "user_admin" } });
    expect(tasks[0]).toMatchObject({ title: "准备周报", creatorId: "user_admin" });
    expect(revalidatedPaths).toEqual(["/tasks"]);
  });

  it("rejects invalid task input before saving", async () => {
    const { actions, tasks } = createHarness();

    const result = await actions.createTask({ ...validInput, title: "   " });

    expect(result).toEqual({ ok: false, message: "请检查任务内容。" });
    expect(tasks).toEqual([]);
  });

  it("moves a task to another workflow column", async () => {
    const { actions, tasks } = createHarness();
    await actions.createTask(validInput);
    const id = tasks[0].id;

    const result = await actions.moveTask(id, "review" as TaskStatus, 2500);

    expect(result).toMatchObject({ ok: true });
    expect(tasks[0]).toMatchObject({ status: "review", position: 2500 });
  });

  it("rejects a whitespace-only comment", async () => {
    const { actions, comments } = createHarness();

    const result = await actions.addTaskComment(
      "11111111-1111-4111-8111-111111111111",
      "   "
    );

    expect(result).toEqual({ ok: false, message: "留言不能为空。" });
    expect(comments).toEqual([]);
  });

  it("does not archive a task linked to scheduled content", async () => {
    const { actions, tasks } = createHarness();
    await actions.createTask(validInput);
    tasks[0] = { ...tasks[0], kind: "content_publish" };

    const result = await actions.archiveTask(tasks[0].id);

    expect(result).toEqual({
      ok: false,
      message: "发布任务要从内容排期里处理，不能在这里收起。",
    });
    expect(tasks[0].archivedAt).toBeNull();
  });
});
