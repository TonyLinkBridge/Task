'use client';
import {useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {useTheme} from 'next-themes';
import {useAppToast} from '@/components/feedback/app-toast';
import {SavedMark} from './personal-profile';
const options=[['light','浅色','柔和浅色背景'],['dark','深色','炭黑背景'],['system','跟随系统','']] as const;
const subscribe=()=>()=>{};
export function ThemeOptions(){
 const {theme,setTheme,systemTheme}=useTheme();const mounted=useSyncExternalStore(subscribe,()=>true,()=>false);const {toast}=useAppToast();
 const refs=useRef<(HTMLButtonElement|null)[]>([]);const [saved,setSaved]=useState(false);const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
 function choose(index:number){const [key,label]=options[index];setTheme(key);setSaved(true);if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>setSaved(false),2300);toast({type:'success',title:key==='system'?'显示模式已跟随系统。':`已切换为${label}模式。`});}
 return <><header className="st-sec"><div><h2>外观</h2><p className="card__sub">浅色、深色或跟随系统</p></div></header><div className="st-themes" role="radiogroup" aria-label="显示模式">{options.map(([key,label,description],index)=><button ref={node=>{refs.current[index]=node;}} type="button" role="radio" className="st-theme" key={key} disabled={!mounted} aria-checked={mounted&&theme===key} tabIndex={mounted&&(theme??'system')===key?0:-1} onClick={()=>choose(index)} onKeyDown={event=>{let next:number;switch(event.key){case 'ArrowRight':case 'ArrowDown':next=(index+1)%3;break;case 'ArrowLeft':case 'ArrowUp':next=(index+2)%3;break;case 'Home':next=0;break;case 'End':next=2;break;default:return;}event.preventDefault();refs.current[next]?.focus();choose(next);}}><span className={`st-mock st-mock--${key}`} aria-hidden="true"><i/><i/><i/></span><b>{label}</b><small>{key==='system'?mounted?`当前系统：${systemTheme==='dark'?'深色':'浅色'}`:'正在读取系统设置…':description}</small></button>)}</div><p className="st-live"><span>显示模式保存在此设备，不改变同事的设置。</span><SavedMark visible={saved}/></p><p className="card__sub">减少动画会遵守设备的辅助使用设置。</p></>;
}
