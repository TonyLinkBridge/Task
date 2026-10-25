'use client';
import Image from 'next/image';
import {useState} from 'react';
import {Select} from '@/components/ui/select';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Button,buttonVariants} from '@/components/ui/button';
import type {MediaAsset} from '../types';
export function AssetGrid({assets,userId,admin,onArchive}:{assets:MediaAsset[];userId:string;admin:boolean;onArchive:(id:string,archived:boolean)=>Promise<{ok:true;data:MediaAsset}|{ok:false;message:string}>}){
 const [query,setQuery]=useState(''),[type,setType]=useState(''),[scope,setScope]=useState('active'),[preview,setPreview]=useState<MediaAsset|null>(null),[message,setMessage]=useState<string|null>(null),[busy,setBusy]=useState<string|null>(null);
 const visible=assets.filter(a=>(scope==='archived'?Boolean(a.archivedAt):!a.archivedAt)&&(!type||a.mimeType.startsWith(type))&&a.fileName.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
 async function archive(a:MediaAsset){setBusy(a.id);setMessage(null);try{const result=await onArchive(a.id,!a.archivedAt);if(!result.ok)setMessage(result.message);}catch{setMessage('暂时没有保存成功，请重试。');}finally{setBusy(null);}}
 return <><div className="marketing-toolbar media-asset-filters"><div className="marketing-filter-row"><label>搜索素材<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="文件名称"/></label><Select label="素材类型" value={type} onValueChange={setType} options={[{value:'',label:'全部类型'},{value:'image/',label:'图片'},{value:'video/',label:'影片'},{value:'audio/',label:'音频'},{value:'application/',label:'文档'}]}/><Select label="素材状态" value={scope} onValueChange={setScope} options={[{value:'active',label:'可用素材'},{value:'archived',label:'已移除'}]}/></div></div>
 {message?<p role="alert">{message}</p>:null}<div className="media-asset-grid">{visible.map(a=><article className="marketing-card media-asset-card" key={a.id} aria-label={`素材 ${a.fileName}`}>
 {!a.archivedAt&&a.mimeType.startsWith('image/')?<button className="media-asset-preview" aria-label={`预览素材 ${a.fileName}`} onClick={()=>setPreview(a)}><Image src={`/api/media-assets/${a.id}?mode=preview`} alt={a.fileName} width={640} height={360} unoptimized/></button>:<div className="media-asset-kind">{a.archivedAt?'已移除':a.mimeType.split('/')[0]}</div>}
 <h3 title={a.fileName}>{a.fileName}</h3><p>{a.byteSize>=1048576?`${(a.byteSize/1048576).toFixed(1)} MB`:`${Math.max(.1,a.byteSize/1024).toFixed(1)} KB`}{a.uploaderId===userId?' · 我上传的':''}</p><div className="media-asset-actions">
 {!a.archivedAt?<a className={buttonVariants({variant:'outline',size:'sm'})} href={`/api/media-assets/${a.id}?mode=download`} aria-label={`下载素材 ${a.fileName}`}>下载</a>:null}
 {admin||a.uploaderId===userId?<Button size="sm" variant="outline" disabled={busy===a.id} onClick={()=>void archive(a)}>{busy===a.id?'正在保存…':a.archivedAt?'恢复素材':'从素材库移除'}</Button>:null}</div></article>)}</div>
 {!visible.length?<p className="marketing-empty">没有符合条件的素材。</p>:null}<Dialog open={Boolean(preview)} onOpenChange={open=>{if(!open)setPreview(null);}}><DialogContent className="max-h-[90vh] overflow-auto sm:max-w-4xl"><DialogHeader><DialogTitle>{preview?.fileName??'素材预览'}</DialogTitle><DialogDescription>预览原图，需要保存时再下载。</DialogDescription></DialogHeader>{preview?<><Image src={`/api/media-assets/${preview.id}?mode=preview`} alt={`${preview.fileName} 原图预览`} width={1600} height={1200} unoptimized className="max-h-[65vh] w-full object-contain"/><a className={buttonVariants()} href={`/api/media-assets/${preview.id}?mode=download`}>下载原图</a></>:null}</DialogContent></Dialog></>;
}
