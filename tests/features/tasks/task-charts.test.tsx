import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChartsSection } from "@/components/tasks/charts/charts-section";
import type { TaskRecord } from "@/features/tasks/types";

const task: TaskRecord = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "任务",
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

describe("ChartsSection", () => {
  it("turns real tasks into status totals and a seven-day completion trend", () => {
    const tasks: TaskRecord[] = [
      task,
      { ...task, id: "2", status: "in_progress" },
      { ...task, id: "3", status: "review" },
      {
        ...task,
        id: "4",
        status: "done",
        updatedAt: "2026-09-01T03:00:00.000Z",
      },
      {
        ...task,
        id: "5",
        status: "done",
        updatedAt: "2026-09-01T08:00:00.000Z",
      },
    ];

    render(
      <ChartsSection
        tasks={tasks}
        now={new Date("2026-09-02T04:00:00.000Z")}
      />
    );

    const statusChart = screen.getByRole("region", { name: "任务状态分布" });
    expect(within(statusChart).getByText("还没开始")).toBeInTheDocument();
    expect(within(statusChart).getAllByText("1")).toHaveLength(3);
    expect(within(statusChart).getByText("2")).toBeInTheDocument();

    const trend = screen.getByRole("region", { name: "最近 7 天完成趋势" });
    expect(within(trend).getByText("9月1日")).toBeInTheDocument();
    expect(within(trend).getByText("完成 2 项")).toBeInTheDocument();
  });
});
