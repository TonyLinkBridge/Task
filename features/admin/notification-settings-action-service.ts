import { z } from "zod";

import type {
  NotificationEventSettings,
  NotificationSettings,
} from "@/features/notifications/types";
import type { VerifiedUser } from "@/lib/auth/types";
import type { SlackChannel } from "@/lib/slack/client";

const eventSettingsSchema = z.object({
  submitted: z.boolean(),
  first_approved: z.boolean(),
  all_approved: z.boolean(),
  changes_requested: z.boolean(),
  resubmitted: z.boolean(),
  publish_advance: z.boolean(),
  publish_due: z.boolean(),
  publish_due_unapproved: z.boolean(),
  published: z.boolean(),
});

const settingsInputSchema = z.object({
  channelId: z.string().regex(/^[CG][A-Z0-9]+$/),
  reminderMinutes: z.number().int().min(5).max(10080),
  enabledEvents: eventSettingsSchema,
});

type SettingsSaveInput = {
  slackChannelId: string;
  slackChannelName: string;
  reminderMinutes: number;
  enabledEvents: NotificationEventSettings;
  updatedBy: string;
};

type Dependencies = {
  getVerifiedUser: () => Promise<VerifiedUser>;
  getAllowedChannel: (id: string) => Promise<SlackChannel>;
  save: (input: SettingsSaveInput) => Promise<NotificationSettings>;
  recordAudit: (input: {
    actorId: string;
    action: "notification_settings_updated";
    channelId: string;
    reminderMinutes: number;
    enabledEvents: NotificationEventSettings;
  }) => Promise<void>;
  revalidatePath: (path: string) => void;
};

export function makeNotificationSettingsActions(dependencies: Dependencies) {
  return {
    async saveNotificationSettings(input: unknown) {
      const user = await dependencies.getVerifiedUser();
      if (user.role !== "admin") {
        return {
          ok: false as const,
          message: "只有管理员可以修改通知设置。",
        };
      }
      const parsed = settingsInputSchema.safeParse(input);
      if (!parsed.success) {
        return { ok: false as const, message: "请检查 Slack 通知设置。" };
      }
      try {
        const channel = await dependencies.getAllowedChannel(
          parsed.data.channelId
        );
        const data = await dependencies.save({
          slackChannelId: channel.id,
          slackChannelName: channel.name,
          reminderMinutes: parsed.data.reminderMinutes,
          enabledEvents: parsed.data.enabledEvents,
          updatedBy: user.id,
        });
        await dependencies.recordAudit({
          actorId: user.id,
          action: "notification_settings_updated",
          channelId: channel.id,
          reminderMinutes: parsed.data.reminderMinutes,
          enabledEvents: parsed.data.enabledEvents,
        });
        dependencies.revalidatePath("/admin/settings");
        return { ok: true as const, data };
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === "SLACK_APP_NOT_IN_CHANNEL"
        ) {
          return {
            ok: false as const,
            message: "请先把 Slack App 加进这个私人频道。",
          };
        }
        return {
          ok: false as const,
          message: "暂时无法保存 Slack 通知设置。",
        };
      }
    },
  };
}
