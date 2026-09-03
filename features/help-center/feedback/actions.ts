import { z } from "zod";

import { getVerifiedUser } from "@/lib/auth/get-verified-user";
import type { VerifiedUser } from "@/lib/auth/types";
import {
  helpFeedbackRepository,
  type SaveHelpFeedbackInput,
} from "./repository";

const feedbackSchema = z.object({
  articleSlug: z.string().trim().min(1).max(300),
  helpful: z.boolean(),
  comment: z.string().trim().min(3).max(512).optional(),
});

type Dependencies = {
  getVerifiedUser: () => Promise<VerifiedUser>;
  saveFeedback: (input: SaveHelpFeedbackInput) => Promise<void>;
};

export function makeHelpFeedbackActions(dependencies: Dependencies) {
  return {
    async saveHelpFeedback(input: unknown) {
      try {
        const user = await dependencies.getVerifiedUser();
        const parsed = feedbackSchema.safeParse(input);
        if (!parsed.success) {
          return { ok: false as const, message: "请检查反馈内容。" };
        }

        await dependencies.saveFeedback({
          articleSlug: parsed.data.articleSlug,
          clerkUserId: user.id,
          helpful: parsed.data.helpful,
          comment: parsed.data.helpful ? null : (parsed.data.comment ?? null),
        });
        return { ok: true as const, message: "谢谢你的反馈。" };
      } catch {
        return { ok: false as const, message: "暂时无法保存反馈，请稍后再试。" };
      }
    },
  };
}

const helpFeedbackActions = makeHelpFeedbackActions({
  getVerifiedUser,
  saveFeedback: (input) => helpFeedbackRepository.save(input),
});

export async function saveHelpFeedback(input: unknown) {
  "use server";
  return helpFeedbackActions.saveHelpFeedback(input);
}
