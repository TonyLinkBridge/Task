import { MarketingLibrary } from '@/features/marketing/components/library';
import { MarketingShell } from '@/features/marketing/components/shell';
import { makeMarketingLibraryQueries } from '@/features/marketing/library-query-service';
import { contentRepository } from '@/features/content/repository';
import { listScheduledContent } from '@/features/schedule/queries';
import { getVerifiedUser } from '@/lib/auth/get-verified-user';
const library = makeMarketingLibraryQueries({ getVerifiedUser, listContents: listScheduledContent, listAttachments: id => contentRepository.listAttachments(id) });
export default async function MarketingLibraryPage() {
  const [currentUser, groups] = await Promise.all([getVerifiedUser(), library.list()]);
  return <MarketingShell currentUser={currentUser} active="library" title="Library" description="搜索现有内容里的图片和文件，选择预览或下载。"><MarketingLibrary groups={groups} /></MarketingShell>;
}
