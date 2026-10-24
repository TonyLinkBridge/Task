'use client';
import { useEffect, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
/** Murmura's route exit: opacity 0, y -8, .18s power2.in. Never delays forms or external links. */
export function MarketingRouteTransition({children}:{children:React.ReactNode}) {
  const router=useRouter();
  const [isPending,startTransition]=useTransition();
  const pathname=usePathname();
  useEffect(()=>{
    let timer: ReturnType<typeof setTimeout> | undefined;
    let main: HTMLElement | null = null;
    const clear=()=>{if(timer)clearTimeout(timer);main?.removeAttribute('data-marketing-leaving');};
    const click=(event:MouseEvent)=>{
      if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
      const anchor=(event.target as Element)?.closest<HTMLAnchorElement>('a[href]');
      if(!anchor||anchor.hasAttribute('download')||anchor.target&&anchor.target!=='_self'||!anchor.closest('.marketing-shell,.marketing-sheet'))return;
      const url=new URL(anchor.href,window.location.href);
      if(url.origin!==window.location.origin||!(/^\/marketing(?:\/|$)/.test(url.pathname)||/^\/tasks\/[A-Za-z0-9-]+$/.test(url.pathname)||(/^\/help(?:\/|$)/.test(url.pathname)&&!url.pathname.endsWith('/pdf')))||url.hash||url.pathname+url.search===window.location.pathname+window.location.search)return;
      main=document.getElementById('marketing-main');if(!main)return;
      event.preventDefault();clear();main.setAttribute('data-marketing-leaving','');
      timer=setTimeout(()=>{main?.removeAttribute('data-marketing-leaving');startTransition(()=>router.push(url.pathname+url.search));},180);
    };
    document.addEventListener('click',click,true);window.addEventListener('popstate',clear);
    return()=>{clear();document.removeEventListener('click',click,true);window.removeEventListener('popstate',clear);};
  },[router,pathname]);
  return <div className="marketing-route-container" data-marketing-pending={isPending?'':undefined}>{children}{isPending?<div className="marketing-route-status" role="status">正在打开页面…</div>:null}</div>;
}
