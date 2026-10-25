'use client';
import{useCallback,useLayoutEffect,useMemo,useRef,useState}from'react';
import{usePathname}from'next/navigation';
import type{VerifiedUser}from'@/lib/auth/types';
import type{MarketingPage}from'./navigation';
import{MarketingChrome}from'./chrome';
import{MarketingFrameContext,useRouteMotion}from'./route-context';
import{loadMarketingMotion}from'../motion-runtime';
export function marketingPageForPath(path:string):MarketingPage{
 const section=path.split('?')[0].split('/')[2];
 if(!section)return'overview';
 if(section==='content')return'compose';
 return (['calendar','approvals','inbox','analytics','listening','library','channels','team','settings','tasks','history'].includes(section)?section:'overview') as MarketingPage;
}
export function MarketingFrame({currentUser,children}:{currentUser:VerifiedUser;children:React.ReactNode}){
 const pathname=usePathname();
 const [identity,setIdentity]=useState(currentUser);
 const publishIdentity=useCallback((user:VerifiedUser)=>setIdentity(previous=>previous.id===user.id&&previous.name===user.name&&previous.role===user.role&&previous.imageUrl===user.imageUrl&&previous.accessRevision===user.accessRevision?previous:user),[]);
 const context=useMemo(()=>({publishIdentity}),[publishIdentity]);
 const frame=useRef<HTMLDivElement>(null);
 const previous=useRef(pathname);
 const route=useRouteMotion();
 useLayoutEffect(()=>{void loadMarketingMotion().catch(()=>{});},[]);
 useLayoutEffect(()=>{
  if(previous.current===pathname)return;
  const internalTeam=['/marketing/team','/marketing/settings'].some(prefix=>previous.current.startsWith(prefix)&&pathname.startsWith(prefix));
  previous.current=pathname;
  const snapshot=route?.takeSnapshot();
  if(internalTeam){snapshot?.dispose();return;}
  if(snapshot){if(frame.current&&snapshot.targetPath===pathname&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches)snapshot.play(frame.current);else snapshot.dispose();}
  window.scrollTo({top:0});
  const title=frame.current?.querySelector<HTMLElement>('#marketing-main h1');
  title?.setAttribute('tabindex','-1');
  if(snapshot){const focus=window.setTimeout(()=>{if(title?.isConnected)title.focus({preventScroll:true});},180);return()=>window.clearTimeout(focus);}
  title?.focus({preventScroll:true});
 },[pathname,route]);
 return <MarketingFrameContext.Provider value={context}><div className="marketing-shell" ref={frame} data-marketing-frame="persistent"><MarketingChrome currentUser={identity} active={marketingPageForPath(pathname)} pendingActive={route?.pendingHref?marketingPageForPath(route.pendingHref):undefined}/>{children}</div></MarketingFrameContext.Provider>;
}
