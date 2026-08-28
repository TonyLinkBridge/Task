import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/features/approval/actions", () => ({
  approveContent: vi.fn(),
  archiveContent: vi.fn(),
  markPublished: vi.fn(),
  requestChanges: vi.fn(),
  submitForReview: vi.fn(),
  unlockApprovedContent: vi.fn(),
}));

vi.mock("@/features/content/actions/inline-threads", () => ({
  clearResolvedComments: vi.fn(),
}));

vi.mock("@/features/content/components/blocknote-editor", () => ({
  BlockNoteEditor: ({ editable }: { editable: boolean }) => (
    <div data-testid="live-editor" data-editable={String(editable)} />
  ),
}));

vi.mock("@/features/content/components/snapshot-viewer", () => ({
  SnapshotViewer: () => <div data-testid="fixed-snapshot" />,
}));

vi.mock("@/features/approval/components/review-actions", () => ({
  ReviewActions: () => <div data-testid="review-actions" />,
}));

import { ContentEditorReview } from "@/features/content/components/content-editor-review";
import type { ContentRecord } from "@/features/content/types";

const content: ContentRecord = {
  id: "22222222-2222-4222-8222-222222222222",
  title: "员工送审内容",
  status: "in_review",
  authorId: "user_employee",
  assigneeId: "user_employee",
  publishAt: "2026-08-29T02:00:00.000Z",
  liveblocksRoomId: "content:22222222-2222-4222-8222-222222222222",
  currentVersion: 1,
  requiredApprovals: 2,
  requestedReviewerId: null,
  publishedBy: null,
  publishedAt: null,
  linkedTaskId: "33333333-3333-4333-8333-333333333333",
  archivedAt: null,
  createdAt: "2026-08-28T02:00:00.000Z",
  updatedAt: "2026-08-28T02:00:00.000Z",
};

describe("ContentEditorReview", () => {
  it("shows a locked snapshot while keeping inline comments available after employee submission", () => {
    render(
      <ContentEditorReview
        content={content}
        approvals={[]}
        currentUser={{
          id: "user_employee",
          role: "employee",
          name: "员工",
          imageUrl: null,
        }}
        admins={[]}
        snapshotDocument={[
          { type: "paragraph", content: "送审时保存的正文" },
        ]}
      />
    );

    expect(screen.getByTestId("fixed-snapshot")).toBeInTheDocument();
    expect(screen.getByText("这是送审时保存的固定版本，也是管理员批准的依据。")).toBeInTheDocument();
    expect(screen.getByText("指定文字留言")).toBeInTheDocument();
    expect(screen.getByTestId("live-editor")).toHaveAttribute(
      "data-editable",
      "false"
    );
    expect(screen.queryByTestId("live-editor")).not.toHaveAttribute(
      "data-editable",
      "true"
    );
  });

  it("restores the editable body after an admin requests changes", () => {
    render(
      <ContentEditorReview
        content={{ ...content, status: "changes_requested" }}
        approvals={[]}
        currentUser={{
          id: "user_employee",
          role: "employee",
          name: "员工",
          imageUrl: null,
        }}
        admins={[]}
        snapshotDocument={[
          { type: "paragraph", content: "上一次送审的正文" },
        ]}
      />
    );

    expect(screen.getByTestId("live-editor")).toHaveAttribute(
      "data-editable",
      "true"
    );
    expect(screen.queryByTestId("fixed-snapshot")).not.toBeInTheDocument();
    expect(
      screen.getByText("可以选中文字直接留言；送审前会先确认内容已经同步。")
    ).toBeInTheDocument();
  });
});
