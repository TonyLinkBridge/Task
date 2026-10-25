import 'server-only';
import {getSupabaseAdmin} from '@/lib/supabase/admin';
import type {PersonalProfile,ProfilePatch} from './profile-types';
export const profileRepository={
 async load(actor:string):Promise<PersonalProfile>{const{data,error}=await getSupabaseAdmin().rpc('personal_profile',{p_actor_id:actor});if(error||!data)throw Error(error?.message??'PROFILE_UNAVAILABLE');return data as PersonalProfile;},
 async save(actor:string,patch:ProfilePatch,revision:number):Promise<PersonalProfile>{const{data,error}=await getSupabaseAdmin().rpc('save_personal_profile',{p_actor_id:actor,p_patch:patch,p_revision:revision});if(error||!data)throw Error(error?.message??'PROFILE_UNAVAILABLE');return data as PersonalProfile;},
};
