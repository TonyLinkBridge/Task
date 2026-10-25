import {z} from 'zod';
import type {VerifiedUser} from '@/lib/auth/types';
import {managementError} from '@/features/library-management/service';
import type {Result} from '@/features/library-management/types';
import type {WorkspacePreferences} from './types';
export const workspaceSchema=z.object({name:z.string().trim().min(1).max(24),description:z.string().trim().max(40),weekStartsOn:z.union([z.literal(0),z.literal(1)]),revision:z.number().int().min(0)});
export function makeWorkspaceSettings(d:{getUser():Promise<VerifiedUser>;load():Promise<WorkspacePreferences>;save(v:WorkspacePreferences,actor:string):Promise<WorkspacePreferences>}){
 return {async load(){await d.getUser();return d.load();},async save(input:unknown):Promise<Result<WorkspacePreferences>>{try{const u=await d.getUser();if(u.role!=='admin')throw Error('FORBIDDEN');const value=workspaceSchema.parse(input);return {ok:true,data:await d.save(value,u.id)};}catch(e){return {ok:false,message:e instanceof z.ZodError?'名称最多 24 字，说明最多 40 字，请检查输入。':managementError(e)};}}};
}
