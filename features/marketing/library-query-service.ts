import type { ContentAttachment } from '@/features/content/types';
import type { ScheduledContent } from '@/features/schedule/types';
export type MarketingLibraryGroup = { id: string; title: string; status: ScheduledContent['status']; attachments: ContentAttachment[] };
type Dependencies = { getVerifiedUser(): Promise<unknown>; listContents(): Promise<Pick<ScheduledContent, 'id' | 'title' | 'status'>[]>; listAttachments(id: string): Promise<ContentAttachment[]> };
export function makeMarketingLibraryQueries(dependencies: Dependencies) { return { async list(): Promise<MarketingLibraryGroup[]> {
  await dependencies.getVerifiedUser();
  const contents = await dependencies.listContents();
  const groups: MarketingLibraryGroup[] = [];
  // Keep the existing active-attachment query and history rules; bound concurrent requests.
  for (let index = 0; index < contents.length; index += 8) {
    groups.push(...await Promise.all(contents.slice(index, index + 8).map(async item => ({ ...item, attachments: await dependencies.listAttachments(item.id) }))));
  }
  return groups;
} }; }
