import { describe, expect, it } from "vitest";

import {
  buildStoragePath,
  fileSchema,
  makeContentFileActions,
} from "@/features/content/files/service";

describe("fileSchema", () => {
  it("rejects a file larger than 100 MB", () => {
    expect(
      fileSchema.safeParse({
        name: "video.mp4",
        type: "video/mp4",
        size: 100 * 1024 * 1024 + 1,
      }).success
    ).toBe(false);
  });

  it("rejects executable files", () => {
    expect(
      fileSchema.safeParse({
        name: "setup.exe",
        type: "application/x-msdownload",
        size: 1024,
      }).success
    ).toBe(false);
  });
});

describe("buildStoragePath", () => {
  it("keeps every upload inside its content folder", () => {
    expect(
      buildStoragePath(
        "22222222-2222-4222-8222-222222222222",
        "图片 ../ 最终版.png",
        "33333333-3333-4333-8333-333333333333"
      )
    ).toBe(
      "22222222-2222-4222-8222-222222222222/33333333-3333-4333-8333-333333333333-_.png"
    );
  });
});

describe("content file actions", () => {
  it("does not create an upload link for missing content", async () => {
    const actions = makeContentFileActions({
      getVerifiedUser: async () => ({
        id: "user_employee",
        role: "employee",
        name: "Employee",
        imageUrl: null,
      }),
      findContent: async () => null,
      createUploadUrl: async () => ({ token: "unused" }),
      inspectUpload: async () => null,
      saveAttachment: async () => {
        throw new Error("unused");
      },
      createId: () => "33333333-3333-4333-8333-333333333333",
      revalidatePath: () => undefined,
    });

    const result = await actions.requestUpload(
      "22222222-2222-4222-8222-222222222222",
      { name: "post.png", type: "image/png", size: 1024 }
    );

    expect(result).toEqual({ ok: false, message: "找不到这条内容。" });
  });

  it("rejects a completed upload outside the content folder", async () => {
    const actions = makeContentFileActions({
      getVerifiedUser: async () => ({
        id: "user_employee",
        role: "employee",
        name: "Employee",
        imageUrl: null,
      }),
      findContent: async () => ({ id: "content" }),
      createUploadUrl: async () => ({ token: "unused" }),
      inspectUpload: async () => ({ size: 1024, type: "image/png" }),
      saveAttachment: async () => {
        throw new Error("unused");
      },
      createId: () => "33333333-3333-4333-8333-333333333333",
      revalidatePath: () => undefined,
    });

    const result = await actions.finishUpload(
      "22222222-2222-4222-8222-222222222222",
      "another-content/post.png",
      { name: "post.png", type: "image/png", size: 1024 }
    );

    expect(result).toEqual({ ok: false, message: "文件资料不正确。" });
  });
});
