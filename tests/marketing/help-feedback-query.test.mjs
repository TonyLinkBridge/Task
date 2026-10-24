import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMarketingTestClient} from './runtime/local-database.mjs';
test('isolated help feedback saves and updates one response per article and user',async()=>{
 const {client,close}=await createMarketingTestClient();
 try{
  const input={article_slug:'内容排期/建立内容',clerk_user_id:'marketing_employee',helpful:true,comment:null};
  const first=await client.from('help_article_feedback').upsert(input,{onConflict:'article_slug,clerk_user_id'});assert.equal(first.error,null);
  const second=await client.from('help_article_feedback').upsert({...input,helpful:false,comment:'补充一个例子'},{onConflict:'article_slug,clerk_user_id'});assert.equal(second.error,null);
  const rows=await client.from('help_article_feedback').select('*');assert.equal(rows.data.length,1);assert.equal(rows.data[0].helpful,false);assert.equal(rows.data[0].comment,'补充一个例子');
  const bad=await client.from('help_article_feedback').upsert(input,{onConflict:'article_slug);drop table profiles;--'});assert.match(bad.error.message,/INVALID_IDENTIFIER/);
  const profiles=await client.from('profiles').select('*');assert.equal(profiles.error,null);assert.equal(profiles.data.length,3);
 }finally{await close();}
});
