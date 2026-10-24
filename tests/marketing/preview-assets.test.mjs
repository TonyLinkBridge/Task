import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('../../preview/murmura/', import.meta.url);
test('all original page modules and styles retain recorded hashes and media is locally available', async()=>{
  const manifest=JSON.parse(await readFile(new URL('source-manifest.json',root),'utf8'));
  assert.equal(manifest.filter(x=>x.name.endsWith('.js')).length,13);
  for(const asset of manifest) {
    const bytes=await readFile(new URL(`site/assets/${asset.name}`,root));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256,asset.name);
  }
  const media=JSON.parse(await readFile(new URL('media-manifest.json',root),'utf8'));
  for(const asset of media) assert.equal((await stat(new URL(`site/${asset.path}`,root))).size,asset.bytes,asset.path);
  const html=await readFile(new URL('site/index.html',root),'utf8');
  assert.doesNotMatch(html,/<(?:script|link)[^>]*(?:src|href)=["']https?:/);
  assert.match(html,/未连接正式系统/);
  const fontCSS=await readFile(new URL('site/fonts.css',root),'utf8');
  assert.doesNotMatch(fontCSS,/url\(https?:/);
});
