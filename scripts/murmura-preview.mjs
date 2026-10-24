import http from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.ico': 'image/x-icon',
};

/** Local, read-only preview. It deliberately has no proxy, database or API handlers. */
export function createPreviewServer({ siteRoot = path.join(projectRoot, 'preview/murmura/site') } = {}) {
  return http.createServer(async (request, response) => {
    response.setHeader('X-Robots-Tag', 'noindex, nofollow');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Content-Security-Policy', [
      "default-src 'self'", "script-src 'self' 'unsafe-inline'", "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:", "font-src 'self'", "connect-src 'self'",
      "form-action 'none'", "base-uri 'none'", "frame-ancestors 'none'",
    ].join('; '));
    if (!['GET', 'HEAD'].includes(request.method ?? '')) {
      response.writeHead(405, { Allow: 'GET, HEAD' }); response.end('Read-only preview'); return;
    }
    try {
      const rawPath = (request.url ?? '/').split('?')[0];
      const decoded = decodeURIComponent(rawPath);
      if (decoded.includes('\0') || decoded.includes('\\') || decoded.split('/').includes('..')) {
        response.writeHead(400); response.end('Invalid path'); return;
      }
      if (decoded === '/' || decoded === '/murmura') {
        response.writeHead(302, { Location: '/murmura/' }); response.end(); return;
      }
      if (decoded === '/favicon.ico') { response.writeHead(204); response.end(); return; }
      if (!decoded.startsWith('/murmura/')) {
        response.writeHead(404); response.end('No application or production services on this preview'); return;
      }
      const relative = decoded.slice('/murmura/'.length) || 'index.html';
      if (relative.split('/').some(segment => segment.startsWith('.')) || !types[path.extname(relative)]) {
        response.writeHead(404); response.end('Not found'); return;
      }
      const base = await realpath(siteRoot);
      const target = await realpath(path.resolve(base, relative));
      if (!target.startsWith(base + path.sep) || !(await stat(target)).isFile()) {
        response.writeHead(404); response.end('Not found'); return;
      }
      const bytes = await readFile(target);
      response.writeHead(200, { 'Content-Type': types[path.extname(target)], 'Content-Length': bytes.length });
      response.end(request.method === 'HEAD' ? undefined : bytes);
    } catch (error) {
      const invalid = error instanceof URIError;
      response.writeHead(invalid ? 400 : 404); response.end(invalid ? 'Invalid path' : 'Not found');
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.MURMURA_PREVIEW_PORT ?? 3217);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid preview port');
  const server = createPreviewServer();
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`Isolated Murmura preview: http://127.0.0.1:${port}/murmura/`));
}
