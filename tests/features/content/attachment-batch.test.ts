import {createClient} from '@supabase/supabase-js';
import {describe,expect,it} from 'vitest';
import {createContentRepository} from '@/features/content/repository';
const row=(id:string,contentId='content-a',archivedAt:string|null=null)=>({id,content_id:contentId,storage_path:`${contentId}/${id}.png`,file_name:`${id}.png`,mime_type:'image/png',byte_size:'2048',uploader_id:'author',archived_at:archivedAt,created_at:'2026-10-25T00:00:00Z'});
function transport(rows:ReturnType<typeof row>[],failAfter=Infinity){
 const requests:URL[]=[];
 const client=createClient('https://isolated-library.invalid','local-test-only',{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async(input)=>{
  const url=new URL(String(input));requests.push(url);
  if(requests.length>failAfter)return new Response(JSON.stringify({message:'offline'}),{status:400});
  if(url.pathname!=='/rest/v1/content_attachments')throw Error('Unexpected test destination');
  const ids=(url.searchParams.get('content_id')??'').slice(4,-1).split(',').map(id=>id.replaceAll('"',''));
  const activeOnly=url.searchParams.get('archived_at')==='is.null';
  const selected=rows.filter(r=>ids.includes(r.content_id)&&(!activeOnly||r.archived_at===null));
  if(url.searchParams.get('order')==='created_at.asc,id.asc')selected.sort((a,b)=>a.created_at.localeCompare(b.created_at)||a.id.localeCompare(b.id));
  const offset=Number(url.searchParams.get('offset')??0);
  const limit=Math.min(100,Number(url.searchParams.get('limit')??100));
  return new Response(JSON.stringify(selected.slice(offset,offset+limit)),{headers:{'content-type':'application/json'}});
 }}});
 return {repository:createContentRepository(client),requests};
}
describe('batch current attachment reads',()=>{
 it('reads 43 contents in one request and excludes removed or unrelated files',async()=>{
  const ids=Array.from({length:43},(_,i)=>`content-${i}`);
  const {repository,requests}=transport([row('first','content-0'),row('last','content-42'),row('removed','content-0','2026-10-25'),row('unrelated','other')]);
  const files=await repository.listAttachmentsForContents(ids);
  expect(files.map(f=>f.id)).toEqual(['first','last']);expect(files[0].byteSize).toBe(2048);
  expect(requests).toHaveLength(1);
 });
 it('keeps all 205 files beyond the response row limit in stable order',async()=>{
  const rows=Array.from({length:205},(_,i)=>row(`file-${String(i).padStart(3,'0')}`)).reverse();
  const {repository,requests}=transport(rows);
  const files=await repository.listAttachmentsForContents(['content-a']);
  expect(files).toHaveLength(205);expect(new Set(files.map(f=>f.id)).size).toBe(205);
  expect(files[0].id).toBe('file-000');expect(files[204].id).toBe('file-204');
  expect(requests).toHaveLength(3);
 });
 it('returns no files without issuing an unrestricted empty-ID request',async()=>{const {repository,requests}=transport([row('private')]);expect(await repository.listAttachmentsForContents([])).toEqual([]);expect(requests).toHaveLength(0);});
 it('fails the whole read when a later page fails instead of silently dropping files',async()=>{const {repository}=transport(Array.from({length:101},(_,i)=>row(String(i))),1);await expect(repository.listAttachmentsForContents(['content-a'])).rejects.toThrow('CONTENT_DATABASE_ERROR:offline');});
 it('bounds long content ID lists without losing the last group',async()=>{const ids=Array.from({length:240},(_,i)=>`22222222-2222-4222-8222-${String(i).padStart(12,'0')}`);const {repository,requests}=transport([row('first',ids[0]),row('last',ids[239])]);const files=await repository.listAttachmentsForContents(ids);expect(files.map(f=>f.id)).toEqual(['first','last']);expect(requests.every(u=>u.toString().length<8000)).toBe(true);});
});
