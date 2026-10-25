import {hasPermission} from "@/features/team/permissions";
import { LibraryWorkspace } from '@/features/library-management/components/library-workspace';
import { mediaRepository } from '@/features/media-library/repository';
import { MarketingLibrary } from '@/features/marketing/components/library';
import { MarketingShell } from '@/features/marketing/components/shell';
import { makeMarketingLibraryQueries } from '@/features/marketing/library-query-service';
import { contentRepository } from '@/features/content/repository';
import { listScheduledContent } from '@/features/schedule/queries';
import { getVerifiedUser } from '@/lib/auth/get-verified-user';
const library = makeMarketingLibraryQueries({ getVerifiedUser, listContents: listScheduledContent, listAttachmentsForContents: ids => contentRepository.listAttachmentsForContents(ids) });
export default async function MarketingLibraryPage() {
  const [currentUser, groups, assets] = await Promise.all([getVerifiedUser(), library.list(), mediaRepository.list()]);
  return <MarketingShell currentUser={currentUser} active="library" title="Library" description="独立上传素材、预览和下载，再到内容里选用。"><LibraryWorkspace canEdit={hasPermission(currentUser,'library.manage')} assets={assets} userId={currentUser.id} admin={hasPermission(currentUser,'library.manage_all')}/><details className="marketing-card marketing-entry mt-6"><summary>查看各篇内容现有的附件</summary><MarketingLibrary groups={groups}/></details></MarketingShell>;
}
