import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ignoreBuild} from '../../scripts/vercel-ignore-build.mjs';
test('an explicitly marked commit skips deployment, while later normal changes can deploy',()=>{
 assert.equal(ignoreBuild('[skip vercel] Merge new workbench',false),true);
 assert.equal(ignoreBuild('Release after schema is ready',false),false);
 assert.equal(ignoreBuild('Normal commit',true),true);
});
test('Vercel uses the guarded ignore step',async()=>{
 const config=JSON.parse(await readFile(new URL('../../vercel.json',import.meta.url),'utf8'));
 assert.equal(config.ignoreCommand,'node scripts/vercel-ignore-build.mjs');
});
