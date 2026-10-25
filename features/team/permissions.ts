import type {AppRole} from '@/lib/auth/types';
export const PERMISSIONS = [
 ['content.write','撰写内容','建立草稿、编辑和上传附件','内容发布'],
 ['content.reschedule','调整排期','修改可编辑内容的时间和平台','内容发布'],
 ['content.approve','审核内容','批准或退回内容；仍遵守版本及人数规则','内容发布'],
 ['content.publish','确认发布','内容批准完成后确认已经发布','内容发布'],
 ['content.delete','删除自己的内容','永久删除自己建立的内容','内容发布'],
 ['content.manage_all','管理所有人的内容','扩大到全员内容；仍需勾选对应的撰写、排期或删除动作','内容发布'],
 ['tasks.manage','操作普通任务','建立、修改、拖动任务及留言','团队协作'],
 ['tasks.manage_all','管理所有人的任务','扩大到全员任务；仍需勾选操作普通任务','团队协作'],
 ['messages.send','发送私人消息','给工作区成员发送站内消息','团队协作'],
 ['reports.view','查看工作汇总','查看内容和任务汇总','数据与记录'],
 ['reports.export','导出内容排期','导出当前可查看的排期资料','数据与记录'],
 ['history.view','查看操作记录','查看团队操作和通知发送记录','数据与记录'],
 ['library.manage','使用素材与文字资源','上传、复用和管理自己的素材与文字资源','素材'],
 ['library.manage_all','管理全部素材','扩大到全员资源；仍需勾选使用素材与文字资源','素材'],
 ['channels.manage','管理发布平台','新增、修改、停用和恢复平台','工作区管理'],
 ['team.manage','管理团队和权限','邀请、设置角色、停用成员；不能授予自己没有的权限','工作区管理'],
 ['workspace.manage','修改工作区设置','工作区名称、通知频道及提醒规则','工作区管理'],
 ['workspace.export','导出工作区备份','导出业务资料备份，不包含私信及登录密钥','工作区管理'],
] as const;
export type Permission = typeof PERMISSIONS[number][0];
export const ALL_PERMISSIONS:Permission[] = PERMISSIONS.map(p=>p[0]);
const employee:Permission[]=['content.write','content.reschedule','content.publish','content.delete','tasks.manage','messages.send','reports.view','reports.export','library.manage'];
export function legacyPermissions(role:AppRole):Permission[]{return [...(role==='admin'?ALL_PERMISSIONS:employee)];}
export const BUILTIN_ROLES = [
 {id:'owner',name:'负责人',color:'#191b1e',description:'保留全部权限，固定角色。',permissions:ALL_PERMISSIONS},
 {id:'admin',name:'管理员',color:'#3769a0',description:'管理工作区、团队、内容及设置。',permissions:ALL_PERMISSIONS},
 {id:'manager',name:'主管',color:'#34725b',description:'安排内容、审核和协作，不管理工作区权限。',permissions:[...employee,'content.approve','content.manage_all','tasks.manage_all','history.view','library.manage_all'] as Permission[]},
 {id:'editor',name:'编辑',color:'#ebbd55',description:'撰写内容、上传素材和跟进任务；提交后需要审核。',permissions:employee},
 {id:'community',name:'社群运营',color:'#397a86',description:'处理成员消息、普通任务和素材。',permissions:['messages.send','tasks.manage','reports.view','library.manage'] as Permission[]},
 {id:'analyst',name:'分析员',color:'#f4f4f1',description:'查看汇总、导出排期和操作记录，不修改内容。',permissions:['reports.view','reports.export','history.view'] as Permission[]},
 {id:'client',name:'访客',color:'#b84c3e',description:'只查看团队内容及工作汇总。',permissions:['reports.view'] as Permission[]},
];
type AccessUser={role:AppRole;permissions?:readonly string[];teamStatus?:string};
export function hasPermission(user:AccessUser,permission:Permission):boolean{
 if(user.teamStatus&&user.teamStatus!=='active')return false;
 return (user.permissions??legacyPermissions(user.role)).includes(permission);
}
export function requirePermission(user:AccessUser,permission:Permission):void{if(!hasPermission(user,permission))throw Error('FORBIDDEN');}
export function roleLabel(user:{role:AppRole;teamRoleName?:string}){return user.teamRoleName??(user.role==='admin'?'管理员':'员工');}
