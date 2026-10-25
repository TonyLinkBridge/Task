'use client';
import {createContext,useContext,useState,useSyncExternalStore,useLayoutEffect,useRef,type ReactNode} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {AnimatePresence,motion,useReducedMotion} from 'motion/react';
import {UserRound,Bell,Globe,ShieldCheck,KeyRound,CreditCard,Sun,Download,Users,Layers} from 'lucide-react';
import {MarketingShell} from '@/features/marketing/components/shell';
import {useRouteMotion} from '@/features/marketing/components/route-context';
import {useWorkspacePreferences} from './provider';
import {PersonAvatar} from '@/features/team/components/shared';
import type {VerifiedUser} from '@/lib/auth/types';
import type {PersonalProfile} from '../profile-types';
import './settings.css';
export const settingsSections=[['profile','个人资料',UserRound],['notifications','通知',Bell],['workspace','工作区',Globe],['approvals','审核规则',ShieldCheck],['security','账号安全',KeyRound],['billing','收费',CreditCard],['appearance','外观',Sun],['data','资料导出',Download]] as const;
const ProfileContext=createContext<{profile:PersonalProfile;update:(value:PersonalProfile)=>void}|null>(null);
const subscribeLayout=(notify:()=>void)=>{const query=window.matchMedia('(max-width:900px)');query.addEventListener('change',notify);return()=>query.removeEventListener('change',notify);};
export function usePersonalProfile(){const value=useContext(ProfileContext);if(!value)throw Error('SETTINGS_PROFILE_CONTEXT_REQUIRED');return value;}
export function SettingsWorkspace({initial,currentUser,memberCount,approverCount,children}:{initial:PersonalProfile;currentUser:VerifiedUser;memberCount:number;approverCount:number;children:ReactNode}){
 const path=usePathname();const reduce=useReducedMotion();const route=useRouteMotion();const {preferences}=useWorkspacePreferences();
 const compact=useSyncExternalStore(subscribeLayout,()=>window.matchMedia('(max-width:900px)').matches,()=>false);
 const [local,setLocal]=useState({source:initial,value:initial});if(local.source!==initial)setLocal({source:initial,value:initial});const profile=local.source===initial?local.value:initial;
 const section=path.split('/settings/')[1]?.split('/')[0]??'profile';const active=route?.pendingHref?.split('/settings/')[1]?.split('/')[0]??section;
 const index=settingsSections.findIndex(x=>x[0]===section);const [position,setPosition]=useState({index,direction:1});if(position.index!==index)setPosition({index,direction:index>=position.index?1:-1});const direction=position.index===index?position.direction:index>=position.index?1:-1;
 const navigation=useRef<HTMLElement>(null);
 useLayoutEffect(()=>{if(!compact)return;const nav=navigation.current;const active=nav?.querySelector<HTMLElement>('[aria-current=page]');if(nav&&active)nav.scrollTo({left:Math.max(0,active.offsetLeft-(nav.clientWidth-active.offsetWidth)/2),behavior:reduce?'auto':'smooth'});},[compact,section,reduce]);
 const user={...currentUser,name:profile.name,imageUrl:profile.avatarMode==='photo'?profile.photoUrl:null,accessRevision:`${profile.revision}:${currentUser.accessRevision??''}`};
 const avatar={name:profile.name,imageUrl:user.imageUrl};
 const hero=<header className="marketing-settings-hero"><h1 className="marketing-title" tabIndex={-1} aria-label="Settings"><span className="word" aria-hidden="true">{Array.from('Settings').map((c,i)=><span className="ch" key={i}>{c}</span>)}</span></h1><dl>{[{Icon:Users,value:memberCount,label:'工作区成员'},{Icon:ShieldCheck,value:approverCount,label:'可审核成员'},{Icon:Layers,value:1,label:'内部工作区'}].map(({Icon,value,label})=><div className="stat" key={label}><span className="stat__ico"><Icon/></span><div><dd className="stat__value">{value}</dd><dt className="stat__label">{label}</dt></div></div>)}</dl></header>;
 return <ProfileContext.Provider value={{profile,update:value=>setLocal({source:initial,value})}}><MarketingShell currentUser={user} active="settings" title="Settings" description="个人资料和显示偏好" hero={hero}><div className="marketing-settings marketing-team st-grid marketing-entry">
  <aside className="card st-side"><div className="st-me"><PersonAvatar member={avatar} size="md"/><div><b>{profile.name}</b><span className="badge badge--ink">{profile.roleName}</span></div></div><nav ref={navigation} className="st-navwrap" aria-label="设置分类"><div className="st-nav">{settingsSections.map(([key,label,Icon])=><Link key={key} href={`/marketing/settings/${key}`} className="st-tab" prefetch aria-current={section===key?'page':undefined} onFocus={event=>{if(compact)navigation.current?.scrollTo({left:Math.max(0,event.currentTarget.offsetLeft-16),behavior:reduce?'auto':'smooth'});}}>{active===key?<motion.span className="st-nav__pill" layoutId="settings-navigation-pill" transition={reduce?{duration:0}:{duration:.55,ease:[.65,0,.35,1]}}/>:null}<Icon className="ico"/><span>{label}</span></Link>)}</div></nav></aside>
  <section className="card st-main" aria-label="设置"><AnimatePresence mode="wait" initial={false}><motion.div key={section} className="st-panel" initial={reduce?false:{opacity:0,x:compact?0:direction*22,y:compact?direction*22:0}} animate={{opacity:1,x:0,y:0}} exit={{opacity:0,x:reduce||compact?0:-direction*16,y:!reduce&&compact?-direction*16:0,transition:{duration:reduce?0:.16,ease:'easeIn'}}} transition={{duration:reduce?0:.42,ease:[.22,1,.36,1]}}>{children}</motion.div></AnimatePresence></section>
 </div><span className="sr-only">当前工作区：{preferences.name}</span></MarketingShell></ProfileContext.Provider>;
}
