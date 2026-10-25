'use client';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Select} from '@/components/ui/select';
import {loadWorkspacePreferences,saveWorkspacePreferences} from '../actions';
import type {WorkspacePreferences} from '../types';
export function WorkspaceForm({initial,admin}:{initial:WorkspacePreferences;admin:boolean}){
 const [value,setValue]=useState(initial),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 async function save(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage('');setError('');try{const r=await saveWorkspacePreferences(value);if(!r.ok)setError(r.message);else{setValue(r.data);window.dispatchEvent(new CustomEvent('workspace-preferences-saved',{detail:r.data}));setMessage('已保存，页头名称和日历的一周起点会跟着更新。');}}catch{setError('暂时没有保存成功，请重试。');}finally{setBusy(false);}}
 async function reload(){setBusy(true);setError('');try{setValue(await loadWorkspacePreferences());setMessage('已读取最新资料。');}catch{setError('暂时读不到最新资料。');}finally{setBusy(false);}}
 return <><h2>工作区资料</h2><p>管理员可调整团队名称、说明和日历一周起点。排期固定使用马来西亚时间；登录工作区和审批人数不受这些设置影响。</p><form onSubmit={save} className="workspace-settings-form"><label>工作区名称<input required maxLength={24} value={value.name} disabled={!admin||busy} onChange={e=>setValue(v=>({...v,name:e.target.value}))}/></label><label>页头说明<input maxLength={40} value={value.description} disabled={!admin||busy} onChange={e=>setValue(v=>({...v,description:e.target.value}))}/></label><Select label="一周开始于" value={String(value.weekStartsOn)} onValueChange={s=>setValue(v=>({...v,weekStartsOn:s==='0'?0:1}))} disabled={!admin||busy} options={[{value:'1',label:'星期一'},{value:'0',label:'星期日'}]}/>{error?<p role="alert">{error}</p>:null}{message?<p role="status">{message}</p>:null}{admin?<Button type="submit" disabled={busy}>{busy?'正在保存…':'保存工作区设置'}</Button>:<p>只有管理员可以修改工作区设置。</p>}<Button type="button" variant="outline" disabled={busy} onClick={()=>void reload()}>读取最新工作区资料</Button></form></>;
}
