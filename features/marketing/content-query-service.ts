import { z } from 'zod';
import { canEditBody } from '@/features/approval/rules';
import { effectiveContentStatus } from '@/features/schedule/query-service';
import type { ContentRecord, ContentAttachment, ContentCommentView, ContentPlatform } from '@/features/content/types';
import type { ContentApprovalView, ContentReviewEventView } from '@/features/approval/types';
import type { AssignableUser } from '@/features/tasks/types';
import type { VerifiedUser } from '@/lib/auth/types';

type Dependencies = {
  getVerifiedUser(): Promise<VerifiedUser>;
  find(id: string): Promise<ContentRecord | null>;
  isArchived(id: string): Promise<boolean>;
  listApprovals(id: string): Promise<ContentApprovalView[]>;
  listHistory(id: string): Promise<ContentReviewEventView[]>;
  listComments(id: string): Promise<ContentCommentView[]>;
  listAttachments(id: string): Promise<ContentAttachment[]>;
  listPlatforms(): Promise<ContentPlatform[]>;
  listPlatformIds(id: string): Promise<string[]>;
  listAssignees(): Promise<AssignableUser[]>;
  findVersion(id: string, version: number): Promise<unknown | null>;
  listVersionAttachments(id: string, version: number): Promise<ContentAttachment[]>;
  now(): Date;
};

export function makeMarketingContentQueries(dependencies: Dependencies) {
  return {
    async isArchived(id: string) {
      await dependencies.getVerifiedUser();
      if (!z.uuid().safeParse(id).success) return false;
      return dependencies.isArchived(id);
    },
    async creation() {
      const currentUser = await dependencies.getVerifiedUser();
      const [platforms, assignees] = await Promise.all([dependencies.listPlatforms(), dependencies.listAssignees()]);
      return { currentUser, platforms, assignees };
    },
    async cover(id: string) {
      await dependencies.getVerifiedUser();
      if (!z.uuid().safeParse(id).success) return null;
      const content = await dependencies.find(id);
      if (!content || content.archivedAt !== null || content.status === 'archived') return null;
      const attachments = canEditBody(content.status) ? await dependencies.listAttachments(id)
        : content.currentVersion > 0 ? await dependencies.listVersionAttachments(id, content.currentVersion) : [];
      return attachments.find(file => /^image\/(png|jpe?g|webp|gif|avif)$/.test(file.mimeType)) ?? null;
    },
    async detail(id: string) {
      const currentUser = await dependencies.getVerifiedUser();
      if (!z.uuid().safeParse(id).success) return null;
      const stored = await dependencies.find(id);
      if (!stored || stored.archivedAt !== null || stored.status === 'archived') return null;
      const content = { ...stored, status: effectiveContentStatus(stored.status, stored.publishAt, dependencies.now()) };
      const [approvals, history, comments, attachments, platforms, platformIds, assignees, snapshotDocument, snapshotAttachments] = await Promise.all([
        dependencies.listApprovals(id), dependencies.listHistory(id), dependencies.listComments(id),
        dependencies.listAttachments(id), dependencies.listPlatforms(), dependencies.listPlatformIds(id), dependencies.listAssignees(),
        stored.currentVersion > 0 ? dependencies.findVersion(id, stored.currentVersion) : Promise.resolve(null),
        stored.currentVersion > 0 ? dependencies.listVersionAttachments(id, stored.currentVersion) : Promise.resolve([]),
      ]);
      const editable = canEditBody(content.status);
      return { content, currentUser, approvals, history, comments, attachments, platforms, platformIds, assignees,
        snapshotDocument, snapshotAttachments, editable, visibleAttachments: editable ? attachments : snapshotAttachments };
    },
  };
}

export type MarketingContentDetailData = NonNullable<Awaited<ReturnType<ReturnType<typeof makeMarketingContentQueries>['detail']>>>;
