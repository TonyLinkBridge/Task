import { notFound } from "next/navigation";

import { HelpLayout } from "@/features/help-center/components/help-layout";
import { extractHelpHeadings } from "@/features/help-center/content/headings";
import { loadHelpArticle } from "@/features/help-center/content/loader";
import {
  getAdjacentArticles,
  getHelpNavigation,
} from "@/features/help-center/content/registry";
import { HelpBreadcrumbs } from "@/features/help-center/gitbook/breadcrumbs";
import { HelpDocumentView } from "@/features/help-center/gitbook/document-view";
import { HelpFooter } from "@/features/help-center/gitbook/footer";
import { saveHelpFeedback } from "@/features/help-center/feedback/actions";
import { HelpMobileNavigation } from "@/features/help-center/gitbook/mobile-navigation";
import { HelpMobilePageOutline } from "@/features/help-center/gitbook/mobile-page-outline";
import { HelpPageAside } from "@/features/help-center/gitbook/page-aside";
import { HelpPageCover } from "@/features/help-center/gitbook/page-cover";
import { HelpPageFooterNavigation } from "@/features/help-center/gitbook/page-footer-navigation";
import { HelpPageTags } from "@/features/help-center/gitbook/page-tags";
import { HelpPageFeedback } from "@/features/help-center/gitbook/page-feedback";
import { HelpPdfPrintControls } from "@/features/help-center/gitbook/pdf-print-controls";
import { HelpPdfRootLayout } from "@/features/help-center/gitbook/pdf-root-layout";
import { HelpScrollToTop } from "@/features/help-center/gitbook/scroll-to-top";
import { HelpTableOfContents } from "@/features/help-center/gitbook/table-of-contents";

export default async function HelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const isPdfPage = slug.at(-1) === "pdf";
  const articleSlug = (isPdfPage ? slug.slice(0, -1) : slug).join("/");
  const article = await loadHelpArticle(articleSlug);
  if (!article) notFound();

  if (isPdfPage) {
    return (
      <HelpPdfRootLayout
        title={article.title}
        category={article.category}
        updatedAt={article.updatedAt}
      >
        <HelpPdfPrintControls articleHref={`/help/${article.slug}`} />
        <HelpDocumentView source={article.source} />
      </HelpPdfRootLayout>
    );
  }

  const navigation = getHelpNavigation();
  const headings = extractHelpHeadings(article.source);
  const adjacent = getAdjacentArticles(article.slug);

  return (
    <HelpLayout
      navigation={
        <HelpTableOfContents
          navigation={navigation}
          currentSlug={article.slug}
        />
      }
      aside={
        <div>
          <HelpPageAside headings={headings} />
          <HelpScrollToTop />
        </div>
      }
    >
      <article>
        <HelpMobileNavigation
          navigation={navigation}
          currentSlug={article.slug}
        />
        <HelpMobilePageOutline headings={headings} />
        <HelpPageCover src={article.cover} title={article.category} />
        <HelpBreadcrumbs article={article} />
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{article.title}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{article.description}</p>
        <div className="mt-5">
          <HelpPageTags tags={article.tags} />
        </div>
        <div className="mt-8">
          <HelpDocumentView source={article.source} />
        </div>
        <div className="mt-8 rounded-xl border bg-muted/30 p-4">
          <a
            className="font-medium underline underline-offset-4"
            href={`/help/${article.slug}/pdf`}
          >
            打开 PDF / 打印版本
          </a>
        </div>
        <HelpPageFooterNavigation
          previous={adjacent.previous}
          next={adjacent.next}
        />
        <HelpPageFeedback
          articleSlug={article.slug}
          saveAction={saveHelpFeedback}
        />
        <HelpFooter />
      </article>
    </HelpLayout>
  );
}
