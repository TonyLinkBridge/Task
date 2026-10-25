import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMarketingTestClient } from './runtime/local-database.mjs';
test('library assets reuse into independent content attachments, lock reviews and preserve historical files',async()=>{
 const {client,db,close}=await createMarketingTestClient();
 const asset='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',a='22222222-2222-4222-8222-222222222222',b='33333333-3333-4333-8333-333333333333';
 try{
  const put=await client.from('media_assets').insert({id:asset,storage_path:'library/marketing_employee/source.png',file_name:'source.png',mime_type:'image/png',byte_size:16,uploader_id:'marketing_employee'});assert.equal(put.error,null);
  for(const id of [a,b])assert.equal((await client.rpc('create_scheduled_content',{p_id:id,p_title:'素材复用'+id,p_author_id:'marketing_employee',p_assignee_id:'marketing_employee',p_publish_at:'2026-11-01T00:00:00Z',p_platform_ids:['11111111-1111-4111-8111-111111111111']})).error,null);
  const attach=(id,actor='marketing_employee')=>client.rpc('attach_media_asset',{p_asset_id:asset,p_content_id:id,p_storage_path:id+'/copy.png',p_actor_id:actor});
  const first=await attach(a);assert.equal(first.error,null);assert.equal(first.data.source_asset_id,asset);
  const again=await attach(a);assert.equal(again.data.id,first.data.id);
  const second=await attach(b);assert.equal(second.error,null);assert.notEqual(first.data.storage_path,second.data.storage_path);
  assert.equal((await client.rpc('submit_content_for_review',{p_content_id:a,p_actor_id:'marketing_employee',p_blocknote_json:[],p_requested_reviewer_id:null})).error,null);
  assert.ok((await attach(a)).error,'review cannot change attachments');
  await client.from('media_assets').update({archived_at:new Date().toISOString()}).eq('id',asset);
  const snapshot=await client.from('content_versions').select('attachments:content_version_attachments(attachment:content_attachments(*))').eq('content_id',a).single();
  assert.equal(snapshot.data.attachments[0].attachment.id,first.data.id);
  assert.equal((await client.from('content_attachments').select('*').eq('id',second.data.id).single()).error,null);
  assert.equal((await client.from('media_asset_usage').select('*').eq('asset_id',asset).single()).data.use_count,2);
  await db.query('update contents set archived_at=now() where id=$1',[b]);
  assert.equal((await client.from('media_asset_usage').select('*').eq('asset_id',asset).single()).data.use_count,1);
  const grants=await db.query("select has_function_privilege('anon','attach_media_asset(uuid,uuid,text,text)','execute') as anon, has_function_privilege('authenticated','attach_media_asset(uuid,uuid,text,text)','execute') as signed, has_function_privilege('service_role','attach_media_asset(uuid,uuid,text,text)','execute') as service");
  assert.deepEqual(grants.rows[0],{anon:false,signed:false,service:true});
 }finally{await close();}
});
