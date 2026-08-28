import { describe, expect, it } from "vitest";

import { makeFileDownloadHandler } from "@/features/content/api/file-download-handler";

describe("GET /api/files/:attachmentId", () => {
  it("redirects a verified member to a 60-second private link", async () => {
    const handler = makeFileDownloadHandler({
      getVerifiedUser: async () => ({
        id: "user_employee",
        role: "employee",
        name: "Employee",
        imageUrl: null,
      }),
      findAttachment: async () => ({
        id: "33333333-3333-4333-8333-333333333333",
        contentId: "22222222-2222-4222-8222-222222222222",
        storagePath: "222/post.png",
        fileName: "post.png",
        mimeType: "image/png",
        byteSize: 1024,
        uploaderId: "user_employee",
        createdAt: "2026-08-28T03:00:00.000Z",
      }),
      createSignedUrl: async (_path, expiresIn) =>
        expiresIn === 60 ? "https://storage.example/private" : "wrong",
    });

    const response = await handler(new Request("http://localhost"), {
      params: Promise.resolve({
        attachmentId: "33333333-3333-4333-8333-333333333333",
      }),
    });

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://storage.example/private"
    );
  });

  it("does not reveal a missing or archived attachment", async () => {
    const handler = makeFileDownloadHandler({
      getVerifiedUser: async () => ({
        id: "user_employee",
        role: "employee",
        name: "Employee",
        imageUrl: null,
      }),
      findAttachment: async () => null,
      createSignedUrl: async () => "unused",
    });

    const response = await handler(new Request("http://localhost"), {
      params: Promise.resolve({
        attachmentId: "33333333-3333-4333-8333-333333333333",
      }),
    });

    expect(response.status).toBe(404);
  });
});
