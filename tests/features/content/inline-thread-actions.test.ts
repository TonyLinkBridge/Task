import { describe, expect, it } from "vitest";

import { makeInlineThreadActions } from "@/features/content/inline-thread-action-service";

const contentId = "8e49db64-75f5-4bd5-98ab-95652c49ab80";

function setup(role: "employee" | "admin") {
  const calls: string[] = [];
  const actions = makeInlineThreadActions({
    getVerifiedUser: async () => ({
      id: role === "admin" ? "admin-a" : "employee-a",
      role,
      name: role === "admin" ? "上司" : "员工",
      imageUrl: null,
    }),
    clearResolvedThreads: async (roomId) => {
      calls.push(roomId);
      return 11;
    },
  });
  return { actions, calls };
}

describe("clear resolved inline comments", () => {
  it("does not let an employee clear resolved comments", async () => {
    const { actions, calls } = setup("employee");

    await expect(actions.clearResolvedComments(contentId)).resolves.toEqual({
      ok: false,
      message: "只有管理员可以清空已解决留言。",
    });
    expect(calls).toEqual([]);
  });

  it("clears every resolved comment in the content room for an admin", async () => {
    const { actions, calls } = setup("admin");

    await expect(actions.clearResolvedComments(contentId)).resolves.toEqual({
      ok: true,
      deleted: 11,
    });
    expect(calls).toEqual([`content:${contentId}`]);
  });

  it("rejects an invalid content id before deleting anything", async () => {
    const { actions, calls } = setup("admin");

    await expect(actions.clearResolvedComments("wrong-id")).resolves.toEqual({
      ok: false,
      message: "内容编号不正确。",
    });
    expect(calls).toEqual([]);
  });
});
