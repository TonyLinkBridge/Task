import { makeFileDownloadHandler } from '@/features/content/api/file-download-handler';
import { mediaRepository } from '@/features/media-library/repository';
import { getVerifiedUser } from '@/lib/auth/get-verified-user';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
const download=makeFileDownloadHandler({getVerifiedUser,async findAttachment(id){const asset=await mediaRepository.find(id);return asset&&!asset.archivedAt?asset:null;},async createSignedUrl(path,expires,download){const {data,error}=await getSupabaseAdmin().storage.from('content-files').createSignedUrl(path,expires,download?{download:true}:undefined);if(error||!data)throw Error('MEDIA_DOWNLOAD_UNAVAILABLE');return data.signedUrl;}});

export async function GET(request:Request,context:{params:Promise<{attachmentId:string}>}){
 try{return await download(request,context);}
 catch{return new Response('素材暂时读取不到，请重试。',{status:503,headers:{'cache-control':'no-store'}});}
}
