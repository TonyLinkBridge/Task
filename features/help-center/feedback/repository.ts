import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type SaveHelpFeedbackInput = {
  articleSlug: string;
  clerkUserId: string;
  helpful: boolean;
  comment: string | null;
};

export function createHelpFeedbackRepository(providedClient?: SupabaseClient) {
  const client = () => providedClient ?? getSupabaseAdmin();

  return {
    async save(input: SaveHelpFeedbackInput) {
      const { error } = await client()
        .from("help_article_feedback")
        .upsert(
          {
            article_slug: input.articleSlug,
            clerk_user_id: input.clerkUserId,
            helpful: input.helpful,
            comment: input.comment,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "article_slug,clerk_user_id" }
        );

      if (error) {
        throw new Error(`HELP_FEEDBACK_SAVE_FAILED:${error.message}`);
      }
    },
  };
}

export const helpFeedbackRepository = createHelpFeedbackRepository();
