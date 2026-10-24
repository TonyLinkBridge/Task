'use client';
import { Select } from "@/components/ui/select";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ContentBoard } from '@/features/schedule/components/content-board';
import type { ScheduleFilters, ScheduledPlatform } from '@/features/schedule/types';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { calendarMonthDays, moveCalendarMonth, toMalaysiaDateKey } from '@/features/schedule/date';
import type { ScheduledContent } from '@/features/schedule/types';
import { marketingStatusLabels } from '../page-model';
import { MarketingIcon } from './icon';
type View = 'week' | 'month' | 'list' | 'board';
const shift = (day: string, count: number) => new Date(Date.parse(`${day}T00:00:00Z`) + count * 86400000).toISOString().slice(0, 10);
const week = (day: string) => { const start = shift(day, -((new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7)); return Array.from({ length: 7 }, (_, index) => shift(start, index)); };
const time = new Intl.DateTimeFormat('zh-MY', { timeZone: 'Asia/Kuala_Lumpur', hour: '2-digit', minute: '2-digit' });
const malaysiaMinute=(value:string)=>{const date=new Date(Date.parse(value)+8*3600000);return date.getUTCHours()*60+date.getUTCMinutes();};
export function MarketingCalendar({ contents, initialDate, initialView = 'week', initialFilters = {}, platforms: availablePlatforms, assignees: availableAssignees, moveAction }: {
  contents: ScheduledContent[]; initialDate?: string; initialView?: View; initialFilters?: ScheduleFilters;
  platforms?: ScheduledPlatform[]; assignees?: { id: string; name: string }[];
  moveAction?: (contentId: string, status: 'draft' | 'changes_requested') => Promise<{ ok: true } | { ok: false; message: string }>;
}) {
  const router = useRouter();
  const today = toMalaysiaDateKey(new Date().toISOString());
  const [anchor, setAnchor] = useState(initialDate ?? today);
  const [view, setView] = useState<View>(initialView);
  const [platform, setPlatform] = useState(initialFilters.platformId ?? '');
  const [status, setStatus] = useState(initialFilters.status ?? '');
  const [assignee, setAssignee] = useState(initialFilters.assigneeId ?? '');
  const [from, setFrom] = useState(initialFilters.from ?? '');
  const [to, setTo] = useState(initialFilters.to ?? '');
  const stage=useRef<HTMLDivElement>(null);
  const pane=useRef<HTMLDivElement>(null);
  const flip=useRef<{Flip:{getState(targets:Element[]):unknown;from(state:unknown,vars:object):unknown};gsap:{context(callback:()=>void,scope:Element):{revert():void}}}|null>(null);
  const before=useRef<unknown>(null);
  const animation=useRef<{revert():void}|null>(null);
  useEffect(()=>{let cancelled=false;const url='/marketing-assets/motion.mjs';void import(/* webpackIgnore: true */ url).then(module=>{if(!cancelled)flip.current=module;}).catch(()=>{});return()=>{cancelled=true;animation.current?.revert();};},[]);
  function capture(){animation.current?.revert();if(pane.current&&flip.current&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches)before.current=flip.current.Flip.getState(Array.from(pane.current.querySelectorAll('.marketing-calendar-post')));}
  useLayoutEffect(()=>{if(before.current&&flip.current&&pane.current){const state=before.current;const motionRuntime=flip.current;animation.current=motionRuntime.gsap.context(()=>{motionRuntime.Flip.from(state,{targets:pane.current?.querySelectorAll('.marketing-calendar-post'),duration:.6,ease:'power3.inOut',scale:false});},pane.current);before.current=null;}},[view,anchor,platform,status,assignee,from,to]);
  function changeView(next:View){if(view===next)return;capture();setView(next);}
  const platforms = useMemo(() => availablePlatforms ?? Array.from(new Map(contents.flatMap(item => item.platforms).map(item => [item.id, item])).values()), [contents, availablePlatforms]);
  const assignees = useMemo(() => availableAssignees ?? Array.from(new Map(contents.map(item => [item.assignee.id, item.assignee])).values()), [contents, availableAssignees]);
  const filtered = contents.filter(item => (!platform || item.platforms.some(p => p.id === platform)) && (!status || item.status === status) && (!assignee || item.assignee.id === assignee) && (!from || toMalaysiaDateKey(item.publishAt) >= from) && (!to || toMalaysiaDateKey(item.publishAt) <= to)).sort((a, b) => a.publishAt.localeCompare(b.publishAt));
  const days = view === 'month' ? calendarMonthDays(anchor.slice(0, 7)) : week(anchor);
  const monthDays=calendarMonthDays(anchor.slice(0,7));
  const grouped = new Map<string, ScheduledContent[]>();
  for (const item of filtered) { const key = toMalaysiaDateKey(item.publishAt); grouped.set(key, [...(grouped.get(key) ?? []), item]); }
  const visible = view === 'list' || view === 'board' ? filtered : filtered.filter(item => days.includes(toMalaysiaDateKey(item.publishAt)));
  const move = (count: number) => {capture();setAnchor(view === 'month' ? moveCalendarMonth(anchor.slice(0, 7), count) + '-01' : shift(anchor, count * 7));};
  // A busy day remains readable: all cards at the same time share its timeline row.
  const slots=(items:ScheduledContent[])=>{const groups=new Map<number,ScheduledContent[]>();for(const item of items){const hour=Math.floor(malaysiaMinute(item.publishAt)/60);groups.set(hour,[...(groups.get(hour)??[]),item]);}return Array.from(groups);};
  useEffect(()=>{if(view!=='week'||!stage.current)return;const minutes=contents.filter(c=>week(anchor).includes(toMalaysiaDateKey(c.publishAt))).map(c=>malaysiaMinute(c.publishAt));stage.current.scrollTop=Math.max(0,(minutes.length?Math.min(...minutes)/60-1:8)*72);},[anchor,view,contents]);
  function card(item: ScheduledContent) {
    return <Link key={item.id} className="marketing-calendar-post" data-flip-id={`calendar-content-${item.id}`} href={`/marketing/content/${encodeURIComponent(item.id)}`} style={{ borderLeftColor: item.platforms[0]?.color }}>
      <time dateTime={item.publishAt}>{view === 'list' ? `${toMalaysiaDateKey(item.publishAt)} · ` : ''}{time.format(new Date(item.publishAt))}</time>
      <strong>{item.title}</strong><span>{marketingStatusLabels[item.status]} · {item.assignee.name}</span><span>{item.platforms.map(p => p.name).join(' · ')}</span><span>已批准 {new Set(item.approvalAdminIds).size}/{item.requiredApprovals}</span>
    </Link>;
  }
  return <section className="marketing-entry marketing-calendar-page mcal" aria-label="内容日历">
    <div className="marketing-toolbar marketing-calendar-controls"><div className="marketing-filter-row"><Select label="发布平台" value={platform} onValueChange={setPlatform} options={[{value:"",label:"全部平台"},...platforms.map(p=>({value:p.id,label:p.name}))]} /><Select label="内容状态" value={status} onValueChange={setStatus} options={[{value:"",label:"全部状态"},...Object.entries(marketingStatusLabels).map(([value,label])=>({value,label}))]} /><Select label="负责人" value={assignee} onValueChange={value=>{capture();setAssignee(value);}} options={[{value:'',label:'全部负责人'},...assignees.map(p=>({value:p.id,label:p.name}))]} />
      <label className="marketing-date-filter">开始日期<input type="date" value={from} onChange={e=>{capture();setFrom(e.target.value);}} /></label>
      <label className="marketing-date-filter">结束日期<input type="date" min={from || undefined} value={to} onChange={e=>{capture();setTo(e.target.value);}} /></label>
      <button type="button" className="marketing-clear-filters" disabled={!platform&&!status&&!assignee&&!from&&!to} onClick={()=>{capture();setPlatform('');setStatus('');setAssignee('');setFrom('');setTo('');}}>清除筛选</button></div>
      <div className="marketing-calendar-navigation"><div className="marketing-segments" aria-label="日历视图">{([['week', '周'], ['month', '月'], ['list', '清单'], ['board', '看板']] as const).map(([key, label]) => <button type="button" key={key} aria-pressed={view === key} onClick={() => changeView(key)}>{label}</button>)}</div>{view === 'week' || view === 'month' ? <div className="marketing-segments"><button type="button" aria-label={view === 'month' ? '上个月' : '上一周'} onClick={() => move(-1)}>←</button><button type="button" onClick={() => setAnchor(today)}>今天</button><button type="button" aria-label={view === 'month' ? '下个月' : '下一周'} onClick={() => move(1)}>→</button></div> : null}<Link href="/marketing/content/new" className="marketing-primary"><MarketingIcon name="plus"/>New post</Link></div>
    </div>
    <div className="mcal-grid"><div className="marketing-card card mcal-cal"><header className="marketing-card-head"><div><h2>{view === 'month' ? anchor.slice(0, 7) : view === 'board' ? '内容看板' : view === 'list' ? '全部排期' : `${days[0]} — ${days[6]}`}</h2><p className="marketing-caption">{visible.length} 篇内容 · 马来西亚时间</p></div></header>
      <div ref={pane} className="marketing-calendar-stage" role="region" aria-label="排期内容" key={`${view}:${anchor}`}>
      {view === 'board' ? <div className="marketing-content-board"><ContentBoard initialContents={visible} moveAction={moveAction} onMoved={()=>router.refresh()} basePath="/marketing/content" /></div> : view === 'list' ? <div className="marketing-calendar-list">{visible.map(card)}</div> : view==='week'?<div className="marketing-week-scroll" ref={stage}>
        <div role="grid" aria-label="周日历" className="marketing-week-timeline"><div className="marketing-week-hours" aria-hidden="true"><span/> {Array.from({length:24},(_,hour)=><time key={hour}>{String(hour).padStart(2,'0')}:00</time>)}</div>
        {days.map(day=><section role="gridcell" aria-label={day} key={day} className={`marketing-week-day ${day===today?'is-today':''}`}><header><small>{['日','一','二','三','四','五','六'][new Date(`${day}T00:00:00Z`).getUTCDay()]}</small><b>{day.slice(8)}</b><span>{(grouped.get(day)??[]).length} 篇</span></header><div className="marketing-week-day-body">{Array.from({length:24},(_,h)=><i aria-hidden="true" className="marketing-week-hour-cell" style={{gridRow:h+1}} key={h}/>)}{slots(grouped.get(day)??[]).map(([hour,items])=><div className="marketing-week-time-slot" key={hour} style={{gridRow:`${hour+1} / span 1`}}>{items.map(card)}</div>)}</div></section>)}
        </div></div>:<div className="marketing-calendar-scroll"><div role="grid" aria-label="月日历" className="marketing-calendar-grid is-month">{days.map(day => <section role="gridcell" aria-label={day} key={day} className={day === today ? 'is-today' : ''}><h3><time dateTime={day}>{day.slice(5)} · {['日', '一', '二', '三', '四', '五', '六'][new Date(`${day}T00:00:00Z`).getUTCDay()]}</time></h3>{(grouped.get(day) ?? []).map(card)}</section>)}</div></div>}
      </div>
      {visible.length === 0 ? <p className="marketing-empty">这段时间没有符合条件的内容。</p> : null}<p className="marketing-caption">审核和发布状态请到内容详情里处理。</p>
    </div><aside className="mcal-side" aria-label="日历辅助信息"><section className="marketing-card card"><header className="marketing-card-head"><h2>{anchor.slice(0,7)}</h2><div className="marketing-mini-nav"><button aria-label="小日历上个月" onClick={()=>setAnchor(moveCalendarMonth(anchor.slice(0,7),-1)+'-01')}>‹</button><button aria-label="小日历下个月" onClick={()=>setAnchor(moveCalendarMonth(anchor.slice(0,7),1)+'-01')}>›</button></div></header><div className="marketing-mini-month" aria-label="选择日期">{['一','二','三','四','五','六','日'].map(day=><span key={day}>{day}</span>)}{monthDays.map(day=><button key={day} type="button" aria-label={`跳到 ${day}`} aria-pressed={day===anchor} className={`${day===today?'is-today':''} ${day.slice(0,7)!==anchor.slice(0,7)?'is-muted':''}`} onClick={()=>{setAnchor(day);setView('week');}}>{day.slice(8).replace(/^0/,'')}{grouped.has(day)?<i/>:null}</button>)}</div></section>
      <section className="marketing-card card"><header className="marketing-card-head"><h2>草稿</h2><span>{filtered.filter(c=>c.status==='draft').length}</span></header><div className="marketing-calendar-drafts">{filtered.filter(c=>c.status==='draft').slice(0,5).map(c=><Link href={`/marketing/content/${c.id}`} key={c.id}><MarketingIcon name="library"/><span>{c.title}<small>{c.assignee.name} · 已设排期</small></span></Link>)}</div>{!filtered.some(c=>c.status==='draft')?<p>暂时没有草稿。</p>:null}</section>
      <section className="marketing-card card"><header className="marketing-card-head"><h2>各平台内容</h2></header><div className="marketing-platform-summary">{platforms.map(p=><button type="button" key={p.id} onClick={()=>setPlatform(platform===p.id?'':p.id)} aria-pressed={platform===p.id}><i style={{background:p.color}}/>{p.name}<b>{visible.filter(c=>c.platforms.some(item=>item.id===p.id)).length}</b></button>)}</div></section>
    </aside></div>
  </section>;
}
