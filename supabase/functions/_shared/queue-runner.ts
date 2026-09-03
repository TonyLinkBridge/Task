import {
  processClaimedDeletion,
  processClaimedDelivery,
  type ClaimedSlackDeletion,
  type ClaimedSlackDelivery,
  type DeletionResult,
  type DeliveryResult,
} from "./processor.ts";
import type { SlackMessageBlock } from "./notification-types.ts";

export async function runSlackQueue(dependencies: {
  now: string;
  appUrl: string;
  scheduleDueContent: (now: string) => Promise<void>;
  claimDeletions: (now: string) => Promise<ClaimedSlackDeletion[]>;
  deleteMessage: (input: {
    channel: string;
    timestamp: string;
  }) => Promise<void>;
  completeDeletion: (id: string, result: DeletionResult) => Promise<void>;
  claimDeliveries: (now: string) => Promise<ClaimedSlackDelivery[]>;
  postMessage: (input: {
    channel: string;
    text: string;
    blocks?: SlackMessageBlock[];
  }) => Promise<{ timestamp: string }>;
  completeDelivery: (id: string, result: DeliveryResult) => Promise<void>;
}) {
  const deletions = await dependencies.claimDeletions(dependencies.now);
  let deleted = 0;
  let deletionFailed = 0;

  for (const deletion of deletions) {
    const result = await processClaimedDeletion(deletion, {
      failedAt: dependencies.now,
      deleteMessage: dependencies.deleteMessage,
    });
    await dependencies.completeDeletion(deletion.id, result);
    if (result.status === "deleted") deleted += 1;
    else deletionFailed += 1;
  }

  await dependencies.scheduleDueContent(dependencies.now);
  const deliveries = await dependencies.claimDeliveries(dependencies.now);
  let sent = 0;
  let failed = 0;

  for (const delivery of deliveries) {
    const result = await processClaimedDelivery(delivery, {
      appUrl: dependencies.appUrl,
      failedAt: dependencies.now,
      postMessage: dependencies.postMessage,
    });
    await dependencies.completeDelivery(delivery.id, result);
    if (result.status === "sent") sent += 1;
    else failed += 1;
  }

  return {
    deletionsClaimed: deletions.length,
    deleted,
    deletionFailed,
    claimed: deliveries.length,
    sent,
    failed,
  };
}
