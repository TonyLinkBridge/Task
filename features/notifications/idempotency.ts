import type { NotificationEvent } from "@/features/notifications/types";

export function deliveryKey(
  event: NotificationEvent,
  contentId: string,
  version: number,
  scheduledFor: string
) {
  return `${event}:${contentId}:v${version}:${scheduledFor}`;
}
