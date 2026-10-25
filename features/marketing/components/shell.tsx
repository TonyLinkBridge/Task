"use client";
import{useContext,useLayoutEffect}from'react';
import type{VerifiedUser}from'@/lib/auth/types';
import type{MarketingPage}from'./navigation';
import{MarketingChrome}from'./chrome';
import{MarketingMotion}from'./motion';
import{MarketingFrameContext}from'./route-context';
export function MarketingShell({currentUser,title,description,active,children,hero}:{currentUser:VerifiedUser;title:string;description:string;active:MarketingPage;children:React.ReactNode;hero?:React.ReactNode}){
 const insideFrame=useContext(MarketingFrameContext);
 useLayoutEffect(()=>{insideFrame?.publishIdentity(currentUser);},[insideFrame,currentUser]);
 const body=<MarketingMotion><main id="marketing-main" className="marketing-main" tabIndex={-1}>
 {hero??<div className="marketing-heading"><h1 className="marketing-title" tabIndex={-1} aria-label={title}>{title.split(' ').map((word,index)=><span className="word" aria-hidden="true" key={`${word}:${index}`}>{Array.from(word).map((letter,i)=><span className="ch" key={i}>{letter}</span>)}{' '}</span>)}</h1><p>{description}</p></div>}{children}</main></MarketingMotion>;
 return insideFrame?body:<div className="marketing-shell"><MarketingChrome currentUser={currentUser} active={active}/>{body}</div>;
}
