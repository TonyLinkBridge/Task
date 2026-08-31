import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatsCards } from "@/components/tasks/stats/stats-cards";
import type { TaskRecord } from "@/features/tasks/types";

const baseTask: TaskRecord = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "准备周报",
  project: "内容运营",
  description: "",
  status: "todo",
  priority: "medium",
  kind: "general",
  assigneeId: "employee",
  creatorId: "admin",
  dueAt: "2026-09-02T02:00:00.000Z",
  position: 1000,
  linkedContentId: null,
  archivedAt: null,
  createdAt: "2026-08-31T02:00:00.000Z",
  updatedAt: "2026-08-31T02:00:00.000Z",
};

function cardValue(label: string) {
  return within(screen.getByRole("article", { name: label })).getByTestId(
    "task-stat-value"
  );
}

describe("StatsCards", () => {
  it("shows four real task totals using Malaysia dates", () => {
    const tasks: TaskRecord[] = [
      baseTask,
      {
        ...baseTask,
        id: "22222222-2222-4222-8222-222222222222",
        title: "昨天的任务",
        dueAt: "2026-09-01T02:00:00.000Z",
      },
      {
        ...baseTask,
        id: "33333333-3333-4333-8333-333333333333",
        title: "正在处理",
        status: "in_progress",
        dueAt: "2026-09-03T02:00:00.000Z",
      },
      {
        ...baseTask,
        id: "44444444-4444-4444-8444-444444444444",
        title: "本周完成",
        status: "done",
        dueAt: "2026-08-31T02:00:00.000Z",
        updatedAt: "2026-09-01T03:00:00.000Z",
      },
      {
        ...baseTask,
        id: "55555555-5555-4555-8555-555555555555",
        title: "上周完成",
        status: "done",
        dueAt: "2026-08-28T02:00:00.000Z",
        updatedAt: "2026-08-28T03:00:00.000Z",
      },
    ];

    render(
      <StatsCards tasks={tasks} now={new Date("2026-09-02T04:00:00.000Z")} />
    );

    expect(cardValue("今天到期")).toHaveTextContent("1");
    expect(cardValue("已经逾期")).toHaveTextContent("1");
    expect(cardValue("正在处理")).toHaveTextContent("1");
    expect(cardValue("本周完成")).toHaveTextContent("1");
  });
});
