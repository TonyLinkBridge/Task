'use client';

import {useEffect,useRef} from 'react';
import type {ToastType} from '@/components/arc/toast-stack/toast-stack';
import {useOptionalAppToast} from './app-toast';

/** Transient action results share the app queue. Field errors and ongoing states stay inline. */
export function ActionFeedback({message,type='info',persistent=false,className}:{message:string|null|undefined;type?:ToastType;persistent?:boolean;className?:string}){
 const api=useOptionalAppToast();
 const previous=useRef<string|null>(null);
 useEffect(()=>{
  if(!message){previous.current=null;return;}
  if(!api||persistent)return;
  const signature=`${type}\n${message}`;
  if(previous.current===signature)return;
  previous.current=signature;
  api.toast({type,title:message});
 },[api,message,persistent,type]);
 if(!message||api&&!persistent)return null;
 return <p role={type==='error'||type==='warning'?'alert':'status'} className={className}>{message}</p>;
}
