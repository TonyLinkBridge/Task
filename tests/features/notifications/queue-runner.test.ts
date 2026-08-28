import { describe, expect, it } from "vitest";

import { runSlackQueue } from "@/features/notifications/queue-runner";

const content = {
  id: "8e49db64-75f5-4bd5-98ab-95652c49ab80",
  title: "八月新品介绍",
  publishAt: "2026-08-29T07:15:00.000Z",
  assigneeName: "Tony",
  platformNames: ["Instagram"],
};

describe("Slack queue runner", () => {
  it("schedules reminders, sends claimed messages, and records every result", async () => {
    const completed: Array<{ id: string; status: string }> = [];
    let scheduledAt = "";

    const summary = await runSlackQueue({
      now: "2026-08-28T08:00:00.000Z",
      appUrl: "https://tasklb.vercel.app",
      scheduleDueContent: async (now) => {
        scheduledAt = now;
      },
      claimDeliveries: async () => [
        {
          id: "delivery-1",
          channelId: "G001",
          attemptCount: 1,
          payload: { event: "submitted", content },
        },
        {
          id: "delivery-2",
          channelId: "G001",
          attemptCount: 2,
          payload: { event: "publish_due", content },
        },
      ],
      postMessage: async ({ text }) => {
        if (text.includes("到达发布时间")) throw new Error("ratelimited");
        return { timestamp: "1724832000.000100" };
      },
      completeDelivery: async (id, result) => {
        completed.push({ id, status: result.status });
      },
    });

    expect(scheduledAt).toBe("2026-08-28T08:00:00.000Z");
    expect(completed).toEqual([
      { id: "delivery-1", status: "sent" },
      { id: "delivery-2", status: "failed" },
    ]);
    expect(summary).toEqual({ claimed: 2, sent: 1, failed: 1 });
  });
});
