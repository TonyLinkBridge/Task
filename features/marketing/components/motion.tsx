'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

type Gsap = {
  context(callback: () => void, scope: Element): { revert(): void };
  fromTo(target: unknown, from: Record<string, unknown>, to: Record<string, unknown>): unknown;
  to(target: unknown, vars: Record<string, unknown>): unknown;
};

/** Uses the original public GSAP runtime and measured Murmura entry timings. No demo application is mounted. */
export function MarketingMotion({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useEffect(() => {
    let cancelled = false;
    let context: { revert(): void } | undefined;
    const root = ref.current;
    if (!root) return;
    root.dataset.motionState = 'entering';
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { root.dataset.motionState='ready'; return; }
    const url = '/marketing-assets/motion.mjs';
    void import(/* webpackIgnore: true */ url).then((module: { gsap: Gsap }) => {
      if (cancelled || !ref.current) return;
      context = module.gsap.context(() => {
        const letters = root.querySelectorAll('.marketing-title .ch');
        const cards = root.querySelectorAll('.marketing-entry');
        let remaining = Number(letters.length > 0) + Number(cards.length > 0);
        const done = () => {if (--remaining <= 0 && !cancelled) root.dataset.motionState = 'ready';};
        if (!remaining) root.dataset.motionState='ready';
        if (letters.length) module.gsap.fromTo(letters, { yPercent: 115, rotation: 6 },
          { yPercent: 0, rotation: 0, duration: .85, ease: 'power4.out', stagger: .022, clearProps: 'transform', onComplete: done });
        if (cards.length) module.gsap.fromTo(cards, { opacity: 0, y: 34, scale: .985 },
          { opacity: 1, y: 0, scale: 1, duration: .9, ease: 'power3.out', stagger: .07, clearProps: 'transform,opacity', onComplete: done });
      }, root);
    }).catch(() => { if (!cancelled) root.dataset.motionState='ready'; /* Optional motion must never block content. */ });
    return () => { cancelled = true; context?.revert(); };
  }, [pathname]);
  return <div ref={ref} data-testid="marketing-motion">{children}</div>;
}
