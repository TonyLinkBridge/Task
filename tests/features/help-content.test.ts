import { describe, expect, it } from "vitest";

import {
  getAdjacentArticles,
  getHelpArticle,
  getHelpNavigation,
} from "@/features/help-center/content/registry";

describe("help content registry", () => {
  it("groups articles into the configured category order", () => {
    const navigation = getHelpNavigation();

    expect(navigation[0]?.title).toBe("新员工入门");
    expect(
      navigation.find((group) => group.title === "内容排期")?.articles[0]
        ?.title
    ).toBe("如何建立内容排期");
  });

  it("returns an article by its URL slug", () => {
    expect(getHelpArticle("内容审核/提交审核")?.title).toBe(
      "如何提交上司审核"
    );
  });

  it("returns adjacent articles in navigation order", () => {
    const adjacent = getAdjacentArticles("内容排期/建立内容");

    expect(adjacent.previous?.slug).toBe("新员工入门/欢迎");
    expect(adjacent.next?.slug).toBe("内容审核/提交审核");
  });

  it("returns no article for an unknown slug", () => {
    expect(getHelpArticle("不存在/文章")).toBeNull();
  });

  it("lists the Telegram content guides in their intended reading order", () => {
    const brandGuides = getHelpNavigation().find(
      (group) => group.title === "品牌与文案规范"
    );

    expect(brandGuides?.articles.map((article) => article.title)).toEqual([
      "Telegram 大群内容底层逻辑",
      "六大内容栏目与审核标准",
      "CTA Level 使用规则",
      "每周栏目与 CTA 对应表",
    ]);
  });
});
