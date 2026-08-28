import type { WebhookEvent } from "@liveblocks/node";
import { WebhookHandler } from "@liveblocks/node";

import { getServerEnv } from "@/lib/env/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type RelevantEventType =
  | "threadCreated"
  | "threadDeleted"
  | "commentCreated"
  | "commentEdited"
  | "commentDeleted"
  | "threadMarkedAsResolved"
  | "threadMarkedAsUnresolved";

type RelevantWebhookEvent = {
  type: RelevantEventType;
  data: {
    projectId: string;
    roomId: string;
    threadId: string;
    commentId?: string;
    createdAt?: string;
    editedAt?: string;
    deletedAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
  };
};

export type InlineCommentEventInput = {
  eventKey: string;
  roomId: string;
  threadId: string;
  commentId: string | null;
  eventType: RelevantEventType;
  actorId: string | null;
  payload: Record<string, unknown>;
  occurredAt: string;
};

const relevantTypes = new Set<RelevantEventType>([
  "threadCreated",
  "threadDeleted",
  "commentCreated",
  "commentEdited",
  "commentDeleted",
  "threadMarkedAsResolved",
  "threadMarkedAsUnresolved",
]);

export function mapInlineCommentEvent(
  event: RelevantWebhookEvent
): InlineCommentEventInput | null {
  if (
    !relevantTypes.has(event.type) ||
    !event.data.roomId.startsWith("content:")
  ) {
    return null;
  }

  const occurredAt =
    event.data.createdAt ??
    event.data.editedAt ??
    event.data.deletedAt ??
    event.data.updatedAt;
  if (!occurredAt) return null;

  const commentId = event.data.commentId ?? null;
  return {
    eventKey: [
      event.type,
      event.data.roomId,
      event.data.threadId,
      commentId ?? "",
      occurredAt,
    ].join(":"),
    roomId: event.data.roomId,
    threadId: event.data.threadId,
    commentId,
    eventType: event.type,
    actorId: event.data.createdBy ?? event.data.updatedBy ?? null,
    payload: event.data,
    occurredAt,
  };
}

type Dependencies = {
  verifyRequest: (input: {
    headers: Headers;
    rawBody: string;
  }) => WebhookEvent;
  saveEvent: (event: InlineCommentEventInput) => Promise<void>;
};

export function makeLiveblocksWebhookHandler(dependencies: Dependencies) {
  return async function POST(request: Request) {
    const rawBody = await request.text();
    let verifiedEvent: WebhookEvent;
    try {
      verifiedEvent = dependencies.verifyRequest({
        headers: request.headers,
        rawBody,
      });
    } catch {
      return new Response("Could not verify webhook", { status: 400 });
    }

    const event = mapInlineCommentEvent(
      verifiedEvent as RelevantWebhookEvent
    );
    if (event) await dependencies.saveEvent(event);
    return Response.json({ received: true });
  };
}

let webhookHandler: WebhookHandler | undefined;

function verifyRequest(input: { headers: Headers; rawBody: string }) {
  webhookHandler ??= new WebhookHandler(
    getServerEnv().LIVEBLOCKS_WEBHOOK_SECRET
  );
  return webhookHandler.verifyRequest(input);
}

async function saveEvent(event: InlineCommentEventInput) {
  const { error } = await getSupabaseAdmin()
    .from("inline_comment_events")
    .upsert(
      {
        event_key: event.eventKey,
        room_id: event.roomId,
        thread_id: event.threadId,
        comment_id: event.commentId,
        event_type: event.eventType,
        actor_id: event.actorId,
        payload: event.payload,
        occurred_at: event.occurredAt,
      },
      { onConflict: "event_key", ignoreDuplicates: true }
    );
  if (error) throw new Error(`INLINE_EVENT_SAVE_FAILED:${error.message}`);
}

export const POST = makeLiveblocksWebhookHandler({ verifyRequest, saveEvent });
