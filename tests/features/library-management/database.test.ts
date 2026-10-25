import {expect,it} from 'vitest';
import {randomUUID} from 'node:crypto';
import {createMarketingTestClient} from '@/tests/marketing/runtime/local-database.mjs';
it('enforces ownership, private favorites, resource revision conflicts, idempotent usage and admin-only workspace changes',async()=>{
 const r=await createMarketingTestClient();const db=r.db;
 const asset=randomUUID(),otherAsset=randomUUID(),snippet=randomUUID(),event=randomUUID();
 try{
  await db.query("insert into media_assets(id,storage_path,file_name,mime_type,byte_size,uploader_id) values($1,'test/source.png','source.png','image/png',10,'marketing_employee')",[asset]);
  await expect(db.query("select * from set_media_asset_tags($1,array['封面'],'marketing_admin_a')",[asset])).resolves.toBeTruthy();
  await expect(db.query("select * from set_media_asset_tags($1,array['bad'],'marketing_admin_b_missing')",[asset])).rejects.toThrow('FORBIDDEN');
  await db.query("select set_media_favorites(array[$1::uuid],'marketing_employee',true)",[asset]);
  await db.query("select set_media_favorites(array[$1::uuid],'marketing_admin_a',true)",[asset]);
  await db.query("select set_media_favorites(array[$1::uuid],'marketing_employee',false)",[asset]);
  expect((await db.query('select user_id from media_asset_favorites')).rows).toEqual([{user_id:'marketing_admin_a'}]);
  await expect(db.query("select * from save_library_snippet($1,'template','空版本','正文',null,'marketing_employee')",[snippet])).rejects.toThrow('CONFLICT');
  await db.query("select * from save_library_snippet($1,'template','晨报模板','第一段\n\n第二段',-1,'marketing_employee')",[snippet]);
  await db.query("select * from save_library_snippet($1,'template','修改后的模板','新正文',0,'marketing_admin_a')",[snippet]);
  await expect(db.query("select * from save_library_snippet($1,'template','过期编辑','过期内容',0,'marketing_employee')",[snippet])).rejects.toThrow('CONFLICT');
  for(let i=0;i<2;i++)await db.query("select record_library_snippet_use($1,$2,'marketing_employee')",[snippet,event]);
  expect((await db.query('select use_count from library_snippets where id=$1',[snippet])).rows[0].use_count).toBe(1);
  await expect(db.query("select * from save_workspace_preferences('被员工修改','x',0,0,'marketing_employee')")).rejects.toThrow('FORBIDDEN');
  await db.query("select * from save_workspace_preferences('测试团队','内部工具',0,0,'marketing_admin_a')");
  await expect(db.query("select * from save_workspace_preferences('覆盖同事','x',1,0,'marketing_admin_b')")).rejects.toThrow('CONFLICT');
  expect((await db.query('select name,week_starts_on from workspace_preferences')).rows[0]).toEqual({name:'测试团队',week_starts_on:0});
  await db.query("insert into media_assets(id,storage_path,file_name,mime_type,byte_size,uploader_id) values($1,'test/admin.png','admin.png','image/png',10,'marketing_admin_a')",[otherAsset]);
  await expect(db.query("select * from set_media_asset_tags($1,array['bad'],'marketing_employee')",[otherAsset])).rejects.toThrow('FORBIDDEN');
  await expect(db.query("select * from archive_media_assets($1::uuid[],true,'marketing_employee')",[[asset,otherAsset]])).rejects.toThrow('FORBIDDEN');
  expect((await db.query('select archived_at from media_assets where id=$1',[asset])).rows[0].archived_at).toBe(null);
  const permissions=await db.query("select relname,relrowsecurity from pg_class where relname in ('media_asset_favorites','library_snippets','library_snippet_uses','workspace_preferences')");
  expect(permissions.rows).toHaveLength(4);expect(permissions.rows.every((p:{relrowsecurity:boolean})=>p.relrowsecurity)).toBe(true);
  expect((await db.query("select has_function_privilege('authenticated','public.save_workspace_preferences(text,text,integer,integer,text)','execute') allowed")).rows[0].allowed).toBe(false);
 }finally{await r.close();}
},20000);
