import { describe, expect, it } from "vitest";

import { processClaimedDelivery } from "@/features/notifications/processor";

const delivery = {
  id: "delivery-1",
  channelId: "G001",
  attemptCount: 1,
  payload: {
    event: "submitted" as const,
    content: {
      id: "8e49db64-75f5-4bd5-98ab-95652c49ab80",
      title: "八月新品介绍",
      publishAt: "2026-08-29T07:15:00.000Z",
      assigneeName: "Tony",
      platformNames: ["Instagram"],
    },
  },
};

describe("Slack delivery processor", () => {
  it("returns the Slack timestamp after a successful send", async () => {
    const result = await processClaimedDelivery(delivery, {
      appUrl: "https://tasklb.vercel.app",
      failedAt: "2026-08-28T08:00:00.000Z",
      postMessage: async () => ({ timestamp: "1724832000.000100" }),
    });

    expect(result).toEqual({
      status: "sent",
      slackTimestamp: "1724832000.000100",
    });
  });

  it("returns a safe retry time after Slack fails", async () => {
    const result = await processClaimedDelivery(delivery, {
      appUrl: "https://tasklb.vercel.app",
      failedAt: "2026-08-28T08:00:00.000Z",
      postMessage: async () => {
        throw new Error("SLACK_API_ERROR:ratelimited");
      },
    });

    expect(result).toEqual({
      status: "failed",
      error: "SLACK_API_ERROR:ratelimited",
      nextAttemptAt: "2026-08-28T08:01:00.000Z",
    });
  });

  it("stops automatic retries after the fifth attempt", async () => {
    const result = await processClaimedDelivery(
      { ...delivery, attemptCount: 5 },
      {
        appUrl: "https://tasklb.vercel.app",
        failedAt: "2026-08-28T08:00:00.000Z",
        postMessage: async () => {
          throw new Error("Slack unavailable");
        },
      }
    );

    expect(result).toMatchObject({ status: "failed", nextAttemptAt: null });
  });
});
