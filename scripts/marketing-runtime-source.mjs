export function marketingRuntimeSource(realLogin) {
 return `import {createMarketingTestClient,identities} from './local-database.mjs';
export {identities};
const state=globalThis as typeof globalThis & {marketingTestRuntime?:ReturnType<typeof createMarketingTestClient>};
async function attachUpdatedQueryAdapter(r:any){
 let needsUpgrade=true;
 try{needsUpgrade=r.client.from('profiles').supportsHistoryContent!==true||typeof r.client.from('profiles').range!=='function'||!r.client.supportsSetofResults;}catch{/* Recover a stale adapter while preserving its database and files. */}
 if(needsUpgrade){
  const updated=await createMarketingTestClient({existingDatabase:r.db});
  r.client.from=updated.client.from;
  r.client.rpc=updated.client.rpc;
  r.client.supportsSetofResults=true;
  const storageFrom=r.client.storage.from;
  r.client.storage.from=(bucket:string)=>storageFrom(bucket==='task-files'?'content-files':bucket);
 }
 return r;
}
export function runtime(){return (state.marketingTestRuntime??=createMarketingTestClient({sourceRoot:process.cwd(),seedIdentities:${!realLogin}})).then(attachUpdatedQueryAdapter);}
function query(table:string){const steps:[string,unknown[]][]=[];const proxy=new Proxy({}, {get(_,key){if(key==='then')return (ok:unknown,fail:unknown)=>runtime().then(async r=>{let q=r.client.from(table);for(const [name,args]of steps)q=q[name](...args);return await q;}).then(ok,fail);return (...args:unknown[])=>{steps.push([String(key),args]);return proxy;};}});return proxy;}
export const testClient={from:query,rpc:async(...args:unknown[])=> (await runtime()).client.rpc(...args),storage:{from:(bucket:string)=>new Proxy({}, {get:(_,key)=>(...args:unknown[])=>runtime().then(r=>r.client.storage.from(bucket)[key](...args))})}};`;
}
