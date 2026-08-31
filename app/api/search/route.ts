import { makeGlobalSearchHandler } from "@/features/search/global-search-handler";
import { globalSearchRepository } from "@/features/search/repository";
import { getVerifiedUser } from "@/lib/auth/get-verified-user";

export const GET = makeGlobalSearchHandler({
  getVerifiedUser,
  searchTasks: (query) => globalSearchRepository.searchTasks(query),
  searchContents: (query) => globalSearchRepository.searchContents(query),
});
