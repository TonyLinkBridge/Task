import { describe, expect, it } from 'vitest';
import { buildMarketingSummary, marketingHref } from '@/features/marketing/page-model';
import type { ScheduledContent } from '@/features/schedule/types';
const item = (id: string, status: ScheduledContent['status'], publishAt: string): ScheduledContent => ({ id, status, storedStatus: status, publishAt, title: id, assignee: { id: 'employee', name: '员工', imageUrl: null }, platforms: [], requiredApprovals: 2, approvalAdminIds: [] });
describe('marketing page projections', () => {
  it('counts actual records and keeps overdue review separate from approved waiting to publish', () => {
    const summary = buildMarketingSummary([item('review', 'in_review', '2026-10-20T00:00:00Z'), item('due', 'due', '2026-10-20T00:00:00Z'), item('sent', 'published', '2026-10-20T00:00:00Z')]);
    expect(summary.counts.in_review).toBe(1); expect(summary.counts.due).toBe(1); expect(summary.counts.published).toBe(1);
    expect(summary.pending.map(p => p.id)).toEqual(['due', 'review']);
  });
  it('maps only known internal destinations and rejects external or unrelated URLs', () => {
    expect(marketingHref('/content/abc?version=2')).toBe('/marketing/content/abc?version=2');
    expect(marketingHref('/tasks/task-id')).toBe('/tasks/task-id');
    expect(marketingHref('https://evil.example/')).toBe('/marketing/inbox');
    expect(marketingHref('//evil.example')).toBe('/marketing/inbox');
    expect(marketingHref('/admin/settings')).toBe('/marketing/inbox');
  });
  it('keeps list searches and notification links inside the new workspace', () => {
    expect(marketingHref('/tasks')).toBe('/marketing/tasks');
    expect(marketingHref('/tasks?assignee=ivy&status=todo')).toBe('/marketing/tasks?assignee=ivy&status=todo');
    expect(marketingHref('/content?assignee=ivy')).toBe('/marketing/calendar?view=list&assignee=ivy');
    expect(marketingHref('/content')).toBe('/marketing/calendar?view=list');
    expect(marketingHref('/help/content/review')).toBe('/help/content/review');
    expect(marketingHref('/tasks/task-id?tab=history')).toBe('/tasks/task-id?tab=history');
  });

});
