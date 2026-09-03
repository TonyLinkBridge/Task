import Link from "next/link";

import { HelpAnnouncement } from "../gitbook/announcement";
import { HelpFooter } from "../gitbook/footer";
import { HelpSearchInput } from "../gitbook/search-input";
import type { HelpArticle, HelpCategory } from "../content/types";

export function HelpHome({
  articles,
  navigation,
}: {
  articles: HelpArticle[];
  navigation: HelpCategory[];
}) {
  return (
    <div>
      <HelpAnnouncement>JUYU Marketing 帮助中心已经上线</HelpAnnouncement>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <section className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            有什么可以帮到你？
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            搜索工作流程、内容审核规则和平台操作说明。
          </p>
          <div className="mx-auto mt-7 max-w-2xl"><HelpSearchInput large /></div>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold">常用文章</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {articles.slice(0, 3).map((article) => (
              <Link
                key={article.slug}
                href={`/help/${article.slug}`}
                className="rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50"
              >
                <p className="font-medium">{article.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {article.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold">所有分类</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {navigation.map((category) => (
              <section key={category.id} className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold">{category.title}</h3>
                {category.articles.length ? (
                  <div className="mt-3 grid gap-2">
                    {category.articles.map((article) => (
                      <Link
                        key={article.slug}
                        href={`/help/${article.slug}`}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        {article.title}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">文章准备中</p>
                )}
              </section>
            ))}
          </div>
        </section>

        <HelpFooter />
      </div>
    </div>
  );
}
