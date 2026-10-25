import { makeInAppNotificationsHandler } from "@/features/notifications/in-app-handler";
import { inAppNotificationRepository } from "@/features/notifications/in-app-repository";
import { getVerifiedUser } from "@/lib/auth/get-verified-user";

const handler = makeInAppNotificationsHandler({
  getVerifiedUser,
  list: (recipientId) => inAppNotificationRepository.list(recipientId, { bell: true }),
  mutate: (recipientId, action, ids) => inAppNotificationRepository.mutate(recipientId, action, ids),
  markAllRead: (recipientId) =>
    inAppNotificationRepository.markAllRead(recipientId),
});

export const GET = handler.GET;
export async function PATCH(request: Request) {
  return handler.PATCH(request);
}
