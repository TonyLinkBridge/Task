import { buildSlackMessage } from "./message.ts";
import { nextRetryAt } from "./retry-policy.ts";
import type {
  NotificationEvent,
  SlackMessageBlock,
  SlackMessageContent,
} from "./notification-types.ts";

export type ClaimedSlackDelivery = {
  id: string;
  channelId: string;
  attemptCount: number;
  payload: {
    event: NotificationEvent;
    content: SlackMessageContent;
  };
};

export type DeliveryResult =
  | { status: "sent"; slackTimestamp: string }
  | { status: "failed"; error: string; nextAttemptAt: string | null };

export type ClaimedSlackDeletion = {
  id: string;
  channelId: string;
  slackTimestamp: string;
  attemptCount: number;
};

export type DeletionResult =
  | { status: "deleted" }
  | { status: "failed"; error: string; nextAttemptAt: string | null };

function safeError(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.slice(0, 1000);
  }
  return "UNKNOWN_SLACK_ERROR";
}

export async function processClaimedDelivery(
  delivery: ClaimedSlackDelivery,
  dependencies: {
    appUrl: string;
    failedAt: string;
    postMessage: (input: {
      channel: string;
      text: string;
      blocks?: SlackMessageBlock[];
    }) => Promise<{ timestamp: string }>;
  }
): Promise<DeliveryResult> {
  try {
    const message = buildSlackMessage(delivery.payload, dependencies.appUrl);
    const sent = await dependencies.postMessage({
      channel: delivery.channelId,
      ...message,
    });
    return { status: "sent", slackTimestamp: sent.timestamp };
  } catch (error) {
    return {
      status: "failed",
      error: safeError(error),
      nextAttemptAt: nextRetryAt(delivery.attemptCount, dependencies.failedAt),
    };
  }
}

export async function processClaimedDeletion(
  deletion: ClaimedSlackDeletion,
  dependencies: {
    failedAt: string;
    deleteMessage: (input: {
      channel: string;
      timestamp: string;
    }) => Promise<void>;
  }
): Promise<DeletionResult> {
  try {
    await dependencies.deleteMessage({
      channel: deletion.channelId,
      timestamp: deletion.slackTimestamp,
    });
    return { status: "deleted" };
  } catch (error) {
    return {
      status: "failed",
      error: safeError(error),
      nextAttemptAt: nextRetryAt(deletion.attemptCount, dependencies.failedAt),
    };
  }
}
