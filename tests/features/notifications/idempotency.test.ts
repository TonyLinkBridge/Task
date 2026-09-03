import { describe, expect, it } from "vitest";

import { deliveryKey } from "@/features/notifications/idempotency";

describe("deliveryKey", () => {
  it("creates the same key for the same scheduled event", () => {
    const first = deliveryKey(
      "publish_due",
      "22222222-2222-4222-8222-222222222222",
      3,
      "2026-08-29T02:00:00.000Z"
    );
    const second = deliveryKey(
      "publish_due",
      "22222222-2222-4222-8222-222222222222",
      3,
      "2026-08-29T02:00:00.000Z"
    );

    expect(first).toBe(second);
    expect(first).toBe(
      "publish_due:22222222-2222-4222-8222-222222222222:v3:2026-08-29T02:00:00.000Z"
    );
  });

  it("changes when the scheduled time changes", () => {
    const oldKey = deliveryKey(
      "publish_advance",
      "22222222-2222-4222-8222-222222222222",
      2,
      "2026-08-29T02:00:00.000Z"
    );
    const newKey = deliveryKey(
      "publish_advance",
      "22222222-2222-4222-8222-222222222222",
      2,
      "2026-08-29T03:00:00.000Z"
    );

    expect(newKey).not.toBe(oldKey);
  });
});
