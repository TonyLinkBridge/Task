'use client';
import {useSyncExternalStore} from 'react';
import {useTheme} from 'next-themes';
export function ThemeOptions(){const {theme,setTheme}=useTheme();const mounted=useSyncExternalStore(()=>()=>{},()=>true,()=>false);return <><h2>显示模式</h2><p>选择后保存在当前浏览器，不会改变同事的显示设置。跟随系统会自动响应电脑或手机的主题。</p><div className="workspace-theme-options" aria-label="显示模式">{[['light','浅色','明亮背景'],['dark','深色','深色背景'],['system','跟随系统','使用设备设置']].map(([key,label,description])=><button type="button" key={key} disabled={!mounted} aria-pressed={mounted&&theme===key} onClick={()=>setTheme(key)}><strong>{label}</strong><small className="block">{description}</small></button>)}</div><p>减少动画会遵守设备的辅助使用设置。</p></>;}
