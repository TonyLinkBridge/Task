import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelpHome } from "@/features/help-center/components/help-home";
import { HelpLayout } from "@/features/help-center/components/help-layout";
import {
  getHelpArticles,
  getHelpNavigation,
  getRecentlyUpdatedHelpArticles,
} from "@/features/help-center/content/registry";

describe("help center pages", () => {
  it("shows the announcement, search introduction and article categories", () => {
    render(
      <HelpHome
        articles={getHelpArticles()}
        recentArticles={getRecentlyUpdatedHelpArticles()}
        navigation={getHelpNavigation()}
      />
    );

    expect(screen.getByRole("heading", { name: "有什么可以帮到你？" }))
      .toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "JUYU Marketing 帮助中心已经上线"
    );
    expect(screen.getByRole("heading", { name: "内容排期" }))
      .toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "最近更新" }))
      .toBeInTheDocument();
    expect(screen.getByRole("link", { name: "如何建立内容排期" }))
      .toHaveAttribute("href", "/help/内容排期/建立内容");
    expect(screen.queryByText("文章准备中")).not.toBeInTheDocument();
  });

  it("provides the three-column article reading layout", () => {
    render(
      <HelpLayout
        navigation={<nav aria-label="文章目录">目录</nav>}
        aside={<aside aria-label="本页内容">本页内容</aside>}
      >
        <article>正文</article>
      </HelpLayout>
    );

    expect(screen.getByTestId("help-three-column-layout"))
      .toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "文章目录" }))
      .toBeInTheDocument();
    expect(screen.getByRole("article")).toHaveTextContent("正文");
    expect(screen.getByRole("complementary", { name: "本页内容" }))
      .toBeInTheDocument();
  });
});
