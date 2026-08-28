import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AuditLog } from "@/features/admin/components/audit-log";
import { DeliveryLog } from "@/features/admin/components/delivery-log";

describe("admin history", () => {
  it("shows failed Slack messages and lets an admin queue a retry", async () => {
    const user = userEvent.setup();
    render(
      <DeliveryLog
        deliveries={[
          {
            id: "11111111-1111-4111-8111-111111111111",
            eventType: "submitted",
            status: "failed",
            attemptCount: 2,
            scheduledFor: "2026-08-28T07:00:00.000Z",
            sentAt: null,
            lastError: "ratelimited",
            channelId: "G001",
            contentTitle: "八月新品介绍",
          },
        ]}
        retryAction={async () => ({ ok: true })}
      />
    );

    expect(screen.getByText("发送失败")).toBeInTheDocument();
    expect(screen.getByText("八月新品介绍")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "重新发送" }));
    expect(await screen.findByText("已经排队重发。")).toBeInTheDocument();
  });

  it("shows who performed an important action", () => {
    render(
      <AuditLog
        events={[
          {
            id: "audit-1",
            actorName: "上司 A",
            entityType: "content",
            entityId: "content-1",
            action: "approved",
            createdAt: "2026-08-28T07:00:00.000Z",
          },
        ]}
      />
    );

    expect(screen.getByText("上司 A")).toBeInTheDocument();
    expect(screen.getByText("批准内容")).toBeInTheDocument();
  });
});
