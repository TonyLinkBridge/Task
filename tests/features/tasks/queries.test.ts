import { describe, expect, it } from "vitest";

import { makeTaskQueries } from "@/features/tasks/query-service";
import type { TaskRecord } from "@/features/tasks/types";

const task: TaskRecord = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "准备周报",
  description: "",
  status: "todo",
  priority: "medium",
  kind: "general",
  assigneeId: "user_employee",
  creatorId: "user_admin",
  dueAt: "2026-08-29T02:00:00.000Z",
  position: 1000,
  linkedContentId: null,
  archivedAt: null,
  createdAt: "2026-08-28T02:00:00.000Z",
  updatedAt: "2026-08-28T02:00:00.000Z",
};

describe("task queries", () => {
  it("does not read tasks without a verified user", async () => {
    let readCount = 0;
    const queries = makeTaskQueries({
      getVerifiedUser: async () => {
        throw new Error("UNAUTHENTICATED");
      },
      list: async () => {
        readCount += 1;
        return [task];
      },
    });

    await expect(queries.listTasks()).rejects.toThrow("UNAUTHENTICATED");
    expect(readCount).toBe(0);
  });

  it("passes task filters after checking the user", async () => {
    let receivedFilters: unknown;
    const queries = makeTaskQueries({
      getVerifiedUser: async () => ({
        id: "user_admin",
        role: "admin",
        name: "Admin",
        imageUrl: null,
      }),
      list: async (filters) => {
        receivedFilters = filters;
        return [task];
      },
    });

    const result = await queries.listTasks({ priority: "urgent" });

    expect(result).toEqual([task]);
    expect(receivedFilters).toEqual({ priority: "urgent" });
  });
});
