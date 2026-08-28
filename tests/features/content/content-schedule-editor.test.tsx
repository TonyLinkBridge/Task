import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

import {
  ContentScheduleEditor,
} from "@/features/content/components/content-schedule-editor";
import { canEditContentSchedule } from "@/features/content/schedule-edit-permission";
import type { ContentRecord } from "@/features/content/types";

const content: ContentRecord = {
  id: "22222222-2222-4222-8222-222222222222",
  title: "旧标题",
  status: "draft",
  authorId: "user_employee",
  assigneeId: "user_employee",
  publishAt: "2026-08-29T02:00:00.000Z",
  liveblocksRoomId: "content:22222222-2222-4222-8222-222222222222",
  currentVersion: 0,
  requiredApprovals: 2,
  requestedReviewerId: null,
  publishedBy: null,
  publishedAt: null,
  linkedTaskId: "33333333-3333-4333-8333-333333333333",
  archivedAt: null,
  createdAt: "2026-08-28T02:00:00.000Z",
  updatedAt: "2026-08-28T02:00:00.000Z",
};

describe("ContentScheduleEditor", () => {
  it("opens with current values, saves, closes, and refreshes", async () => {
    const user = userEvent.setup();
    const updateAction = vi.fn(async (_id: unknown, input: unknown) => ({
      ok: true as const,
      data: { ...content, ...(input as object), title: "新标题" },
    }));
    render(
      <ContentScheduleEditor
        content={content}
        platformIds={["11111111-1111-4111-8111-111111111111"]}
        platforms={[
          {
            id: "11111111-1111-4111-8111-111111111111",
            name: "Instagram",
            color: "#ec4899",
            archivedAt: null,
            createdAt: "2026-08-28T02:00:00.000Z",
          },
        ]}
        assignees={[
          {
            id: "user_employee",
            role: "employee",
            name: "员工",
            imageUrl: null,
          },
        ]}
        updateAction={updateAction}
      />
    );

    expect(screen.queryByLabelText("标题")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "编辑排期资料" }));
    expect(screen.getByLabelText("标题")).toHaveValue("旧标题");

    await user.clear(screen.getByLabelText("标题"));
    await user.type(screen.getByLabelText("标题"), "新标题");
    await user.click(screen.getByRole("button", { name: "保存修改" }));

    await waitFor(() =>
      expect(updateAction).toHaveBeenCalledWith(
        content.id,
        expect.objectContaining({ title: "新标题" })
      )
    );
    await waitFor(() =>
      expect(screen.queryByLabelText("标题")).not.toBeInTheDocument()
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("only authorizes editable content for an admin, author, or assignee", () => {
    const unrelatedEmployee = {
      id: "other-employee",
      role: "employee" as const,
      name: "其他员工",
      imageUrl: null,
    };
    const author = {
      id: "user_employee",
      role: "employee" as const,
      name: "员工",
      imageUrl: null,
    };
    const admin = {
      id: "admin-a",
      role: "admin" as const,
      name: "上司",
      imageUrl: null,
    };

    expect(canEditContentSchedule(content, unrelatedEmployee)).toBe(false);
    expect(canEditContentSchedule(content, author)).toBe(true);
    expect(canEditContentSchedule(content, admin)).toBe(true);
    expect(
      canEditContentSchedule({ ...content, status: "in_review" }, admin)
    ).toBe(false);
  });
});
