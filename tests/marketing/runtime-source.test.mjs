import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { marketingRuntimeSource } from '../../scripts/marketing-runtime-source.mjs';
test('generated preview runtime compiles for both identity modes and never changes the existing database',()=>{
 for(const realLogin of [false,true]){
  const source=marketingRuntimeSource(realLogin);
  const result=ts.transpileModule(source,{reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});
  assert.equal(result.diagnostics.filter(d=>d.category===ts.DiagnosticCategory.Error).length,0);
  assert.ok(source.includes(`seedIdentities:${!realLogin}`));
  assert.match(source,/existingDatabase:r\.db/);
 }
});
test('a broken cached query adapter can recover without replacing database or file handles',async()=>{
 const database={},upload=()=>{},seen=[];
 const cached={db:database,upload,client:{from(){throw Error('STALE_QUERY_CONSTRUCTOR');},storage:{from:bucket=>({bucket})}}};
 const from=()=>({supportsCompositeUpsert:true});
 const source=marketingRuntimeSource(true);
 const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 const exported={};
 new Function('require','exports','globalThis',compiled)(()=>({identities:{},createMarketingTestClient:async options=>{seen.push(options);return {client:{from}};}}),exported,{marketingTestRuntime:Promise.resolve(cached)});
 const result=await exported.runtime();
 assert.equal(result,cached);assert.equal(result.db,database);assert.equal(result.upload,upload);assert.equal(result.client.from,from);assert.deepEqual(seen,[{existingDatabase:database}]);
});
