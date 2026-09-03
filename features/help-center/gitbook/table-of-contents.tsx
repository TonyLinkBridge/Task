import Link from "next/link";

import type { HelpCategory } from "../content/types";

// Adapted from GitBook's TableOfContents and PagesList components.
export function HelpTableOfContents({
  navigation,
  currentSlug,
}: {
  navigation: HelpCategory[];
  currentSlug: string;
}) {
  return (
    <nav aria-label="文章目录" className="space-y-5 text-sm">
      {navigation.map((category) => (
        <section key={category.id}>
          <h2 className="font-semibold text-foreground">{category.title}</h2>
          {category.articles.length ? (
            <div className="mt-2 grid gap-0.5 border-l pl-3">
              {category.articles.map((article) => {
                const active = article.slug === currentSlug;
                return (
                  <Link
                    key={article.slug}
                    href={`/help/${article.slug}`}
                    aria-current={active ? "page" : undefined}
                    className={
                      active
                        ? "-ml-[13px] border-l-2 border-primary py-1.5 pl-[11px] font-medium text-foreground"
                        : "py-1.5 text-muted-foreground transition-colors hover:text-foreground"
                    }
                  >
                    {article.title}
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">文章准备中</p>
          )}
        </section>
      ))}
    </nav>
  );
}
