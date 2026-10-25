import 'server-only';
import type {SupabaseClient} from '@supabase/supabase-js';
import {getSupabaseAdmin} from '@/lib/supabase/admin';
import type {VerifiedUser} from '@/lib/auth/types';
import type {TeamSnapshot} from './types';
export function createTeamRepository(provided?:SupabaseClient){
 const db=()=>provided??getSupabaseAdmin();
 async function rpc(name:string,args:Record<string,unknown>){const{data,error}=await db().rpc(name,args);if(error)throw Error(error.message);return data;}
 return {
  snapshot:(actor:string)=>rpc('team_snapshot',{p_actor_id:actor}) as Promise<TeamSnapshot>,
  mutate:(actor:string,op:string,input:unknown)=>rpc('team_manage',{p_actor_id:actor,p_operation:op,p_input:input}) as Promise<Record<string,unknown>>,
  async hydrate(user:VerifiedUser,verifiedEmail?:string){
   if(verifiedEmail)await rpc('team_accept_invites',{p_user_id:user.id,p_verified_email:verifiedEmail});
   const access=await rpc('team_user_access',{p_user_id:user.id}) as Partial<VerifiedUser>|null;
   if(!access||!Array.isArray(access.permissions)||access.teamStatus!=='active')throw Error('TEAM_ACCESS_DENIED');
   return {...user,...access} as VerifiedUser;
  },
 };
}
export const teamRepository=createTeamRepository();
