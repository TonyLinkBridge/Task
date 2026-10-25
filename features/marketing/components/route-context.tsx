'use client';
import{createContext,useContext}from'react';
import type{VerifiedUser}from'@/lib/auth/types';
import type{RouteSnapshot}from'../route-snapshot';
export type RouteMotionState={pendingHref:string|null;snapshot:{current:RouteSnapshot|null};takeSnapshot:()=>RouteSnapshot|null};
export const RouteMotionContext=createContext<RouteMotionState|null>(null);
export const MarketingFrameContext=createContext<{publishIdentity:(user:VerifiedUser)=>void}|null>(null);
export const useRouteMotion=()=>useContext(RouteMotionContext);
