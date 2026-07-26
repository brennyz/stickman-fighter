/** Shared minimal static file server for Puppeteer smoke tests (no tunnel side-effects). */
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

export function repoRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
}

export function smokeBaseUrl(port = 8787, pathname = '/index.html') {
  return `http://127.0.0.1:${port}${pathname}`;
}

/** Start server on port; returns null if port already in use (reuse existing). */
export function startStaticServer(root, port = 8787) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let rel = decodeURIComponent((req.url || '/').split('?')[0]);
      if (rel === '/') rel = '/index.html';
      const file = path.join(root, rel.replace(/^\//, ''));
      if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404);
        res.end('no');
        return;
      }
      const ext = path.extname(file);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    server.once('error', (err) => {
      if (err && err.code === 'EADDRINUSE') resolve(null);
      else reject(err);
    });
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

/** Best-effort bootstrap; safe to call from every smoke script. */
export async function ensureSmokeServer(port = 8787) {
  const root = repoRoot();
  try {
    return await startStaticServer(root, port);
  } catch (_) {
    return null;
  }
}
