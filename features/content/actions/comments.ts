import { revalidatePath } from "next/cache";

import { makeContentCommentActions } from "@/features/content/comments-service";
import { contentRepository } from "@/features/content/repository";
import { getVerifiedUser } from "@/lib/auth/get-verified-user";

const commentActions = makeContentCommentActions({
  getVerifiedUser,
  addComment: (contentId, authorId, body) =>
    contentRepository.addComment(contentId, authorId, body),
  revalidatePath,
});

export async function addContentComment(contentId: string, body: string) {
  "use server";
  return commentActions.addContentComment(contentId, body);
}
