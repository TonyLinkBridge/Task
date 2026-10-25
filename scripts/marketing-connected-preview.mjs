// Creates a disposable local copy. Never reads production .env or modifies the original app.
import {readFile,writeFile,mkdir,cp,symlink,chmod} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {randomBytes} from 'node:crypto';
import{assertMarketingClerkProviders,assertMarketingClerkInstance}from'./marketing-login-isolation.mjs';
const source=resolve(import.meta.dirname,'..');
const realLogin=process.argv.includes('--real-login');
const portArg=process.argv.find(a=>a.startsWith('--port='));
const port=portArg?Number(portArg.split('=')[1]):realLogin?3219:3218;
if(![3218,3219,3221,3222].includes(port))throw Error('ONLY_ISOLATED_PORTS_ALLOWED');
const origin='http://127.0.0.1:'+port;
const root=resolve(source,'.isolated/marketing/web',Date.now().toString());
const providers=JSON.parse(await readFile((realLogin||port===3222)?resolve(source,'.isolated/marketing/providers.json'):'/Users/tony/Documents/ChatGPT/Task/.isolated/n8n/providers.json','utf8'));
if(providers.liveblocksProjectId!=='6a91c42f2636d77aa4a4f4eb'||!providers.liveblocksSecretKey?.startsWith('sk_dev_')||!providers.liveblocksPublicKey?.startsWith('pk_dev_'))throw Error('Dedicated development Liveblocks project required');
if(realLogin){
 assertMarketingClerkProviders(providers);
 const response=await fetch('https://api.clerk.com/v1/instance',{headers:{Authorization:'Bearer '+providers.clerkSecretKey},signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Error('Clerk development instance check failed');assertMarketingClerkInstance(await response.json());
}
await mkdir(root,{recursive:true,mode:0o700});
for(const name of ['app','components','features','hooks','lib','content','public','supabase/migrations','package.json','tsconfig.json']) {
 await mkdir(dirname(resolve(root,name)),{recursive:true});
 await cp(resolve(source,name),resolve(root,name),{recursive:true});
}
await symlink(resolve(source,'node_modules'),resolve(root,'node_modules'));
async function put(path,text){await mkdir(dirname(resolve(root,path)),{recursive:true});await writeFile(resolve(root,path),text);}
await put('lib/marketing-test/local-database.mjs',await readFile(resolve(source,'tests/marketing/runtime/local-database.mjs'),'utf8'));
await put('lib/marketing-test/runtime.ts',`
import {createMarketingTestClient,identities} from './local-database.mjs';
export {identities};
const state=globalThis as typeof globalThis & {marketingTestRuntime?:ReturnType<typeof createMarketingTestClient>};
export function runtime(){return state.marketingTestRuntime??=createMarketingTestClient({sourceRoot:process.cwd(),seedIdentities:${!realLogin}});}
function query(table:string){const steps:[string,unknown[]][]=[];const proxy=new Proxy({}, {get(_,key){if(key==='then')return (ok:unknown,fail:unknown)=>runtime().then(async r=>{let q=r.client.from(table);for(const [name,args]of steps)q=q[name](...args);return await q;}).then(ok,fail);return (...args:unknown[])=>{steps.push([String(key),args]);return proxy;};}});return proxy;}
export const testClient={from:query,rpc:async(...args:unknown[])=> (await runtime()).client.rpc(...args),storage:{from:(bucket:string)=>new Proxy({}, {get:(_,key)=>(...args:unknown[])=>runtime().then(r=>r.client.storage.from(bucket)[key](...args))})}};
`);
await put('lib/auth/get-verified-user.ts',`
import 'server-only';import {cookies} from 'next/headers';import {redirect} from 'next/navigation';
import {identities} from '@/lib/marketing-test/runtime';import type {VerifiedUser} from './types';
export async function getVerifiedUser():Promise<VerifiedUser>{const key=(await cookies()).get('marketing-test-person')?.value;if(!key||!Object.hasOwn(identities,key))redirect('/marketing-test');return identities[key as keyof typeof identities];}
`);
await put('lib/supabase/admin.ts',`import 'server-only';import type{SupabaseClient}from'@supabase/supabase-js';import{testClient}from'@/lib/marketing-test/runtime';export function getSupabaseAdmin():SupabaseClient{return testClient as unknown as SupabaseClient;}`);
await put('lib/supabase/browser.ts',`'use client';export function getSupabaseBrowser(){return {storage:{from:(bucket:string)=>({uploadToSignedUrl:async(path:string,token:string,file:File,options:{contentType:string})=>{if(!['content-files','task-files'].includes(bucket))return {error:{message:'TEST_INVALID_BUCKET'}};const response=await fetch('/marketing-test/upload?token='+encodeURIComponent(token),{method:'PUT',headers:{'content-type':options.contentType},body:file});return response.ok?{error:null}:{error:{message:'TEST_UPLOAD_FAILED'}};}})}};}`);
const layout=(await readFile(resolve(root,'app/layout.tsx'),'utf8')).replace('import { ClerkProvider } from "@clerk/nextjs";','').replace('<ClerkProvider>','').replace('</ClerkProvider>','');await put('app/layout.tsx',layout);
await put('proxy.ts',`import{NextResponse,NextRequest}from'next/server';export function proxy(request:NextRequest){const host=request.headers.get('host');const path=request.nextUrl.pathname;if(![${JSON.stringify('127.0.0.1:'+port)},${JSON.stringify('localhost:'+port)}].includes(host??''))return new Response('Loopback test only',{status:403});if(path!=='/'&&!['/marketing','/marketing-test','/dashboard','/content','/admin','/tasks','/help','/_next/','/api/liveblocks-','/api/files/','/api/media-assets/','/api/task-files/','/api/search','/api/notifications','/api/messages','/api/workspace-preferences','/api/workspace-export','/marketing-assets/','/mascots/','/favicon'].some(p=>path.startsWith(p)))return new Response('Outside isolated test scope',{status:403});return NextResponse.next();}`);
if(!realLogin)await put('components/auth/user-account-menu.tsx',`import type{VerifiedUser}from'@/lib/auth/types';export function UserAccountMenu({currentUser}:{currentUser:VerifiedUser}){return <details><summary aria-label='打开账号菜单'>{currentUser.name}</summary><p>这是隔离测试身份</p><a href='/marketing-test'>退出测试身份</a></details>;}`);
await put('next.config.ts',`export default {serverExternalPackages:['@electric-sql/pglite'],outputFileTracingRoot:${JSON.stringify(root)},allowedDevOrigins:['localhost','127.0.0.1'],experimental:{serverActions:{allowedOrigins:[${JSON.stringify('localhost:'+port)},${JSON.stringify('127.0.0.1:'+port)}]}}};`);
await put('app/marketing-test/page.tsx',`import{identities}from'@/lib/marketing-test/runtime';export default function TestEntry(){return <main style={{padding:48}}><h1>独立测试工作台</h1><p>本机临时资料、测试身份、专用 Liveblocks 测试项目。正式系统未连接。</p>{Object.values(identities).map(p=><form key={p.id} action='/marketing-test/login' method='post'><input type='hidden' name='identity' value={p.id}/><button style={{margin:12,padding:12}}>{p.name}</button></form>)}</main>;}`);
await put('app/marketing-test/login/route.ts',`import{cookies}from'next/headers';import{identities}from'@/lib/marketing-test/runtime';export async function POST(request:Request){if(request.headers.get('origin')!=='http://'+request.headers.get('host'))return new Response('Forbidden',{status:403});const id=(await request.formData()).get('identity');if(typeof id!=='string'||!Object.hasOwn(identities,id))return new Response('Forbidden',{status:403});(await cookies()).set('marketing-test-person',id,{httpOnly:true,sameSite:'strict',path:'/'});return Response.redirect(new URL('/marketing',request.headers.get('origin')!),303);}`);
await put('app/marketing-test/upload/route.ts',`import{getVerifiedUser}from'@/lib/auth/get-verified-user';import{runtime}from'@/lib/marketing-test/runtime';export async function PUT(request:Request){await getVerifiedUser();if(request.headers.get('origin')!=='http://'+request.headers.get('host'))return new Response('Forbidden',{status:403});if(Number(request.headers.get('content-length'))>104857600)return new Response('Too large',{status:413});try{await(await runtime()).upload(new URL(request.url).searchParams.get('token'),Buffer.from(await request.arrayBuffer()),request.headers.get('content-type'));return Response.json({ok:true});}catch{return new Response('Upload rejected',{status:400});}}`);
await put('app/marketing-test/file/route.ts',`import{getVerifiedUser}from'@/lib/auth/get-verified-user';import{runtime}from'@/lib/marketing-test/runtime';export async function GET(request:Request){await getVerifiedUser();try{const f=await(await runtime()).download(new URL(request.url).searchParams.get('token'));return new Response(f.body,{headers:{'Content-Type':f.contentType,'Content-Disposition':f.download?'attachment':'inline','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}catch{return new Response('File not found',{status:404});}}`);
// Precompile Tailwind once against this copy; no parent-worktree scans or background workers.
const require=createRequire(resolve(source,'package.json'));const pluginPath=require.resolve('@tailwindcss/postcss');const postcss=createRequire(pluginPath)('postcss');
const css=(await readFile(resolve(root,'app/globals.css'),'utf8')).replace('@import "tailwindcss";','@import "tailwindcss" source(none);\n@source "../app";\n@source "../components";\n@source "../features";\n@source "../hooks";');
const result=await postcss([require('@tailwindcss/postcss')({base:root})]).process(css,{from:resolve(root,'app/globals.css')});await put('app/globals.css',result.css);await put('postcss.config.mjs','export default {plugins:{}};');
const env={NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:realLogin?providers.clerkPublishableKey:'test-only-unused',CLERK_SECRET_KEY:realLogin?providers.clerkSecretKey:'test-only-unused',ALLOWED_SLACK_TEAM_ID:'T094DTFCVA8',NEXT_PUBLIC_SUPABASE_URL:origin,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'local-only-unused',SUPABASE_SERVICE_ROLE_KEY:'local-only-unused',NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY:providers.liveblocksPublicKey,LIVEBLOCKS_SECRET_KEY:providers.liveblocksSecretKey,LIVEBLOCKS_WEBHOOK_SECRET:randomBytes(32).toString('hex'),NEXT_PUBLIC_APP_URL:origin,NEXT_TELEMETRY_DISABLED:'1'};
if(realLogin){
 // Restore canonical Clerk/Slack identity resolution in the disposable copy only.
 for(const path of ['lib/auth/get-verified-user.ts','app/layout.tsx'])await put(path,await readFile(resolve(source,path),'utf8'));
 await put('lib/marketing-test/login-boundary.ts',`export const testOrigin=${JSON.stringify(origin)};export function localOnly(request:Request){return request.headers.get('host')===new URL(testOrigin).host;}`);
 const originalProxy=await readFile(resolve(source,'proxy.ts'),'utf8');
 await put('marketing-login-isolation.mjs',(await readFile(resolve(source,'scripts/marketing-login-isolation.mjs'),'utf8')).replace("origin:'http://127.0.0.1:3219'",'origin:'+JSON.stringify(origin)));
 await put('proxy.ts',originalProxy.replace('export default clerkMiddleware(','const clerkTestMiddleware = clerkMiddleware(')+`
import type {NextRequest,NextFetchEvent}from'next/server';
import{normalizeMarketingClerkResponse}from'./marketing-login-isolation.mjs';
export default async function isolatedClerkProxy(request:NextRequest,event:NextFetchEvent){
 if(request.headers.get('host')!==${JSON.stringify('127.0.0.1:'+port)})return new Response('Loopback only',{status:403});
 if(request.nextUrl.pathname==='/marketing-test/login')return new Response('Synthetic login disabled',{status:404});
 return normalizeMarketingClerkResponse(request,await clerkTestMiddleware(request,event));
}`);
 await put('app/marketing-test/page.tsx',`import{redirect}from'next/navigation';export default function Entry(){redirect('/marketing');}`);
 await put('app/marketing-test/login/route.ts',`export function POST(){return new Response('Synthetic login disabled',{status:404});}`);
 await put('next.config.ts',`export default{serverExternalPackages:['@electric-sql/pglite'],skipProxyUrlNormalize:false,outputFileTracingRoot:${JSON.stringify(root)},allowedDevOrigins:['127.0.0.1'],experimental:{serverActions:{allowedOrigins:[${JSON.stringify('127.0.0.1:'+port)}]}}};`);
 await writeFile(resolve(root,'app/globals.css'),result.css+'\nbody::before{content:"独立测试环境 · 真实测试登录 · 正式资料未连接";display:block;background:#fef3c7;color:#78350f;padding:8px;text-align:center;font:13px sans-serif;}');
}
if(!realLogin&&port===3222){
 await put('features/workspace-settings/components/account-management.tsx',`export function AccountManagement(){return <p>当前为本机角色测试；真实账号安全界面请在 3221 的 Clerk 测试登录中查看。</p>;}`);
 await put('app/globals.css',(await readFile(resolve(root,'app/globals.css'),'utf8'))+'\nbody::before{content:"独立角色测试 · 本机资料 · 正式系统未连接";display:block;background:#fef3c7;color:#78350f;padding:8px;text-align:center;font:13px sans-serif;}');
}
await put('.env.local',Object.entries(env).map(([k,v])=>k+'='+v).join('\n'));await chmod(resolve(root,'.env.local'),0o600);
await put('ISOLATION.txt',realLogin?'Disposable marketing preview. Dedicated Clerk DEVELOPMENT identity with original Slack workspace verification. Local PGlite and files; designated development Liveblocks only. Synthetic login endpoint disabled. No production connection, deployment or Slack notifications.':'Disposable marketing preview. Synthetic identities. Local PGlite and local files. Only the designated development Liveblocks project is connected. No Slack messages, Clerk changes, deployment or production database connection.');
await mkdir(resolve(source,'.isolated/marketing'),{recursive:true});await writeFile(resolve(source,'.isolated/marketing/'+(port===3222?'current-library-settings-roles.json':port===3221?'current-library-settings.json':realLogin?'current-real.json':'current.json')),JSON.stringify({root,url:origin+'/marketing',realLogin},null,2));
const childEnv={...env,NODE_ENV:'development'};for(const name of ['PATH','HOME','TMPDIR','USER','LANG','SHELL'])if(process.env[name])childEnv[name]=process.env[name];
console.log('Independent preview: '+origin+(realLogin?'/marketing':'/marketing-test'));console.log('Temporary source copy:',root);
const child=spawn(process.execPath,[resolve(source,'node_modules/next/dist/bin/next'),'dev','--webpack','--hostname','127.0.0.1','--port',String(port)],{cwd:root,env:childEnv,stdio:'inherit'});for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));child.on('exit',code=>process.exit(code??0));
