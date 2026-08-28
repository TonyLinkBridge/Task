import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { TaskComments } from "@/features/tasks/components/task-comments";

const currentUser = {
  id: "user_admin",
  role: "admin" as const,
  name: "Admin",
  imageUrl: null,
};

describe("TaskComments", () => {
  it("does not submit a whitespace-only comment", async () => {
    const user = userEvent.setup();
    render(
      <TaskComments
        taskId="11111111-1111-4111-8111-111111111111"
        comments={[]}
        currentUser={currentUser}
      />
    );

    await user.type(screen.getByRole("textbox"), "   ");

    expect(screen.getByRole("button", { name: "留言" })).toBeDisabled();
  });

  it("shows a new comment and clears the box after saving", async () => {
    const user = userEvent.setup();
    render(
      <TaskComments
        taskId="11111111-1111-4111-8111-111111111111"
        comments={[]}
        currentUser={currentUser}
        addCommentAction={async (taskId, body) => ({
          ok: true,
          data: {
            id: "22222222-2222-4222-8222-222222222222",
            taskId,
            authorId: currentUser.id,
            body,
            createdAt: "2026-08-28T02:00:00.000Z",
          },
        })}
      />
    );

    await user.type(screen.getByRole("textbox"), "请补上最后一张图片");
    await user.click(screen.getByRole("button", { name: "留言" }));

    await waitFor(() =>
      expect(screen.getByText("请补上最后一张图片")).toBeInTheDocument()
    );
    expect(screen.getByRole("textbox")).toHaveValue("");
  });
});
