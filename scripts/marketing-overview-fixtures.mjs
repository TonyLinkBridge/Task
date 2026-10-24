// Generates acceptance data controls only inside the loopback-only disposable preview.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
const source=resolve(import.meta.dirname,'..');
const {root}=JSON.parse(await readFile(resolve(source,'.isolated/marketing/current-real.json'),'utf8'));
if(!resolve(root).startsWith(resolve(source,'.isolated/marketing/web')+'/'))throw Error('DISPOSABLE_PREVIEW_REQUIRED');
async function put(path,body){const file=resolve(root,path);await mkdir(dirname(file),{recursive:true});await writeFile(file,body);}
await put('app/marketing-test/overview/page.tsx',`export default function OverviewFixture(){return <main style={{padding:40,maxWidth:600}}><h1>Overview 本机验收资料</h1><p>只向这套本机临时数据库加入首页样稿，不连接正式资料，不发 Slack。重复点击不会重复加入。</p><form action="/marketing-test/overview/seed" method="post"><button style={{padding:16,marginTop:20}}>加入本机首页验收资料</button></form></main>}`);
await put('app/marketing-test/overview/seed/route.ts',`import {randomUUID} from 'node:crypto';
import {getVerifiedUser} from '@/lib/auth/get-verified-user';
import {runtime} from '@/lib/marketing-test/runtime';
import {toMalaysiaDateKey} from '@/features/schedule/date';
export async function POST(request:Request){
 if(request.headers.get('host')!=='127.0.0.1:3219'||request.headers.get('origin')!=='http://127.0.0.1:3219')return new Response('Local test only',{status:403});
 const user=await getVerifiedUser();const r=await runtime();
 if((await r.db.query("select id from tasks where project=$1 limit 1",['Overview 本机验收'])).rows.length)return Response.redirect(new URL('/marketing','http://127.0.0.1:3219'),303);
 const now=new Date();const today=toMalaysiaDateKey(now.toISOString());const midnight=Date.parse(today+'T00:00:00+08:00');
 const dayEnd=new Date(midnight+86400000-1).toISOString(),past=new Date(midnight-3600000).toISOString(),future=new Date(midnight+86400000+3600000).toISOString();
 await r.db.transaction(async(tx:any)=>{
  for(const [id,name]of[['overview_test_admin_a','本机验收管理员 A'],['overview_test_admin_b','本机验收管理员 B']])await tx.query("insert into profiles(clerk_user_id,role,display_name,slack_team_id,slack_verified_at) values($1,'admin',$2,'T_LOCAL_TEST',now()) on conflict(clerk_user_id) do nothing",[id,name]);
  for(let i=1;i<=7;i++)await tx.query("insert into tasks(title,project,assignee_id,assignee_ids,creator_id,due_at) values($1,$2,$3,$4,$3,$5)",['Overview验收｜今天任务 '+i,'Overview 本机验收',user.id,[user.id],dayEnd]);
  await tx.query("insert into tasks(title,project,assignee_id,assignee_ids,creator_id,due_at) values($1,$2,$3,$4,$3,$5)",['Overview验收｜昨天过期任务','Overview 本机验收',user.id,[user.id],past]);
  await tx.query("insert into tasks(title,project,assignee_id,assignee_ids,creator_id,due_at,status) values($1,$2,$3,$4,$3,$5,'done')",['Overview验收｜已完成不应出现','Overview 本机验收',user.id,[user.id],dayEnd]);
  await tx.query("insert into tasks(title,project,assignee_id,assignee_ids,creator_id,due_at,archived_at) values($1,$2,$3,$4,$3,$5,now())",['Overview验收｜已归档不应出现','Overview 本机验收',user.id,[user.id],dayEnd]);
  const platform=(await tx.query('select id from platforms where archived_at is null order by created_at limit 1')).rows[0]?.id;if(!platform)throw Error('TEST_PLATFORM_REQUIRED');
  const samples=[['等待检查',future,'review'],['已批准待发布',future,'approved'],['超时草稿',past,'draft'],['超时仍在审核',past,'review'],['已批准到时未发布',past,'approved']];
  for(const [name,date,phase]of samples){
   const id=randomUUID();const created=(await tx.query('select * from create_scheduled_content($1,$2,$3,$4,$5,$6::uuid[])',[id,'Overview验收｜'+name,user.id,user.id,date,[platform]])).rows[0];
   if(phase==='draft')continue;
   const doc=JSON.stringify([{id:randomUUID(),type:'paragraph',props:{},content:[{type:'text',text:'仅用于本机首页汇总与链接验收。',styles:{}}],children:[]}]);
   const submitted=(await tx.query('select * from submit_content_for_review($1,$2,$3::jsonb,$4)',[id,user.id,doc,user.role==='admin'?'overview_test_admin_a':null])).rows[0];
   if(phase==='approved')for(const admin of ['overview_test_admin_a','overview_test_admin_b'].slice(0,created.required_approvals))await tx.query('select * from approve_content_version($1,$2,$3)',[id,submitted.current_version,admin]);
  }
 });
 return Response.redirect(new URL('/marketing','http://127.0.0.1:3219'),303);
}`);
console.log('Prepared local-only Overview fixture controls on 3219');
