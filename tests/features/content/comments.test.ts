import { describe, expect, it } from "vitest";

import { makeContentCommentActions } from "@/features/content/comments-service";
import type { ContentComment } from "@/features/content/types";

function createHarness() {
  const comments: ContentComment[] = [];
  const actions = makeContentCommentActions({
    getVerifiedUser: async () => ({
      id: "user_admin",
      role: "admin",
      name: "Admin",
      imageUrl: null,
    }),
    addComment: async (contentId, authorId, body) => {
      const comment = {
        id: "33333333-3333-4333-8333-333333333333",
        contentId,
        authorId,
        body,
        createdAt: "2026-08-28T03:00:00.000Z",
      };
      comments.push(comment);
      return comment;
    },
    revalidatePath: () => undefined,
  });
  return { actions, comments };
}

describe("content comment actions", () => {
  it("rejects a whitespace-only general comment", async () => {
    const { actions, comments } = createHarness();

    const result = await actions.addContentComment(
      "22222222-2222-4222-8222-222222222222",
      "   "
    );

    expect(result).toEqual({ ok: false, message: "留言不能为空。" });
    expect(comments).toEqual([]);
  });

  it("records the verified member as the author", async () => {
    const { actions, comments } = createHarness();

    const result = await actions.addContentComment(
      "22222222-2222-4222-8222-222222222222",
      "请换一张图片"
    );

    expect(result).toMatchObject({ ok: true });
    expect(comments[0]).toMatchObject({
      authorId: "user_admin",
      body: "请换一张图片",
    });
  });
});
