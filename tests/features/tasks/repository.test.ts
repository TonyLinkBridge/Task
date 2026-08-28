import { describe, expect, it } from "vitest";

import { mapTaskRow } from "@/features/tasks/task-mapper";

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
