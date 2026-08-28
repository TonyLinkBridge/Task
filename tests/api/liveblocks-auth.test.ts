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
      findContentByRoomId: async () => ({ id: room.slice(8), status: "draft" as const }),
      authorizeRoom: async (_user, _room, editable) => ({
        token: editable ? "private-room-token" : "wrong-token",
      }),
    });

    const response = await handler(requestWithRoom(room));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      token: "private-room-token",
    });
  });

  it("opens locked content without body-write permission", async () => {
    const room = "content:22222222-2222-4222-8222-222222222222";
    let editable: boolean | undefined;
    const handler = makeLiveblocksAuthHandler({
      getVerifiedUser: async () => user,
      findContentByRoomId: async () => ({ id: room.slice(8), status: "in_review" as const }),
      authorizeRoom: async (_user, _room, canEdit) => {
        editable = canEdit;
        return { token: "read-and-comment-token" };
      },
    });

    const response = await handler(requestWithRoom(room));

    expect(response.status).toBe(200);
    expect(editable).toBe(false);
  });

  it("rechecks database state so a delayed auth request cannot restore stale access", async () => {
    const room = "content:22222222-2222-4222-8222-222222222222";
    const states = ["draft", "in_review", "in_review"] as const;
    const permissions: boolean[] = [];
    let read = 0;
    const handler = makeLiveblocksAuthHandler({
      getVerifiedUser: async () => user,
      findContentByRoomId: async () => ({
        id: room.slice(8),
        status: states[Math.min(read++, states.length - 1)],
      }),
      authorizeRoom: async (_user, _room, editable) => {
        permissions.push(editable);
        return { token: editable ? "stale-write-token" : "current-read-token" };
      },
    });

    const response = await handler(requestWithRoom(room));

    await expect(response.json()).resolves.toEqual({
      token: "current-read-token",
    });
    expect(permissions).toEqual([true, false]);
  });

  it("forces read-only access when content is archived during authentication", async () => {
    const room = "content:22222222-2222-4222-8222-222222222222";
    const permissions: boolean[] = [];
    let read = 0;
    const handler = makeLiveblocksAuthHandler({
      getVerifiedUser: async () => user,
      findContentByRoomId: async () =>
        read++ === 0 ? { id: room.slice(8), status: "draft" as const } : null,
      authorizeRoom: async (_user, _room, editable) => {
        permissions.push(editable);
        return { token: "unused" };
      },
    });

    const response = await handler(requestWithRoom(room));

    expect(response.status).toBe(403);
    expect(permissions).toEqual([true, false]);
  });

  it("fails closed when room status cannot stabilize", async () => {
    const room = "content:22222222-2222-4222-8222-222222222222";
    const states = ["draft", "in_review", "changes_requested", "approved"] as const;
    const permissions: boolean[] = [];
    let read = 0;
    const handler = makeLiveblocksAuthHandler({
      getVerifiedUser: async () => user,
      findContentByRoomId: async () => ({
        id: room.slice(8),
        status: states[Math.min(read++, states.length - 1)],
      }),
      authorizeRoom: async (_user, _room, editable) => {
        permissions.push(editable);
        return { token: "unused" };
      },
    });

    const response = await handler(requestWithRoom(room));

    expect(response.status).toBe(403);
    expect(permissions).toEqual([true, false, true, false]);
  });
});
