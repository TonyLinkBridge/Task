import Link from "next/link";

import type { HelpArticle } from "../content/types";

// Adapted from GitBook's PageBody breadcrumb presentation.
export function HelpBreadcrumbs({ article }: { article: HelpArticle }) {
  return (
    <nav aria-label="面包屑" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <Link href="/help" className="hover:text-foreground">帮助中心</Link>
      <span aria-hidden="true">›</span>
      <span>{article.category}</span>
      <span aria-hidden="true">›</span>
      <span className="text-foreground">{article.title}</span>
    </nav>
  );
}
