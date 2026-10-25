import {PGlite} from '@electric-sql/pglite';
import {expect,it} from 'vitest';
import {createContentRepository} from '@/features/content/repository';
import {createMarketingTestClient} from '../../marketing/runtime/local-database.mjs';
it('reads all pages from PostgreSQL without including removed files or another content',async()=>{
 const db=new PGlite();
 const runtime=await createMarketingTestClient({existingDatabase:db} as never);
 try{
  await db.exec(`create table content_attachments(id text primary key,content_id text,storage_path text,file_name text,mime_type text,byte_size bigint,uploader_id text,created_at timestamptz,archived_at timestamptz);
   insert into content_attachments select 'file-'||lpad(i::text,3,'0'),'visible','visible/'||i||'.png',i||'.png','image/png',2048,'author','2026-10-25'::timestamptz,null from generate_series(0,204) i;
   insert into content_attachments values('removed','visible','removed.png','removed.png','image/png',1,'author','2026-10-25','2026-10-25'),('private','other','private.png','private.png','image/png',1,'author','2026-10-25',null);`);
  const repository=createContentRepository(runtime.client as never);
  const files=await repository.listAttachmentsForContents(['visible']);
  expect(files).toHaveLength(205);
  expect(files[0].id).toBe('file-000');expect(files[204].id).toBe('file-204');
  expect(files.every(f=>f.contentId==='visible'&&f.byteSize===2048)).toBe(true);
 }finally{await runtime.close();}
},20000);
