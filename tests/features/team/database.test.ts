import {beforeAll,afterAll,expect,it} from 'vitest';
import {PGlite} from '@electric-sql/pglite';
import {readFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
let db:PGlite;
beforeAll(async()=>{db=new PGlite();await db.exec("create role anon;create role authenticated;create role service_role;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);");for(const p of (await readdir(resolve('supabase/migrations'))).filter(p=>p.endsWith('.sql')).sort())await db.exec(await readFile(resolve('supabase/migrations',p),'utf8'));for(const [id,role]of [['admin-a','admin'],['admin-b','admin'],['employee','employee']])await db.query("insert into profiles(clerk_user_id,role,display_name,slack_team_id,slack_verified_at)values($1,$2,$1,'T094DTFCVA8',now())",[id,role]);},20000);
afterAll(async()=>{await db?.close();});
const manage=async(actor:string,op:string,input:unknown)=>(await db.query<{result:Record<string,unknown>}>('select public.team_manage($1,$2,$3::jsonb) as result',[actor,op,JSON.stringify(input)])).rows[0].result;
it('maps old roles, denies employees management, and protects the last two approvers',async()=>{
 const rows=await db.query<{clerk_user_id:string;team_role_id:string}>('select clerk_user_id,team_role_id from profiles order by clerk_user_id');expect(rows.rows.map(r=>r.team_role_id)).toEqual(['admin','admin','editor']);
 await expect(manage('employee','set_role',{id:'employee',roleId:'admin',revision:0})).rejects.toThrow('TEAM_FORBIDDEN');
 await expect(manage('admin-a','set_status',{id:'admin-b',status:'suspended',revision:0})).rejects.toThrow('TEAM_APPROVERS_REQUIRED');
});
it('persists role edits and rejects stale writes; login metadata cannot overwrite the managed role',async()=>{
 await manage('admin-a','set_role',{id:'employee',roleId:'analyst',revision:0});
 await expect(manage('admin-b','set_role',{id:'employee',roleId:'editor',revision:0})).rejects.toThrow('TEAM_CONFLICT');
 await db.query("update profiles set role='admin' where clerk_user_id='employee'");
 const row=(await db.query<{role:string;team_role_id:string}>("select role,team_role_id from profiles where clerk_user_id='employee'")).rows[0];expect(row).toEqual({role:'employee',team_role_id:'analyst'});
});
it('creates custom roles, protects referenced roles, and keeps a transactional audit trail',async()=>{
 const role=await manage('admin-a','save_role',{id:'custom-research',name:'研究',description:'只看报表',permissions:['reports.view'],revision:-1,color:'#397a86'});
 expect(role.id).toBe('custom-research');
 await manage('admin-a','set_role',{id:'employee',roleId:'custom-research',revision:1});
 await expect(manage('admin-a','delete_role',{id:'custom-research',revision:0})).rejects.toThrow('TEAM_ROLE_IN_USE');
 const count=await db.query<{n:number}>("select count(*)::int n from team_audit_events where action='set_role'");expect(count.rows[0].n).toBe(2);
});
it('suspends an existing user and makes permission checks reject the old role',async()=>{
 await manage('admin-a','set_status',{id:'employee',status:'suspended',revision:2});
 const row=await db.query<{allowed:boolean}>("select public.team_has_permission('employee','reports.view') allowed");expect(row.rows[0].allowed).toBe(false);
});
it('rejects disabling the last management role and direct business RPC calls by a revoked user',async()=>{
 const permissions=(await db.query<{permissions:string[]}>("select permissions from team_roles where id='admin'")).rows[0].permissions;
 await expect(manage('admin-a','save_role',{id:'admin',name:'管理员',description:'管理员',color:'#3769a0',permissions:permissions.filter(p=>p!=='team.manage'),revision:0})).rejects.toThrow('TEAM_MANAGER_REQUIRED');
 await expect(db.query("select approve_content_version('22222222-2222-4222-8222-222222222222',1,'employee')")).rejects.toThrow('TEAM_FORBIDDEN');
});
it('does not accept invitations for another email or after expiry',async()=>{
 const invite=await manage('admin-a','create_invite',{name:'新成员',email:'join@example.test',roleId:'analyst'});
 await manage('admin-a','invite_delivery',{id:invite.id,revision:0,sent:true,deliveryId:'test-mail'});
 await db.query("insert into profiles(clerk_user_id,display_name,slack_team_id,slack_verified_at) values('new-join','新成员','T094DTFCVA8',now())");
 await db.query("select team_accept_invites('new-join','other@example.test')");
 expect((await db.query<{team_role_id:string}>("select team_role_id from profiles where clerk_user_id='new-join'")).rows[0].team_role_id).toBe('editor');
 await db.query("update team_invites set expires_at=now()-interval '1 hour' where id=$1",[invite.id]);
 await db.query("select team_accept_invites('new-join','join@example.test')");
 expect((await db.query<{status:string}>("select status from team_invites where id=$1",[invite.id])).rows[0].status).toBe('pending');
 await db.query("update team_invites set expires_at=now()+interval '1 hour' where id=$1",[invite.id]);
 await db.query("select team_accept_invites('new-join','join@example.test')");
 expect((await db.query<{team_role_id:string}>("select team_role_id from profiles where clerk_user_id='new-join'")).rows[0].team_role_id).toBe('analyst');
});
it('returns the full roster, permission cards and real audit trail as a single snapshot',async()=>{
 const data=(await db.query<{result:{roles:unknown[];members:unknown[];events:unknown[]}}>("select team_snapshot('admin-a') result")).rows[0].result;
 expect(data.roles.length).toBeGreaterThanOrEqual(7);expect(data.members.length).toBeGreaterThanOrEqual(3);expect(data.events.length).toBeGreaterThan(0);
});
it('lets a newly assigned reviewer approve while retaining two independent approvals and rejecting self-review',async()=>{
 await db.query("insert into profiles(clerk_user_id,display_name,slack_team_id,slack_verified_at)values('manager-writer','主管','T094DTFCVA8',now())");
 await manage('admin-a','set_role',{id:'manager-writer',roleId:'manager',revision:0});
 await db.query("insert into platforms(id,name,color)values('11111111-1111-4111-8111-111111111111','测试平台','#397a86')");
 await db.query("select create_scheduled_content('33333333-3333-4333-8333-333333333333','审核规则验收','manager-writer','manager-writer',now()+interval '1 day',array['11111111-1111-4111-8111-111111111111'::uuid])");
 await db.query("select submit_content_for_review('33333333-3333-4333-8333-333333333333','manager-writer','[]'::jsonb,null)");
 await expect(db.query("select approve_content_version('33333333-3333-4333-8333-333333333333',1,'manager-writer')")).rejects.toThrow('CONTENT_AUTHOR_CANNOT_REVIEW');
 await db.query("select approve_content_version('33333333-3333-4333-8333-333333333333',1,'admin-a')");
 expect((await db.query<{status:string}>("select status from contents where id='33333333-3333-4333-8333-333333333333'")).rows[0].status).toBe('in_review');
 await db.query("select approve_content_version('33333333-3333-4333-8333-333333333333',1,'admin-b')");
 expect((await db.query<{status:string}>("select status from contents where id='33333333-3333-4333-8333-333333333333'")).rows[0].status).toBe('approved');
});
it('does not let a manager grant owner to someone else and fixes the first explicitly claimed owner',async()=>{
 await expect(manage('admin-a','set_role',{id:'admin-b',roleId:'owner',revision:0})).rejects.toThrow('TEAM_CANNOT_GRANT');
 await manage('admin-a','set_role',{id:'admin-a',roleId:'owner',revision:0});
 await expect(manage('admin-b','set_status',{id:'admin-a',status:'suspended',revision:1})).rejects.toThrow('TEAM_OWNER_FIXED');
});
it('keeps invitation addresses private from history-only roles and denies public data/API access',async()=>{
 const snapshot=(await db.query<{data:{members:{email:string|null}[];invites:unknown[];events:{details:Record<string,unknown>}[]}}>("select team_snapshot('new-join') data")).rows[0].data;
 expect(snapshot.invites).toEqual([]);expect(snapshot.members.every(m=>m.email===null)).toBe(true);expect(snapshot.events.every(e=>!('email'in e.details))).toBe(true);
 const rights=(await db.query<{readable:boolean;callable:boolean}>("select has_table_privilege('anon','public.team_roles','select') readable,has_function_privilege('authenticated','public.team_manage(text,text,jsonb)','execute') callable")).rows[0];expect(rights).toEqual({readable:false,callable:false});
});
