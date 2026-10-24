import type { ContentApproval } from '../approval/types.ts';
import type { ContentRecord, ContentStatus } from '../content/types.ts';
import type { ScheduledContent } from '../schedule/types.ts';

/** Existing Task destinations. The preview never calls production routes. */
export const marketingRoutes = {
  overview: '/dashboard', compose: '/content/new', calendar: '/content',
  approvals: '/content?status=in_review', tasks: '/tasks', help: '/help',
  team: '/admin/settings', settings: '/admin/settings', history: '/admin/history',
} as const;

export type MarketingContent = {
  source: 'task'; id: string; title: string; authorId: string;
  assignee: ScheduledContent['assignee']; status: ContentStatus; storedStatus: ContentStatus;
  version: number; publishAt: string; timeZone: 'Asia/Kuala_Lumpur'; localDate: string; localTime: string;
  approval: { count: number; required: 1 | 2; remaining: number; complete: boolean; adminIds: string[] };
  platforms: Array<ScheduledContent['platforms'][number] & { connectionStatus: 'unknown'; accountId: null }>;
  body: { state: 'not_loaded'; version: number; roomId: string };
  metrics: null; publishedAt: string | null; publishedBy: string | null;
  contentHref: string; linkedTaskHref: string | null;
};

/** Read-only projection, never a publisher or authorization decision. Keeps Task status/version authoritative. */
export function toMarketingContent({ content, schedule, approvals, now }: {
  content: ContentRecord; schedule: ScheduledContent; approvals: readonly ContentApproval[]; now: Date;
}): MarketingContent | null {
  if (content.status === 'archived' || content.archivedAt !== null) return null;
  const publishTimestamp = Date.parse(content.publishAt);
  if (!Number.isFinite(publishTimestamp) || !Number.isFinite(now.getTime())) throw new Error('INVALID_MARKETING_DATE');
  if (schedule.id !== content.id || schedule.storedStatus !== content.status ||
      Date.parse(schedule.publishAt) !== publishTimestamp || schedule.assignee.id !== content.assigneeId ||
      schedule.requiredApprovals !== content.requiredApprovals) throw new Error('INCOHERENT_MARKETING_SNAPSHOT');

  const adminIds = [...new Set(approvals.filter(approval =>
    approval.contentId === content.id && approval.version === content.currentVersion &&
    approval.invalidatedAt === null && approval.adminId.trim().length > 0
  ).map(approval => approval.adminId))];
  const status = content.status === 'approved' && publishTimestamp <= now.getTime() ? 'due' : content.status;
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(publishTimestamp));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(value => value.type === type)?.value ?? '';
  return {
    source: 'task', id: content.id, title: content.title, authorId: content.authorId,
    assignee: { ...schedule.assignee }, status, storedStatus: content.status,
    version: content.currentVersion, publishAt: content.publishAt, timeZone: 'Asia/Kuala_Lumpur',
    localDate: `${part('year')}-${part('month')}-${part('day')}`, localTime: `${part('hour')}:${part('minute')}`,
    approval: { count: adminIds.length, required: content.requiredApprovals,
      remaining: Math.max(0, content.requiredApprovals - adminIds.length),
      complete: adminIds.length >= content.requiredApprovals, adminIds },
    platforms: schedule.platforms.map(platform => ({ ...platform, connectionStatus: 'unknown', accountId: null })),
    body: { state: 'not_loaded', version: content.currentVersion, roomId: content.liveblocksRoomId },
    metrics: null, publishedAt: content.publishedAt, publishedBy: content.publishedBy,
    contentHref: `/content/${encodeURIComponent(content.id)}`,
    linkedTaskHref: content.linkedTaskId ? `/tasks/${encodeURIComponent(content.linkedTaskId)}` : null,
  };
}
