import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelpSearchResults } from "@/features/help-center/gitbook/search-results";
import { searchHelpArticles } from "@/features/help-center/search";

describe("help article search", () => {
  it("ranks a matching article and includes a useful excerpt", async () => {
    const results = await searchHelpArticles("提交审核");

    expect(results[0]).toMatchObject({
      slug: "内容审核/提交审核",
      title: "如何提交上司审核",
      category: "内容审核",
    });
    expect(results[0]?.excerpt).toContain("提交");
  });

  it("returns no results for unrelated words", async () => {
    await expect(searchHelpArticles("火星办公室")).resolves.toEqual([]);
  });

  it("finds the Telegram CTA guide by its rules", async () => {
    const results = await searchHelpArticles("Level 3");

    expect(results[0]).toMatchObject({
      slug: "品牌与文案规范/cta-level",
      title: "CTA Level 使用规则",
      category: "品牌与文案规范",
    });
  });

  it("shows highlighted results without creating HTML from the query", () => {
    render(
      <HelpSearchResults
        query="提交"
        results={[
          {
            slug: "内容审核/提交审核",
            title: "如何提交上司审核",
            category: "内容审核",
            excerpt: "完成正文后提交检查。",
            score: 100,
          },
        ]}
      />
    );

    expect(screen.getByRole("link", { name: /如何提交上司审核/ }))
      .toHaveAttribute("href", "/help/内容审核/提交审核");
    expect(screen.getAllByText("提交")[0]?.tagName).toBe("MARK");
  });
});
