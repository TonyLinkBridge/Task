import 'server-only';
import {getSupabaseAdmin} from '@/lib/supabase/admin';
import type {LibrarySnippet,LibraryOrganization} from './types';
import type {SnippetInput} from './service';
type Row={id:string;kind:LibrarySnippet['kind'];title:string;body:string;owner_id:string;revision:number;use_count:number;created_at:string;updated_at:string;archived_at:string|null};
const map=(r:Row):LibrarySnippet=>({id:r.id,kind:r.kind,title:r.title,body:r.body,ownerId:r.owner_id,revision:r.revision,useCount:r.use_count,createdAt:r.created_at,updatedAt:r.updated_at,archivedAt:r.archived_at});
async function rpc(name:string,args:Record<string,unknown>){const {data,error}=await getSupabaseAdmin().rpc(name,args);if(error)throw Error(error.message);return data;}
export const libraryManagementRepository={
 async list(userId:string):Promise<LibraryOrganization>{
  const all=async(table:string,column:string,filter?:[string,string])=>{const rows:Record<string,unknown>[]=[];for(let offset=0;;offset+=100){let q=getSupabaseAdmin().from(table).select('*').order(column);if(filter)q=q.eq(...filter);const {data,error}=await q.range(offset,offset+99);if(error)throw Error(error.message);rows.push(...(data??[]));if(!data||data.length<100)return rows;}};
  const [favorites,usage,snippets]=await Promise.all([all('media_asset_favorites','asset_id',['user_id',userId]),all('media_asset_usage','asset_id'),all('library_snippets','id')]);
  return {favorites:favorites.map(r=>String(r.asset_id)),usage:Object.fromEntries(usage.map(r=>[String(r.asset_id),Number(r.use_count)])),snippets:snippets.map(r=>map(r as unknown as Row))};
 },
 async favorite(ids:string[],favorite:boolean,actor:string){await rpc('set_media_favorites',{p_asset_ids:ids,p_actor_id:actor,p_favorite:favorite});},
 async tags(id:string,tags:string[],actor:string):Promise<string[]>{const data=await rpc('set_media_asset_tags',{p_asset_id:id,p_tags:tags,p_actor_id:actor});return data.tags;},
 async save(v:SnippetInput&{id:string},actor:string){return map(await rpc('save_library_snippet',{p_id:v.id,p_kind:v.kind,p_title:v.title,p_body:v.body,p_revision:v.revision,p_actor_id:actor}));},
 async archive(id:string,archived:boolean,revision:number,actor:string){return map(await rpc('archive_library_snippet',{p_id:id,p_archived:archived,p_revision:revision,p_actor_id:actor}));},
 async use(id:string,eventId:string,actor:string){return Number(await rpc('record_library_snippet_use',{p_id:id,p_event_id:eventId,p_actor_id:actor}));},
};
