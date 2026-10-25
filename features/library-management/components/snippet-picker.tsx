'use client';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Select} from '@/components/ui/select';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {loadLibraryOrganization,recordLibrarySnippetUse} from '../actions';
import {snippetLabels,type LibrarySnippet} from '../types';
export function SnippetPicker({disabled,onInsert}:{disabled:boolean;onInsert:(body:string)=>Promise<void>}){
 const [open,setOpen]=useState(false),[loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[query,setQuery]=useState(''),[kind,setKind]=useState(''),[resources,setResources]=useState<LibrarySnippet[]>([]),[error,setError]=useState(''),[message,setMessage]=useState('');
 async function show(){setOpen(true);setLoading(true);setError('');try{const r=await loadLibraryOrganization();if(!r.ok)setError(r.message);else setResources(r.data.snippets.filter(s=>!s.archivedAt));}catch{setError('资源暂时读不到，请重试。');}finally{setLoading(false);}}
 async function insert(r:LibrarySnippet){setBusy(true);setError('');try{await onInsert(r.body);setOpen(false);setMessage('已添加到正文末尾，请检查内容并等待同步完成。');const result=await recordLibrarySnippetUse({id:r.id,eventId:crypto.randomUUID()});if(!result.ok)setMessage('已插入，使用次数暂未更新。');}catch{setError('未能插入；请确认正文可编辑并已连接，再重试。');}finally{setBusy(false);}}
 const visible=resources.filter(s=>(!kind||s.kind===kind)&&`${s.title} ${s.body}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
 return <><Button type="button" variant="outline" disabled={disabled} onClick={()=>void show()}>插入模板或常用文字</Button>{message?<p role="status">{message}</p>:null}<Dialog open={open} onOpenChange={value=>{if(!busy)setOpen(value);}}><DialogContent className="max-h-[85vh] overflow-auto"><DialogHeader><DialogTitle>从资源库插入文字</DialogTitle><DialogDescription>添加到正文末尾，不替换已有内容。只有草稿或需要修改、协同连接正常时可以插入。</DialogDescription></DialogHeader><label>搜索文字资源<input type="search" value={query} onChange={e=>setQuery(e.target.value)} className="w-full rounded-lg border p-2"/></label><Select label="文字资源类型" value={kind} onValueChange={setKind} options={[{value:'',label:'全部文字资源'},...Object.entries(snippetLabels).map(([value,label])=>({value,label}))]}/>{error?<p role="alert">{error}<Button variant="outline" onClick={()=>void show()}>重新加载文字资源</Button></p>:null}{loading?<p role="status">正在读取文字资源…</p>:visible.map(s=><article className="rounded-xl border p-3" key={s.id}><h3>{s.title}</h3><p className="max-h-32 overflow-auto whitespace-pre-wrap text-sm">{s.body}</p><Button disabled={disabled||busy} onClick={()=>void insert(s)}>添加 {s.title} 到正文末尾</Button></article>)}{!loading&&!error&&!visible.length?<p>没有符合条件的文字资源，可先到文件库新增。</p>:null}</DialogContent></Dialog></>;
}
