import { z } from "zod";

import type { ContentComment } from "@/features/content/types";
import type { VerifiedUser } from "@/lib/auth/types";

type Dependencies = {
  getVerifiedUser: () => Promise<VerifiedUser>;
  addComment: (
    contentId: string,
    authorId: string,
    body: string
  ) => Promise<ContentComment>;
  revalidatePath: (path: string) => void;
};

const commentSchema = z.object({
  contentId: z.uuid(),
  body: z.string().trim().min(1).max(5000),
});

export function makeContentCommentActions(dependencies: Dependencies) {
  return {
    async addContentComment(contentId: string, body: string) {
      const user = await dependencies.getVerifiedUser();
      const parsed = commentSchema.safeParse({ contentId, body });
      if (!parsed.success) {
        return { ok: false as const, message: "留言不能为空。" };
      }

      try {
        const comment = await dependencies.addComment(
          parsed.data.contentId,
          user.id,
          parsed.data.body
        );
        dependencies.revalidatePath(`/content/${parsed.data.contentId}`);
        return { ok: true as const, data: comment };
      } catch {
        return {
          ok: false as const,
          message: "暂时无法留言，请稍后再试。",
        };
      }
    },
  };
}
