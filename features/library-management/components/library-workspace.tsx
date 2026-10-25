'use client';
import {useCallback,useEffect,useState} from 'react';
import {Button} from '@/components/ui/button';
import {MediaLibrary} from '@/features/media-library/components/library';
import {requestMediaUpload,finishMediaUpload,setMediaArchived} from '@/features/media-library/actions';
import type {MediaAsset} from '@/features/media-library/types';
import {loadLibraryOrganization,saveMediaFavorites,saveMediaTags,saveLibrarySnippet,archiveLibrarySnippet,recordLibrarySnippetUse,archiveMediaAssets} from '../actions';
import type {LibraryOrganization,SnippetKind} from '../types';
import {snippetLabels} from '../types';
import {ResourcePanel} from './resource-panel';
import './management.css';
export function LibraryWorkspace({assets,userId,admin,canEdit=true}:{assets:MediaAsset[];userId:string;admin:boolean;canEdit?:boolean}){
 const [tab,setTab]=useState<'media'|SnippetKind>('media'),[organization,setOrganization]=useState<LibraryOrganization|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const refresh=useCallback(async()=>{try{const result=await loadLibraryOrganization();if(result.ok)setOrganization(result.data);else setError(result.message);}catch{setError('管理资料暂时读取失败，请重试。');}finally{setLoading(false);}},[]);
 const requestRefresh=()=>{setLoading(true);setError('');void refresh();};
 useEffect(()=>{let active=true;loadLibraryOrganization().then(result=>{if(!active)return;if(result.ok)setOrganization(result.data);else setError(result.message);}).catch(()=>{if(active)setError('管理资料暂时读取失败，请重试。');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
 return <><nav className="marketing-segments library-tabs" aria-label="资源分类">{([['media','媒体素材'],...Object.entries(snippetLabels)] as [typeof tab,string][]).map(([key,label])=><button key={key} type="button" aria-pressed={tab===key} onClick={()=>setTab(key)}>{label}</button>)}</nav>{error?<div role="alert">{error}<Button variant="outline" onClick={requestRefresh}>重新加载管理资料</Button></div>:null}
 <div hidden={tab!=='media'}><MediaLibrary canEdit={canEdit} assets={assets} userId={userId} admin={admin} requestAction={requestMediaUpload} finishAction={finishMediaUpload} archiveAction={setMediaArchived} organization={organization} organizationLoading={loading} onFavorite={async(ids,favorite)=>{const r=await saveMediaFavorites({ids,favorite});if(r.ok)setOrganization(o=>o?{...o,favorites:favorite?[...new Set([...o.favorites,...ids])]:o.favorites.filter(id=>!ids.includes(id))}:o);return r;}} onTags={async(id,tags)=>saveMediaTags({id,tags})} onBatchArchive={async(ids,archived)=>archiveMediaAssets({ids,archived})}/></div>{tab!=='media'?(loading?<p role="status">正在读取资源…</p>:organization?<ResourcePanel canEdit={canEdit} key={tab} kind={tab} resources={organization.snippets} userId={userId} admin={admin} onRefresh={requestRefresh} onSave={async value=>{const r=await saveLibrarySnippet(value);if(r.ok)setOrganization(o=>o?{...o,snippets:[r.data,...o.snippets.filter(s=>s.id!==r.data.id)]}:o);return r;}} onArchive={async value=>{const r=await archiveLibrarySnippet(value);if(r.ok)setOrganization(o=>o?{...o,snippets:o.snippets.map(s=>s.id===r.data.id?r.data:s)}:o);return r;}} onUsed={async(id,eventId)=>{const r=await recordLibrarySnippetUse({id,eventId});if(r.ok)setOrganization(o=>o?{...o,snippets:o.snippets.map(s=>s.id===id?{...s,useCount:r.data}:s)}:o);return r;}}/>:<p>资源尚未读取成功，请先重新加载。</p>):null}</>;
}
