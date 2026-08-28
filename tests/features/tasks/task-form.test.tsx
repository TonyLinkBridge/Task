import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { TaskForm } from "@/features/tasks/components/task-form";
import type { TaskInput } from "@/features/tasks/schema";
import type { AssignableUser, TaskRecord } from "@/features/tasks/types";

const employee: AssignableUser = {
  id: "user_employee",
  role: "employee",
  name: "Employee",
  imageUrl: null,
};

describe("TaskForm", () => {
  it("creates a task with the selected assignee and priority", async () => {
    const user = userEvent.setup();
    let receivedInput: TaskInput | undefined;
    const savedTasks: TaskRecord[] = [];
    render(
      <TaskForm
        assignees={[employee]}
        createTaskAction={async (input) => {
          receivedInput = input as TaskInput;
          return {
            ok: true,
            data: {
              id: "11111111-1111-4111-8111-111111111111",
              ...(input as TaskInput),
              status: "todo",
              kind: "general",
              creatorId: "user_admin",
              position: 1000,
              linkedContentId: null,
              archivedAt: null,
              createdAt: "2026-08-28T02:00:00.000Z",
              updatedAt: "2026-08-28T02:00:00.000Z",
            },
          };
        }}
        onSaved={(task) => savedTasks.push(task)}
      />
    );

    await user.click(screen.getByRole("button", { name: "新增任务" }));
    await user.type(screen.getByLabelText("标题"), "准备周报");
    await user.selectOptions(screen.getByLabelText("负责人"), "user_employee");
    await user.selectOptions(screen.getByLabelText("优先级"), "urgent");
    fireEvent.change(screen.getByLabelText("完成时间"), {
      target: { value: "2026-08-29T10:00" },
    });
    expect(screen.getByLabelText("标题")).toHaveValue("准备周报");
    expect(screen.getByLabelText("负责人")).toHaveValue("user_employee");
    expect(screen.getByLabelText("优先级")).toHaveValue("urgent");
    expect(screen.getByLabelText("完成时间")).toHaveValue("2026-08-29T10:00");
    await user.click(screen.getByRole("button", { name: "保存任务" }));

    await waitFor(() => expect(savedTasks).toHaveLength(1));
    expect(receivedInput).toMatchObject({
      title: "准备周报",
      assigneeId: "user_employee",
      priority: "urgent",
    });
    expect(receivedInput?.dueAt).toBe("2026-08-29T02:00:00.000Z");
  });

  it("labels the trigger as edit when a task is provided", () => {
    render(
      <TaskForm
        assignees={[employee]}
        initialTask={{
          id: "11111111-1111-4111-8111-111111111111",
          title: "准备周报",
          description: "",
          status: "todo",
          priority: "medium",
          kind: "general",
          assigneeId: employee.id,
          creatorId: "user_admin",
          dueAt: "2026-08-29T02:00:00.000Z",
          position: 1000,
          linkedContentId: null,
          archivedAt: null,
          createdAt: "2026-08-28T02:00:00.000Z",
          updatedAt: "2026-08-28T02:00:00.000Z",
        }}
      />
    );

    expect(screen.getByRole("button", { name: "修改任务" })).toBeInTheDocument();
  });
});
