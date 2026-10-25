import 'server-only';
import { MediaAttachRejected } from './service';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { ContentAttachment } from '@/features/content/types';
import type { MediaAsset } from './types';
type Row={id:string;storage_path:string;file_name:string;mime_type:string;byte_size:number|string;uploader_id:string;created_at:string;archived_at:string|null};
const map=(r:Row):MediaAsset=>({id:r.id,storagePath:r.storage_path,fileName:r.file_name,mimeType:r.mime_type,byteSize:Number(r.byte_size),uploaderId:r.uploader_id,createdAt:r.created_at,archivedAt:r.archived_at});
export const mediaRepository={
 async list(){
  const assets:MediaAsset[]=[];const batchSize=100;
  for(let offset=0;;offset+=batchSize){
   const {data,error}=await getSupabaseAdmin().from('media_assets').select('*').order('created_at',{ascending:false}).order('id',{ascending:false}).range(offset,offset+batchSize-1);
   if(error)throw Error('MEDIA_DATABASE_UNAVAILABLE');
   assets.push(...(data??[]).map(r=>map(r)));
   if(!data||data.length<batchSize)return assets;
  }
 },
 async find(id:string){const {data,error}=await getSupabaseAdmin().from('media_assets').select('*').eq('id',id).maybeSingle();if(error)throw Error('MEDIA_DATABASE_UNAVAILABLE');return data?map(data):null;},
 async save(a:MediaAsset){const {data,error}=await getSupabaseAdmin().from('media_assets').upsert({id:a.id,storage_path:a.storagePath,file_name:a.fileName,mime_type:a.mimeType,byte_size:a.byteSize,uploader_id:a.uploaderId,created_at:a.createdAt,archived_at:a.archivedAt},{onConflict:'id'}).select('*').single();if(error||!data)throw Error('MEDIA_SAVE_FAILED');return map(data);},
 async archive(id:string,at:string|null){const {data,error}=await getSupabaseAdmin().from('media_assets').update({archived_at:at}).eq('id',id).select('*').single();if(error||!data)throw Error('MEDIA_SAVE_FAILED');return map(data);},
 async attach(assetId:string,contentId:string,path:string,actorId:string):Promise<ContentAttachment>{const {data,error}=await getSupabaseAdmin().rpc('attach_media_asset',{p_asset_id:assetId,p_content_id:contentId,p_storage_path:path,p_actor_id:actorId});if(error?.code==='P0001')throw new MediaAttachRejected();if(error||!data)throw Error('MEDIA_ATTACH_FAILED');return {id:data.id,contentId:data.content_id,storagePath:data.storage_path,fileName:data.file_name,mimeType:data.mime_type,byteSize:Number(data.byte_size),uploaderId:data.uploader_id,createdAt:data.created_at};},
};
