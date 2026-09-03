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
    slug: "任务管理/建立与跟进任务",
    title: "如何建立与跟进任务",
    description: "建立任务、分派负责人、移动进度，并在完成后留下清楚记录。",
    category: "任务管理",
    order: 10,
    cover: "/mascots/chiikawa-peek.png",
    tags: ["任务", "负责人", "进度"],
    updatedAt: "2026-09-03",
    sourcePath: "task-management/manage-tasks.mdx",
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
  {
    slug: "发布流程/从批准到发布",
    title: "从批准到正式发布",
    description: "了解两位管理员批准后，内容怎样进入等待发布并由员工完成发布。",
    category: "发布流程",
    order: 10,
    cover: "/mascots/chiikawa-peek.png",
    tags: ["发布", "提醒", "已经发布"],
    updatedAt: "2026-09-03",
    sourcePath: "publishing/publish-content.mdx",
  },
  {
    slug: "平台操作/管理发布平台",
    title: "如何管理发布平台",
    description: "管理员可以建立、修改、停用和恢复团队使用的自定义发布平台。",
    category: "平台操作",
    order: 10,
    cover: "/mascots/chiikawa-peek.png",
    tags: ["平台", "管理员", "自定义"],
    updatedAt: "2026-09-03",
    sourcePath: "platforms/manage-platforms.mdx",
  },
  {
    slug: "平台操作/帮助中心内容示范",
    title: "帮助中心内容组件示范",
    description: "查看图片、影片、文件、表格、提示框、分页、代码、数学公式、流程图和 PDF 的实际显示方式。",
    category: "平台操作",
    order: 20,
    cover: "/mascots/chiikawa-peek.png",
    tags: ["帮助中心", "内容格式", "功能示范"],
    updatedAt: "2026-09-03",
    sourcePath: "platforms/help-content-components.mdx",
  },
  {
    slug: "品牌与文案规范/telegram-content-logic",
    title: "Telegram 大群内容底层逻辑",
    description: "先帮助用户理解市场、建立判断和降低风险，再承接已经成熟的真实需求。",
    category: "品牌与文案规范",
    order: 10,
    cover: "/mascots/chiikawa-peek.png",
    tags: ["Telegram", "内容策略", "JUYU"],
    updatedAt: "2026-09-03",
    sourcePath: "brand-copy/telegram-content-logic.mdx",
  },
  {
    slug: "品牌与文案规范/content-columns",
    title: "六大内容栏目与审核标准",
    description: "域名早报、域名101、域名Battle、域名拆解、域名避坑和品牌出海的固定写法。",
    category: "品牌与文案规范",
    order: 20,
    cover: "/mascots/chiikawa-peek.png",
    tags: ["内容栏目", "审核标准", "Telegram"],
    updatedAt: "2026-09-03",
    sourcePath: "brand-copy/content-columns.mdx",
  },
  {
    slug: "品牌与文案规范/cta-level",
    title: "CTA Level 使用规则",
    description: "按照文章产生的用户意图选择 Level 1、Level 2 或 Level 3，并只保留一个主要 CTA。",
    category: "品牌与文案规范",
    order: 30,
    cover: "/mascots/chiikawa-peek.png",
    tags: ["CTA", "Level 1", "Level 2", "Level 3"],
    updatedAt: "2026-09-03",
    sourcePath: "brand-copy/cta-level.mdx",
  },
  {
    slug: "品牌与文案规范/weekly-cta",
    title: "每周栏目与 CTA 对应表",
    description: "星期一至星期日的栏目安排、唯一 CTA 和每天的审核要求。",
    category: "品牌与文案规范",
    order: 40,
    cover: "/mascots/chiikawa-peek.png",
    tags: ["每周排期", "CTA", "审核"],
    updatedAt: "2026-09-03",
    sourcePath: "brand-copy/weekly-cta.mdx",
  },
  {
    slug: "常见问题/权限与内容状态",
    title: "权限、审核和内容状态常见问题",
    description: "快速查看员工与管理员权限、两人批准、Slack 通知和内容状态规则。",
    category: "常见问题",
    order: 10,
    cover: "/mascots/chiikawa-peek.png",
    tags: ["权限", "审核", "Slack", "状态"],
    updatedAt: "2026-09-03",
    sourcePath: "faq/common-questions.mdx",
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

export function getRecentlyUpdatedHelpArticles(limit = 4): HelpArticle[] {
  return getHelpArticles()
    .sort(
      (left, right) =>
        right.updatedAt.localeCompare(left.updatedAt) ||
        left.order - right.order ||
        left.title.localeCompare(right.title, "zh")
    )
    .slice(0, Math.max(0, limit));
}

export function getHelpArticle(slug: string): HelpArticle | null {
  let normalizedSlug = slug;
  try {
    normalizedSlug = decodeURIComponent(slug);
  } catch {
    // Keep the original value so an invalid URL simply returns no article.
  }

  return articles.find((article) => article.slug === normalizedSlug) ?? null;
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
