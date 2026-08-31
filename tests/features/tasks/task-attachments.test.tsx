import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TaskAttachments } from "@/features/tasks/components/task-attachments";

describe("TaskAttachments", () => {
  it("shows private downloads and an upload control", () => {
    render(
      <TaskAttachments
        taskId="11111111-1111-4111-8111-111111111111"
        attachments={[
          {
            id: "33333333-3333-4333-8333-333333333333",
            taskId: "11111111-1111-4111-8111-111111111111",
            storagePath: "111/brief.pdf",
            fileName: "brief.pdf",
            mimeType: "application/pdf",
            byteSize: 1024,
            uploaderId: "user_employee",
            createdAt: "2026-08-31T03:00:00.000Z",
          },
        ]}
      />
    );

    expect(screen.getByRole("link", { name: "brief.pdf" })).toHaveAttribute(
      "href",
      "/api/task-files/33333333-3333-4333-8333-333333333333"
    );
    expect(screen.getByLabelText("上传任务附件")).toBeInTheDocument();
  });
});
