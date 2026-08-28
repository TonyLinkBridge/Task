import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ArchiveTaskButton } from "@/features/tasks/components/archive-task-button";

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => router }));

describe("ArchiveTaskButton", () => {
  beforeEach(() => {
    router.push.mockClear();
    router.refresh.mockClear();
  });

  it("asks for confirmation before archiving a normal task", async () => {
    const user = userEvent.setup();
    let archived = false;
    render(
      <ArchiveTaskButton
        taskId="11111111-1111-4111-8111-111111111111"
        taskKind="general"
        archiveTaskAction={async () => {
          archived = true;
          return {
            ok: true,
            data: {
              id: "11111111-1111-4111-8111-111111111111",
            },
          } as never;
        }}
      />
    );

    await user.click(screen.getByRole("button", { name: "收起任务" }));
    expect(screen.getByText("确定要收起这个任务吗？")).toBeInTheDocument();
    expect(archived).toBe(false);

    await user.click(screen.getByRole("button", { name: "确认收起" }));
    await waitFor(() => expect(archived).toBe(true));
    expect(router.push).toHaveBeenCalledWith("/tasks");
  });

  it("does not offer archive for a scheduled-content task", () => {
    render(
      <ArchiveTaskButton
        taskId="11111111-1111-4111-8111-111111111111"
        taskKind="content_publish"
      />
    );

    expect(screen.queryByRole("button", { name: "收起任务" })).not.toBeInTheDocument();
    expect(screen.getByText(/要从内容排期里处理/)).toBeInTheDocument();
  });
});
