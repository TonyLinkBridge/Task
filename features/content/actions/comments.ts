import { revalidatePath } from "next/cache";
import { z } from "zod";

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

export async function refreshContentComments(contentId: string) {
  "use server";
  try {
    await getVerifiedUser();
    const parsedContentId = z.uuid().safeParse(contentId);
    if (!parsedContentId.success) {
      return { ok: false as const, message: "找不到这项内容。" };
    }
    const comments = await contentRepository.listComments(parsedContentId.data);
    return { ok: true as const, data: comments };
  } catch {
    return { ok: false as const, message: "暂时无法更新留言。" };
  }
}
