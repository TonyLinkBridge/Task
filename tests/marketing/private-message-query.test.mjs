import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMarketingTestClient} from './runtime/local-database.mjs';
test('isolated private-message queries filter participants and retain sender names',async()=>{
 const {client,close}=await createMarketingTestClient();
 try{
  const select='*, sender:profiles!private_messages_sender_id_fkey(display_name), recipient:profiles!private_messages_recipient_id_fkey(display_name)';
  await client.from('private_messages').insert({sender_id:'marketing_employee',recipient_id:'marketing_admin_a',body:'UI fixture'});
  await client.from('private_messages').insert({sender_id:'marketing_admin_a',recipient_id:'marketing_admin_b',body:'Unrelated fixture'});
  const list=await client.from('private_messages').select(select).or('sender_id.eq.marketing_employee,recipient_id.eq.marketing_employee');
  assert.equal(list.error,null);assert.equal(list.data.length,1);assert.equal(list.data[0].sender.display_name,'测试员工');assert.equal(list.data[0].recipient.display_name,'测试管理员 A');
  const absent=await client.from('private_messages').select('*').or("sender_id.eq.' OR 1=1 --,recipient_id.eq.' OR 1=1 --");assert.equal(absent.error,null);assert.equal(absent.data.length,0);
 }finally{await close();}
});
