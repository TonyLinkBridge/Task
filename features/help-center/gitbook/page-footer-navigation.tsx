import Link from "next/link";

import type { HelpArticle } from "../content/types";

// Adapted from GitBook's PageFooterNavigation component.
export function HelpPageFooterNavigation({
  previous,
  next,
}: {
  previous: HelpArticle | null;
  next: HelpArticle | null;
}) {
  if (!previous && !next) return null;

  return (
    <nav aria-label="上一篇和下一篇" className="mt-10 grid gap-3 border-t pt-6 sm:grid-cols-2">
      {previous ? (
        <Link href={`/help/${previous.slug}`} className="min-h-20 rounded-xl border p-4 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="text-xs text-muted-foreground">上一篇</span>
          <span className="mt-1 block font-medium">上一篇：{previous.title}</span>
        </Link>
      ) : <span />}
      {next ? (
        <Link href={`/help/${next.slug}`} className="min-h-20 rounded-xl border p-4 text-right hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="text-xs text-muted-foreground">下一篇</span>
          <span className="mt-1 block font-medium">下一篇：{next.title}</span>
        </Link>
      ) : null}
    </nav>
  );
}
