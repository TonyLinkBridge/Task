import { describe, expect, it } from "vitest";

import {
  createContentRepository,
  mapContentCommentRow,
  mapContentRow,
  mapPlatformRow,
} from "@/features/content/repository";

const contentId = "22222222-2222-4222-8222-222222222222";

describe("mapContentRow", () => {
  it("turns database fields into content data", () => {
    expect(
      mapContentRow({
        id: contentId,
        title: "新品贴文",
        status: "draft",
        author_id: "user_admin",
        assignee_id: "user_employee",
        publish_at: "2026-08-29T02:00:00.000Z",
        liveblocks_room_id: `content:${contentId}`,
        current_version: 0,
        required_approvals: 1,
        requested_reviewer_id: null,
        published_by: null,
        published_at: null,
        linked_task_id: null,
        archived_at: null,
        created_at: "2026-08-28T02:00:00.000Z",
        updated_at: "2026-08-28T02:00:00.000Z",
      })
    ).toEqual({
      id: contentId,
      title: "新品贴文",
      status: "draft",
      authorId: "user_admin",
      assigneeId: "user_employee",
      publishAt: "2026-08-29T02:00:00.000Z",
      liveblocksRoomId: `content:${contentId}`,
      currentVersion: 0,
      requiredApprovals: 1,
      requestedReviewerId: null,
      publishedBy: null,
      publishedAt: null,
      linkedTaskId: null,
      archivedAt: null,
      createdAt: "2026-08-28T02:00:00.000Z",
      updatedAt: "2026-08-28T02:00:00.000Z",
    });
  });
});

describe("createContentRepository", () => {
  it("creates a content with a stable private room id", async () => {
    const rpcNames: string[] = [];
    const client = {
      rpc: async (name: string) => {
        rpcNames.push(name);
        return { data: {
          id: contentId,
          title: "新品贴文",
          status: "draft",
          author_id: "user_admin",
          assignee_id: "user_employee",
          publish_at: "2026-08-29T02:00:00.000Z",
          liveblocks_room_id: `content:${contentId}`,
          current_version: 0,
          required_approvals: 1,
          requested_reviewer_id: null,
          published_by: null,
          published_at: null,
          linked_task_id: null,
          archived_at: null,
          created_at: "2026-08-28T02:00:00.000Z",
          updated_at: "2026-08-28T02:00:00.000Z",
        },
        error: null };
      },
    };
    const repository = createContentRepository(
      client as never,
      () => contentId
    );

    const content = await repository.create(
      {
        title: "新品贴文",
        platformIds: ["11111111-1111-4111-8111-111111111111"],
        publishAt: "2026-08-29T02:00:00.000Z",
        assigneeId: "user_employee",
      },
      "user_admin"
    );

    expect(content.liveblocksRoomId).toBe(`content:${contentId}`);
    expect(rpcNames).toEqual(["create_scheduled_content"]);
  });

  it("updates schedule fields through the protected RPC", async () => {
    const calls: { name: string; input: Record<string, unknown> }[] = [];
    const client = {
      rpc: async (name: string, input: Record<string, unknown>) => {
        calls.push({ name, input });
        return {
          data: {
            id: contentId,
            title: "修改后的标题",
            status: "draft",
            author_id: "user_admin",
            assignee_id: "user_employee_2",
            publish_at: "2026-08-30T04:30:00.000Z",
            liveblocks_room_id: `content:${contentId}`,
            current_version: 0,
            required_approvals: 1,
            requested_reviewer_id: null,
            published_by: null,
            published_at: null,
            linked_task_id: "33333333-3333-4333-8333-333333333333",
            archived_at: null,
            created_at: "2026-08-28T02:00:00.000Z",
            updated_at: "2026-08-28T06:00:00.000Z",
          },
          error: null,
        };
      },
    };
    const repository = createContentRepository(client as never);

    await repository.updateSchedule(
      contentId,
      {
        title: "修改后的标题",
        platformIds: ["44444444-4444-4444-8444-444444444444"],
        assigneeId: "user_employee_2",
        publishAt: "2026-08-30T04:30:00.000Z",
      },
      "user_admin"
    );

    expect(calls).toEqual([
      {
        name: "update_scheduled_content",
        input: {
          p_content_id: contentId,
          p_actor_id: "user_admin",
          p_title: "修改后的标题",
          p_assignee_id: "user_employee_2",
          p_publish_at: "2026-08-30T04:30:00.000Z",
          p_platform_ids: ["44444444-4444-4444-8444-444444444444"],
        },
      },
    ]);
  });
});

describe("mapContentCommentRow", () => {
  it("includes the ordinary comment author's profile", () => {
    expect(
      mapContentCommentRow({
        id: "33333333-3333-4333-8333-333333333333",
        content_id: contentId,
        author_id: "user_admin",
        body: "请换一张图片",
        created_at: "2026-08-28T03:00:00.000Z",
        author: { display_name: "上司", avatar_url: null },
      })
    ).toEqual({
      id: "33333333-3333-4333-8333-333333333333",
      contentId,
      authorId: "user_admin",
      body: "请换一张图片",
      createdAt: "2026-08-28T03:00:00.000Z",
      authorName: "上司",
      authorImageUrl: null,
    });
  });
});

describe("mapPlatformRow", () => {
  it("keeps the active or stopped state for administrator settings", () => {
    expect(
      mapPlatformRow({
        id: "11111111-1111-4111-8111-111111111111",
        name: "Instagram",
        color: "#ec4899",
        archived_at: "2026-08-28T04:00:00.000Z",
        created_at: "2026-08-28T02:00:00.000Z",
      })
    ).toEqual({
      id: "11111111-1111-4111-8111-111111111111",
      name: "Instagram",
      color: "#ec4899",
      archivedAt: "2026-08-28T04:00:00.000Z",
      createdAt: "2026-08-28T02:00:00.000Z",
    });
  });
});
