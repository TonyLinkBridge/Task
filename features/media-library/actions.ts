import { revalidatePath } from 'next/cache';
import { getVerifiedUser } from '@/lib/auth/get-verified-user';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { contentRepository } from '@/features/content/repository';
import type { ContentFileMeta } from '@/features/content/files/service';
import { makeMediaLibraryActions } from './service';
import { mediaRepository } from './repository';
const bucket=()=>getSupabaseAdmin().storage.from('content-files');
const actions=makeMediaLibraryActions({getUser:getVerifiedUser,...mediaRepository,findContent:id=>contentRepository.find(id),id:()=>crypto.randomUUID(),now:()=>new Date(),
 async createUploadUrl(path){const {data,error}=await bucket().createSignedUploadUrl(path);if(error||!data)throw Error('UPLOAD_UNAVAILABLE');return {token:data.token,signedUrl:data.signedUrl};},
 async inspect(path){const {data,error}=await bucket().info(path);return error||!data?.size||!data.contentType?null:{size:data.size,type:data.contentType};},
 async copy(from,to){const {error}=await bucket().copy(from,to);if(error)throw Error('COPY_UNAVAILABLE');},
 async remove(path){const {error}=await bucket().remove([path]);if(error)throw Error('REMOVE_UNAVAILABLE');},
});
export async function requestMediaUpload(meta:ContentFileMeta){'use server';return actions.request(meta);}
export async function finishMediaUpload(id:string,path:string,meta:ContentFileMeta){'use server';const result=await actions.finish(id,path,meta);if(result.ok)revalidatePath('/marketing/library');return result;}
export async function setMediaArchived(id:string,archived:boolean){'use server';const result=await actions.setArchived(id,archived);if(result.ok)revalidatePath('/marketing/library');return result;}
export async function useMediaInContent(assetId:string,contentId:string){'use server';const result=await actions.useInContent(assetId,contentId);if(result.ok){revalidatePath(`/marketing/content/${contentId}`);revalidatePath(`/content/${contentId}`);}return result;}
export async function listAvailableMedia(){'use server';await getVerifiedUser();return (await mediaRepository.list()).filter(a=>!a.archivedAt);}
