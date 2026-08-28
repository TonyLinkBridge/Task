import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ApprovalProgress } from "@/features/approval/components/approval-progress";
import { ReviewActions } from "@/features/approval/components/review-actions";
import type { ContentApproval } from "@/features/approval/types";
import type { ContentRecord } from "@/features/content/types";

const contentId = "22222222-2222-4222-8222-222222222222";
const approval: ContentApproval = {
  id: "44444444-4444-4444-8444-444444444444",
  contentId,
  version: 1,
  adminId: "admin-a",
  approvedAt: "2026-08-28T04:00:00.000Z",
  invalidatedAt: null,
};

function content(overrides: Partial<ContentRecord> = {}): ContentRecord {
  return {
    id: contentId,
    title: "新品贴文",
    status: "in_review",
    authorId: "employee",
    assigneeId: "employee",
    publishAt: "2026-08-29T02:00:00.000Z",
    liveblocksRoomId: `content:${contentId}`,
    currentVersion: 1,
    requiredApprovals: 2,
    requestedReviewerId: null,
    publishedBy: null,
    publishedAt: null,
    linkedTaskId: "33333333-3333-4333-8333-333333333333",
    archivedAt: null,
    createdAt: "2026-08-28T02:00:00.000Z",
    updatedAt: "2026-08-28T02:00:00.000Z",
    ...overrides,
  };
}

describe("ApprovalProgress", () => {
  it("shows one of two approvals", () => {
    render(<ApprovalProgress required={2} approvals={[approval]} />);

    expect(screen.getByText("已批准 1/2")).toBeInTheDocument();
  });
});

describe("ReviewActions", () => {
  it("lets either admin review employee content", () => {
    render(
      <ReviewActions
        content={content()}
        approvals={[approval]}
        currentUser={{ id: "admin-b", role: "admin", name: "上司 B", imageUrl: null }}
        admins={[]}
        document={[]}
      />
    );

    expect(screen.getByRole("button", { name: "批准内容" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "要求修改" })).toBeInTheDocument();
  });

  it("only lets the chosen reviewer approve admin content", () => {
    render(
      <ReviewActions
        content={content({
          authorId: "admin-a",
          requiredApprovals: 1,
          requestedReviewerId: "admin-b",
        })}
        approvals={[]}
        currentUser={{ id: "admin-a", role: "admin", name: "上司 A", imageUrl: null }}
        admins={[]}
        document={[]}
      />
    );

    expect(screen.getByText("已经交给另一位管理员检查")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "批准内容" })).not.toBeInTheDocument();
  });

  it("shows the submit action while an employee is editing", () => {
    render(
      <ReviewActions
        content={content({ status: "changes_requested" })}
        approvals={[]}
        currentUser={{ id: "employee", role: "employee", name: "员工", imageUrl: null }}
        admins={[]}
        document={[{ type: "paragraph" }]}
      />
    );

    expect(screen.getByRole("button", { name: "交给上司检查" })).toBeInTheDocument();
  });
});
