import { z } from "zod";

import type { VerifiedUser } from "@/lib/auth/types";

type Dependencies = {
  getVerifiedUser: () => Promise<VerifiedUser>;
  clearResolvedThreads: (roomId: string) => Promise<number>;
};

export function makeInlineThreadActions(dependencies: Dependencies) {
  return {
    async clearResolvedComments(contentId: string) {
      const user = await dependencies.getVerifiedUser();
      if (user.role !== "admin") {
        return {
          ok: false as const,
          message: "只有管理员可以清空已解决留言。",
        };
      }
      if (!z.uuid().safeParse(contentId).success) {
        return { ok: false as const, message: "内容编号不正确。" };
      }

      const deleted = await dependencies.clearResolvedThreads(
        `content:${contentId}`
      );
      return { ok: true as const, deleted };
    },
  };
}
