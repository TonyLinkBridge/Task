import { describe, expect, it } from "vitest";

import {
  mapAssignableUserRow,
  mapTaskCommentRow,
  mapTaskRow,
} from "@/features/tasks/task-mapper";

describe("mapTaskRow", () => {
  it("turns database field names and numeric positions into app data", () => {
    expect(
      mapTaskRow({
        id: "11111111-1111-4111-8111-111111111111",
        title: "准备周报",
        description: "",
        status: "review",
        priority: "urgent",
        kind: "general",
        assignee_id: "user_employee",
        creator_id: "user_admin",
        due_at: "2026-08-29T02:00:00.000Z",
        position: "2500",
        linked_content_id: null,
        archived_at: null,
        created_at: "2026-08-28T02:00:00.000Z",
        updated_at: "2026-08-28T03:00:00.000Z",
      })
    ).toEqual({
      id: "11111111-1111-4111-8111-111111111111",
      title: "准备周报",
      description: "",
      status: "review",
      priority: "urgent",
      kind: "general",
      assigneeId: "user_employee",
      creatorId: "user_admin",
      dueAt: "2026-08-29T02:00:00.000Z",
      position: 2500,
      linkedContentId: null,
      archivedAt: null,
      createdAt: "2026-08-28T02:00:00.000Z",
      updatedAt: "2026-08-28T03:00:00.000Z",
    });
  });
});

describe("mapTaskCommentRow", () => {
  it("includes the comment author's profile", () => {
    expect(
      mapTaskCommentRow({
        id: "22222222-2222-4222-8222-222222222222",
        task_id: "11111111-1111-4111-8111-111111111111",
        author_id: "user_admin",
        body: "请补一张图片",
        created_at: "2026-08-28T02:00:00.000Z",
        author: { display_name: "Admin", avatar_url: null },
      })
    ).toEqual({
      id: "22222222-2222-4222-8222-222222222222",
      taskId: "11111111-1111-4111-8111-111111111111",
      authorId: "user_admin",
      body: "请补一张图片",
      createdAt: "2026-08-28T02:00:00.000Z",
      authorName: "Admin",
      authorImageUrl: null,
    });
  });
});

describe("mapAssignableUserRow", () => {
  it("maps an active profile for task assignment", () => {
    expect(
      mapAssignableUserRow({
        clerk_user_id: "user_employee",
        role: "employee",
        display_name: "Employee",
        avatar_url: null,
      })
    ).toEqual({
      id: "user_employee",
      role: "employee",
      name: "Employee",
      imageUrl: null,
    });
  });
});
