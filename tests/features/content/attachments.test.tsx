import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Attachments } from "@/features/content/components/attachments";

const input=()=>document.querySelector('input[type="file"]') as HTMLInputElement;
describe("Attachments", () => {
  it("opens the original preview from a library thumbnail without showing an upload form", async () => {
    render(<Attachments contentId="one" editable={false} presentation="library" attachments={[{id:"file-one",contentId:"one",storagePath:"one/photo.png",fileName:"photo.png",mimeType:"image/png",byteSize:2048,uploaderId:"employee",createdAt:"2026-10-25T00:00:00Z"}]} />);
    expect(screen.queryByText("文件", {exact:true})).not.toBeInTheDocument();
    expect(screen.queryByLabelText("上传文件")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button",{name:"预览图片 photo.png"}));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("img",{name:"photo.png 预览"})).toHaveAttribute("src","/api/files/file-one?mode=preview");
    expect(screen.getByText("2.0 KB")).toBeInTheDocument();
  });
  it("restores the upload button when the server request rejects", async () => {
    const user = userEvent.setup();
    render(
      <Attachments
        contentId="22222222-2222-4222-8222-222222222222"
        attachments={[]}
        requestUploadAction={async () => {
          throw new Error("Server Components render failed");
        }}
      />
    );

    await user.upload(
      input(),
      new File(["image"], "post.png", { type: "image/png" })
    );

    expect(
      await screen.findByText("服务器刚刚没有回应，请直接重试，不需要刷新页面。")
    ).toBeInTheDocument();
    expect(input()).toBeEnabled();
    expect(screen.getByText("上传文件")).toBeInTheDocument();
  });

  it("allows the same file to be selected again after a failed upload", async () => {
    const user = userEvent.setup();
    const requestUploadAction = vi.fn(async () => ({
      ok: false as const,
      message: "上传失败，请再试一次。",
    }));
    render(
      <Attachments
        contentId="22222222-2222-4222-8222-222222222222"
        attachments={[]}
        requestUploadAction={requestUploadAction}
      />
    );
    const file = new File(["image"], "post.png", { type: "image/png" });

    await user.upload(input(), file);
    await screen.findByText("上传失败，请再试一次。");
    await user.click(screen.getByRole("button",{name:"Retry post.png"}));

    expect(requestUploadAction).toHaveBeenCalledTimes(2);
  });

  it("previews an image before the member chooses to download it", async () => {
    const user = userEvent.setup();
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

    expect(screen.getByRole("link", { name: "下载 post.png" })).toHaveAttribute(
      "href",
      "/api/files/33333333-3333-4333-8333-333333333333?mode=download"
    );
    await user.click(screen.getByRole("button", { name: "预览 post.png" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "post.png 预览" }))
      .toHaveAttribute(
        "src",
        "/api/files/33333333-3333-4333-8333-333333333333?mode=preview"
      );
    expect(input()).toBeInTheDocument();
  });

  it("offers only download for files the browser cannot preview safely", () => {
    render(
      <Attachments
        contentId="22222222-2222-4222-8222-222222222222"
        attachments={[
          {
            id: "44444444-4444-4444-8444-444444444444",
            contentId: "22222222-2222-4222-8222-222222222222",
            storagePath: "222/brief.docx",
            fileName: "brief.docx",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            byteSize: 1024,
            uploaderId: "user_employee",
            createdAt: "2026-08-28T03:00:00.000Z",
          },
        ]}
      />
    );

    expect(screen.queryByRole("button", { name: "预览 brief.docx" }))
      .not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "下载 brief.docx" }))
      .toHaveAttribute(
        "href",
        "/api/files/44444444-4444-4444-8444-444444444444?mode=download"
      );
  });
});
