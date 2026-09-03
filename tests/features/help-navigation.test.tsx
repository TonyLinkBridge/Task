import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { extractHelpHeadings } from "@/features/help-center/content/headings";
import { getHelpArticle, getHelpNavigation } from "@/features/help-center/content/registry";
import { HelpBreadcrumbs } from "@/features/help-center/gitbook/breadcrumbs";
import { HelpMobileNavigation } from "@/features/help-center/gitbook/mobile-navigation";
import { HelpPageAside } from "@/features/help-center/gitbook/page-aside";
import { HelpPageFooterNavigation } from "@/features/help-center/gitbook/page-footer-navigation";
import { HelpScrollToTop } from "@/features/help-center/gitbook/scroll-to-top";
import { HelpTableOfContents } from "@/features/help-center/gitbook/table-of-contents";

const article = getHelpArticle("内容排期/建立内容")!;

describe("help article navigation", () => {
  it("groups child articles and marks the current article", () => {
    render(
      <HelpTableOfContents
        navigation={getHelpNavigation()}
        currentSlug={article.slug}
      />
    );

    expect(screen.getByRole("navigation", { name: "文章目录" }))
      .toBeInTheDocument();
    expect(screen.getByRole("link", { name: article.title }))
      .toHaveAttribute("aria-current", "page");
  });

  it("shows the complete breadcrumb path", () => {
    render(<HelpBreadcrumbs article={article} />);

    const breadcrumbs = screen.getByRole("navigation", { name: "面包屑" });
    expect(breadcrumbs).toHaveTextContent("帮助中心");
    expect(breadcrumbs).toHaveTextContent("内容排期");
    expect(breadcrumbs).toHaveTextContent("如何建立内容排期");
  });

  it("extracts stable and unique article heading ids", () => {
    expect(
      extractHelpHeadings("## 填写资料\n文字\n### 选择平台\n## 填写资料")
    ).toEqual([
      { id: "填写资料", text: "填写资料", level: 2 },
      { id: "选择平台", text: "选择平台", level: 3 },
      { id: "填写资料-2", text: "填写资料", level: 2 },
    ]);
  });

  it("shows the article outline and adjacent article links", () => {
    const headings = [{ id: "填写资料", text: "填写资料", level: 2 as const }];

    render(
      <>
        <HelpPageAside headings={headings} />
        <HelpPageFooterNavigation
          previous={getHelpArticle("新员工入门/欢迎")}
          next={getHelpArticle("内容审核/提交审核")}
        />
      </>
    );

    expect(screen.getByRole("complementary", { name: "本页内容" }))
      .toHaveTextContent("填写资料");
    expect(screen.getByRole("link", { name: /上一篇：欢迎使用/ }))
      .toBeInTheDocument();
    expect(screen.getByRole("link", { name: /下一篇：如何提交上司审核/ }))
      .toBeInTheDocument();
  });

  it("opens the complete directory from the mobile button", () => {
    render(
      <HelpMobileNavigation
        navigation={getHelpNavigation()}
        currentSlug={article.slug}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "打开文章目录" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("文章目录");
    expect(screen.getByRole("dialog")).toHaveTextContent(article.title);
  });

  it("scrolls back to the top", () => {
    const scrollTo = vi.fn();
    Object.defineProperty(window, "scrollTo", { value: scrollTo, writable: true });
    render(<HelpScrollToTop />);

    fireEvent.click(screen.getByRole("button", { name: "回到顶部" }));
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });
});
