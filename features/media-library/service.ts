import {hasPermission,requirePermission} from "@/features/team/permissions";
import { z } from 'zod';
import { fileSchema, buildStoragePath, type ContentFileMeta } from '@/features/content/files/service';
import type { ContentAttachment } from '@/features/content/types';
import type { VerifiedUser } from '@/lib/auth/types';
import type { MediaAsset } from './types';
type EditableContent={id:string;status:string;authorId:string;assigneeId:string};
type Dependencies={
 getUser():Promise<VerifiedUser>; find(id:string):Promise<MediaAsset|null>; save(asset:MediaAsset):Promise<MediaAsset>; archive(id:string,at:string|null):Promise<MediaAsset>;
 createUploadUrl(path:string):Promise<{token:string;signedUrl:string}>; inspect(path:string):Promise<{size:number;type:string}|null>;
 findContent(id:string):Promise<EditableContent|null>; copy(from:string,to:string):Promise<void>; remove(path:string):Promise<void>;
 attach(assetId:string,contentId:string,path:string,actorId:string):Promise<ContentAttachment>; id():string; now():Date;
};
const validId=(id:string)=>z.uuid().safeParse(id).success;
/** Only an explicit database rejection proves the transaction did not commit. */
export class MediaAttachRejected extends Error {}
export function makeMediaLibraryActions(d:Dependencies){
 return {
  async request(meta:unknown){
   try{const user=await d.getUser(),file=fileSchema.safeParse(meta);if(!file.success)return {ok:false as const,message:'只可上传图片、影片、音频、PDF 或 Office 文件，最大 100MB。'};
    const assetId=d.id(),storagePath=buildStoragePath(`library/${user.id}/${assetId}`,file.data.name,d.id());
    return {ok:true as const,data:{assetId,storagePath,...await d.createUploadUrl(storagePath)}};
   }catch{return {ok:false as const,message:'暂时无法开始上传，请重试。'};}
  },
  async finish(assetId:string,path:string,meta:ContentFileMeta){
   try{const user=await d.getUser(),file=fileSchema.safeParse(meta);if(!validId(assetId)||!file.success||!path.startsWith(`library/${user.id}/${assetId}/`)||path.includes('..'))return {ok:false as const,message:'文件资料不正确。'};
    const existing=await d.find(assetId);if(existing){if(existing.uploaderId!==user.id||existing.storagePath!==path||existing.archivedAt)return {ok:false as const,message:'素材已经变更，请重新上传。'};return {ok:true as const,data:existing};}
    const actual=await d.inspect(path);if(!actual||!fileSchema.safeParse({...file.data,...actual,name:file.data.name}).success)return {ok:false as const,message:'文件没有上传完整，请重试。'};
    return {ok:true as const,data:await d.save({id:assetId,storagePath:path,fileName:file.data.name,mimeType:actual.type,byteSize:actual.size,uploaderId:user.id,createdAt:d.now().toISOString(),archivedAt:null})};
   }catch{return {ok:false as const,message:'素材没有保存成功，请重试。'};}
  },
  async setArchived(assetId:string,archived:boolean){
   try{const user=await d.getUser();requirePermission(user,"library.manage");if(!validId(assetId)||typeof archived!=='boolean')return {ok:false as const,message:'找不到素材。'};const asset=await d.find(assetId);
    if(!asset)return {ok:false as const,message:'找不到素材。'};if(!hasPermission(user,'library.manage_all')&&asset.uploaderId!==user.id)return {ok:false as const,message:'你只能管理自己上传的素材。'};
    return {ok:true as const,data:await d.archive(assetId,archived?d.now().toISOString():null)};
   }catch{return {ok:false as const,message:'没有保存成功，请重试。'};}
  },
  async useInContent(assetId:string,contentId:string){
   let copied:string|undefined;
   try{const user=await d.getUser();requirePermission(user,"library.manage");if(!validId(assetId)||!validId(contentId))return {ok:false as const,message:'素材或内容资料不正确。'};
    const [asset,content]=await Promise.all([d.find(assetId),d.findContent(contentId)]);
    if(!asset||asset.archivedAt)return {ok:false as const,message:'素材已移除，请选择其他素材。'};
    if(!content||!['draft','changes_requested'].includes(content.status)||(!hasPermission(user,'content.manage_all')&&user.id!==content.authorId&&user.id!==content.assigneeId))return {ok:false as const,message:'你不能修改这份内容的文件，或内容正在审核。'};
    const path=buildStoragePath(contentId,asset.fileName,d.id());await d.copy(asset.storagePath,path);copied=path;
    const attached=await d.attach(assetId,contentId,path,user.id);
    if(attached.storagePath!==path)await d.remove(path).catch(()=>{});
    return {ok:true as const,data:attached};
   }catch(error){
    // A lost response may follow a successful commit. Preserve that copy so a
    // retry can find the existing attachment instead of leaving a broken file.
    if(copied&&error instanceof MediaAttachRejected)await d.remove(copied).catch(()=>{});
    return {ok:false as const,message:'未能确认是否加入内容，请重试；系统会避免重复加入。'};
   }
  },
 };
}
