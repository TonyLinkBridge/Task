import Link from 'next/link';
import type { DashboardSummaryData } from '../dashboard-summary';
import { marketingStatusLabels } from '../page-model';
import { malaysiaDateTimeFormatter } from '@/features/schedule/date';
import { MarketingIcon, type MarketingIconName } from './icon';

type Item = { id: string; title: string; href: string; time: string; detail: string };
function SummaryCard({ id, title, empty, items, icon, urgent = false }: {
  id: string; title: string; empty: string; items: Item[]; icon: MarketingIconName; urgent?: boolean;
}) {
  const rows = (entries: Item[]) => entries.map(item => <li key={item.id}>
    <Link href={item.href} className="marketing-summary-item">
      <span><strong>{item.title}</strong><span className="marketing-summary-meta"><small>{item.detail}</small><time dateTime={item.time}>{malaysiaDateTimeFormatter.format(new Date(item.time))}</time></span></span>
      <MarketingIcon name="arrow" />
    </Link>
  </li>);
  return <section className="marketing-card marketing-work-summary-card marketing-entry" aria-labelledby={id}>
    <header><span className={`marketing-summary-symbol${urgent ? ' is-urgent' : ''}`}><MarketingIcon name={icon}/></span><h3 id={id}>{title}</h3><span className="marketing-summary-count" aria-label={`共 ${items.length} 项`}>{items.length}</span></header>
    {items.length ? <>
      <ul>{rows(items.slice(0,5))}</ul>
      {items.length > 5 ? <details className="marketing-summary-more"><summary>展开其余 {items.length - 5} 项</summary><ul>{rows(items.slice(5))}</ul></details> : null}
    </> : <p className="marketing-summary-empty">{empty}</p>}
  </section>;
}
export function DashboardSummary({ summary }: { summary: DashboardSummaryData }) {
  const taskItems = (tasks: DashboardSummaryData['todayTasks']): Item[] => tasks.map(task => ({
    id: task.id, title: task.title, href: `/tasks/${encodeURIComponent(task.id)}`, time: task.dueAt,
    detail: task.kind === 'content_publish' ? '发布任务 · 截止时间' : '普通任务 · 截止时间',
  }));
  const contentItems = (contents: DashboardSummaryData['waitingReview']): Item[] => contents.map(content => ({
    id: content.id, title: content.title, href: `/marketing/content/${encodeURIComponent(content.id)}`, time: content.publishAt,
    detail: `${content.assignee.name} · ${marketingStatusLabels[content.status]} · 发布时间`,
  }));
  return <section className="marketing-dashboard-summary" aria-labelledby="work-summary-heading">
    <header className="marketing-work-summary-heading"><div><h2 id="work-summary-heading">工作总览</h2><p>按马来西亚时间查看。已完成的任务不会列入；今天到期的任务也可能已经过期。</p></div><div><Link href="/marketing/tasks">任务看板 <MarketingIcon name="arrow"/></Link><Link href="/marketing/calendar">内容日历 <MarketingIcon name="arrow"/></Link></div></header>
    <div className="marketing-task-summary-grid">
      <SummaryCard id="overview-today-tasks" title="今天要做的任务" empty="今天没有到期任务" items={taskItems(summary.todayTasks)} icon="tasks"/>
      <SummaryCard id="overview-overdue-tasks" title="已经过期的任务" empty="没有过期任务" items={taskItems(summary.overdueTasks)} icon="clock" urgent/>
    </div>
    <div className="marketing-content-summary-grid">
      <SummaryCard id="overview-waiting-review" title="等待上司检查" empty="没有内容在等检查" items={contentItems(summary.waitingReview)} icon="team"/>
      <SummaryCard id="overview-upcoming" title="最近准备发布" empty="没有即将发布的内容" items={contentItems(summary.upcoming)} icon="calendar"/>
      <SummaryCard id="overview-missed-publish" title="超过时间还没发布" empty="没有漏掉的发布内容" items={contentItems(summary.missedPublish)} icon="clock" urgent/>
    </div>
  </section>;
}
