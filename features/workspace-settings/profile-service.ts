import {z} from 'zod';
import type {VerifiedUser} from '@/lib/auth/types';
import type {PersonalProfile,ProfilePatch} from './profile-types';
import type {Result} from '@/features/library-management/types';
const patchSchema=z.object({name:z.string().trim().min(1).max(100).optional(),title:z.string().trim().max(80).optional(),avatarMode:z.enum(['photo','initials']).optional()}).strict().refine(value=>Object.keys(value).length>0);
const inputSchema=z.object({patch:patchSchema,revision:z.number().int().nonnegative()}).strict();
export function makeProfileService(deps:{getUser():Promise<VerifiedUser>;save(actor:string,patch:ProfilePatch,revision:number):Promise<PersonalProfile>}){
 return {async save(input:unknown):Promise<Result<PersonalProfile>>{try{
  const user=await deps.getUser();const value=inputSchema.parse(input);
  return {ok:true,data:await deps.save(user.id,value.patch,value.revision)};
 }catch(error){const message=error instanceof Error?error.message:'';return {ok:false,message:error instanceof z.ZodError?'姓名需填写且最多 100 字，职务最多 80 字，请检查输入。':message.includes('PROFILE_CONFLICT')?'资料已经被更新，请重新读取后再试。':message.includes('PROFILE_NO_PHOTO')?'目前没有登录头像，请先在账号管理中设置。':message.includes('TEAM_FORBIDDEN')?'当前账号不能修改资料。':'资料没有保存成功，请重试。'};}}};
}
