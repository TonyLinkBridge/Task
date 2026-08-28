import { revalidatePath } from "next/cache";

import { makeNotificationSettingsActions } from "@/features/admin/notification-settings-action-service";
import { adminRepository } from "@/features/admin/repository";
import { getVerifiedUser } from "@/lib/auth/get-verified-user";
import { getServerEnv } from "@/lib/env/server";
import { makeSlackClient } from "@/lib/slack/client";

const notificationSettingsActions = makeNotificationSettingsActions({
  getVerifiedUser,
  getAllowedChannel: async (id) => {
    const token = getServerEnv().SLACK_BOT_TOKEN;
    if (!token) throw new Error("SLACK_BOT_TOKEN_MISSING");
    return makeSlackClient({ token }).getAllowedChannel(id);
  },
  save: (input) => adminRepository.saveNotificationSettings(input),
  recordAudit: (input) =>
    adminRepository.recordAudit({
      actorId: input.actorId,
      entityType: "notification_settings",
      entityId: "singleton",
      action: input.action,
      afterData: {
        channelId: input.channelId,
        reminderMinutes: input.reminderMinutes,
        enabledEvents: input.enabledEvents,
      },
    }),
  revalidatePath,
});

export async function saveNotificationSettings(input: unknown) {
  "use server";
  return notificationSettingsActions.saveNotificationSettings(input);
}
