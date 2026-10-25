import {hasPermission} from "@/features/team/permissions";
import { taskRepository } from '@/features/tasks/repository';
import { buildDashboardSummary } from '@/features/marketing/dashboard-summary';
import { DashboardSummary } from '@/features/marketing/components/dashboard-summary';
import Link from 'next/link';
import { marketingContentQueries } from '@/features/marketing/queries';
import { MarketingCover } from '@/features/marketing/components/cover';
import { redirect } from 'next/navigation';
import { getVerifiedUser } from '@/lib/auth/get-verified-user';
import { listScheduledContent } from '@/features/schedule/queries';
import { MarketingShell } from '@/features/marketing/components/shell';
import { MarketingIcon } from '@/features/marketing/components/icon';
import { buildMarketingSummary, marketingStatusLabels } from '@/features/marketing/page-model';
import { malaysiaDateTimeFormatter, toMalaysiaDateKey } from '@/features/schedule/date';
export default async function MarketingPage({searchParams}:{searchParams:Promise<{status?:string}>}) {
  if ((await searchParams).status === 'in_review') redirect('/marketing/approvals');
  const currentUser = await getVerifiedUser();
  if (!hasPermission(currentUser,"reports.view")) redirect("/marketing/team");
  const [contents, tasks] = await Promise.all([listScheduledContent(), taskRepository.list()]);
  const { counts, pending } = buildMarketingSummary(contents);
  const next = pending[0];
  const cover = next ? await marketingContentQueries.cover(next.id).catch(() => null) : null;
  const needs = pending.filter(c => c.status === 'in_review' || c.status === 'changes_requested' || c.status === 'due');
  const now = new Date();
  const today = toMalaysiaDateKey(now.toISOString());
  const dashboardSummary = buildDashboardSummary(tasks, contents, now);
  const dates = Array.from({length:7},(_,i)=>new Date(Date.parse(`${today}T00:00:00Z`)+i*86400000).toISOString().slice(0,10));
  const platformCounts = new Map<string, {name:string;color:string;count:number}>();
  for (const c of contents) for (const p of c.platforms) platformCounts.set(p.id,{...p,count:(platformCounts.get(p.id)?.count??0)+1});
  const href = (id:string)=>`/marketing/content/${encodeURIComponent(id)}`;
  const when = (value:string)=>malaysiaDateTimeFormatter.format(new Date(value));
  const hero = <header className="marketing-overview-head">
    <h1 className="marketing-title" aria-label={`Hello, ${currentUser.name}`}><span className="word">{Array.from('Hello,').map((l,i)=><span className="ch" key={i}>{l}</span>)}</span><br/><span className="word">{Array.from(currentUser.name).map((l,i)=><span className="ch" key={i}>{l}</span>)}</span></h1>
    <dl className="marketing-head-stats">{([['全部内容',contents.length,'library','/marketing/calendar'],['等待审核',counts.in_review,'team','/marketing/approvals'],['已经发布',counts.published,'check','/marketing/analytics']] as const).map(([label,value,icon,url])=><div className="marketing-head-stat" key={label}><span className="marketing-stat-icon"><MarketingIcon name={icon}/></span><div><dd><Link href={url}>{value}</Link></dd><dt>{label}</dt></div></div>)}</dl>
    <Link className="marketing-primary" href="/marketing/content/new"><MarketingIcon name="plus"/>New post</Link>
  </header>;
  return <MarketingShell currentUser={currentUser} active="overview" title={`Hello, ${currentUser.name}`} description="今天要准备、审核和跟进的内容，都在这里。" hero={hero}>
    <DashboardSummary summary={dashboardSummary} />
    <div className="ov-grid">
      <section className="marketing-card ov-next marketing-entry"><header className="marketing-card-head"><h2>Up next</h2><span className="ov-live"><i/>接下来要跟进</span></header>
        {next ? <><Link href={href(next.id)} className="ov-hero"><span className="ov-hero__media"><MarketingCover key={cover?.id} attachmentId={cover?.id ?? null}/></span><span className="ov-hero__body"><span className="ov-hero__meta"><span className="ov-hero__brand">{next.assignee.name}</span><span className="marketing-status-on-dark">{marketingStatusLabels[next.status]}</span></span><span className="ov-hero__count"><span className="ov-hero__in">发布时间 · 马来西亚时间</span><b>{new Intl.DateTimeFormat('zh-MY',{timeZone:'Asia/Kuala_Lumpur',month:'long',day:'numeric'}).format(new Date(next.publishAt))}</b></span><span className="ov-hero__when"><MarketingIcon name="clock"/>{when(next.publishAt)}</span><strong className="ov-hero__text">{next.title}</strong><span className="ov-hero__foot"><span className="marketing-platform-dots">{next.platforms.map(p=><i key={p.id} title={p.name} style={{background:p.color}}/>)}</span><span className="marketing-feature-open">打开内容 <MarketingIcon name="arrow"/></span></span></span></Link>
        <div className="ov-after__label">After that · 后续排期</div><div className="ov-after">{pending.slice(1,5).map(c=><Link key={c.id} className="ov-after__item" href={href(c.id)}><span className="ov-after__thumb"><MarketingIcon name="calendar"/></span><span className="ov-after__txt"><b>{c.title}</b><small>{when(c.publishAt)}</small></span><MarketingIcon name="arrow"/></Link>)}</div>{pending.length===1?<p className="marketing-caption">后面暂时没有其他排期。</p>:null}</> : <div className="marketing-empty"><MarketingIcon name="calendar"/><h3>目前没有待跟进的内容</h3><p>从 New post 开始准备下一篇。</p></div>}
      </section>
      <section className="marketing-card ov-needs marketing-entry"><header className="marketing-card-head"><h2>Needs you</h2><Link href="/marketing/approvals" className="marketing-soft-link">审核列表 <MarketingIcon name="arrow"/></Link></header><div className="ov-todos">{needs.slice(0,4).map(c=><Link className="ov-todo" href={href(c.id)} key={c.id}><span className="ov-todo__ico marketing-tint-butter"><MarketingIcon name={c.status==='in_review'?'team':'clock'}/></span><span className="ov-todo__txt"><b>{c.title}</b><small>{c.assignee.name} · {marketingStatusLabels[c.status]}</small></span><span className="ov-todo__act"><span className="marketing-small-pill">{c.status==='in_review'?`批准 ${new Set(c.approvalAdminIds).size} / ${c.requiredApprovals}`:'打开处理'} <MarketingIcon name="arrow"/></span></span></Link>)}</div>{!needs.length?<div className="marketing-empty"><MarketingIcon name="check"/><p>暂时没有需要处理的审核或发布。</p></div>:null}</section>
      <section className="marketing-card ov-growth marketing-entry"><header className="marketing-card-head"><h2>Content progress</h2><span className="marketing-caption">内容进度</span></header><div className="ov-growth__sum"><b>{contents.length}</b><span>篇内容</span></div><div className="marketing-progress-bars">{Object.entries(marketingStatusLabels).map(([status,label])=><div key={status}><span>{label}</span><meter min={0} max={Math.max(contents.length,1)} value={counts[status as keyof typeof counts]}/><b>{counts[status as keyof typeof counts]}</b></div>)}</div><p className="marketing-caption">这里显示内部制作进度，尚未接入平台互动数据。</p></section>
      <section className="marketing-card ov-top marketing-entry"><header className="marketing-card-head"><h2>Workspace</h2><MarketingIcon name="channels"/></header><div className="marketing-workspace-links"><Link href="/marketing/library"><MarketingIcon name="library"/><span><b>文件库</b><small>查看图片、影片与附件</small></span><MarketingIcon name="arrow"/></Link><Link href="/marketing/tasks"><MarketingIcon name="tasks"/><span><b>普通任务</b><small>分派、跟进和完成团队任务</small></span><MarketingIcon name="arrow"/></Link><Link href="/marketing/team"><MarketingIcon name="team"/><span><b>团队与权限</b><small>查看现有成员</small></span><MarketingIcon name="arrow"/></Link></div></section>
      <section className="marketing-card ov-week marketing-entry"><header className="marketing-card-head"><h2>The week ahead</h2><Link className="marketing-soft-link" href="/marketing/calendar">完整日历 <MarketingIcon name="arrow"/></Link></header><div className="ov-week__days">{dates.map((day,index)=>{const items=contents.filter(c=>toMalaysiaDateKey(c.publishAt)===day);return <Link href={`/marketing/calendar?date=${day}`} key={day} className={`ov-day ${index===0?'is-today':''}`}><span className="ov-day__head"><b>{['日','一','二','三','四','五','六'][new Date(day+'T00:00:00Z').getUTCDay()]}</b><span>{day.slice(8)}</span></span><span className="ov-day__list">{items.slice(0,2).map(c=><span className="ov-chip marketing-small-pill" key={c.id}>{c.title}</span>)}{items.length>2?<span>+{items.length-2} 篇</span>:null}</span>{!items.length?<span className="ov-day__gap">没有排期</span>:null}</Link>})}</div></section>
      <section className="marketing-card ov-nets marketing-entry"><header className="marketing-card-head"><h2>Channels</h2><Link href="/marketing/channels" aria-label="查看平台"><MarketingIcon name="arrow"/></Link></header><div className="marketing-platform-summary">{Array.from(platformCounts.entries()).map(([id,p])=><Link key={id} href="/marketing/calendar"><i style={{background:p.color}}/>{p.name}<b>{p.count} 篇</b></Link>)}</div>{!platformCounts.size?<p>暂时没有内容平台统计。</p>:null}</section>
      <section className="marketing-card ov-inbox marketing-entry"><header className="marketing-card-head"><h2>Inbox</h2><MarketingIcon name="inbox"/></header><p>查看内容提交、审核和团队任务的站内通知。</p><Link href="/marketing/inbox" className="marketing-soft-link">打开收件箱 <MarketingIcon name="arrow"/></Link></section>
      <section className="marketing-card ov-team marketing-entry"><header className="marketing-card-head"><h2>Team workflow</h2><MarketingIcon name="team"/></header><p>员工提交 → 两位管理员批准 → 到时提醒 → 确认发布。</p><Link href="/marketing/settings/approvals" className="marketing-soft-link">查看审核规则 <MarketingIcon name="arrow"/></Link></section>
    </div>
  </MarketingShell>;
}
