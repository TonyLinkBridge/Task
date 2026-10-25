import type { InAppNotification, NotificationMutation } from "@/features/notifications/in-app-types";
import type { VerifiedUser } from "@/lib/auth/types";

type Dependencies = {
  getVerifiedUser: () => Promise<VerifiedUser>;
  list: (recipientId: string) => Promise<InAppNotification[]>;
  markAllRead: (recipientId: string) => Promise<void>;
  mutate?: (recipientId: string, action: NotificationMutation, ids: string[]) => Promise<void>;
};

export function makeInAppNotificationsHandler(dependencies: Dependencies) {
  return {
    async GET() {
      let user;
      try { user = await dependencies.getVerifiedUser(); }
      catch { return Response.json({ error: 'forbidden' }, { status: 403 }); }
      try {
        const notifications = await dependencies.list(user.id);
        return Response.json({
          notifications,
          unreadCount: notifications.filter(({ readAt }) => !readAt).length,
        });
      } catch {
        return Response.json({ error: "notification_load_failed" }, { status: 500 });
      }
    },

    async PATCH(request?: Request) {
      let user;
      try { user = await dependencies.getVerifiedUser(); }
      catch { return Response.json({ error: 'forbidden' }, { status: 403 }); }
      const body = request ? await request.text() : '';
      if (body.length > 4096) return Response.json({ error: 'invalid_request' }, { status: 400 });
      let mutation: { action: NotificationMutation; ids: string[] } | undefined;
      if (body) {
        try {
          const parsed = JSON.parse(body);
          if (!['read', 'unread', 'dismiss'].includes(parsed?.action) || !Array.isArray(parsed.ids)
            || !parsed.ids.length || parsed.ids.length > 30
            || !parsed.ids.every((id: unknown) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) throw Error('invalid');
          mutation = { action: parsed.action, ids: [...new Set<string>(parsed.ids)] };
        } catch { return Response.json({ error: 'invalid_request' }, { status: 400 }); }
      }
      try {
        if (mutation) {
          if (!dependencies.mutate) throw Error('NOT_CONFIGURED');
          await dependencies.mutate(user.id, mutation.action, mutation.ids);
        } else await dependencies.markAllRead(user.id);
        return Response.json({ ok: true });
      } catch {
        return Response.json({ error: "notification_save_failed" }, { status: 500 });
      }
    },
  };
}
