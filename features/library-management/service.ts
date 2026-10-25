import {z} from 'zod';
import type {VerifiedUser} from '@/lib/auth/types';
import type {LibraryOrganization,LibrarySnippet,Result} from './types';
export const snippetSchema=z.object({id:z.uuid().optional(),kind:z.enum(['template','hashtag_set','saved_reply']),title:z.string().trim().min(1).max(100),body:z.string().trim().min(1).max(20000),revision:z.number().int().min(-1)});
export type SnippetInput=z.infer<typeof snippetSchema>;
type Dependencies={getUser():Promise<VerifiedUser>;id():string;list(userId:string):Promise<LibraryOrganization>;favorite(ids:string[],favorite:boolean,actor:string):Promise<void>;tags(id:string,tags:string[],actor:string):Promise<string[]>;save(input:SnippetInput&{id:string},actor:string):Promise<LibrarySnippet>;archive(id:string,archived:boolean,revision:number,actor:string):Promise<LibrarySnippet>;use(id:string,eventId:string,actor:string):Promise<number>};
export function managementError(error:unknown){const message=error instanceof Error?error.message:'';return message.includes('CONFLICT')?'同事已经更新了这份资料，请重新加载后再编辑。':message.includes('FORBIDDEN')?'你没有权限修改这份资料。':message.includes('NOT_FOUND')?'资料已移除，请重新加载。':'暂时没有保存成功，请重试。';}
export function makeLibraryManagement(d:Dependencies){
 async function run<T>(fn:(user:VerifiedUser)=>Promise<T>):Promise<Result<T>>{try{return {ok:true,data:await fn(await d.getUser())};}catch(e){return {ok:false,message:e instanceof z.ZodError?'请检查输入内容；标题最长 100 字、正文最长 20000 字，标签最多 20 个且每个最长 32 字。':managementError(e)};}}
 return {
  list:()=>run(user=>d.list(user.id)),
  favorite:(input:unknown)=>run(async user=>{const v=z.object({ids:z.array(z.uuid()).min(1).max(100),favorite:z.boolean()}).parse(input);await d.favorite([...new Set(v.ids)],v.favorite,user.id);return v;}),
  tags:(input:unknown)=>run(async user=>{const v=z.object({id:z.uuid(),tags:z.array(z.string().trim().min(1).max(32)).max(20)}).parse(input);return {id:v.id,tags:await d.tags(v.id,[...new Set(v.tags)],user.id)};}),
  save:(input:unknown)=>run(async user=>{const v=snippetSchema.parse(input);if(!v.id&&v.revision!==-1)throw Error('CONFLICT');return d.save({...v,id:v.id??d.id()},user.id);}),
  archive:(input:unknown)=>run(async user=>{const v=z.object({id:z.uuid(),archived:z.boolean(),revision:z.number().int().min(0)}).parse(input);return d.archive(v.id,v.archived,v.revision,user.id);}),
  use:(input:unknown)=>run(async user=>{const v=z.object({id:z.uuid(),eventId:z.uuid()}).parse(input);return d.use(v.id,v.eventId,user.id);}),
 };
}
