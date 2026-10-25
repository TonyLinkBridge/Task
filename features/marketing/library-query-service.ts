import type { ContentAttachment } from '@/features/content/types';
import type { ScheduledContent } from '@/features/schedule/types';
export type MarketingLibraryGroup = { id: string; title: string; status: ScheduledContent['status']; attachments: ContentAttachment[] };
type Dependencies = {
  getVerifiedUser(): Promise<unknown>;
  listContents(): Promise<Pick<ScheduledContent, 'id' | 'title' | 'status'>[]>;
  listAttachmentsForContents(ids: string[]): Promise<ContentAttachment[]>;
};
export function makeMarketingLibraryQueries(dependencies: Dependencies) {
  return { async list(): Promise<MarketingLibraryGroup[]> {
    await dependencies.getVerifiedUser();
    const contents = await dependencies.listContents();
    if (!contents.length) return [];
    const attachments = await dependencies.listAttachmentsForContents(contents.map(item => item.id));
    const byContent = new Map<string, ContentAttachment[]>();
    for (const attachment of attachments) {
      const files = byContent.get(attachment.contentId) ?? [];
      files.push(attachment);
      byContent.set(attachment.contentId, files);
    }
    return contents.map(item => ({ ...item, attachments: byContent.get(item.id) ?? [] }));
  } };
}
