import type { ContentInput } from "@/features/content/schema";
import { contentInputSchema } from "@/features/content/schema";
import type { ContentRecord } from "@/features/content/types";
import type { VerifiedUser } from "@/lib/auth/types";
import { z } from "zod";

type Dependencies = {
  getVerifiedUser: () => Promise<VerifiedUser>;
  create: (input: ContentInput, authorId: string) => Promise<ContentRecord>;
  update: (
    contentId: string,
    input: ContentInput,
    actorId: string
  ) => Promise<ContentRecord>;
  find?: (contentId: string) => Promise<ContentRecord | null>;
  remove?: (
    contentId: string,
    actorId: string
  ) => Promise<{ roomId: string; storagePaths: string[] }>;
  deleteRoom?: (roomId: string) => Promise<void>;
  deleteFiles?: (paths: string[]) => Promise<void>;
  revalidatePath: (path: string) => void;
};

export type ContentActionResult =
  | { ok: true; data: ContentRecord }
  | { ok: false; message: string };

export type ContentDeleteResult =
  | { ok: true }
  | { ok: false; message: string };

export function makeContentActions(dependencies: Dependencies) {
  return {
    async createScheduledContent(input: unknown): Promise<ContentActionResult> {
      const user = await dependencies.getVerifiedUser();
      const parsed = contentInputSchema.safeParse(input);
      if (!parsed.success) {
        return { ok: false, message: "请检查排期内容。" };
      }
      try {
        const data = await dependencies.create(parsed.data, user.id);
        dependencies.revalidatePath("/content");
        return { ok: true, data };
      } catch {
        return { ok: false, message: "暂时无法建立内容，请稍后再试。" };
      }
    },

    async updateScheduledContent(
      contentId: unknown,
      input: unknown
    ): Promise<ContentActionResult> {
      const user = await dependencies.getVerifiedUser();
      const parsedId = z.uuid().safeParse(contentId);
      const parsedInput = contentInputSchema.safeParse(input);
      if (!parsedId.success || !parsedInput.success) {
        return { ok: false, message: "请检查排期内容。" };
      }
      try {
        const data = await dependencies.update(
          parsedId.data,
          parsedInput.data,
          user.id
        );
        dependencies.revalidatePath("/content");
        dependencies.revalidatePath(`/content/${parsedId.data}`);
        return { ok: true, data };
      } catch {
        return { ok: false, message: "暂时无法保存修改，请稍后再试。" };
      }
    },

    async deleteScheduledContent(
      contentId: unknown
    ): Promise<ContentDeleteResult> {
      const user = await dependencies.getVerifiedUser();
      const parsedId = z.uuid().safeParse(contentId);
      if (!parsedId.success) {
        return { ok: false, message: "找不到这个内容。" };
      }
      if (!dependencies.find || !dependencies.remove) {
        return { ok: false, message: "暂时无法删除，请稍后再试。" };
      }

      try {
        const content = await dependencies.find(parsedId.data);
        if (!content) {
          return { ok: false, message: "找不到这个内容。" };
        }
        if (user.role !== "admin" && content.authorId !== user.id) {
          return { ok: false, message: "你只能删除自己建立的内容。" };
        }

        const cleanup = await dependencies.remove(parsedId.data, user.id);
        try {
          await dependencies.deleteRoom?.(cleanup.roomId);
        } catch {
          // The content is already gone; an orphaned room can be retried later.
        }
        try {
          if (cleanup.storagePaths.length > 0) {
            await dependencies.deleteFiles?.(cleanup.storagePaths);
          }
        } catch {
          // The content is already gone; orphaned files can be retried later.
        }

        dependencies.revalidatePath("/content");
        dependencies.revalidatePath("/tasks");
        return { ok: true };
      } catch {
        return { ok: false, message: "暂时无法删除，请稍后再试。" };
      }
    },
  };
}
