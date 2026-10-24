import Link from 'next/link';
import type { ScheduledContent } from '@/features/schedule/types';
import { malaysiaDateTimeFormatter } from '@/features/schedule/date';
import { marketingStatusLabels } from '../page-model';
export function MarketingContentCards({ contents }: { contents: ScheduledContent[] }) {
  return <div className="marketing-content-grid marketing-entry">{contents.map(c => <article className="marketing-card" key={c.id}>
    <div className="marketing-pills"><span className={`status-${c.status}`}>{marketingStatusLabels[c.status]}</span>{c.platforms.map(p => <span key={p.id}><i style={{ background: p.color }} />{p.name}</span>)}</div>
    <h2>{c.title}</h2><p>{c.assignee.name} · {malaysiaDateTimeFormatter.format(new Date(c.publishAt))}</p><p>批准进度：{new Set(c.approvalAdminIds).size} / {c.requiredApprovals}</p><Link className="marketing-primary" href={`/marketing/content/${encodeURIComponent(c.id)}`}>打开内容</Link>
  </article>)}</div>;
}
