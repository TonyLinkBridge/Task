'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {AnimatePresence,motion,useReducedMotion} from 'motion/react';
import {Check,X,Layers,KeyRound} from 'lucide-react';
import {PersonAvatar} from '@/features/team/components/shared';
import {PERMISSIONS} from '@/features/team/permissions';
import {usePersonalProfile} from './settings-workspace';
import {useWorkspacePreferences} from './provider';
import {AccountManagement} from './account-management';
import {savePersonalProfile,loadPersonalProfile} from '../profile-actions';
import type {ProfilePatch} from '../profile-types';
export function SavedMark({visible}:{visible:boolean}){const reduce=useReducedMotion();return <AnimatePresence>{visible?<motion.span className="st-saved" initial={reduce?false:{opacity:0,x:-6,scale:.8}} animate={{opacity:1,x:0,scale:1}} exit={{opacity:0}} transition={{duration:reduce?0:.35,type:reduce?'tween':'spring'}}><Check/>已保存</motion.span>:null}</AnimatePresence>;}
export function PersonalProfile(){
 const {profile,update}=usePersonalProfile();const {preferences}=useWorkspacePreferences();const reduce=useReducedMotion();
 const [name,setName]=useState(profile.name),[title,setTitle]=useState(profile.title),[avatarMode,setAvatarMode]=useState(profile.avatarMode);
 const [pending,setPending]=useState(0),[error,setError]=useState(''),[saved,setSaved]=useState('');
 const latest=useRef(profile);useEffect(()=>{if(profile.revision>latest.current.revision)latest.current=profile;},[profile]);
 const chain=useRef(Promise.resolve());const clearSaved=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>()=>{if(clearSaved.current)clearTimeout(clearSaved.current);},[]);
 function commit(patch:ProfilePatch){
  setPending(n=>n+1);setSaved('');setError('');
  chain.current=chain.current.then(async()=>{
   if(Object.entries(patch).every(([key,value])=>latest.current[key as keyof ProfilePatch]===value))return;
   const result=await savePersonalProfile({patch,revision:latest.current.revision});
   if(!result.ok){setError(result.message);return;}
   latest.current=result.data;update(result.data);setSaved(Object.keys(patch)[0]);
   if(clearSaved.current)clearTimeout(clearSaved.current);clearSaved.current=setTimeout(()=>setSaved(''),2300);
  }).catch(()=>setError('没有收到保存确认，请重新读取资料后再试。')).finally(()=>setPending(n=>n-1));
 }
 async function reload(){try{const value=await loadPersonalProfile();latest.current=value;update(value);setName(value.name);setTitle(value.title);setAvatarMode(value.avatarMode);setError('');setSaved('');}catch{setError('读取资料失败，请重试。');}}
 const avatar={name:profile.name,imageUrl:profile.avatarMode==='photo'?profile.photoUrl:null};
 return <><header className="st-sec"><div><h2>个人资料</h2><p className="card__sub">你的显示姓名、职务和头像</p></div></header><div className="st-profile">
  <div className="st-face"><motion.div key={profile.avatarMode} initial={reduce?false:{scale:.7,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:'spring',duration:.55}}><PersonAvatar member={avatar} size="xl"/></motion.div><div className="st-face__t"><b>{profile.name}</b><span className="badge badge--ink">{profile.roleName}</span><div className="st-face__seg"><div className="seg" role="group" aria-label="头像显示方式">{[['photo','照片'],['initials','姓名缩写']].map(([key,label])=><button key={key} type="button" className="seg__btn" disabled={key==='photo'&&!profile.photoUrl} aria-pressed={avatarMode===key} onClick={()=>{setAvatarMode(key as 'photo'|'initials');commit({avatarMode:key as 'photo'|'initials'});}}>{avatarMode===key?<motion.i className="settings-segment-pill" layoutId="profile-picture-mode"/>:null}<span>{label}</span></button>)}</div><SavedMark visible={saved==='avatarMode'}/></div>{!profile.photoUrl?<small className="card__sub">目前没有登录头像。</small>:null}</div></div>
  <div className="st-fields"><label className="field st-field"><span className="field__label st-label">显示姓名<SavedMark visible={saved==='name'}/></span><input autoComplete="name" maxLength={100} value={name} onChange={e=>setName(e.target.value)} onBlur={()=>commit({name})} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/><small className="field__hint">只修改工作台内的显示姓名。</small></label>
   <label className="field st-field"><span className="field__label st-label">职务<SavedMark visible={saved==='title'}/></span><input autoComplete="organization-title" maxLength={80} value={title} onChange={e=>setTitle(e.target.value)} onBlur={()=>commit({title})} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/></label>
   <label className="field st-field"><span className="field__label">工作邮箱</span><input type="email" value={profile.email??''} readOnly placeholder="尚未同步已验证邮箱"/><small className="field__hint">来自已验证的登录账号；修改邮箱请用下方账号管理。</small></label>
   <div className="field st-ro"><span className="field__label">角色</span><p><span className="badge badge--ink">{profile.roleName}</span><Link className="card__sub" href="/marketing/team/roles">由团队与权限页面设置。</Link></p></div>
  </div>
  <div className="settings-save-status" role="status" aria-live="polite">{pending?'正在保存…':error?'资料尚未保存。':saved?'资料已保存。':'修改后离开输入框会自动保存。'}</div>{error?<div className="settings-profile-error" role="alert"><span>{error}</span><button type="button" disabled={pending>0} onClick={()=>void reload()}>重新读取资料</button></div>:null}
  <div className="st-access"><div><h3><Layers className="ico"/>可以访问的工作区</h3><div className="st-access__brands"><span className="settings-workspace-mark">{preferences.name.slice(0,2)}</span><b>{preferences.name}</b></div><p className="card__sub">当前内部工作区。内容仍按现有提交、审核和发布规则处理。</p></div><div><h3><KeyRound className="ico"/>你的角色可以做什么</h3><ul className="st-access__perms">{PERMISSIONS.map(([id,label])=>{const allowed=profile.permissions.includes(id);const Icon=allowed?Check:X;return <li className={allowed?'is-on':''} key={id}><Icon className="ico"/><span className="sr-only">{allowed?'允许：':'不允许：'}</span>{label}</li>;})}</ul></div></div>
  <div className="settings-account-management"><AccountManagement/></div>
 </div></>;
}
