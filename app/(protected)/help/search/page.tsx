import Link from "next/link";

import { HelpSearchInput } from "@/features/help-center/gitbook/search-input";
import { HelpSearchResults } from "@/features/help-center/gitbook/search-results";
import { searchHelpArticles } from "@/features/help-center/search";

export default async function HelpSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const raw = (await searchParams).q;
  const query = (Array.isArray(raw) ? raw[0] : raw ?? "").trim().slice(0, 100);
  const results = query.length >= 2 ? await searchHelpArticles(query) : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link href="/help" className="text-sm text-muted-foreground hover:text-foreground">← 返回帮助中心</Link>
      <h1 className="mt-6 text-3xl font-semibold">搜索帮助文章</h1>
      <div className="mt-6"><HelpSearchInput defaultValue={query} /></div>
      <p className="mb-4 mt-8 text-sm text-muted-foreground">
        {query.length >= 2 ? `“${query}”找到 ${results.length} 个结果` : "输入至少两个字开始搜索"}
      </p>
      <HelpSearchResults query={query} results={results} />
    </div>
  );
}
