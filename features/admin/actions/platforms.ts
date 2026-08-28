import { revalidatePath } from "next/cache";

import { makePlatformActions } from "@/features/admin/platform-action-service";
import { contentRepository } from "@/features/content/repository";
import { getVerifiedUser } from "@/lib/auth/get-verified-user";

const platformActions = makePlatformActions({
  getVerifiedUser,
  create: (input) => contentRepository.createPlatform(input),
  update: (id, input) => contentRepository.updatePlatform(id, input),
  setArchived: (id, archived) =>
    contentRepository.setPlatformArchived(id, archived),
  revalidatePath,
});

export async function createPlatform(input: unknown) {
  "use server";
  return platformActions.createPlatform(input);
}

export async function updatePlatform(id: string, input: unknown) {
  "use server";
  return platformActions.updatePlatform(id, input);
}

export async function archivePlatform(id: string) {
  "use server";
  return platformActions.archivePlatform(id);
}

export async function restorePlatform(id: string) {
  "use server";
  return platformActions.restorePlatform(id);
}
