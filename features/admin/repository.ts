import type { SupabaseClient } from "@supabase/supabase-js";

import {
  DEFAULT_NOTIFICATION_EVENTS,
  type NotificationEventSettings,
  type NotificationSettings,
} from "@/features/notifications/types";
import type { AssignableUser } from "@/features/tasks/types";
import type {
  AuditEventView,
  SlackDeliveryView,
} from "@/features/admin/history-types";
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

    async findSlackDelivery(id: string) {
      const { data, error } = await client()
        .from("slack_deliveries")
        .select("id, status")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(`ADMIN_DATABASE_ERROR:${error.message}`);
      return data as {
        id: string;
        status: "pending" | "sending" | "sent" | "failed" | "cancelled";
      } | null;
    },

    async resetSlackDelivery(id: string) {
      const { data, error } = await client()
        .from("slack_deliveries")
        .update({
          status: "pending",
          attempt_count: 0,
          next_attempt_at: new Date().toISOString(),
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("status", "failed")
        .select("id")
        .maybeSingle();
      if (error || !data) {
        throw new Error(`ADMIN_DATABASE_ERROR:${error?.message ?? "NOT_FAILED"}`);
      }
    },

    async listSlackDeliveries(limit = 100): Promise<SlackDeliveryView[]> {
      const { data, error } = await client()
        .from("slack_deliveries")
        .select(
          "id, event_type, status, attempt_count, scheduled_for, sent_at, last_error, channel_id, content:contents(title)"
        )
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw new Error(`ADMIN_DATABASE_ERROR:${error.message}`);
      return (data ?? []).map((item) => {
        const row = item as unknown as {
          id: string;
          event_type: string;
          status: SlackDeliveryView["status"];
          attempt_count: number;
          scheduled_for: string;
          sent_at: string | null;
          last_error: string | null;
          channel_id: string;
          content: { title: string } | null;
        };
        return {
          id: row.id,
          eventType: row.event_type,
          status: row.status,
          attemptCount: row.attempt_count,
          scheduledFor: row.scheduled_for,
          sentAt: row.sent_at,
          lastError: row.last_error,
          channelId: row.channel_id,
          contentTitle: row.content?.title ?? null,
        };
      });
    },

    async listAuditEvents(limit = 200): Promise<AuditEventView[]> {
      const { data, error } = await client()
        .from("audit_events")
        .select(
          "id, entity_type, entity_id, action, created_at, actor:profiles!audit_events_actor_id_fkey(display_name)"
        )
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw new Error(`ADMIN_DATABASE_ERROR:${error.message}`);
      return (data ?? []).map((item) => {
        const row = item as unknown as {
          id: string;
          entity_type: string;
          entity_id: string;
          action: string;
          created_at: string;
          actor: { display_name: string } | null;
        };
        return {
          id: row.id,
          actorName: row.actor?.display_name ?? null,
          entityType: row.entity_type,
          entityId: row.entity_id,
          action: row.action,
          createdAt: row.created_at,
        };
      });
    },
  };
}

export const adminRepository = createAdminRepository();
