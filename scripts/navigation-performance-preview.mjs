// Diagnostic route ONLY in the disposable local preview; never deployed.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
const source=resolve(import.meta.dirname,'..');
const metadata=JSON.parse(await readFile(resolve(source,'.isolated/marketing/current-real.json'),'utf8'));
const root=resolve(metadata.root);
if(!metadata.realLogin||!root.startsWith(resolve(source,'.isolated/marketing/web')+'/'))throw Error('DISPOSABLE_PREVIEW_REQUIRED');
async function put(path,content){await mkdir(dirname(resolve(root,path)),{recursive:true});await writeFile(resolve(root,path),content);}
await put('lib/auth/get-verified-user.ts',await readFile(resolve(source,'lib/auth/get-verified-user.ts'),'utf8'));
const resolver=(await readFile(resolve(source,'lib/auth/resolve-verified-user.ts'),'utf8')).replace('export async function resolveVerifiedUser(','async function originalResolveVerifiedUser(');
await put('lib/auth/resolve-verified-user.ts',resolver+`\nimport{getAuthProbe}from'@/lib/marketing-test/auth-probe';\nexport async function resolveVerifiedUser(dependencies:ResolveVerifiedUserDependencies):Promise<VerifiedUser>{getAuthProbe().resolutions++;return originalResolveVerifiedUser(dependencies);}\n`);
await put('lib/marketing-test/auth-probe.ts',`import{cache}from'react';export const getAuthProbe=cache(()=>({requestId:crypto.randomUUID(),resolutions:0}));`);
await put('app/(protected)/marketing/navigation-probe/page.tsx',`import{getVerifiedUser}from'@/lib/auth/get-verified-user';import{getAuthProbe}from'@/lib/marketing-test/auth-probe';export const dynamic='force-dynamic';export default async function Probe(){await Promise.all([getVerifiedUser(),getVerifiedUser(),getVerifiedUser()]);const p=getAuthProbe();return <main style={{padding:40}}><h1>本机导航检查</h1><p>仅使用测试登录与本机资料。</p><label>本次身份解析次数<output aria-label="身份解析次数">{p.resolutions}</output></label><label>本次请求编号<output aria-label="请求编号">{p.requestId}</output></label></main>}`);
console.log('Prepared only in disposable preview: http://127.0.0.1:3219/marketing/navigation-probe');
