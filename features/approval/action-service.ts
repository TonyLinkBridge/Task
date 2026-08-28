import { z } from "zod";

import type { ContentRecord } from "@/features/content/types";
import { canEditBody } from "@/features/approval/rules";
import type { VerifiedUser } from "@/lib/auth/types";

export type ApprovalActionRepository = {
  find(contentId: string): Promise<ContentRecord | null>;
  submitForReview(
    contentId: string,
    blocknoteJson: unknown,
    actorId: string,
    requestedReviewerId?: string
  ): Promise<ContentRecord>;
  approve(
    contentId: string,
    version: number,
    actorId: string
  ): Promise<ContentRecord>;
  requestChanges(
    contentId: string,
    version: number,
    actorId: string,
    message: string
  ): Promise<ContentRecord>;
  unlockApproved(contentId: string, actorId: string): Promise<ContentRecord>;
  markPublished(contentId: string, actorId: string): Promise<ContentRecord>;
  archive(contentId: string, actorId: string): Promise<ContentRecord>;
};

type Dependencies = {
  getVerifiedUser: () => Promise<VerifiedUser>;
  repository: ApprovalActionRepository;
  setRoomEditable: (roomId: string, editable: boolean) => Promise<void>;
  revalidatePath: (path: string) => void;
};

export type ApprovalActionResult =
  | { ok: true; data: ContentRecord }
  | { ok: false; message: string };

const contentIdSchema = z.uuid();
const versionSchema = z.number().int().positive();
const reviewerSchema = z.string().trim().min(1).optional();
const messageSchema = z.string().trim().min(1).max(5000);

function isJsonValue(value: unknown): boolean {
  try {
    return JSON.stringify(value) !== undefined;
  } catch {
    return false;
  }
}

function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("CONTENT_VERSION_STALE")) {
    return "内容已经更新，请重新检查";
  }
  if (message.includes("CONTENT_REVIEWER_MISMATCH")) {
    return "这份内容已经交给另一位管理员检查。";
  }
  if (message.includes("CONTENT_NOT_PUBLISHABLE")) {
    return "内容还没有批准完成，暂时不能发布。";
  }
  if (message.includes("CONTENT_NOT_FOUND")) {
    return "找不到这份内容。";
  }
  return "暂时无法保存，请稍后再试。";
}

export function makeApprovalActions(dependencies: Dependencies) {
  function revalidate(contentId: string) {
    dependencies.revalidatePath("/content");
    dependencies.revalidatePath(`/content/${contentId}`);
  }

  async function save(
    contentId: string,
    operation: () => Promise<ContentRecord>
  ): Promise<ApprovalActionResult> {
    try {
      const data = await operation();
      revalidate(contentId);
      return { ok: true, data };
    } catch (error) {
      return { ok: false, message: errorMessage(error) };
    }
  }

  async function currentVersionIs(
    contentId: string,
    version: number
  ): Promise<boolean | null> {
    const record = await dependencies.repository.find(contentId);
    return record ? record.currentVersion === version : null;
  }

  async function reconcileRoomAccess(contentId: string): Promise<boolean> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const before = await dependencies.repository.find(contentId);
      if (!before) return false;
      const editable = canEditBody(before.status);
      await dependencies.setRoomEditable(before.liveblocksRoomId, editable);
      const after = await dependencies.repository.find(contentId);
      if (
        after &&
        after.liveblocksRoomId === before.liveblocksRoomId &&
        canEditBody(after.status) === editable
      ) {
        return true;
      }
    }
    return false;
  }

  return {
    async submitForReview(
      contentId: string,
      blocknoteJson: unknown,
      requestedReviewerId?: string
    ): Promise<ApprovalActionResult> {
      const user = await dependencies.getVerifiedUser();
      const parsedId = contentIdSchema.safeParse(contentId);
      const parsedReviewer = reviewerSchema.safeParse(requestedReviewerId);
      if (!parsedId.success || !parsedReviewer.success || !isJsonValue(blocknoteJson)) {
        return { ok: false, message: "请检查内容后再提交。" };
      }

      const reviewerId =
        user.role === "admin" ? (parsedReviewer.data ?? user.id) : undefined;
      const current = await dependencies.repository.find(parsedId.data);
      if (!current) return { ok: false, message: "找不到这份内容。" };

      try {
        await dependencies.setRoomEditable(current.liveblocksRoomId, false);
      } catch {
        return { ok: false, message: "暂时无法锁定内容，请稍后再试。" };
      }

      const result = await save(parsedId.data, () =>
        dependencies.repository.submitForReview(
          parsedId.data,
          blocknoteJson,
          user.id,
          reviewerId
        )
      );
      if (!result.ok) {
        await reconcileRoomAccess(parsedId.data).catch(() => false);
      } else if (!(await reconcileRoomAccess(parsedId.data).catch(() => false))) {
        return {
          ok: false,
          message: "内容已经送审，但权限同步失败，请刷新页面确认。",
        };
      }
      return result;
    },

    async approveContent(
      contentId: string,
      version: number
    ): Promise<ApprovalActionResult> {
      const user = await dependencies.getVerifiedUser();
      if (user.role !== "admin") {
        return { ok: false, message: "只有管理员可以批准内容。" };
      }
      const parsedId = contentIdSchema.safeParse(contentId);
      const parsedVersion = versionSchema.safeParse(version);
      if (!parsedId.success || !parsedVersion.success) {
        return { ok: false, message: "找不到要批准的内容。" };
      }
      const current = await currentVersionIs(parsedId.data, parsedVersion.data);
      if (current === null) return { ok: false, message: "找不到这份内容。" };
      if (!current) {
        return { ok: false, message: "内容已经更新，请重新检查" };
      }

      return save(parsedId.data, () =>
        dependencies.repository.approve(
          parsedId.data,
          parsedVersion.data,
          user.id
        )
      );
    },

    async requestChanges(
      contentId: string,
      version: number,
      message: string
    ): Promise<ApprovalActionResult> {
      const user = await dependencies.getVerifiedUser();
      if (user.role !== "admin") {
        return { ok: false, message: "只有管理员可以要求修改。" };
      }
      const parsedId = contentIdSchema.safeParse(contentId);
      const parsedVersion = versionSchema.safeParse(version);
      const parsedMessage = messageSchema.safeParse(message);
      if (!parsedMessage.success) {
        return { ok: false, message: "请写下需要修改的地方。" };
      }
      if (!parsedId.success || !parsedVersion.success) {
        return { ok: false, message: "找不到这份内容。" };
      }
      const current = await currentVersionIs(parsedId.data, parsedVersion.data);
      if (current === null) return { ok: false, message: "找不到这份内容。" };
      if (!current) {
        return { ok: false, message: "内容已经更新，请重新检查" };
      }

      const result = await save(parsedId.data, () =>
        dependencies.repository.requestChanges(
          parsedId.data,
          parsedVersion.data,
          user.id,
          parsedMessage.data
        )
      );
      if (result.ok) {
        if (!(await reconcileRoomAccess(parsedId.data).catch(() => false))) {
          return {
            ok: false,
            message: "修改要求已经保存，但编辑区暂时没打开，请刷新页面。",
          };
        }
      }
      return result;
    },

    async unlockApprovedContent(contentId: string): Promise<ApprovalActionResult> {
      const user = await dependencies.getVerifiedUser();
      const parsedId = contentIdSchema.safeParse(contentId);
      if (!parsedId.success) return { ok: false, message: "找不到这份内容。" };
      const result = await save(parsedId.data, () =>
        dependencies.repository.unlockApproved(parsedId.data, user.id)
      );
      if (result.ok) {
        if (!(await reconcileRoomAccess(parsedId.data).catch(() => false))) {
          return {
            ok: false,
            message: "内容已经退回修改，但编辑区暂时没打开，请刷新页面。",
          };
        }
      }
      return result;
    },

    async markPublished(contentId: string): Promise<ApprovalActionResult> {
      const user = await dependencies.getVerifiedUser();
      const parsedId = contentIdSchema.safeParse(contentId);
      if (!parsedId.success) return { ok: false, message: "找不到这份内容。" };
      const result = await save(parsedId.data, () =>
        dependencies.repository.markPublished(parsedId.data, user.id)
      );
      if (result.ok) await reconcileRoomAccess(parsedId.data).catch(() => false);
      return result;
    },

    async archiveContent(contentId: string): Promise<ApprovalActionResult> {
      const user = await dependencies.getVerifiedUser();
      if (user.role !== "admin") {
        return { ok: false, message: "只有管理员可以收起内容。" };
      }
      const parsedId = contentIdSchema.safeParse(contentId);
      if (!parsedId.success) return { ok: false, message: "找不到这份内容。" };
      const result = await save(parsedId.data, () =>
        dependencies.repository.archive(parsedId.data, user.id)
      );
      if (result.ok) {
        try {
          await dependencies.setRoomEditable(
            result.data.liveblocksRoomId,
            false
          );
        } catch {
          return {
            ok: false,
            message: "内容已经收起，但权限同步失败，请刷新页面确认。",
          };
        }
      }
      return result;
    },
  };
}
