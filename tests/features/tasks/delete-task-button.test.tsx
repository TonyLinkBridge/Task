import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeleteTaskButton } from "@/features/tasks/components/delete-task-button";
const push = vi.fn(); const refresh = vi.fn();
vi.mock("next/navigation", () => ({useRouter: () => ({push, refresh})}));
beforeEach(() => { push.mockClear(); refresh.mockClear(); });
describe("DeleteTaskButton", () => {
  it("does not delete before an explicit confirmation and returns to the requested board", async () => {
    const user = userEvent.setup();
    const browserConfirm = vi.spyOn(window,"confirm").mockReturnValue(true);
    const deleteTaskAction = vi.fn(async () => ({ok:true as const}));
    render(<DeleteTaskButton taskId="one" deleteTaskAction={deleteTaskAction} redirectTo="/marketing/tasks"/>);
    await user.click(screen.getByRole("button",{name:"删除任务"}));
    expect(screen.getByRole("alertdialog",{name:"删除这个任务？"})).toHaveAccessibleDescription("任务和留言都会消失，删除后不能恢复。");
    expect(deleteTaskAction).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button",{name:"取消"}));
    expect(deleteTaskAction).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button",{name:"删除任务"}));
    await user.click(screen.getByRole("button",{name:"永久删除任务"}));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/marketing/tasks"));
    expect(deleteTaskAction).toHaveBeenCalledExactlyOnceWith("one");
    expect(browserConfirm).not.toHaveBeenCalled(); browserConfirm.mockRestore();
  });
});
