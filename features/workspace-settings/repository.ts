import 'server-only';
import {getSupabaseAdmin} from '@/lib/supabase/admin';
import type {WorkspacePreferences} from './types';
type Row={name:string;description:string;week_starts_on:0|1;revision:number};
const map=(r:Row):WorkspacePreferences=>({name:r.name,description:r.description,weekStartsOn:r.week_starts_on,revision:r.revision});
export const workspaceRepository={async load(){const {data,error}=await getSupabaseAdmin().from('workspace_preferences').select('name,description,week_starts_on,revision').eq('id',true).single();if(error||!data)throw Error(error?.message??'WORKSPACE_UNAVAILABLE');return map(data as Row);},async save(v:WorkspacePreferences,actor:string){const {data,error}=await getSupabaseAdmin().rpc('save_workspace_preferences',{p_name:v.name,p_description:v.description,p_week_starts_on:v.weekStartsOn,p_revision:v.revision,p_actor_id:actor});if(error||!data)throw Error(error?.message??'WORKSPACE_UNAVAILABLE');return map(data as Row);}};
