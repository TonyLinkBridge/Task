import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import type { HelpArticleDocument } from "./types";
import { getHelpArticle } from "./registry";

export async function loadHelpArticle(
  slug: string
): Promise<HelpArticleDocument | null> {
  const article = getHelpArticle(slug);
  if (!article) {
    return null;
  }

  const filePath = path.join(process.cwd(), "content", "help", article.sourcePath);
  const source = await readFile(filePath, "utf8");

  return { ...article, source };
}
