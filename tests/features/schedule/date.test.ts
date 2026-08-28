import { describe, expect, it } from "vitest";

import { toMalaysiaDateKey } from "@/features/schedule/date";

describe("toMalaysiaDateKey", () => {
  it("groups UTC evening into the next Malaysia day", () => {
    expect(toMalaysiaDateKey("2026-08-28T18:00:00.000Z")).toBe("2026-08-29");
  });

  it("keeps a Malaysia morning on the same date", () => {
    expect(toMalaysiaDateKey("2026-08-28T02:00:00.000Z")).toBe("2026-08-28");
  });
});
