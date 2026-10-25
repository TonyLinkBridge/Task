'use client';
import {useRef,useState} from 'react';
import {MediaUpload,uploadSignedFile} from './upload';
import {AssetGrid,type AssetOrganizationProps} from './asset-grid';
import type {MediaAsset,SignedAssetUpload} from '../types';
import type {ContentFileMeta} from '@/features/content/files/service';
type Result<T>={ok:true;data:T}|{ok:false;message:string};
export function MediaLibrary({assets,userId,admin,canEdit=true,requestAction,finishAction,archiveAction,...organizationProps}:{assets:MediaAsset[];userId:string;admin:boolean;canEdit?:boolean;requestAction:(meta:ContentFileMeta)=>Promise<Result<SignedAssetUpload>>;finishAction:(id:string,path:string,meta:ContentFileMeta)=>Promise<Result<MediaAsset>>;archiveAction:(id:string,archive:boolean)=>Promise<Result<MediaAsset>>}&AssetOrganizationProps){
 const [saved,setSaved]=useState(assets);const tickets=useRef(new WeakMap<File,SignedAssetUpload&{transferred?:boolean}>());
 return <section aria-label="独立素材库" className="marketing-entry media-library"><div className="marketing-card"><h2>上传到素材库</h2><p>先保存素材，再到任何草稿或需要修改的内容里选用。已加入内容的文件会独立保留。</p><MediaUpload disabled={!canEdit} save={async(file,meta,options)=>{
  let ticket=tickets.current.get(file);if(!ticket){const result=await requestAction(meta);if(!result.ok)throw Error(result.message);ticket=result.data;tickets.current.set(file,ticket);}
  if(options.signal.aborted)throw new DOMException('已取消','AbortError');
  if(!ticket.transferred){try{await uploadSignedFile(ticket.signedUrl,file,options);ticket.transferred=true;}catch(e){tickets.current.delete(file);throw e;}}
  if(options.signal.aborted)throw new DOMException('已取消','AbortError');
  const result=await finishAction(ticket.assetId,ticket.storagePath,meta);if(!result.ok)throw Error(result.message);
  setSaved(all=>[result.data,...all.filter(a=>a.id!==result.data.id)]);options.onProgress(100);
 }}/></div><AssetGrid canEdit={canEdit} {...organizationProps} onBatchArchive={organizationProps.onBatchArchive?async(ids,archived)=>{const r=await organizationProps.onBatchArchive!(ids,archived);if(r.ok)setSaved(all=>all.map(a=>{const changed=r.data.find(v=>v.id===a.id);return changed?{...a,archivedAt:changed.archivedAt}:a;}));return r;}:undefined} assets={saved} userId={userId} admin={admin} onArchive={async(id,archived)=>{const result=await archiveAction(id,archived);if(result.ok)setSaved(all=>all.map(a=>a.id===id?result.data:a));return result;}}/></section>;
}
