import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  persistTaskMove,
  TaskBoard,
} from "@/features/tasks/components/task-board";
import type { TaskRecord } from "@/features/tasks/types";

const task: TaskRecord = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "准备周报",
  description: "汇总本周进度",
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

describe("TaskBoard", () => {
  it("renders the four workflow columns", () => {
    render(<TaskBoard initialTasks={[]} assignees={[]} />);

    for (const name of ["还没开始", "正在做", "等人检查", "已经完成"]) {
      expect(screen.getByRole("region", { name })).toBeInTheDocument();
    }
  });

  it("shows each task inside its workflow column", () => {
    render(<TaskBoard initialTasks={[task]} assignees={[]} />);

    expect(
      within(screen.getByRole("region", { name: "还没开始" })).getByText(
        "准备周报"
      )
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "正在做" })).queryByText(
        "准备周报"
      )
    ).not.toBeInTheDocument();
  });

  it("does not show drag or edit controls for a linked publish task", () => {
    render(
      <TaskBoard
        initialTasks={[{ ...task, kind: "content_publish", linkedContentId: "22222222-2222-4222-8222-222222222222" }]}
        assignees={[]}
      />
    );

    expect(screen.queryByRole("button", { name: /拖动/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "编辑" })).not.toBeInTheDocument();
  });
});

describe("persistTaskMove", () => {
  it("restores the previous board when saving the move fails", async () => {
    const snapshots: TaskRecord[][] = [];

    const message = await persistTaskMove({
      tasks: [task],
      taskId: task.id,
      status: "review",
      position: 2000,
      move: async () => ({ ok: false, message: "暂时无法保存。" }),
      showTasks: (tasks) => snapshots.push(tasks),
    });

    expect(snapshots[0][0].status).toBe("review");
    expect(snapshots[1]).toEqual([task]);
    expect(message).toBe("暂时无法保存。");
  });
});
