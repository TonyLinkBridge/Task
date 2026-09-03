import { describe, expect, it } from "vitest";

import { makeInAppNotificationsHandler } from "@/features/notifications/in-app-handler";

const user = {
  id: "user_employee",
  role: "employee" as const,
  name: "Employee",
  imageUrl: null,
};

describe("in-app notifications handler", () => {
  it("lists only the verified member's notifications", async () => {
    const handler = makeInAppNotificationsHandler({
      getVerifiedUser: async () => user,
      list: async (recipientId) => [
        {
          id: "11111111-1111-4111-8111-111111111111",
          recipientId,
          title: "你有新任务",
          body: "准备周报",
          href: "/tasks/22222222-2222-4222-8222-222222222222",
          readAt: null,
          createdAt: "2026-08-31T03:00:00.000Z",
        },
      ],
      markAllRead: async () => undefined,
    });

    const response = await handler.GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ unreadCount: 1 });
  });

  it("marks all notifications as read for the verified member", async () => {
    let markedUser = "";
    const handler = makeInAppNotificationsHandler({
      getVerifiedUser: async () => user,
      list: async () => [],
      markAllRead: async (recipientId) => {
        markedUser = recipientId;
      },
    });

    const response = await handler.PATCH();

    expect(response.status).toBe(200);
    expect(markedUser).toBe(user.id);
  });
});
