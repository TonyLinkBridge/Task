import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { SlackSettingsForm } from "@/features/admin/components/slack-settings-form";
import {
  DEFAULT_NOTIFICATION_EVENTS,
  type NotificationSettings,
} from "@/features/notifications/types";

const settings: NotificationSettings = {
  slackChannelId: null,
  slackChannelName: null,
  reminderMinutes: 1440,
  enabledEvents: DEFAULT_NOTIFICATION_EVENTS,
  updatedBy: null,
  updatedAt: "2026-08-28T02:00:00.000Z",
};

describe("SlackSettingsForm", () => {
  it("plainly explains when the Slack Bot has not been connected", () => {
    render(
      <SlackSettingsForm
        configured={false}
        channels={[]}
        initialSettings={settings}
      />
    );

    expect(screen.getByText("Slack 通知还没连接")).toBeInTheDocument();
    expect(screen.getByText(/SLACK_BOT_TOKEN/)).toBeInTheDocument();
  });

  it("saves a chosen channel and reminder time", async () => {
    const user = userEvent.setup();
    const received: unknown[] = [];
    render(
      <SlackSettingsForm
        configured
        channels={[{ id: "C001", name: "content-review", isPrivate: false }]}
        initialSettings={settings}
        saveSettingsAction={async (input) => {
          received.push(input);
          return {
            ok: true,
            data: {
              ...settings,
              slackChannelId: "C001",
              slackChannelName: "content-review",
              reminderMinutes: 60,
            },
          };
        }}
      />
    );

    await user.selectOptions(screen.getByLabelText("Slack 通知频道"), "C001");
    await user.clear(screen.getByLabelText("提前多少分钟提醒"));
    await user.type(screen.getByLabelText("提前多少分钟提醒"), "60");
    await user.click(screen.getByRole("button", { name: "保存 Slack 设置" }));

    expect(received).toHaveLength(1);
    expect(await screen.findByText("Slack 设置已经保存。")).toBeInTheDocument();
  });
});
