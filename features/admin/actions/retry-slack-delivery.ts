"use server";

import { revalidatePath } from "next/cache";

import { adminRepository } from "@/features/admin/repository";
import { makeRetrySlackDelivery } from "@/features/admin/retry-slack-service";
import { getVerifiedUser } from "@/lib/auth/get-verified-user";

const retry = makeRetrySlackDelivery({
  getVerifiedUser,
  findDelivery: (id) => adminRepository.findSlackDelivery(id),
  resetDelivery: (id) => adminRepository.resetSlackDelivery(id),
  recordAudit: (actorId, id) =>
    adminRepository.recordAudit({
      actorId,
      entityType: "slack_delivery",
      entityId: id,
      action: "manual_retry",
    }),
  revalidatePath,
});

export async function retrySlackDelivery(deliveryId: string) {
  return retry(deliveryId);
}
