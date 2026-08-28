import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ContentBoard, contentBoardMoveMessage } from "@/features/schedule/components/content-board";
import { ContentCalendar } from "@/features/schedule/components/content-calendar";
import { ContentList } from "@/features/schedule/components/content-list";
import type { ScheduledContent } from "@/features/schedule/types";

const scheduled: ScheduledContent = {
  id: "22222222-2222-4222-8222-222222222222",
  title: "新品贴文",
  status: "in_review",
  storedStatus: "in_review",
  publishAt: "2026-08-28T18:00:00.000Z",
  assignee: { id: "employee", name: "员工", imageUrl: null },
  platforms: [{ id: "11111111-1111-4111-8111-111111111111", name: "Instagram", color: "#ec4899" }],
  requiredApprovals: 2,
  approvalAdminIds: ["admin-a"],
};

describe("schedule views", () => {
  it("shows the same content in the calendar and list", () => {
    const { rerender } = render(<ContentCalendar contents={[scheduled]} />);
    expect(screen.getByText("2026年8月29日")).toBeInTheDocument();
    expect(screen.getByText("新品贴文")).toBeInTheDocument();

    rerender(<ContentList contents={[scheduled]} />);
    expect(screen.getByText("新品贴文")).toBeInTheDocument();
    expect(screen.getByText("已批准 1/2")).toBeInTheDocument();
  });

  it("always shows all six board columns", () => {
    render(<ContentBoard initialContents={[scheduled]} />);

    expect(screen.getByRole("region", { name: "草稿" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "等待审核" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "需要修改" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "已经批准" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "等待发布" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "已经发布" })).toBeInTheDocument();
  });

  it("replaces board cards when filtered server data changes", () => {
    const { rerender } = render(<ContentBoard initialContents={[scheduled]} />);
    expect(screen.getByText("新品贴文")).toBeInTheDocument();

    rerender(<ContentBoard initialContents={[]} />);

    expect(screen.queryByText("新品贴文")).not.toBeInTheDocument();
  });

  it("does not let dragging pretend that content was approved or published", () => {
    expect(contentBoardMoveMessage("in_review", "approved")).toBe(
      "必须使用批准按钮，不能直接拖到这里。"
    );
    expect(contentBoardMoveMessage("approved", "published")).toBe(
      "必须使用已发布按钮，不能直接拖到这里。"
    );
    expect(contentBoardMoveMessage("changes_requested", "draft")).toBeNull();
  });
});
