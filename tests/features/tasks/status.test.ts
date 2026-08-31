import { describe, expect, it } from "vitest";

import { groupTasksByStatus } from "@/features/tasks/status";
import type { TaskRecord } from "@/features/tasks/types";

const baseTask: Omit<TaskRecord, "id" | "title" | "status" | "position"> = {
  project: "内容运营",
  description: "",
  priority: "medium",
  kind: "general",
  assigneeId: "user_employee",
  creatorId: "user_admin",
  dueAt: "2026-08-29T02:00:00.000Z",
  linkedContentId: null,
  archivedAt: null,
  createdAt: "2026-08-28T02:00:00.000Z",
  updatedAt: "2026-08-28T02:00:00.000Z",
};

function task(
  id: string,
  status: TaskRecord["status"],
  position: number
): TaskRecord {
  return { ...baseTask, id, title: id, status, position };
}

describe("groupTasksByStatus", () => {
  it("always returns the five workflow columns", () => {
    expect(groupTasksByStatus([])).toEqual({
      draft: [],
      todo: [],
      in_progress: [],
      review: [],
      done: [],
    });
  });

  it("puts tasks in their column and orders them by position", () => {
    const grouped = groupTasksByStatus([
      task("later", "todo", 2000),
      task("review", "review", 1000),
      task("first", "todo", 1000),
    ]);

    expect(grouped.todo.map(({ id }) => id)).toEqual(["first", "later"]);
    expect(grouped.review.map(({ id }) => id)).toEqual(["review"]);
  });
});
