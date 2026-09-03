import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReviewHistory } from "@/features/approval/components/review-history";

describe("ReviewHistory", () => {
  it("shows who requested changes and the reason", () => {
    render(
      <ReviewHistory
        events={[
          {
            id: "55555555-5555-4555-8555-555555555555",
            contentId: "22222222-2222-4222-8222-222222222222",
            version: 1,
            eventType: "changes_requested",
            actorId: "admin-b",
            actorName: "上司 B",
            actorImageUrl: null,
            message: "请修改开头",
            createdAt: "2026-08-28T04:00:00.000Z",
          },
        ]}
      />
    );

    expect(screen.getByText("上司 B · 要求修改")).toBeInTheDocument();
    expect(screen.getByText("请修改开头")).toBeInTheDocument();
    expect(screen.getByText("内容版本 1")).toBeInTheDocument();
  });

  it("shows when old approvals are cancelled during resubmission", () => {
    render(
      <ReviewHistory
        events={[
          {
            id: "66666666-6666-4666-8666-666666666666",
            contentId: "22222222-2222-4222-8222-222222222222",
            version: 1,
            eventType: "approval_invalidated",
            actorId: "user_employee",
            actorName: "员工",
            actorImageUrl: null,
            message: null,
            createdAt: "2026-08-28T05:00:00.000Z",
          },
        ]}
      />
    );

    expect(screen.getByText("员工 · 旧批准已经取消")).toBeInTheDocument();
    expect(screen.getByText("内容版本 1")).toBeInTheDocument();
  });
});
