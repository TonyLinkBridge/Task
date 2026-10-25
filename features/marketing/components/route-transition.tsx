'use client';

import { useEffect, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/** Start the request immediately; keep the current page visible until its replacement is ready. */
export function MarketingRouteTransition({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();

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
      startTransition(() => router.push(href));
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

  return <div className="marketing-route-container" data-marketing-pending={isPending ? '' : undefined}>
    {children}
    {isPending ? <div className="marketing-route-status" role="status">正在打开页面…</div> : null}
  </div>;
}
