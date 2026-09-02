import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ContentChat } from "@/features/content/components/content-chat";

describe("ContentChat", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows ordinary comments in a chat area", () => {
    render(
      <ContentChat
        contentId="22222222-2222-4222-8222-222222222222"
        currentUser={{
          id: "user_employee",
          role: "employee",
          name: "Employee",
          imageUrl: null,
        }}
        comments={[
          {
            id: "33333333-3333-4333-8333-333333333333",
            contentId: "22222222-2222-4222-8222-222222222222",
            authorId: "user_admin",
            authorName: "上司",
            authorImageUrl: null,
            body: "请换一张图片",
            createdAt: "2026-08-28T03:00:00.000Z",
          },
        ]}
      />
    );

    expect(screen.getByRole("heading", { name: "普通留言" })).toBeInTheDocument();
    expect(screen.getByText("上司")).toBeInTheDocument();
    expect(screen.getByText("请换一张图片")).toBeInTheDocument();
    expect(screen.getByLabelText("写留言")).toBeInTheDocument();
  });

  it("shows a comment added by another user without a page refresh", async () => {
    vi.useFakeTimers();
    const refreshedComment = {
      id: "44444444-4444-4444-8444-444444444444",
      contentId: "22222222-2222-4222-8222-222222222222",
      authorId: "user_admin",
      authorName: "Haley",
      authorImageUrl: null,
      body: "这条留言不用刷新就能看到",
      createdAt: "2026-09-02T03:00:00.000Z",
    };

    render(
      <ContentChat
        contentId="22222222-2222-4222-8222-222222222222"
        currentUser={{
          id: "user_employee",
          role: "employee",
          name: "Employee",
          imageUrl: null,
        }}
        comments={[]}
        refreshCommentsAction={async () => ({
          ok: true,
          data: [refreshedComment],
        })}
      />
    );

    expect(screen.queryByText(refreshedComment.body)).not.toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });

    expect(screen.getByText(refreshedComment.body)).toBeInTheDocument();
    expect(screen.getByText("Haley")).toBeInTheDocument();
  });
});
