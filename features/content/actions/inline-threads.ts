"use server";

import { makeInlineThreadActions } from "@/features/content/inline-thread-action-service";
import { getVerifiedUser } from "@/lib/auth/get-verified-user";
import { clearResolvedContentThreads } from "@/lib/liveblocks/server";

const actions = makeInlineThreadActions({
  getVerifiedUser,
  clearResolvedThreads: clearResolvedContentThreads,
});

export async function clearResolvedComments(contentId: string) {
  return actions.clearResolvedComments(contentId);
}
