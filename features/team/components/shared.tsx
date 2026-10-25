'use client';
import {Avatar,AvatarImage,AvatarFallback}from'@/components/ui/avatar';
import type {TeamMember,TeamRole,TeamSnapshot}from'../types';
import type {TeamOperation}from'../service';
export type TeamPanelProps={snapshot:TeamSnapshot;busy:boolean;canManage:boolean;currentId:string;run:(op:TeamOperation,input:unknown)=>Promise<boolean>;openMember:(id:string)=>void;filterRole:(id:string)=>void};
export function PersonAvatar({member,size='md'}:{member:Pick<TeamMember,'name'|'imageUrl'>;size?:'xs'|'sm'|'md'|'xl'}){return <Avatar className={`av av--${size}`}>{member.imageUrl?<AvatarImage src={member.imageUrl} alt=""/>:null}<AvatarFallback>{member.name.slice(0,2)}</AvatarFallback></Avatar>;}
export const tones:Record<string,string>={owner:'ink',admin:'sea',manager:'pine',editor:'butter',community:'lilac',analyst:'plain',client:'coral'};
export function RoleBadge({role}:{role?:TeamRole}){return <span className={`rbadge rbadge--${tones[role?.id??'']??'lilac'} tm-badge`} style={role&&!role.builtIn?{background:role.color,color:'#fff'}:undefined}>{role?.name??'未分配'}</span>;}
export function StatusBadge({status}:{status:TeamMember['status']}){return <span className={`badge badge--${status==='active'?'pine':'coral'}`}><i className="team-status-dot"/>{status==='active'?'正常':status==='suspended'?'已停用':'已移除'}</span>;}
export function lastActive(date:string|null,reference?:string){if(!date)return'未记录';if(!reference)return teamDate(date);const minutes=Math.max(0,(Date.parse(reference)-Date.parse(date))/60000);return minutes<2?'刚刚':minutes<60?`${Math.floor(minutes)} 分钟前`:minutes<1440?`${Math.floor(minutes/60)} 小时前`:`${Math.floor(minutes/1440)} 天前`;}
export function teamDate(date:string){return new Intl.DateTimeFormat('zh-MY',{timeZone:'Asia/Kuala_Lumpur',dateStyle:'medium',timeStyle:'short'}).format(new Date(date));}
