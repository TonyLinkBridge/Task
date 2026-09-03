import { revalidatePath } from "next/cache";

import { makeContentActions } from "@/features/content/action-service";
import { contentRepository } from "@/features/content/repository";
import { getVerifiedUser } from "@/lib/auth/get-verified-user";
import { deleteContentRoom } from "@/lib/liveblocks/server";

const contentActions = makeContentActions({
  getVerifiedUser,
  create: (input, authorId) => contentRepository.create(input, authorId),
  update: (contentId, input, actorId) =>
    contentRepository.updateSchedule(contentId, input, actorId),
  find: (contentId) => contentRepository.find(contentId),
  remove: (contentId, actorId) =>
    contentRepository.removeOwned(contentId, actorId),
  deleteRoom: deleteContentRoom,
  deleteFiles: (paths) => contentRepository.removeStorageFiles(paths),
  revalidatePath,
});

export async function createScheduledContent(input: unknown) {
  "use server";
  return contentActions.createScheduledContent(input);
}

export async function updateScheduledContent(
  contentId: unknown,
  input: unknown
) {
  "use server";
  return contentActions.updateScheduledContent(contentId, input);
}

export async function deleteScheduledContent(contentId: unknown) {
  "use server";
  return contentActions.deleteScheduledContent(contentId);
}
