'use client';
import{useLayoutEffect,useRef}from'react';
import{usePathname}from'next/navigation';
import{getReadyMarketingMotion,loadMarketingMotion,type MarketingGsap}from'../motion-runtime';
import{ROUTE_EXIT_SECONDS}from'../route-snapshot';
import{useRouteMotion}from'./route-context';

/** The same GSAP timings as the reference, prepared before the new page can paint. */
export function MarketingMotion({children}:{children:React.ReactNode}){
 const ref=useRef<HTMLDivElement>(null);
 const pathname=usePathname();
 const previousPath=useRef(pathname);
 const route=useRouteMotion();
 const snapshot=route?.snapshot;
 useLayoutEffect(()=>{
  const root=ref.current;if(!root)return;
  const internalTeam=previousPath.current.startsWith("/marketing/team")&&pathname.startsWith("/marketing/team")&&previousPath.current!==pathname;
  previousPath.current=pathname;
  if(internalTeam){root.dataset.motionState="ready";return;}
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){root.dataset.motionState='ready';return;}
  const letters=Array.from(root.querySelectorAll<HTMLElement>('.marketing-title .ch'));
  const compose=root.querySelector('.marketing-create-grid');
  const all=compose?Array.from(compose.children) as HTMLElement[]:Array.from(root.querySelectorAll<HTMLElement>('.marketing-entry')).filter(node=>!node.parentElement?.closest('.marketing-entry'));
  // Only animate visible panels. Off-screen cards must not create giant composited layers.
  const cards=all.filter(node=>node.getBoundingClientRect().top<window.innerHeight+100);
  const targets=[...letters,...cards];
  const saved=targets.map(node=>({node,transform:node.style.transform,opacity:node.style.opacity}));
  const restore=()=>saved.forEach(({node,transform,opacity})=>{node.style.transform=transform;node.style.opacity=opacity;});
  const delay=snapshot?.current?.targetPath===pathname?ROUTE_EXIT_SECONDS:0;
  const originalVisibility=root.style.visibility;
  if(delay)root.style.visibility='hidden';
  let cancelled=false,started=false,context:{revert():void}|undefined;
  root.dataset.motionState='preparing';
  letters.forEach(node=>{node.style.transform='translateY(115%) rotate(6deg)';});
  cards.forEach(node=>{node.style.opacity='0';node.style.transform='translateY(34px) scale(.985)';});
  const failOpen=()=>{if(cancelled||started)return;cancelled=true;restore();root.style.visibility=originalVisibility;root.dataset.motionState='ready';};
  const fallback=window.setTimeout(failOpen,180);
  const play=(gsap:MarketingGsap)=>{
   if(cancelled)return;started=true;window.clearTimeout(fallback);restore();root.dataset.motionState='entering';
   context=gsap.context(()=>{
    if(delay)gsap.to(root,{visibility:"visible",duration:0,delay,onComplete:()=>{root.style.visibility=originalVisibility;}});
    let remaining=Number(letters.length>0)+Number(cards.length>0);
    const done=()=>{if(--remaining<=0&&!cancelled)root.dataset.motionState='ready';};
    if(!remaining)root.dataset.motionState='ready';
    if(letters.length)gsap.fromTo(letters,{yPercent:115,rotation:6},{yPercent:0,rotation:0,duration:.85,ease:'power4.out',stagger:.022,delay,clearProps:'transform',onComplete:done});
    if(cards.length)gsap.fromTo(cards,{opacity:0,y:34,scale:.985},{opacity:1,y:0,scale:1,duration:.9,ease:'power3.out',stagger:compose?.08:.07,delay:delay+(compose?.1:0),clearProps:'transform,opacity',onComplete:done});
   },root);
  };
  const gsap=getReadyMarketingMotion();if(gsap)play(gsap);else void loadMarketingMotion().then(play).catch(failOpen);
  return()=>{cancelled=true;window.clearTimeout(fallback);context?.revert();restore();root.style.visibility=originalVisibility;};
 },[pathname,snapshot]);
 return <div ref={ref} data-testid="marketing-motion" data-route-key={pathname}>{children}</div>;
}
