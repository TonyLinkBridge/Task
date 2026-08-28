import { describe, expect, it } from "vitest";

import { makeNotificationSettingsActions } from "@/features/admin/notification-settings-action-service";
import type { NotificationEventSettings } from "@/features/notifications/types";

const enabledEvents: NotificationEventSettings = {
  submitted: true,
  first_approved: true,
  all_approved: true,
  changes_requested: true,
  resubmitted: true,
  publish_advance: true,
  publish_due: true,
  publish_due_unapproved: true,
  published: true,
};

function setup(role: "employee" | "admin" = "admin") {
  const saved: unknown[] = [];
  const actions = makeNotificationSettingsActions({
    getVerifiedUser: async () => ({
      id: role === "admin" ? "admin-a" : "employee-a",
      role,
      name: "Tony",
      imageUrl: null,
    }),
    getAllowedChannel: async (id) => ({
      id,
      name: "content-review",
      isPrivate: false,
    }),
    save: async (input) => {
      saved.push(input);
      return { ...input, updatedAt: "2026-08-28T05:00:00.000Z" };
    },
    revalidatePath: () => undefined,
  });
  return { actions, saved };
}

describe("notification settings actions", () => {
  it("rejects changes from an employee", async () => {
    const { actions, saved } = setup("employee");

    await expect(
      actions.saveNotificationSettings({
        channelId: "C001",
        reminderMinutes: 60,
        enabledEvents,
      })
    ).resolves.toEqual({
      ok: false,
      message: "只有管理员可以修改通知设置。",
    });
    expect(saved).toEqual([]);
  });

  it("validates the channel and saves its current name", async () => {
    const { actions, saved } = setup();

    const result = await actions.saveNotificationSettings({
      channelId: "C001",
      reminderMinutes: 60,
      enabledEvents,
    });

    expect(result).toMatchObject({
      ok: true,
      data: {
        slackChannelId: "C001",
        slackChannelName: "content-review",
        reminderMinutes: 60,
        updatedBy: "admin-a",
      },
    });
    expect(saved).toHaveLength(1);
  });

  it("explains when the app has not joined a private channel", async () => {
    const actions = makeNotificationSettingsActions({
      ...setup().actions,
      getVerifiedUser: async () => ({
        id: "admin-a",
        role: "admin",
        name: "Tony",
        imageUrl: null,
      }),
      getAllowedChannel: async () => {
        throw new Error("SLACK_APP_NOT_IN_CHANNEL");
      },
      save: async (input) => ({
        ...input,
        updatedAt: "2026-08-28T05:00:00.000Z",
      }),
      revalidatePath: () => undefined,
    } as never);

    await expect(
      actions.saveNotificationSettings({
        channelId: "G001",
        reminderMinutes: 60,
        enabledEvents,
      })
    ).resolves.toEqual({
      ok: false,
      message: "请先把 Slack App 加进这个私人频道。",
    });
  });
});
