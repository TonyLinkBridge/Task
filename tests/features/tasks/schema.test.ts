import { describe, expect, it } from "vitest";

import {
  taskFiltersFromSearchParams,
  taskInputSchema,
} from "@/features/tasks/schema";

const validInput = {
  title: "准备下周会议资料",
  project: "内容运营",
  description: "整理最新进度",
  assigneeId: "user_employee",
  priority: "medium",
  dueAt: "2026-08-29T02:00:00.000Z",
};

describe("taskInputSchema", () => {
  it("accepts a complete task", () => {
    expect(taskInputSchema.safeParse(validInput).success).toBe(true);
  });

  it("rejects a title that is empty after trimming", () => {
    expect(
      taskInputSchema.safeParse({ ...validInput, title: "   " }).success
    ).toBe(false);
  });

  it("rejects an unknown priority", () => {
    expect(
      taskInputSchema.safeParse({ ...validInput, priority: "highest" }).success
    ).toBe(false);
  });

  it("rejects an invalid due date", () => {
    expect(
      taskInputSchema.safeParse({ ...validInput, dueAt: "tomorrow" }).success
    ).toBe(false);
  });
});

describe("taskFiltersFromSearchParams", () => {
  it("keeps supported filters and drops unknown values", () => {
    expect(
      taskFiltersFromSearchParams({
        search: "  周报  ",
        project: "  内容运营  ",
        priority: "urgent",
        assignee: "user_employee",
      })
    ).toEqual({
      search: "周报",
      project: "内容运营",
      priority: "urgent",
      assigneeId: "user_employee",
    });

    expect(taskFiltersFromSearchParams({ priority: "highest" })).toEqual({});
  });
});
