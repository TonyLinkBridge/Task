import { describe, expect, it } from "vitest";

import { makeTaskFileActions } from "@/features/tasks/files/service";

const fileMeta = { name: "brief.pdf", type: "application/pdf", size: 1024 };

function harness(kind: "general" | "content_publish" = "general") {
  return makeTaskFileActions({
    getVerifiedUser: async () => ({
      id: "user_employee",
      role: "employee",
      name: "Employee",
      imageUrl: null,
    }),
    findTask: async () => ({ id: "task", kind }),
    createUploadUrl: async () => ({ token: "upload-token" }),
    inspectUpload: async () => ({ size: 1024, type: "application/pdf" }),
    saveAttachment: async (input) => ({
      id: "33333333-3333-4333-8333-333333333333",
      taskId: input.taskId,
      storagePath: input.storagePath,
      fileName: input.fileName,
      mimeType: input.mimeType,
      byteSize: input.byteSize,
      uploaderId: input.uploaderId,
      createdAt: "2026-08-31T03:00:00.000Z",
    }),
    createId: () => "44444444-4444-4444-8444-444444444444",
    revalidatePath: () => undefined,
  });
}

describe("task file actions", () => {
  it("creates a private upload link for a normal task", async () => {
    await expect(
      harness().requestUpload(
        "11111111-1111-4111-8111-111111111111",
        fileMeta
      )
    ).resolves.toEqual({
      ok: true,
      data: {
        storagePath:
          "11111111-1111-4111-8111-111111111111/44444444-4444-4444-8444-444444444444-brief.pdf",
        token: "upload-token",
      },
    });
  });

  it("keeps content scheduling files on the content page", async () => {
    await expect(
      harness("content_publish").requestUpload(
        "11111111-1111-4111-8111-111111111111",
        fileMeta
      )
    ).resolves.toEqual({
      ok: false,
      message: "发布任务的文件要在内容排期里管理。",
    });
  });

  it("rejects a completed upload outside the task folder", async () => {
    await expect(
      harness().finishUpload(
        "11111111-1111-4111-8111-111111111111",
        "another-task/brief.pdf",
        fileMeta
      )
    ).resolves.toEqual({ ok: false, message: "文件资料不正确。" });
  });
});
