import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMarketingTestClient} from './runtime/local-database.mjs';
test('local isolated storage supports real copied bytes and independent removal',async()=>{
 const {client,upload,download,close}=await createMarketingTestClient();
 try{const storage=client.storage.from('content-files'),source='library/marketing_employee/source.png',copy='22222222-2222-4222-8222-222222222222/copy.png';
 const signed=await storage.createSignedUploadUrl(source);assert.match(signed.data.signedUrl,/^\/marketing-test\/upload\?token=/);
 await upload(signed.data.token,Buffer.from('actual bytes'),'image/png');assert.equal((await storage.copy(source,copy)).error,null);
 await storage.remove([source]);assert.equal((await storage.info(source)).data,null);assert.equal((await storage.info(copy)).data.size,12);
 const get=await storage.createSignedUrl(copy,60);const f=await download(new URL(get.data.signedUrl,'http://local').searchParams.get('token'));assert.equal(f.body.toString(),'actual bytes');assert.equal(f.contentType,'image/png');
 }finally{await close();}
});
