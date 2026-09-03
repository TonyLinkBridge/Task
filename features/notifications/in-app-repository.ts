import type { InAppNotification } from "@/features/notifications/in-app-types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

function mapNotification(row: {
  id: string;
  recipient_id: string;
  title: string;
  body: string;
  href: string;
  read_at: string | null;
  created_at: string;
}): InAppNotification {
  return {
    id: row.id,
    recipientId: row.recipient_id,
    title: row.title,
    body: row.body,
    href: row.href,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export const inAppNotificationRepository = {
  async list(recipientId: string) {
    const { data, error } = await getSupabaseAdmin()
      .from("in_app_notifications")
      .select("*")
      .eq("recipient_id", recipientId)
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
};
