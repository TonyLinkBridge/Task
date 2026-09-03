import { describe, expect, it } from "vitest";

import {
  calendarMonthDays,
  moveCalendarMonth,
  toMalaysiaDateKey,
} from "@/features/schedule/date";

describe("toMalaysiaDateKey", () => {
  it("groups UTC evening into the next Malaysia day", () => {
    expect(toMalaysiaDateKey("2026-08-28T18:00:00.000Z")).toBe("2026-08-29");
  });

  it("keeps a Malaysia morning on the same date", () => {
    expect(toMalaysiaDateKey("2026-08-28T02:00:00.000Z")).toBe("2026-08-28");
  });
});

describe("calendar month helpers", () => {
  it("builds a Monday-first six-week grid for a month", () => {
    const days = calendarMonthDays("2026-08");

    expect(days).toHaveLength(42);
    expect(days[0]).toBe("2026-07-27");
    expect(days[41]).toBe("2026-09-06");
  });

  it("moves safely across year boundaries", () => {
    expect(moveCalendarMonth("2026-12", 1)).toBe("2027-01");
    expect(moveCalendarMonth("2026-01", -1)).toBe("2025-12");
  });
});
