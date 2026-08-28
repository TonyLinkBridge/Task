import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Attachments } from "@/features/content/components/attachments";

describe("Attachments", () => {
  it("shows private downloads and an upload control", () => {
    render(
      <Attachments
        contentId="22222222-2222-4222-8222-222222222222"
        attachments={[
          {
            id: "33333333-3333-4333-8333-333333333333",
            contentId: "22222222-2222-4222-8222-222222222222",
            storagePath: "222/post.png",
            fileName: "post.png",
            mimeType: "image/png",
            byteSize: 1024,
            uploaderId: "user_employee",
            createdAt: "2026-08-28T03:00:00.000Z",
          },
        ]}
      />
    );

    expect(screen.getByRole("link", { name: "post.png" })).toHaveAttribute(
      "href",
      "/api/files/33333333-3333-4333-8333-333333333333"
    );
    expect(screen.getByLabelText("上传文件")).toBeInTheDocument();
  });
});
