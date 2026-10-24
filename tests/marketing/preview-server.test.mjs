import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { test } from 'node:test';
import { createPreviewServer } from '../../scripts/murmura-preview.mjs';

test('preview serves only local files and refuses API calls, writes and traversal', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'murmura-server-'));
  await mkdir(path.join(temp, 'assets'));
  await writeFile(path.join(temp, 'index.html'), '<!doctype html><title>isolated</title>');
  await writeFile(path.join(temp, 'assets', 'test.js'), 'export const isolated = true;');
  const server = createPreviewServer({ siteRoot: temp });
  try {
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}`;
    const page = await fetch(`${base}/murmura/`);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /isolated/);
    assert.match(page.headers.get('content-security-policy'), /connect-src 'self'/);
    assert.match(page.headers.get('x-robots-tag'), /noindex/);
    assert.equal((await fetch(`${base}/murmura/assets/test.js`)).status, 200);
    assert.equal((await fetch(`${base}/api/messages`)).status, 404);
    assert.equal((await fetch(`${base}/murmura/`, { method: 'POST', body: 'delete' })).status, 405);
    assert.equal((await fetch(`${base}/murmura/%2e%2e%2fpackage.json`)).status, 400);
    assert.equal((await fetch(`${base}/murmura/%00`)).status, 400);
    assert.equal((await fetch(`${base}/murmura/.env.local`)).status, 404);
    const script = await fetch(`${base}/murmura/assets/test.js`);
    assert.match(script.headers.get('content-type'), /javascript/);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await rm(temp, { recursive: true, force: true });
  }
});
