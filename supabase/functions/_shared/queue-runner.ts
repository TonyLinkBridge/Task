import {
  processClaimedDelivery,
  type ClaimedSlackDelivery,
  type DeliveryResult,
} from "./processor.ts";
import type { SlackMessageBlock } from "./notification-types.ts";

export async function runSlackQueue(dependencies: {
  now: string;
  appUrl: string;
  scheduleDueContent: (now: string) => Promise<void>;
  claimDeliveries: (now: string) => Promise<ClaimedSlackDelivery[]>;
  postMessage: (input: {
    channel: string;
    text: string;
    blocks?: SlackMessageBlock[];
  }) => Promise<{ timestamp: string }>;
  completeDelivery: (id: string, result: DeliveryResult) => Promise<void>;
}) {
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

  return { claimed: deliveries.length, sent, failed };
}
