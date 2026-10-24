import type { TaskRecord } from '@/features/tasks/types';
import type { ScheduledContent } from '@/features/schedule/types';
import { toMalaysiaDateKey } from '@/features/schedule/date';

/** The five original Dashboard buckets, using the existing records and Malaysia day boundary. */
export function buildDashboardSummary(tasks: TaskRecord[], contents: ScheduledContent[], now = new Date()) {
  const today = toMalaysiaDateKey(now.toISOString());
  const instant = now.getTime();
  const unfinished = tasks.filter(task => task.status !== 'done' && !task.archivedAt);
  const taskOrder = (a: TaskRecord, b: TaskRecord) => Date.parse(a.dueAt) - Date.parse(b.dueAt) || a.id.localeCompare(b.id);
  const contentOrder = (a: ScheduledContent, b: ScheduledContent) => Date.parse(a.publishAt) - Date.parse(b.publishAt) || a.id.localeCompare(b.id);
  return {
    todayTasks: unfinished.filter(task => toMalaysiaDateKey(task.dueAt) === today).sort(taskOrder),
    overdueTasks: unfinished.filter(task => Date.parse(task.dueAt) < instant).sort(taskOrder),
    waitingReview: contents.filter(content => content.status === 'in_review').sort(contentOrder),
    upcoming: contents.filter(content => content.status === 'approved' && Date.parse(content.publishAt) > instant).sort(contentOrder),
    missedPublish: contents.filter(content => content.status !== 'published' && Date.parse(content.publishAt) <= instant).sort(contentOrder),
  };
}
export type DashboardSummaryData = ReturnType<typeof buildDashboardSummary>;
