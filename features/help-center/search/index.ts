import { loadHelpArticle } from "../content/loader";
import { getHelpArticles } from "../content/registry";
import type { HelpCategoryId } from "../content/types";

export type HelpSearchResult = {
  slug: string;
  title: string;
  category: HelpCategoryId;
  excerpt: string;
  score: number;
};

function plainText(source: string) {
  return source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_`>|\[\]{}()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function excerptAround(text: string, query: string) {
  const index = text.toLocaleLowerCase("zh").indexOf(query.toLocaleLowerCase("zh"));
  if (index < 0) return text.slice(0, 110);
  const start = Math.max(0, index - 35);
  const end = Math.min(text.length, index + query.length + 75);
  return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
}

export async function searchHelpArticles(query: string): Promise<HelpSearchResult[]> {
  const needle = query.trim().toLocaleLowerCase("zh");
  if (needle.length < 2) return [];

  const results = await Promise.all(
    getHelpArticles().map(async (article) => {
      const document = await loadHelpArticle(article.slug);
      const body = plainText(document?.source ?? "");
      const title = article.title.toLocaleLowerCase("zh");
      const description = article.description.toLocaleLowerCase("zh");
      const tags = article.tags.join(" ").toLocaleLowerCase("zh");
      const bodyLower = body.toLocaleLowerCase("zh");

      let score = 0;
      if (title === needle) score += 120;
      else if (title.startsWith(needle)) score += 90;
      else if (title.includes(needle)) score += 70;
      if (tags.includes(needle)) score += 50;
      if (description.includes(needle)) score += 35;
      if (bodyLower.includes(needle)) score += 20;
      if (score === 0) return null;

      const excerptSource = bodyLower.includes(needle) ? body : article.description;
      return {
        slug: article.slug,
        title: article.title,
        category: article.category,
        excerpt: excerptAround(excerptSource, query.trim()),
        score,
      } satisfies HelpSearchResult;
    })
  );

  return results
    .filter((result) => result !== null)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title, "zh"));
}
