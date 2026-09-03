export const helpCategoryIds = [
  "新员工入门",
  "任务管理",
  "内容排期",
  "内容审核",
  "发布流程",
  "平台操作",
  "品牌与文案规范",
  "常见问题",
] as const;

export type HelpCategoryId = (typeof helpCategoryIds)[number];

export type HelpArticle = {
  slug: string;
  title: string;
  description: string;
  category: HelpCategoryId;
  order: number;
  cover: string;
  tags: string[];
  updatedAt: string;
  sourcePath: string;
};

export type HelpCategory = {
  id: HelpCategoryId;
  title: string;
  order: number;
  articles: HelpArticle[];
};

export type HelpArticleDocument = HelpArticle & {
  source: string;
};
