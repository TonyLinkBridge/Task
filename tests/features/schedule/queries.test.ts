import { describe, expect, it } from "vitest";

import { makeScheduleQueries } from "@/features/schedule/query-service";
import type { ScheduledContent } from "@/features/schedule/types";

const item: ScheduledContent = {
  id: "22222222-2222-4222-8222-222222222222",
  title: "新品贴文",
  status: "approved",
  storedStatus: "approved",
  publishAt: "2026-08-28T02:00:00.000Z",
  assignee: { id: "employee", name: "员工", imageUrl: null },
  platforms: [{ id: "11111111-1111-4111-8111-111111111111", name: "Instagram", color: "#ec4899" }],
  requiredApprovals: 2,
  approvalAdminIds: ["admin-a", "admin-b"],
};

describe("schedule queries", () => {
  it("shows approved past-due content in the waiting-to-publish column", async () => {
    const queries = makeScheduleQueries({
      getVerifiedUser: async () => ({ id: "employee", role: "employee", name: "员工", imageUrl: null }),
      list: async () => [item],
      now: () => new Date("2026-08-28T03:00:00.000Z"),
    });

    await expect(queries.listScheduledContent({ status: "due" })).resolves.toEqual([
      { ...item, status: "due" },
    ]);
  });

  it("uses the same platform and assignee filters for every view", async () => {
    const queries = makeScheduleQueries({
      getVerifiedUser: async () => ({ id: "admin-a", role: "admin", name: "A", imageUrl: null }),
      list: async () => [item],
      now: () => new Date("2026-08-27T03:00:00.000Z"),
    });

    await expect(
      queries.listScheduledContent({ platformId: item.platforms[0].id, assigneeId: "employee" })
    ).resolves.toHaveLength(1);
    await expect(
      queries.listScheduledContent({ platformId: "99999999-9999-4999-8999-999999999999" })
    ).resolves.toEqual([]);
  });
});
