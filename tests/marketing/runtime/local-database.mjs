// Test-only adapter. Runs the application's unchanged SQL locally; never connects to Supabase.
import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir, mkdir, writeFile, stat, rm, copyFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

export const identities = {
 marketing_employee:{id:'marketing_employee',role:'employee',name:'测试员工',imageUrl:null},
 marketing_admin_a:{id:'marketing_admin_a',role:'admin',name:'测试管理员 A',imageUrl:null},
 marketing_admin_b:{id:'marketing_admin_b',role:'admin',name:'测试管理员 B',imageUrl:null},
};
const identifier = value => {if(!/^[a-z_][a-z_0-9]*$/i.test(value)) throw Error('TEST_INVALID_IDENTIFIER');return `"${value}"`;};
const normalized = value => JSON.parse(JSON.stringify(value,(_,v)=>typeof v==='bigint'?String(v):v));

export async function createMarketingTestClient({directory,sourceRoot=process.cwd(),seedIdentities=true,existingDatabase}={}) {
 const db=existingDatabase??new PGlite(directory ? resolve(directory,'database') : undefined);
 if(!existingDatabase){
 await db.exec(`create role anon; create role authenticated; create role service_role;
 create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`);
 for(const name of (await readdir(resolve(sourceRoot,'supabase/migrations'))).filter(n=>n.endsWith('.sql')).sort()) {
  await db.exec(await readFile(resolve(sourceRoot,'supabase/migrations',name),'utf8'));
 }
 if(seedIdentities)for(const person of Object.values(identities)) await db.query(`insert into profiles(clerk_user_id,role,display_name,slack_team_id,slack_verified_at) values($1,$2,$3,'T094DTFCVA8',now())`,[person.id,person.role,person.name]);
 await db.query(`insert into platforms(id,name,color) values('11111111-1111-4111-8111-111111111111','Telegram','#00b5c8')`);
 }
 const uploads=new Map(),downloads=new Map(),files=new Map();
 const filesRoot=resolve(directory ?? '/tmp',directory?'files':`marketing-test-files-${randomUUID()}`);
 const pathFor=path=>{const result=resolve(filesRoot,path);if(!result.startsWith(filesRoot+'/'))throw Error('TEST_INVALID_PATH');return result;};
 async function enrich(table,rows,selection) {
  for(const row of rows) {
   for(const [alias,column] of [['admin','admin_id'],['actor','actor_id'],['author','author_id'],['assignee','assignee_id']]) {
    if(selection.includes(alias+':')&&row[column])row[alias]=(await db.query('select * from profiles where clerk_user_id=$1',[row[column]])).rows[0]??null;
   }
   if(table==='slack_deliveries'&&selection.includes('content:'))row.content=(await db.query('select title from contents where id=$1',[row.content_id])).rows[0]??null;
   if(table==='contents'&&selection.includes('platform_links:')) row.platform_links=(await db.query('select p.* from platforms p join content_platforms cp on cp.platform_id=p.id where cp.content_id=$1',[row.id])).rows.map(platform=>({platform}));
   if(table==='contents'&&selection.includes('approvals:')) row.approvals=(await db.query('select * from content_approvals where content_id=$1',[row.id])).rows;
   if(table==='content_versions'&&selection.includes('attachments:')) row.attachments=(await db.query('select a.* from content_attachments a join content_version_attachments v on v.attachment_id=a.id where v.content_version_id=$1',[row.id])).rows.map(attachment=>({attachment}));
   if(table==='content_attachments'&&selection.includes('content:'))row.content=(await db.query('select archived_at from contents where id=$1',[row.content_id])).rows[0]??null;
   if(table==='private_messages'&&selection.includes('sender:profiles')){row.sender=(await db.query('select display_name from profiles where clerk_user_id=$1',[row.sender_id])).rows[0]??{display_name:'成员'};row.recipient=(await db.query('select display_name from profiles where clerk_user_id=$1',[row.recipient_id])).rows[0]??{display_name:'成员'};}
   if(table==='tasks'&&selection.includes('task_comments(count)'))row.task_comments=[{count:Number((await db.query('select count(*) from task_comments where task_id=$1',[row.id])).rows[0].count)}];
  }
  return rows;
 }
 class Query {
  constructor(table){this.supportsHistoryContent=true;this.supportsEqualityOr=true;this.supportsCompositeUpsert=true;identifier(table);this.table=table;this.filters=[];this.orGroups=[];this.selection='*';this.sort=[];this.mode='select';}
  select(value='*'){this.selection=value;return this;}
  eq(column,value){this.filters.push([column,'=',value]);return this;}
  neq(column,value){this.filters.push([column,'<>',value]);return this;}
  is(column,value){if(value!==null)throw Error('TEST_UNSUPPORTED_FILTER');this.filters.push([column,'is',null]);return this;}
  in(column,value){this.filters.push([column,'in',value]);return this;}
  ilike(column,value){this.filters.push([column,' ilike ',value]);return this;}
  contains(column,value){this.filters.push([column,' @> ',value]);return this;}
  or(expression){this.orGroups.push(expression.split(',').map(term=>{const match=/^([a-z_][a-z_0-9]*)\.(ilike|eq)\.(.*)$/i.exec(term);if(!match)throw Error('TEST_UNSUPPORTED_OR_FILTER');return [match[1],match[2],match[3]];}));return this;}
  order(column,{ascending=true}={}){this.sort.push(identifier(column)+(ascending?' asc':' desc'));return this;}
  limit(value){this.count=Number(value);return this;}
  range(from,to){this.offset=Number(from);this.count=Number(to)-this.offset+1;return this;}
  insert(value){this.mode='insert';this.values=value;return this;}
  upsert(value,{onConflict}={}){this.mode='upsert';this.values=value;this.conflict=onConflict;return this;}
  update(value){this.mode='update';this.values=value;return this;}
  delete(){this.mode='delete';return this;}
  single(){this.one=true;this.required=true;return this;}
  maybeSingle(){this.one=true;return this;}
  then(ok,fail){return this.execute().then(ok,fail);}
  async execute(){try{
   const params=[];const bind=v=>{params.push(v);return '$'+params.length;};
   const clauses=this.filters.map(([col,op,value])=>{
    if(col==='content.archived_at'&&op==='is')return 'exists(select 1 from contents c where c.id=content_attachments.content_id and c.archived_at is null)';
    const key=identifier(col);
    if(op==='is')return key+' is null';
    if(op==='in')return value.length?key+' in ('+value.map(bind).join(',')+')':'false';
    return key+op+bind(value);
   });
   for(const group of this.orGroups)clauses.push('('+group.map(([column,operator,value])=>identifier(column)+(operator==='eq'?' = ':' ilike ')+bind(value)).join(' or ')+')');
   const where=clauses.length?' where '+clauses.join(' and '):'';
   const table=identifier(this.table);let sql;
   if(this.mode==='select')sql='select * from '+table+where+(this.sort.length?' order by '+this.sort.join(','):'')+(this.count?' limit '+this.count:'')+(this.offset?' offset '+this.offset:'');
   else if(this.mode==='insert'||this.mode==='upsert'){const columns=Object.keys(this.values);sql='insert into '+table+'('+columns.map(identifier).join(',')+') values('+columns.map(k=>bind(this.values[k])).join(',')+')';if(this.mode==='upsert'){if(!this.conflict)throw Error('TEST_UPSERT_CONFLICT_REQUIRED');const conflictColumns=this.conflict.split(',').map(k=>k.trim());const conflictSql=conflictColumns.map(identifier).join(',');const updatedColumns=columns.filter(k=>!conflictColumns.includes(k));sql+=' on conflict('+conflictSql+') '+(updatedColumns.length?'do update set '+updatedColumns.map(k=>identifier(k)+'=excluded.'+identifier(k)).join(','):'do nothing');}sql+=' returning *';}
   else if(this.mode==='update')sql='update '+table+' set '+Object.entries(this.values).map(([k,v])=>identifier(k)+'='+bind(v)).join(',')+where+' returning *';
   else sql='delete from '+table+where+' returning *';
   const rows=await enrich(this.table,(await db.query(sql,params)).rows,this.selection);
   if(this.one&&(rows.length>1||(this.required&&rows.length!==1)))throw Error('TEST_SINGLE_ROW_EXPECTED');
   return {data:normalized(this.one?(rows[0]??null):rows),error:null};
  }catch(e){return {data:null,error:{message:e.message}};}}
 }
 const storage={from(bucket){if(!['content-files','task-files'].includes(bucket))throw Error('TEST_INVALID_BUCKET');return {
  async createSignedUploadUrl(path){pathFor(path);const token=randomUUID();uploads.set(token,{path,expires:Date.now()+600000});return {data:{token,path,signedUrl:'/marketing-test/upload?token='+token},error:null};},
  async copy(from,to){try{const meta=files.get(from);if(!meta)throw Error('NOT_FOUND');await mkdir(dirname(pathFor(to)),{recursive:true});await copyFile(pathFor(from),pathFor(to));files.set(to,{...meta});return {data:{path:to},error:null};}catch{return {data:null,error:{message:'TEST_COPY_FAILED'}};}},
  async info(path){try{const meta=files.get(path);const info=await stat(pathFor(path));if(!meta)throw Error('NOT_FOUND');return {data:{size:info.size,contentType:meta.contentType},error:null};}catch{return {data:null,error:{message:'NOT_FOUND'}};}},
  async createSignedUrl(path,seconds,options){if(!files.has(path))return {data:null,error:{message:'NOT_FOUND'}};const token=randomUUID();downloads.set(token,{path,expires:Date.now()+seconds*1000,download:options?.download});return {data:{signedUrl:'/marketing-test/file?token='+token},error:null};},
  async remove(paths){for(const path of paths){await rm(pathFor(path),{force:true});files.delete(path);}return {error:null};},
 };}};
 return {client:{supportsSetofResults:true,from:table=>new Query(table),storage,async rpc(name,args){try{
  identifier(name);const params=Object.values(args).map((v,i)=>Object.keys(args)[i].includes('json')?JSON.stringify(v):v);
  const result=await db.query('select * from public.'+identifier(name)+'('+Object.keys(args).map((key,i)=>identifier(key)+' => $'+(i+1)).join(',')+')',params);
  const signature=await db.query("select proretset from pg_proc where proname=$1 and pronamespace='public'::regnamespace",[name]);
  if(signature.rows.some(row=>row.proretset))return {data:normalized(result.rows),error:null};
  const first=result.rows[0]??null;
  return {data:normalized(first&&Object.keys(first).length===1&&name in first?first[name]:first),error:null};
 }catch(e){return {data:null,error:{message:e.message}};}}},
 async upload(token,body,contentType){const entry=uploads.get(token);if(!entry||entry.expires<Date.now())throw Error('TEST_INVALID_TOKEN');if(body.byteLength>104857600)throw Error('FILE_TOO_LARGE');const filePath=pathFor(entry.path);await mkdir(dirname(filePath),{recursive:true});await writeFile(filePath,body);files.set(entry.path,{contentType});uploads.delete(token);return entry.path;},
 async download(token){const entry=downloads.get(token);if(!entry||entry.expires<Date.now())throw Error('TEST_INVALID_TOKEN');return {body:await readFile(pathFor(entry.path)),contentType:files.get(entry.path)?.contentType??'application/octet-stream',download:entry.download};},
 async close(){await db.close();await rm(filesRoot,{recursive:true,force:true});},db};
}
