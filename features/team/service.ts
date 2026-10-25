import {z} from 'zod';
import type {VerifiedUser} from '@/lib/auth/types';
import {ALL_PERMISSIONS,hasPermission} from './permissions';
import type {TeamResult,TeamSnapshot} from './types';
const id=z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),revision=z.number().int().nonnegative();
const schemas={
 save_role:z.object({id,name:z.string().trim().min(1).max(40),description:z.string().max(240),color:z.string().regex(/^#[0-9a-fA-F]{6}$/),permissions:z.array(z.enum(ALL_PERMISSIONS as [string,...string[]])).max(ALL_PERMISSIONS.length),revision:z.number().int().min(-1)}),
 delete_role:z.object({id,revision}),
 set_role:z.object({id:z.string().min(1),roleId:id,revision}),
 set_status:z.object({id:z.string().min(1),status:z.enum(['active','suspended','removed']),revision}),
 save_member:z.object({id:z.string().min(1),title:z.string().trim().max(80),revision}),
 create_invite:z.object({name:z.string().trim().min(1).max(100),email:z.email().max(254).transform(s=>s.toLowerCase()),roleId:id}),
 resend_invite:z.object({id:z.uuid(),revision}),revoke_invite:z.object({id:z.uuid(),revision}),
};
export type TeamOperation=keyof typeof schemas;
type Dependencies={getUser():Promise<VerifiedUser>;snapshot(id:string):Promise<TeamSnapshot>;mutate(id:string,op:string,input:unknown):Promise<Record<string,unknown>>;deliver(email:string,id:string):Promise<{id:string}>;revoke(id:string):Promise<void>;syncAccess():Promise<void>};
export function teamError(e:unknown){const m=e instanceof Error?e.message:'';return m.includes('team_roles_name_unique')?'这个角色名称已经存在，请换一个。':m.includes('CONFLICT')?'同事已经更新了这份资料，请读取最新资料后再试。':m.includes('APPROVERS_REQUIRED')?'需要保留至少两位有审核权限的成员。':m.includes('MANAGER_REQUIRED')?'至少要保留一位能管理团队的成员。':m.includes('ROLE_IN_USE')?'还有成员或邀请使用这个角色，请先转到其他角色。':m.includes('OWNER_FIXED')?'负责人角色和账号受保护，不能这样修改。':m.includes('BUILTIN_FIXED')?'系统内置角色不能删除。':m.includes('CANNOT_GRANT')?'你不能授予自己没有的权限，也不能指定负责人。':m.includes('SELF_CHANGE')?'不能停用自己或移除自己的管理权限，请另一位管理员处理。':m.includes('ALREADY_MEMBER')||m.includes('team_invites_pending_email')?'这个邮箱已有成员账号或待处理邀请。':m.includes('NOT_FOUND')?'资料不存在，请读取最新资料。':m.includes('FORBIDDEN')?'你没有管理团队的权限。':'没有保存成功，请稍后重试。';}
export function makeTeamService(d:Dependencies){return {
 async load():Promise<TeamResult>{try{const user=await d.getUser();return{ok:true,data:await d.snapshot(user.id)};}catch(e){return{ok:false,message:teamError(e)};}},
 async change(operation:string,input:unknown):Promise<TeamResult>{
  try{
   const user=await d.getUser();if(!hasPermission(user,'team.manage'))throw Error('TEAM_FORBIDDEN');
   if(!Object.hasOwn(schemas,operation))return{ok:false,message:'不支持这个操作。'};
   const value=schemas[operation as TeamOperation].parse(input);
   const before=operation==='revoke_invite'||operation==='resend_invite'?await d.snapshot(user.id):null;
   const previous=before?.invites.find(i=>i.id===('id'in value?value.id:''));
   const result=await d.mutate(user.id,operation,value);
   if((operation==='revoke_invite'||operation==='resend_invite')&&previous?.deliveryId)await d.revoke(previous.deliveryId);
   if(operation==='create_invite'||operation==='resend_invite'){
    const email=String(result.email),inviteId=String(result.id),rev=Number(result.revision);
    try{const sent=await d.deliver(email,inviteId);await d.mutate(user.id,'invite_delivery',{id:inviteId,revision:rev,sent:true,deliveryId:sent.id});}
    catch{await d.mutate(user.id,'invite_delivery',{id:inviteId,revision:rev,sent:false});return{ok:false,message:'邀请已保存，但邮件没有确认发送成功。请在待处理邀请中重试。',data:await d.snapshot(user.id)};}
   }
   if(['save_role','delete_role','set_role','set_status'].includes(operation)){
    try{await d.syncAccess();}catch{return{ok:false,message:'权限已保存，但协同连接的权限同步失败。请重试同步，暂时不要让成员继续编辑。',data:await d.snapshot(user.id)};}
   }
   return{ok:true,data:await d.snapshot(user.id)};
  }catch(e){return{ok:false,message:e instanceof z.ZodError?'请检查姓名、邮箱、角色和权限内容。':teamError(e)};}
 },
 async synchronize():Promise<TeamResult>{try{const u=await d.getUser();if(!hasPermission(u,'team.manage'))throw Error('TEAM_FORBIDDEN');await d.syncAccess();return{ok:true,data:await d.snapshot(u.id)};}catch(e){return{ok:false,message:teamError(e)};}},
};}
