import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMarketingTestClient} from './runtime/local-database.mjs';
test('local RPC adapter preserves all setof rows and an empty set as an array',async()=>{
 const {client,db,close}=await createMarketingTestClient();
 try{
  await db.exec('create function public.test_setof_rows(p_size integer) returns setof integer language sql as $$select generate_series(1,p_size)$$');
  assert.deepEqual((await client.rpc('test_setof_rows',{p_size:2})).data,[{test_setof_rows:1},{test_setof_rows:2}]);
  assert.deepEqual((await client.rpc('test_setof_rows',{p_size:0})).data,[]);
 }finally{await close();}
});
