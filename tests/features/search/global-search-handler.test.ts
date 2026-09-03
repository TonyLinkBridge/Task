import { describe, expect, it } from "vitest";

import { makeGlobalSearchHandler } from "@/features/search/global-search-handler";

describe("global search handler", () => {
  it("searches tasks and scheduled content after verifying the member", async () => {
    const handler = makeGlobalSearchHandler({
      getVerifiedUser: async () => ({
        id: "user_employee",
        role: "employee",
        name: "Employee",
        imageUrl: null,
      }),
      searchTasks: async () => [
        { id: "task-1", title: "准备周报", subtitle: "内容运营" },
      ],
      searchContents: async () => [
        { id: "content-1", title: "周报内容", subtitle: "草稿" },
      ],
      searchHelpArticles: async () => [
        { id: "内容排期/周报", title: "如何建立周报", subtitle: "帮助文章" },
      ],
    });

    const response = await handler(
      new Request("http://localhost/api/search?q=%E5%91%A8%E6%8A%A5")
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      results: [
        {
          id: "task-1",
          type: "task",
          title: "准备周报",
          subtitle: "内容运营",
          href: "/tasks/task-1",
        },
        {
          id: "content-1",
          type: "content",
          title: "周报内容",
          subtitle: "草稿",
          href: "/content/content-1",
        },
        {
          id: "内容排期/周报",
          type: "help",
          title: "如何建立周报",
          subtitle: "帮助文章",
          href: "/help/内容排期/周报",
        },
      ],
    });
  });

  it("does not search a one-letter query", async () => {
    const handler = makeGlobalSearchHandler({
      getVerifiedUser: async () => ({
        id: "user_employee",
        role: "employee",
        name: "Employee",
        imageUrl: null,
      }),
      searchTasks: async () => [],
      searchContents: async () => [],
      searchHelpArticles: async () => [],
    });

    const response = await handler(new Request("http://localhost/api/search?q=a"));
    expect(response.status).toBe(400);
  });
});
