'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { ThemeToggle } from '@/components/theme-toggle';
import { MarketingIcon, type MarketingIconName } from './icon';
export type MarketingPage = 'overview' | 'compose' | 'calendar' | 'approvals' | 'inbox' | 'analytics' | 'listening' | 'library' | 'channels' | 'team' | 'settings' | 'tasks' | 'help' | 'history';
export const marketingTabs = [['overview','Overview','/marketing'],['compose','Compose','/marketing/content/new'],['calendar','Calendar','/marketing/calendar'],['inbox','Inbox','/marketing/inbox'],['approvals','Approvals','/marketing/approvals'],['analytics','Analytics','/marketing/analytics'],['listening','Listening','/marketing/listening']] as const;
const destinations: { key: MarketingPage | 'help'; label: string; href: string; icon: MarketingIconName }[] = [
  {key:'approvals',label:'内容审核',href:'/marketing/approvals',icon:'check'},
  {key:'library',label:'文件库',href:'/marketing/library',icon:'library'},
  {key:'channels',label:'发布平台',href:'/marketing/channels',icon:'channels'},
  {key:'team',label:'团队与权限',href:'/marketing/team',icon:'team'},
  {key:'tasks',label:'普通任务',href:'/marketing/tasks',icon:'tasks'},
  {key:'analytics',label:'内容统计',href:'/marketing/analytics',icon:'clock'},
  {key:'listening',label:'监测',href:'/marketing/listening',icon:'search'},
  {key:'history',label:'历史记录',href:'/marketing/history',icon:'clock'},
  {key:'settings',label:'设置',href:'/marketing/settings',icon:'settings'},
  {key:'help',label:'帮助中心',href:'/help',icon:'help'},
];
let lastPill: { left: number; right: number } | undefined;
export function MarketingTabs({ active }: { active: MarketingPage }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const track = ref.current;
    if (!track) return;
    let cancelled = false;
    let revision = 0;
    let cancelTween: (() => void) | undefined;
    const update = (animate = false) => {
      const version = ++revision;
      const link = track.querySelector<HTMLElement>('[aria-current="page"]');
      const pill = track.querySelector<HTMLElement>('.marketing-tab-pill');
      if (!pill) return;
      pill.style.opacity = link ? '1' : '0';
      if (!link) return;
      const to = { left: link.offsetLeft, right: track.clientWidth - link.offsetLeft - link.offsetWidth };
      const clip = (v: typeof to) => `inset(4px ${v.right}px 4px ${v.left}px round 999px)`;
      const from = animate ? lastPill : undefined;
      lastPill = to;
      cancelTween?.();
      if (!from || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { pill.style.clipPath = clip(to); return; }
      pill.style.clipPath = clip(from);
      const url = '/marketing-assets/motion.mjs';
      void import(/* webpackIgnore: true */ url).then((module: { gsap: { to(target: object, vars: object): {kill(): void} } }) => {
        if (cancelled || version !== revision) return;
        const value = {...from};
        const forward = to.left > from.left;
        pill.style.transition = 'none';
        const left = module.gsap.to(value,{left:to.left,duration:forward?.55:.36,ease:forward?'power3.inOut':'power3.out',onUpdate:()=>{pill.style.clipPath=clip(value);}});
        const right = module.gsap.to(value,{right:to.right,duration:forward?.36:.55,ease:forward?'power3.out':'power3.inOut',onUpdate:()=>{pill.style.clipPath=clip(value);}});
        cancelTween = ()=>{left.kill();right.kill();};
      }).catch(()=>{if(!cancelled)pill.style.clipPath=clip(to);});
    };
    update(true);
    let measuredWidth = track.clientWidth;
    const observer = new ResizeObserver(() => {if(track.clientWidth!==measuredWidth){measuredWidth=track.clientWidth;update();}}); observer.observe(track);
    void document.fonts?.ready.then(()=>{if(!cancelled&&track.clientWidth!==measuredWidth)update();});
    return () => {cancelled=true;cancelTween?.();observer.disconnect();};
  }, [active]);
  return <nav className="marketing-tabs" aria-label="营销工作台"><div className="marketing-tab-track" ref={ref}>
    {marketingTabs.map(([key,label,href]) => <Link key={key} href={href} prefetch={key === 'compose'} aria-current={active===key?'page':undefined}>{label}</Link>)}
    <span className="marketing-tab-pill" aria-hidden="true">{marketingTabs.map(([key,label])=><span key={key}>{label}</span>)}</span>
  </div></nav>;
}
export function MarketingNavigation({ active, role = 'employee' }: { active: MarketingPage; role?: 'employee' | 'admin' }) {
  const [open, setOpen] = useState(false);
  const accessibleDestinations = destinations.filter(d => d.key !== 'history' || role === 'admin');
  return <>
    <nav className="marketing-dock" aria-label="现有工作台功能">
      <Link href="/marketing/content/new" className="marketing-create" aria-label="建立内容" title="建立内容"><MarketingIcon name="plus" /></Link>
      <Link href="/marketing/calendar" aria-label="内容日历" title="内容日历"><MarketingIcon name="clock" /></Link>
      {accessibleDestinations.filter(d=>['library','channels','team','tasks','history','settings','help'].includes(d.key)).map(d=><Link key={d.key} href={d.href} aria-label={d.label} title={d.label} aria-current={active===d.key?'page':undefined}><MarketingIcon name={d.icon} /></Link>)}
      <span className="marketing-dock-separator" /><ThemeToggle />
    </nav>
    <nav className="marketing-mobile-nav" aria-label="手机导航">
      <Link href="/marketing" aria-current={active==='overview'?'page':undefined}><MarketingIcon name="home" /><span>首页</span></Link>
      <Link href="/marketing/calendar" aria-current={active==='calendar'?'page':undefined}><MarketingIcon name="calendar" /><span>日历</span></Link>
      <Link href="/marketing/content/new" aria-current={active==='compose'?'page':undefined}><i><MarketingIcon name="plus" /></i><span>建立</span></Link>
      <Link href="/marketing/inbox" aria-current={active==='inbox'?'page':undefined}><MarketingIcon name="inbox" /><span>收件箱</span></Link>
      <BaseDialog.Root open={open} onOpenChange={setOpen}>
        <BaseDialog.Trigger className="marketing-mobile-more" aria-label="更多功能"><MarketingIcon name="more" /><span>更多</span></BaseDialog.Trigger>
        <BaseDialog.Portal><BaseDialog.Backdrop className="marketing-sheet-backdrop" />
          <BaseDialog.Popup className="marketing-sheet">
            <header><BaseDialog.Title>更多功能</BaseDialog.Title><BaseDialog.Close aria-label="关闭更多功能">×</BaseDialog.Close></header>
            <BaseDialog.Description className="marketing-sheet-description">团队的文件、任务与设置</BaseDialog.Description>
            <div className="marketing-sheet-grid">{accessibleDestinations.map(d=><Link key={d.key} href={d.href} aria-current={active===d.key?'page':undefined} onClick={()=>setOpen(false)}><MarketingIcon name={d.icon} />{d.label}</Link>)}</div>
            <footer><span>显示模式</span><ThemeToggle /></footer>
          </BaseDialog.Popup>
        </BaseDialog.Portal>
      </BaseDialog.Root>
    </nav>
  </>;
}
