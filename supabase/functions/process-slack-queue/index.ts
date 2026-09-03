import { createClient } from "npm:@supabase/supabase-js@2";

import { makeQueueHttpHandler } from "../_shared/http-handler.ts";
import type {
  NotificationEvent,
  SlackMessageContent,
} from "../_shared/notification-types.ts";
import type {
  ClaimedSlackDeletion,
  ClaimedSlackDelivery,
  DeletionResult,
  DeliveryResult,
} from "../_shared/processor.ts";
import { runSlackQueue } from "../_shared/queue-runner.ts";

type DeliveryRow = {
  id: string;
  channel_id: string;
  attempt_count: number;
  payload: {
    event: NotificationEvent;
    content: SlackMessageContent;
  };
};

type DeletionRow = {
  id: string;
  channel_id: string;
  slack_timestamp: string;
  attempt_count: number;
};

function requiredEnv(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`MISSING_ENV:${name}`);
  return value;
}

const supabase = createClient(
  requiredEnv("SUPABASE_URL"),
  requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { autoRefreshToken: false, persistSession: false } }
);
const slackToken = requiredEnv("SLACK_BOT_TOKEN");
const appUrl = requiredEnv("NEXT_PUBLIC_APP_URL");

async function postSlackMessage(input: {
  channel: string;
  text: string;
  blocks?: unknown[];
}) {
  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${slackToken}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(input),
  });
  const data = (await response.json()) as {
    ok: boolean;
    ts?: string;
    error?: string;
  };
  if (!response.ok || !data.ok || !data.ts) {
    throw new Error(`SLACK_API_ERROR:${data.error ?? response.status}`);
  }
  return { timestamp: data.ts };
}

async function deleteSlackMessage(input: {
  channel: string;
  timestamp: string;
}) {
  const response = await fetch("https://slack.com/api/chat.delete", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${slackToken}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({ channel: input.channel, ts: input.timestamp }),
  });
  const data = (await response.json()) as { ok: boolean; error?: string };
  if (data.error === "message_not_found") return;
  if (!response.ok || !data.ok) {
    throw new Error(`SLACK_API_ERROR:${data.error ?? response.status}`);
  }
}

async function completeDelivery(id: string, result: DeliveryResult) {
  const now = new Date().toISOString();
  const update = result.status === "sent"
    ? {
        status: "sent",
        sent_at: now,
        slack_timestamp: result.slackTimestamp,
        next_attempt_at: null,
        last_error: null,
        updated_at: now,
      }
    : {
        status: "failed",
        next_attempt_at: result.nextAttemptAt,
        last_error: result.error,
        updated_at: now,
      };
  const { error } = await supabase
    .from("slack_deliveries")
    .update(update)
    .eq("id", id)
    .eq("status", "sending");
  if (error) throw error;

  const { error: auditError } = await supabase.from("audit_events").insert({
    actor_id: null,
    entity_type: "slack_delivery",
    entity_id: id,
    action: result.status === "sent" ? "sent" : "failed",
    after_data: result,
  });
  if (auditError) throw auditError;
}

async function completeDeletion(id: string, result: DeletionResult) {
  const now = new Date().toISOString();
  const update = result.status === "deleted"
    ? {
        status: "deleted",
        deleted_at: now,
        next_attempt_at: null,
        last_error: null,
        updated_at: now,
      }
    : {
        status: "failed",
        next_attempt_at: result.nextAttemptAt,
        last_error: result.error,
        updated_at: now,
      };
  const { error } = await supabase
    .from("slack_deletion_requests")
    .update(update)
    .eq("id", id)
    .eq("status", "sending");
  if (error) throw error;
}

async function run() {
  const now = new Date().toISOString();
  return runSlackQueue({
    now,
    appUrl,
    claimDeletions: async (time) => {
      const { data, error } = await supabase.rpc("claim_slack_deletions", {
        p_now: time,
        p_limit: 20,
      });
      if (error) throw error;
      return ((data ?? []) as DeletionRow[]).map(
        (row): ClaimedSlackDeletion => ({
          id: row.id,
          channelId: row.channel_id,
          slackTimestamp: row.slack_timestamp,
          attemptCount: row.attempt_count,
        })
      );
    },
    deleteMessage: deleteSlackMessage,
    completeDeletion,
    scheduleDueContent: async (time) => {
      const { error } = await supabase.rpc("schedule_due_content_notifications", {
        p_now: time,
      });
      if (error) throw error;
    },
    claimDeliveries: async (time) => {
      const { data, error } = await supabase.rpc("claim_slack_deliveries", {
        p_now: time,
        p_limit: 20,
      });
      if (error) throw error;
      return ((data ?? []) as DeliveryRow[]).map(
        (row): ClaimedSlackDelivery => ({
          id: row.id,
          channelId: row.channel_id,
          attemptCount: row.attempt_count,
          payload: row.payload,
        })
      );
    },
    postMessage: postSlackMessage,
    completeDelivery,
  });
}

Deno.serve(
  makeQueueHttpHandler({
    secret: requiredEnv("EDGE_FUNCTION_SECRET"),
    run,
  })
);
