import { describe, expect, it } from "vitest";

import {
  makeLiveblocksWebhookHandler,
  mapInlineCommentEvent,
} from "@/features/content/api/liveblocks-webhook-handler";

const commentEvent = {
  type: "commentCreated" as const,
  data: {
    projectId: "project-1",
    roomId: "content:22222222-2222-4222-8222-222222222222",
    threadId: "thread-1",
    commentId: "comment-1",
    createdAt: "2026-08-28T03:00:00.000Z",
    createdBy: "user_admin",
  },
};

describe("mapInlineCommentEvent", () => {
  it("creates a stable key so a repeated webhook is saved once", () => {
    expect(mapInlineCommentEvent(commentEvent)).toMatchObject({
      eventKey:
        "commentCreated:content:22222222-2222-4222-8222-222222222222:thread-1:comment-1:2026-08-28T03:00:00.000Z",
      roomId: commentEvent.data.roomId,
      threadId: "thread-1",
      commentId: "comment-1",
      eventType: "commentCreated",
      actorId: "user_admin",
      occurredAt: "2026-08-28T03:00:00.000Z",
    });
  });
});

describe("POST /api/liveblocks-webhook", () => {
  it("rejects a request whose signature is invalid", async () => {
    const handler = makeLiveblocksWebhookHandler({
      verifyRequest: () => {
        throw new Error("bad signature");
      },
      saveEvent: async () => undefined,
    });

    const response = await handler(
      new Request("http://localhost/api/liveblocks-webhook", {
        method: "POST",
        body: JSON.stringify(commentEvent),
      })
    );

    expect(response.status).toBe(400);
  });
});
