import { revalidatePath } from "next/cache";

import { makeContentActions } from "@/features/content/action-service";
import { contentRepository } from "@/features/content/repository";
import { getVerifiedUser } from "@/lib/auth/get-verified-user";

const contentActions = makeContentActions({
  getVerifiedUser,
  create: (input, authorId) => contentRepository.create(input, authorId),
  revalidatePath,
});

export async function createScheduledContent(input: unknown) {
  "use server";
  return contentActions.createScheduledContent(input);
}
