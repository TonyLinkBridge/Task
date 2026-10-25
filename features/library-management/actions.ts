'use server';
import {revalidatePath} from 'next/cache';
import {getVerifiedUser} from '@/lib/auth/get-verified-user';
import {makeLibraryManagement} from './service';
import {libraryManagementRepository} from './repository';
const service=makeLibraryManagement({getUser:getVerifiedUser,id:()=>crypto.randomUUID(),...libraryManagementRepository});
export async function loadLibraryOrganization(){return service.list();}
export async function saveMediaFavorites(input:unknown){return service.favorite(input);}
export async function saveMediaTags(input:unknown){const r=await service.tags(input);if(r.ok)revalidatePath('/marketing/library');return r;}
export async function saveLibrarySnippet(input:unknown){const r=await service.save(input);if(r.ok)revalidatePath('/marketing/library');return r;}
export async function archiveLibrarySnippet(input:unknown){const r=await service.archive(input);if(r.ok)revalidatePath('/marketing/library');return r;}
export async function recordLibrarySnippetUse(input:unknown){return service.use(input);}

export async function archiveMediaAssets(input:unknown){try{const user=await getVerifiedUser();const {z}=await import('zod');const v=z.object({ids:z.array(z.uuid()).min(1).max(100),archived:z.boolean()}).parse(input);const {getSupabaseAdmin}=await import('@/lib/supabase/admin');const {data,error}=await getSupabaseAdmin().rpc('archive_media_assets',{p_ids:[...new Set(v.ids)],p_archived:v.archived,p_actor_id:user.id});if(error)throw Error(error.message);revalidatePath('/marketing/library');return {ok:true as const,data:(data??[]).map((r:{id:string;archived_at:string|null})=>({id:r.id,archivedAt:r.archived_at}))};}catch{return {ok:false as const,message:'没有保存成功；请确认你有权管理全部已选素材，或刷新后重试。'};}}
