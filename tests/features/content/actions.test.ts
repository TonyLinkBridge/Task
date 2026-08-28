import { describe, expect, it } from "vitest";

import { makeContentActions } from "@/features/content/action-service";
import type { ContentInput } from "@/features/content/schema";

const validInput: ContentInput = {
  title: "新品贴文",
  platformIds: ["11111111-1111-4111-8111-111111111111"],
  assigneeId: "employee",
  publishAt: "2026-08-29T02:00:00.000Z",
};

describe("content actions", () => {
  it("uses the signed-in person as author", async () => {
    const authors: string[] = [];
    const paths: string[] = [];
    const actions = makeContentActions({
      getVerifiedUser: async () => ({ id: "admin-a", role: "admin", name: "A", imageUrl: null }),
      create: async (input, authorId) => {
        authors.push(authorId);
        return {
          id: "22222222-2222-4222-8222-222222222222",
          ...input,
          status: "draft",
          authorId,
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
        };
      },
      revalidatePath: (path) => paths.push(path),
    });

    const result = await actions.createScheduledContent(validInput);

    expect(result).toMatchObject({ ok: true, data: { title: "新品贴文" } });
    expect(authors).toEqual(["admin-a"]);
    expect(paths).toEqual(["/content"]);
  });

  it("rejects a content item without a platform", async () => {
    const actions = makeContentActions({
      getVerifiedUser: async () => ({ id: "employee", role: "employee", name: "员工", imageUrl: null }),
      create: async () => {
        throw new Error("should not run");
      },
      revalidatePath: () => undefined,
    });

    await expect(
      actions.createScheduledContent({ ...validInput, platformIds: [] })
    ).resolves.toEqual({ ok: false, message: "请检查排期内容。" });
  });
});
