import { describe, expect, it } from "vitest";

import { nextRetryAt } from "@/features/notifications/retry-policy";

describe("Slack retry policy", () => {
  it.each([
    [1, "2026-08-28T08:01:00.000Z"],
    [2, "2026-08-28T08:05:00.000Z"],
    [3, "2026-08-28T08:15:00.000Z"],
    [4, "2026-08-28T09:00:00.000Z"],
    [5, null],
  ] as const)("uses the correct delay after attempt %s", (attempt, expected) => {
    expect(nextRetryAt(attempt, "2026-08-28T08:00:00.000Z")).toBe(expected);
  });
});
