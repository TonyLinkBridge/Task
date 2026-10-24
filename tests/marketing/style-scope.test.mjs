import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'../..');
const names=css=>new Set(Array.from(css.matchAll(/(--[a-z][a-z0-9-]*)\s*:/gi),m=>m[1]));
test('marketing source variables cannot overwrite the existing application theme',async()=>{
  const theme=names(await readFile(resolve(root,'app/globals.css'),'utf8'));
  const shared=new Set();
  for(const file of ['source-tokens.css','source-overview.css','source-calendar.css']){
    const css=await readFile(resolve(root,'features/marketing',file),'utf8');
    for(const name of names(css))if(theme.has(name))shared.add(name);
  }
  assert.deepEqual([...shared],[],'A source color variable must not replace a canonical component background');
});
