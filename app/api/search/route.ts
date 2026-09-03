import { makeGlobalSearchHandler } from "@/features/search/global-search-handler";
import { globalSearchRepository } from "@/features/search/repository";
import { searchHelpArticles } from "@/features/help-center/search";
import { getVerifiedUser } from "@/lib/auth/get-verified-user";

export const GET = makeGlobalSearchHandler({
  getVerifiedUser,
  searchTasks: (query) => globalSearchRepository.searchTasks(query),
  searchContents: (query) => globalSearchRepository.searchContents(query),
  searchHelpArticles: async (query) =>
    (await searchHelpArticles(query)).slice(0, 10).map((article) => ({
      id: article.slug,
      title: article.title,
      subtitle: article.category,
    })),
});
