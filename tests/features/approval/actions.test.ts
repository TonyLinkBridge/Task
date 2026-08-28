import { describe, expect, it } from "vitest";

import {
  makeApprovalActions,
  type ApprovalActionRepository,
} from "@/features/approval/action-service";
import type { ContentRecord } from "@/features/content/types";

const contentId = "22222222-2222-4222-8222-222222222222";

function content(overrides: Partial<ContentRecord> = {}): ContentRecord {
  return {
    id: contentId,
    title: "明天的贴文",
    status: "in_review",
    authorId: "user_employee",
    assigneeId: "user_employee",
    publishAt: "2026-08-29T02:00:00.000Z",
    liveblocksRoomId: `content:${contentId}`,
    currentVersion: 4,
    requiredApprovals: 2,
    requestedReviewerId: null,
    publishedBy: null,
    publishedAt: null,
    linkedTaskId: "33333333-3333-4333-8333-333333333333",
    archivedAt: null,
    createdAt: "2026-08-28T02:00:00.000Z",
    updatedAt: "2026-08-28T02:00:00.000Z",
    ...overrides,
  };
}

function createHarness(options?: {
  role?: "employee" | "admin";
  record?: ContentRecord;
}) {
  let record = options?.record ?? content();
  const calls: string[] = [];
  const revalidatedPaths: string[] = [];

  const repository: ApprovalActionRepository = {
    async find() {
      return record;
    },
    async submitForReview(_id, _json, actorId, requestedReviewerId) {
      calls.push(`submit:${actorId}:${requestedReviewerId ?? "none"}`);
      record = {
        ...record,
        status: "in_review",
        currentVersion: record.currentVersion + 1,
        requestedReviewerId: requestedReviewerId ?? null,
      };
      return record;
    },
    async approve(_id, version, actorId) {
      calls.push(`approve:${version}:${actorId}`);
      record = { ...record, status: "approved" };
      return record;
    },
    async requestChanges(_id, version, actorId, message) {
      calls.push(`changes:${version}:${actorId}:${message}`);
      record = { ...record, status: "changes_requested" };
      return record;
    },
    async unlockApproved(_id, actorId) {
      calls.push(`unlock:${actorId}`);
      record = { ...record, status: "changes_requested" };
      return record;
    },
    async markPublished(_id, actorId) {
      calls.push(`published:${actorId}`);
      record = { ...record, status: "published", publishedBy: actorId };
      return record;
    },
    async archive(_id, actorId) {
      calls.push(`archive:${actorId}`);
      record = { ...record, status: "archived" };
      return record;
    },
  };

  const actions = makeApprovalActions({
    getVerifiedUser: async () => ({
      id: options?.role === "employee" ? "user_employee" : "user_admin_a",
      role: options?.role ?? "admin",
      name: "使用者",
      imageUrl: null,
    }),
    repository,
    revalidatePath: (path) => revalidatedPaths.push(path),
  });

  return { actions, calls, revalidatedPaths };
}

describe("content approval actions", () => {
  it("rejects approval for an old version", async () => {
    const { actions, calls } = createHarness();

    await expect(actions.approveContent(contentId, 3)).resolves.toEqual({
      ok: false,
      message: "内容已经更新，请重新检查",
    });
    expect(calls).toEqual([]);
  });

  it("does not let an employee approve content", async () => {
    const { actions, calls } = createHarness({ role: "employee" });

    await expect(actions.approveContent(contentId, 4)).resolves.toEqual({
      ok: false,
      message: "只有管理员可以批准内容。",
    });
    expect(calls).toEqual([]);
  });

  it("submits the current document and chosen reviewer", async () => {
    const { actions, calls, revalidatedPaths } = createHarness();

    const result = await actions.submitForReview(
      contentId,
      [{ type: "paragraph", content: "内容" }],
      "user_admin_b"
    );

    expect(result).toMatchObject({
      ok: true,
      data: { status: "in_review", requestedReviewerId: "user_admin_b" },
    });
    expect(calls).toEqual(["submit:user_admin_a:user_admin_b"]);
    expect(revalidatedPaths).toEqual(["/content", `/content/${contentId}`]);
  });

  it("requires a reason before requesting changes", async () => {
    const { actions, calls } = createHarness();

    await expect(
      actions.requestChanges(contentId, 4, "   ")
    ).resolves.toEqual({ ok: false, message: "请写下需要修改的地方。" });
    expect(calls).toEqual([]);
  });

  it("only lets an admin archive content", async () => {
    const { actions, calls } = createHarness({ role: "employee" });

    await expect(actions.archiveContent(contentId)).resolves.toEqual({
      ok: false,
      message: "只有管理员可以收起内容。",
    });
    expect(calls).toEqual([]);
  });
});
