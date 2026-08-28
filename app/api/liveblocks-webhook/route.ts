import { WebhookHandler } from "@liveblocks/node";

import {
  makeLiveblocksWebhookHandler,
  type InlineCommentEventInput,
} from "@/features/content/api/liveblocks-webhook-handler";
import { getServerEnv } from "@/lib/env/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

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
