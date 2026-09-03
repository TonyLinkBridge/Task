import { describe, expect, it } from "vitest";

import { makePrivateMessagesHandler } from "@/features/messages/private-messages-handler";

const user = {
  id: "user_employee",
  role: "employee" as const,
  name: "Employee",
  imageUrl: null,
};

describe("private messages handler", () => {
  it("sends a private message to another active member", async () => {
    const handler = makePrivateMessagesHandler({
      getVerifiedUser: async () => user,
      list: async () => [],
      listMembers: async () => [
        { id: "user_admin", name: "Admin", imageUrl: null },
      ],
      send: async (input) => ({
        id: "11111111-1111-4111-8111-111111111111",
        senderId: input.senderId,
        senderName: "Employee",
        recipientId: input.recipientId,
        recipientName: "Admin",
        body: input.body,
        readAt: null,
        createdAt: "2026-08-31T03:00:00.000Z",
      }),
      markReceivedRead: async () => undefined,
    });

    const response = await handler.POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ recipientId: "user_admin", body: "请看任务" }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      message: { body: "请看任务", recipientId: "user_admin" },
    });
  });

  it("does not send an empty message or a message to yourself", async () => {
    const handler = makePrivateMessagesHandler({
      getVerifiedUser: async () => user,
      list: async () => [],
      listMembers: async () => [],
      send: async () => {
        throw new Error("unused");
      },
      markReceivedRead: async () => undefined,
    });

    const response = await handler.POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ recipientId: user.id, body: " " }),
      })
    );

    expect(response.status).toBe(400);
  });
});
