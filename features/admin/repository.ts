import type { SupabaseClient } from "@supabase/supabase-js";

import {
  DEFAULT_NOTIFICATION_EVENTS,
  type NotificationEventSettings,
  type NotificationSettings,
} from "@/features/notifications/types";
import type { AssignableUser } from "@/features/tasks/types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type SettingsRow = {
  slack_channel_id: string | null;
  slack_channel_name: string | null;
  reminder_minutes: number;
  enabled_events: Partial<NotificationEventSettings> | null;
  updated_by: string | null;
  updated_at: string;
};

function mapSettings(row: SettingsRow): NotificationSettings {
  return {
    slackChannelId: row.slack_channel_id,
    slackChannelName: row.slack_channel_name,
    reminderMinutes: row.reminder_minutes,
    enabledEvents: {
      ...DEFAULT_NOTIFICATION_EVENTS,
      ...(row.enabled_events ?? {}),
    },
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}

export function createAdminRepository(providedClient?: SupabaseClient) {
  const client = () => providedClient ?? getSupabaseAdmin();

  return {
    async getNotificationSettings(): Promise<NotificationSettings> {
      const { data, error } = await client()
        .from("notification_settings")
        .select("*")
        .eq("id", true)
        .single();
      if (error || !data) {
        throw new Error(`ADMIN_DATABASE_ERROR:${error?.message ?? "NO_DATA"}`);
      }
      return mapSettings(data as SettingsRow);
    },

    async saveNotificationSettings(input: {
      slackChannelId: string;
      slackChannelName: string;
      reminderMinutes: number;
      enabledEvents: NotificationEventSettings;
      updatedBy: string;
    }): Promise<NotificationSettings> {
      const { data, error } = await client()
        .from("notification_settings")
        .update({
          slack_channel_id: input.slackChannelId,
          slack_channel_name: input.slackChannelName,
          reminder_minutes: input.reminderMinutes,
          enabled_events: input.enabledEvents,
          updated_by: input.updatedBy,
          updated_at: new Date().toISOString(),
        })
        .eq("id", true)
        .select("*")
        .single();
      if (error || !data) {
        throw new Error(`ADMIN_DATABASE_ERROR:${error?.message ?? "NO_DATA"}`);
      }
      return mapSettings(data as SettingsRow);
    },

    async listMembers(): Promise<AssignableUser[]> {
      const { data, error } = await client()
        .from("profiles")
        .select("clerk_user_id, role, display_name, avatar_url")
        .is("archived_at", null)
        .order("display_name");
      if (error) throw new Error(`ADMIN_DATABASE_ERROR:${error.message}`);
      return (data ?? []).map((row) => ({
        id: row.clerk_user_id,
        role: row.role,
        name: row.display_name,
        imageUrl: row.avatar_url,
      })) as AssignableUser[];
    },

    async recordAudit(input: {
      actorId: string | null;
      entityType: string;
      entityId: string;
      action: string;
      beforeData?: unknown;
      afterData?: unknown;
    }) {
      const { error } = await client().from("audit_events").insert({
        actor_id: input.actorId,
        entity_type: input.entityType,
        entity_id: input.entityId,
        action: input.action,
        before_data: input.beforeData ?? null,
        after_data: input.afterData ?? null,
      });
      if (error) throw new Error(`ADMIN_DATABASE_ERROR:${error.message}`);
    },
  };
}

export const adminRepository = createAdminRepository();
