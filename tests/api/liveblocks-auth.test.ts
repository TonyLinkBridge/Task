import { describe, expect, it } from "vitest";

import { makeLiveblocksAuthHandler } from "@/features/content/api/liveblocks-auth-handler";

function requestWithRoom(room: unknown) {
  return new Request("http://localhost/api/liveblocks-auth", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ room }),
  });
}

const user = {
  id: "user_employee",
  role: "employee" as const,
  name: "Employee",
  imageUrl: null,
};

describe("POST /api/liveblocks-auth", () => {
  it("refuses a room id that is not an existing content record", async () => {
    const handler = makeLiveblocksAuthHandler({
      getVerifiedUser: async () => user,
      findContentByRoomId: async () => null,
      authorizeRoom: async () => ({ token: "must-not-be-returned" }),
    });

    const response = await handler(requestWithRoom("content:missing"));

    expect(response.status).toBe(403);
  });

  it("refuses room names outside the content area", async () => {
    const handler = makeLiveblocksAuthHandler({
      getVerifiedUser: async () => user,
      findContentByRoomId: async () => null,
      authorizeRoom: async () => ({ token: "must-not-be-returned" }),
    });

    const response = await handler(requestWithRoom("tasks:private"));

    expect(response.status).toBe(403);
  });

  it("returns a private room token for a verified member", async () => {
    const room = "content:22222222-2222-4222-8222-222222222222";
    const handler = makeLiveblocksAuthHandler({
      getVerifiedUser: async () => user,
      findContentByRoomId: async () => ({ id: room.slice(8) }),
      authorizeRoom: async () => ({ token: "private-room-token" }),
    });

    const response = await handler(requestWithRoom(room));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      token: "private-room-token",
    });
  });
});
