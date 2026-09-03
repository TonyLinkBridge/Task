import Link from "next/link";
import type { ReactNode } from "react";

import type { HelpSearchResult } from "../search";

function highlight(text: string, query: string): ReactNode[] {
  if (!query) return [text];
  const lowerText = text.toLocaleLowerCase("zh");
  const lowerQuery = query.toLocaleLowerCase("zh");
  const output: ReactNode[] = [];
  let cursor = 0;
  let index = lowerText.indexOf(lowerQuery, cursor);

  while (index >= 0) {
    output.push(text.slice(cursor, index));
    output.push(<mark key={`${index}-${cursor}`} className="rounded bg-yellow-200 px-0.5 text-inherit dark:bg-yellow-700">{text.slice(index, index + query.length)}</mark>);
    cursor = index + query.length;
    index = lowerText.indexOf(lowerQuery, cursor);
  }
  output.push(text.slice(cursor));
  return output;
}

// Adapted from GitBook's SearchResults, SearchPageResultItem and HighlightQuery.
export function HelpSearchResults({ query, results }: { query: string; results: HelpSearchResult[] }) {
  if (query.length < 2) {
    return <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">请输入至少两个字。</p>;
  }
  if (results.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <p className="font-medium">没有找到相关帮助文章</p>
        <p className="mt-2 text-sm text-muted-foreground">可以换一个比较简单的说法再试。</p>
        <Link href="/help" className="mt-4 inline-block text-sm font-medium underline">返回帮助中心</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {results.map((result) => (
        <Link key={result.slug} href={`/help/${result.slug}`} className="rounded-xl border bg-card p-5 transition-colors hover:bg-muted/40">
          <p className="font-semibold">{highlight(result.title, query)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{result.category}</p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{highlight(result.excerpt, query)}</p>
        </Link>
      ))}
    </div>
  );
}
