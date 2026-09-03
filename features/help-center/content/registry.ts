import type { HelpArticle, HelpCategory } from "./types";
import { helpCategoryIds } from "./types";

const articles: HelpArticle[] = [
  {
    slug: "新员工入门/欢迎",
    title: "欢迎使用 JUYU 内部工作台",
    description: "认识任务、内容排期和内部审核的基本使用方式。",
    category: "新员工入门",
    order: 10,
    cover: "/mascots/chiikawa-peek.png",
    tags: ["开始使用", "新员工"],
    updatedAt: "2026-09-03",
    sourcePath: "getting-started/welcome.mdx",
  },
  {
    slug: "内容排期/建立内容",
    title: "如何建立内容排期",
    description: "填写标题、平台、负责人和发布时间，再开始准备正文。",
    category: "内容排期",
    order: 10,
    cover: "/mascots/chiikawa-peek.png",
    tags: ["内容排期", "建立内容"],
    updatedAt: "2026-09-03",
    sourcePath: "content-scheduling/create-content.mdx",
  },
  {
    slug: "内容审核/提交审核",
    title: "如何提交上司审核",
    description: "完成正文后提交检查，并等待两位管理员批准。",
    category: "内容审核",
    order: 10,
    cover: "/mascots/chiikawa-peek.png",
    tags: ["审核", "管理员批准"],
    updatedAt: "2026-09-03",
    sourcePath: "content-review/submit-review.mdx",
  },
];

function validateArticles(items: HelpArticle[]) {
  const slugs = new Set<string>();

  for (const article of items) {
    if (slugs.has(article.slug)) {
      throw new Error(`帮助文章地址重复：${article.slug}`);
    }
    slugs.add(article.slug);
  }
}

validateArticles(articles);

export function getHelpArticles(): HelpArticle[] {
  return [...articles];
}

export function getHelpArticle(slug: string): HelpArticle | null {
  return articles.find((article) => article.slug === slug) ?? null;
}

export function getHelpNavigation(): HelpCategory[] {
  return helpCategoryIds.map((id, order) => ({
    id,
    title: id,
    order,
    articles: articles
      .filter((article) => article.category === id)
      .sort((left, right) => left.order - right.order),
  }));
}

export function getAdjacentArticles(slug: string): {
  previous: HelpArticle | null;
  next: HelpArticle | null;
} {
  const ordered = getHelpNavigation().flatMap((category) => category.articles);
  const index = ordered.findIndex((article) => article.slug === slug);

  if (index < 0) {
    return { previous: null, next: null };
  }

  return {
    previous: ordered[index - 1] ?? null,
    next: ordered[index + 1] ?? null,
  };
}
