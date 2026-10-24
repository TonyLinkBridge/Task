import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMarketingTestClient } from './runtime/local-database.mjs';

test('existing SQL requires two different admins and preserves submitted attachment versions',async()=>{
 const {client,close}=await createMarketingTestClient();
 const id='22222222-2222-4222-8222-222222222222';
 const platform='11111111-1111-4111-8111-111111111111';
 try {
  const profile={clerk_user_id:'marketing_real_login_test',role:'employee',display_name:'登录资料第一次',avatar_url:null,slack_team_id:'T094DTFCVA8',slack_verified_at:'2026-10-24T00:00:00Z'};
  assert.equal((await client.from('profiles').upsert(profile,{onConflict:'clerk_user_id'})).error,null);
  assert.equal((await client.from('profiles').upsert({...profile,display_name:'登录资料已更新'},{onConflict:'clerk_user_id'})).error,null);
  const synced=await client.from('profiles').select('*').eq('clerk_user_id',profile.clerk_user_id).single();
  assert.equal(synced.data.display_name,'登录资料已更新');
  let result=await client.rpc('create_scheduled_content',{p_id:id,p_title:'隔离集成验证',p_author_id:'marketing_employee',p_assignee_id:'marketing_employee',p_publish_at:'2026-10-25T04:00:00Z',p_platform_ids:[platform]});
  assert.equal(result.error,null);assert.equal(result.data.required_approvals,2);assert.equal(result.data.status,'draft');
  result=await client.rpc('save_content_attachment',{p_content_id:id,p_storage_path:`${id}/sample.png`,p_file_name:'sample.png',p_mime_type:'image/png',p_byte_size:32,p_uploader_id:'marketing_employee'});
  assert.equal(result.error,null);
  result=await client.rpc('submit_content_for_review',{p_content_id:id,p_actor_id:'marketing_employee',p_blocknote_json:[{type:'paragraph',content:'第一段'},{type:'paragraph',content:'第二段'}],p_requested_reviewer_id:null});
  assert.equal(result.error,null);assert.equal(result.data.status,'in_review');assert.equal(result.data.current_version,1);
  result=await client.rpc('approve_content_version',{p_content_id:id,p_version:1,p_admin_id:'marketing_employee'});assert.ok(result.error);
  result=await client.rpc('approve_content_version',{p_content_id:id,p_version:1,p_admin_id:'marketing_admin_a'});assert.equal(result.error,null);assert.equal(result.data.status,'in_review');
  await client.rpc('approve_content_version',{p_content_id:id,p_version:1,p_admin_id:'marketing_admin_a'});
  const halfway=await client.from('contents').select('*').eq('id',id).single();assert.equal(halfway.data.status,'in_review');
  result=await client.rpc('approve_content_version',{p_content_id:id,p_version:1,p_admin_id:'marketing_admin_b'});assert.equal(result.error,null);assert.equal(result.data.status,'approved');
  const snapshot=await client.from('content_versions').select('attachments:content_version_attachments(attachment:content_attachments(*))').eq('content_id',id).eq('version',1).single();
  assert.equal(snapshot.data.attachments[0].attachment.file_name,'sample.png');
  assert.equal(snapshot.data.blocknote_json.length,2);
 } finally {await close();}
});
