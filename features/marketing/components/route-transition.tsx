'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {RouteMotionContext} from './route-context';
import {captureRouteSnapshot,type RouteSnapshot} from '../route-snapshot';

/** Start the request immediately; keep the current page visible until its replacement is ready. */
export function MarketingRouteTransition({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const [intent,setIntent]=useState<string|null>(null);
  const snapshot=useRef<RouteSnapshot|null>(null);
  const expiry=useRef<ReturnType<typeof setTimeout>|null>(null);
  const takeSnapshot=useCallback(()=>{const outgoing=snapshot.current;snapshot.current=null;if(expiry.current){clearTimeout(expiry.current);expiry.current=null;}return outgoing;},[]);
  useEffect(()=>()=>{snapshot.current?.dispose();if(expiry.current)clearTimeout(expiry.current);},[]);

  useEffect(() => {
    const warmed = new Map<string, number>();
    const destination = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return null;
      const anchor = target.closest<HTMLAnchorElement>('a[href]');
      if (!anchor || anchor.hasAttribute('download') ||
        (anchor.target && anchor.target !== '_self') ||
        !anchor.closest('.marketing-shell,.marketing-sheet')) return null;
      const url = new URL(anchor.href, window.location.href);
      const supported = /^\/marketing(?:\/|$)/.test(url.pathname) ||
        /^\/tasks\/[A-Za-z0-9-]+$/.test(url.pathname) ||
        (/^\/help(?:\/|$)/.test(url.pathname) && !url.pathname.endsWith('/pdf'));
      const href = url.pathname + url.search;
      if (url.origin !== window.location.origin || !supported || url.hash ||
        href === window.location.pathname + window.location.search) return null;
      return href;
    };
    const prepare = (event: Event) => {
      const href = destination(event.target);
      if (!href) return;
      const now = Date.now();
      if (now - (warmed.get(href) ?? -Infinity) < 30_000) return;
      if (warmed.size >= 32) warmed.delete(warmed.keys().next().value!);
      warmed.set(href, now);
      try { router.prefetch(href); } catch { warmed.delete(href); }
    };
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
        event.altKey || event.shiftKey ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const href = destination(event.target);
      if (!href || !document.getElementById('marketing-main')) return;
      event.preventDefault();
      setIntent(href);
      const targetPath=new URL(href,window.location.href).pathname;
      const internalWorkspace=['/marketing/team','/marketing/settings'].some(prefix=>window.location.pathname.startsWith(prefix)&&targetPath.startsWith(prefix));
      if(targetPath!==window.location.pathname&&!internalWorkspace){
        snapshot.current?.dispose();
        const outgoing=captureRouteSnapshot(document.getElementById('marketing-main')!,targetPath);
        snapshot.current=outgoing;
        if(expiry.current)clearTimeout(expiry.current);
        expiry.current=setTimeout(()=>{if(snapshot.current===outgoing){outgoing.dispose();snapshot.current=null;}},5000);
      }
      startTransition(() => {try{if(internalWorkspace)router.push(href,{scroll:false});else router.push(href);}catch{snapshot.current?.dispose();snapshot.current=null;setIntent(null);}});
    };
    document.addEventListener('click', click, true);
    document.addEventListener('mouseover', prepare);
    document.addEventListener('focusin', prepare);
    document.addEventListener('touchstart', prepare, { passive: true });
    return () => {
      document.removeEventListener('click', click, true);
      document.removeEventListener('mouseover', prepare);
      document.removeEventListener('focusin', prepare);
      document.removeEventListener('touchstart', prepare);
    };
  }, [router, pathname]);

  return <RouteMotionContext.Provider value={{pendingHref:isPending?intent:null,snapshot,takeSnapshot}}><div className="marketing-route-container" data-marketing-pending={isPending ? '' : undefined}>
    {children}
    {isPending ? <div className="marketing-route-status" role="status">正在打开页面…</div> : null}
  </div></RouteMotionContext.Provider>;
}
