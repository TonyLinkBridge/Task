import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMarketingTestClient } from './runtime/local-database.mjs';
test('isolated query transport supports actual search and task assignee filters with bound values', async () => {
  const {client,close}=await createMarketingTestClient();
  try {
    const created=await client.rpc('create_scheduled_content',{p_id:'55555555-5555-4555-8555-555555555555',p_title:'真实搜索 SENTINEL',p_author_id:'marketing_employee',p_assignee_id:'marketing_employee',p_publish_at:'2026-11-01T00:00:00Z',p_platform_ids:['11111111-1111-4111-8111-111111111111']});
    assert.equal(created.error,null);
    const content=await client.from('contents').select('*').ilike('title','%sentinel%');
    assert.equal(content.error,null);assert.equal(content.data.length,1);
    const task=await client.from('tasks').select('*').or('title.ilike.%sentinel%,project.ilike.%sentinel%,description.ilike.%sentinel%').contains('assignee_ids',['marketing_employee']);
    assert.equal(task.error,null);assert.equal(task.data.length,1);
    const absent=await client.from('contents').select('*').ilike('title',"%'; drop table profiles; --%");
    assert.equal(absent.error,null);assert.equal(absent.data.length,0);
    const intact=await client.from('profiles').select('*');assert.equal(intact.data.length,3);
  }finally{await close();}
});
