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
});
