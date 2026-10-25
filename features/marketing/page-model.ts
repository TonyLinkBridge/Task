import { workspaceHref } from "@/lib/navigation/workspace-href";
import type { ScheduledContent } from '@/features/schedule/types';
export const marketingStatusLabels = { draft: '草稿', in_review: '等待审核', changes_requested: '需要修改', approved: '已经批准', due: '等待发布', published: '已经发布' };
export function buildMarketingSummary(contents: ScheduledContent[]) {
  const counts: Record<ScheduledContent['status'], number> = { draft: 0, in_review: 0, changes_requested: 0, approved: 0, due: 0, published: 0 };
  for (const item of contents) counts[item.status]++;
  const pending = contents.filter(item => item.status !== 'published').sort((a, b) => a.publishAt.localeCompare(b.publishAt) || a.id.localeCompare(b.id));
  return { counts, pending };
}
export function marketingHref(href: string) {
  if (!href.startsWith('/') || href.startsWith('//') || href.includes('\\')) return '/marketing/inbox';
  if (href === '/' || /^\/(?:marketing|dashboard|content|tasks|help)(?:[/?#]|$)/.test(href)) return workspaceHref(href);
  return '/marketing/inbox';
}
