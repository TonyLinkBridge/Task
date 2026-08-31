import type { InAppNotification } from "@/features/notifications/in-app-types";
import type { VerifiedUser } from "@/lib/auth/types";

type Dependencies = {
  getVerifiedUser: () => Promise<VerifiedUser>;
  list: (recipientId: string) => Promise<InAppNotification[]>;
  markAllRead: (recipientId: string) => Promise<void>;
};

export function makeInAppNotificationsHandler(dependencies: Dependencies) {
  return {
    async GET() {
      try {
        const user = await dependencies.getVerifiedUser();
        const notifications = await dependencies.list(user.id);
        return Response.json({
          notifications,
          unreadCount: notifications.filter(({ readAt }) => !readAt).length,
        });
      } catch {
        return Response.json({ error: "forbidden" }, { status: 403 });
      }
    },

    async PATCH() {
      try {
        const user = await dependencies.getVerifiedUser();
        await dependencies.markAllRead(user.id);
        return Response.json({ ok: true });
      } catch {
        return Response.json({ error: "forbidden" }, { status: 403 });
      }
    },
  };
}
