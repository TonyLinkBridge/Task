import Link from "next/link";
import { notFound } from "next/navigation";

import { HelpLayout } from "@/features/help-center/components/help-layout";
import { loadHelpArticle } from "@/features/help-center/content/loader";
import { getHelpNavigation } from "@/features/help-center/content/registry";
import { HelpFooter } from "@/features/help-center/gitbook/footer";
import { HelpPageCover } from "@/features/help-center/gitbook/page-cover";
import { HelpPageTags } from "@/features/help-center/gitbook/page-tags";

export default async function HelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const article = await loadHelpArticle(slug.join("/"));
  if (!article) notFound();

  const navigation = getHelpNavigation();

  return (
    <HelpLayout
      navigation={
        <nav aria-label="文章目录" className="space-y-5 text-sm">
          {navigation.map((category) => (
            <section key={category.id}>
              <h2 className="font-semibold">{category.title}</h2>
              <div className="mt-2 grid gap-1.5">
                {category.articles.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/help/${item.slug}`}
                    className={
                      item.slug === article.slug
                        ? "font-medium text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </nav>
      }
      aside={
        <aside aria-label="本页内容" className="text-sm">
          <p className="font-semibold">本页内容</p>
          <p className="mt-2 text-muted-foreground">文章小目录将在下一项加入。</p>
        </aside>
      }
    >
      <article>
        <HelpPageCover src={article.cover} title={article.category} />
        <p className="text-sm text-muted-foreground">帮助中心 → {article.category}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{article.title}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{article.description}</p>
        <div className="mt-5">
          <HelpPageTags tags={article.tags} />
        </div>
        <div className="mt-8 whitespace-pre-wrap leading-7 text-foreground/90">
          {article.source}
        </div>
        <HelpFooter />
      </article>
    </HelpLayout>
  );
}
