import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ContentForm } from "@/features/content/components/content-form";
import type { ContentInput } from "@/features/content/schema";
import type { ContentPlatform, ContentRecord } from "@/features/content/types";
import type { AssignableUser } from "@/features/tasks/types";

const platform: ContentPlatform = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Instagram",
  color: "#ec4899",
  archivedAt: null,
  createdAt: "2026-08-28T02:00:00.000Z",
};
const linkedInPlatform: ContentPlatform = {
  id: "44444444-4444-4444-8444-444444444444",
  name: "LinkedIn",
  color: "#2563eb",
  archivedAt: null,
  createdAt: "2026-08-28T02:00:00.000Z",
};
const employee: AssignableUser = {
  id: "employee",
  role: "employee",
  name: "员工",
  imageUrl: null,
};

describe("ContentForm", () => {
  it("only asks for the fixed scheduling fields", async () => {
    const user = userEvent.setup();
    let received: ContentInput | undefined;
    const saved: ContentRecord[] = [];
    render(
      <ContentForm
        platforms={[platform]}
        assignees={[employee]}
        createContentAction={async (input) => {
          received = input as ContentInput;
          return {
            ok: true,
            data: {
              id: "22222222-2222-4222-8222-222222222222",
              ...(input as ContentInput),
              platformIds: undefined,
              status: "draft",
              authorId: "admin-a",
              liveblocksRoomId: "content:22222222-2222-4222-8222-222222222222",
              currentVersion: 0,
              requiredApprovals: 1,
              requestedReviewerId: null,
              publishedBy: null,
              publishedAt: null,
              linkedTaskId: "33333333-3333-4333-8333-333333333333",
              archivedAt: null,
              createdAt: "2026-08-28T02:00:00.000Z",
              updatedAt: "2026-08-28T02:00:00.000Z",
            } as ContentRecord,
          };
        }}
        onSaved={(record) => saved.push(record)}
      />
    );

    await user.type(screen.getByLabelText("标题"), "新品贴文");
    await user.click(screen.getByLabelText("Instagram"));
    await user.selectOptions(screen.getByLabelText("负责人"), "employee");
    fireEvent.change(screen.getByLabelText("发布时间"), {
      target: { value: "2026-08-29T10:00" },
    });
    await user.click(screen.getByRole("button", { name: "建立内容" }));

    await waitFor(() => expect(saved).toHaveLength(1));
    expect(received).toEqual({
      title: "新品贴文",
      platformIds: [platform.id],
      assigneeId: "employee",
      publishAt: "2026-08-29T02:00:00.000Z",
    });
    expect(screen.queryByLabelText("内容目的")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("目标观众")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Hashtag")).not.toBeInTheDocument();
  });

  it("lets people search many platforms and keeps the selection visible", async () => {
    const user = userEvent.setup();
    render(
      <ContentForm
        platforms={[platform, linkedInPlatform]}
        assignees={[employee]}
      />
    );

    await user.click(screen.getByLabelText("Instagram"));
    await user.type(screen.getByLabelText("搜索发布平台"), "linked");

    expect(screen.queryByLabelText("Instagram")).not.toBeInTheDocument();
    expect(screen.getByLabelText("LinkedIn")).toBeInTheDocument();
    expect(screen.getByText("已选择 1 个平台")).toBeInTheDocument();
    expect(screen.getByText("Instagram", { selector: "span" })).toBeInTheDocument();
  });
});
