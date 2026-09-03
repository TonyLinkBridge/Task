import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DeleteTaskButton } from "@/features/tasks/components/delete-task-button";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

describe("DeleteTaskButton", () => {
  it("requires confirmation before permanently deleting a task", async () => {
    const user = userEvent.setup();
    const deleteAction = vi.fn(async () => ({ ok: true as const }));
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <DeleteTaskButton
        taskId="11111111-1111-4111-8111-111111111111"
        deleteTaskAction={deleteAction}
      />
    );
    await user.click(screen.getByRole("button", { name: "删除任务" }));

    expect(window.confirm).toHaveBeenCalledWith(
      "确定永久删除这个任务吗？任务和留言都会消失，而且不能恢复。"
    );
    expect(deleteAction).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111111"
    );
    expect(push).toHaveBeenCalledWith("/tasks");
  });
});
