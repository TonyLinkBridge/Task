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
  revalidatePath: (path: string) => void;
};

export type ContentActionResult =
  | { ok: true; data: ContentRecord }
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
  };
}
