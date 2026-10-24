import { MarketingPageHeading } from '@/features/marketing/components/page-heading';
import { buildMarketingSummary } from '@/features/marketing/page-model';
import { MarketingCalendar } from '@/features/marketing/components/calendar';
import { MarketingShell } from '@/features/marketing/components/shell';
import { contentRepository } from '@/features/content/repository';
import { taskRepository } from '@/features/tasks/repository';
import { moveEditableContent } from '@/features/schedule/actions';
import { scheduleFiltersFromSearchParams } from '@/features/schedule/queries';
import { listScheduledContent } from '@/features/schedule/queries';
import { getVerifiedUser } from '@/lib/auth/get-verified-user';
export default async function MarketingCalendarPage({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const params = await searchParams;
  const date = typeof params.date === 'string' ? params.date : undefined;
  const initialView = typeof params.view === 'string' && ['week','month','list','board'].includes(params.view) ? params.view as 'week'|'month'|'list'|'board' : 'week';
  const initialDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date)) && new Date(`${date}T00:00:00Z`).toISOString().slice(0,10) === date ? date : undefined;
  const [currentUser, contents, platforms, assignees] = await Promise.all([getVerifiedUser(), listScheduledContent(), contentRepository.listPlatforms(), taskRepository.listAssignees()]);
  return <MarketingShell currentUser={currentUser} active="calendar" title="Calendar" description="用周、月、清单或看板查看同一批内容排期。" hero={<MarketingPageHeading title={'Publishing\ncalendar'} stats={[{label:'全部排期',value:contents.length,icon:'calendar'},{label:'等待审核',value:buildMarketingSummary(contents).counts.in_review,icon:'team'},{label:'已经发布',value:buildMarketingSummary(contents).counts.published,icon:'check'},{label:'等待发布',value:buildMarketingSummary(contents).counts.due,icon:'clock'}]}/>}><MarketingCalendar contents={contents} initialDate={initialDate} initialView={initialView} initialFilters={scheduleFiltersFromSearchParams(params)} platforms={platforms} assignees={assignees} moveAction={moveEditableContent} /></MarketingShell>;
}
