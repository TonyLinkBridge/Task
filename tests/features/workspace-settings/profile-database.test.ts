import {beforeAll,afterAll,expect,it} from 'vitest';
import {PGlite} from '@electric-sql/pglite';
import {readFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
let db:PGlite;
beforeAll(async()=>{
 db=new PGlite();
 await db.exec("create role anon;create role authenticated;create role service_role;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);");
 for(const name of (await readdir(resolve('supabase/migrations'))).filter(x=>x.endsWith('.sql')).sort())await db.exec(await readFile(resolve('supabase/migrations',name),'utf8'));
 for(const id of ['person','other'])await db.query("insert into profiles(clerk_user_id,role,display_name,avatar_url,slack_team_id,slack_verified_at) values($1,'employee',$1,'https://example.test/photo.png','T094DTFCVA8',now())",[id]);
},20000);
afterAll(async()=>{await db?.close();});
const save=async(patch:unknown,revision:number,actor='person')=>(await db.query<{data:Record<string,unknown>}>('select public.save_personal_profile($1,$2::jsonb,$3) data',[actor,JSON.stringify(patch),revision])).rows[0].data;
it('saves only personal presentation and keeps it through identity refresh',async()=>{
 const data=await save({name:'工作台姓名',title:'内容编辑',avatarMode:'initials'},0);
 expect(data).toMatchObject({name:'工作台姓名',title:'内容编辑',avatarMode:'initials',revision:1,roleId:'editor'});
 await db.query("update profiles set display_name='Slack 姓名',avatar_url='https://example.test/refreshed.png',role='admin' where clerk_user_id='person'");
 const row=(await db.query<{display_name:string;avatar_url:null;role:string;team_role_id:string}>("select display_name,avatar_url,role,team_role_id from profiles where clerk_user_id='person'")).rows[0];
 expect(row).toEqual({display_name:'工作台姓名',avatar_url:null,role:'employee',team_role_id:'editor'});
 const restored=await save({avatarMode:'photo'},1);
 expect(restored.photoUrl).toBe('https://example.test/refreshed.png');
 expect((await db.query<{data:{name:string;imageUrl:string}}>("select public.team_user_access('person') data")).rows[0].data).toMatchObject({name:'工作台姓名',imageUrl:'https://example.test/refreshed.png'});
});
it('rejects extra authority fields, stale edits and malformed input without changing another person',async()=>{
 await expect(save({roleId:'admin',name:'Hack'},2)).rejects.toThrow('PROFILE_INVALID');
 await expect(save({email:'new@example.test'},2)).rejects.toThrow('PROFILE_INVALID');
 await expect(save({targetId:'other',name:'Hack'},2)).rejects.toThrow('PROFILE_INVALID');
 await expect(save({name:'Wrong'},0)).rejects.toThrow('PROFILE_CONFLICT');
 await expect(save({name:' '},2)).rejects.toThrow('PROFILE_INVALID');
 expect((await db.query<{display_name:string}>("select display_name from profiles where clerk_user_id='other'")).rows[0].display_name).toBe('other');
});
it('denies inactive and missing users, and exposes no public profile mutation API',async()=>{
 await db.query("update profiles set team_status='suspended' where clerk_user_id='other'");
 await expect(save({title:'No'},0,'other')).rejects.toThrow('TEAM_FORBIDDEN');
 await expect(save({title:'No'},0,'missing')).rejects.toThrow('TEAM_FORBIDDEN');
 const grant=(await db.query<{allowed:boolean}>("select has_function_privilege('anon','public.save_personal_profile(text,jsonb,integer)','execute') allowed")).rows[0];
 expect(grant.allowed).toBe(false);
 expect((await db.query<{count:number}>("select count(*)::integer count from team_audit_events where action='update_profile'")).rows[0].count).toBe(2);
});
