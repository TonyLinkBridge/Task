import type { InAppNotification, NotificationMutation } from "@/features/notifications/in-app-types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

function mapNotification(row: {
  id: string;
  recipient_id: string;
  title: string;
  body: string;
  href: string;
  read_at: string | null;
  created_at: string;
  dismissed_at?: string | null;
}): InAppNotification {
  return {
    id: row.id,
    recipientId: row.recipient_id,
    title: row.title,
    body: row.body,
    href: row.href,
    readAt: row.read_at,
    createdAt: row.created_at,
    dismissedAt: row.dismissed_at ?? null,
  };
}

export const inAppNotificationRepository = {
  async list(recipientId: string, options: { bell?: boolean } = {}) {
    let query = getSupabaseAdmin()
      .from("in_app_notifications")
      .select("*")
      .eq("recipient_id", recipientId);
    if (options.bell) query = query.is('dismissed_at', null);
    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(`NOTIFICATION_LIST_FAILED:${error.message}`);
    return (data ?? []).map(mapNotification);
  },

  async markAllRead(recipientId: string) {
    const { error } = await getSupabaseAdmin()
      .from("in_app_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_id", recipientId)
      .is("read_at", null);
    if (error) throw new Error(`NOTIFICATION_UPDATE_FAILED:${error.message}`);
  },

  async mutate(recipientId: string, action: NotificationMutation, ids: string[]) {
    if (!ids.length || ids.length > 30) throw new Error('INVALID_NOTIFICATION_IDS');
    const value = action === 'dismiss'
      ? { dismissed_at: new Date().toISOString() }
      : { read_at: action === 'read' ? new Date().toISOString() : null };
    const { error } = await getSupabaseAdmin().from('in_app_notifications')
      .update(value).eq('recipient_id', recipientId).in('id', ids);
    if (error) throw new Error(`NOTIFICATION_UPDATE_FAILED:${error.message}`);
  },
};
