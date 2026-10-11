import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(
  fileURLToPath(new URL('../dist/client/', import.meta.url)),
);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
};
const port = Number(process.env.BEFROTHED_PORT || 4179);
createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', 'http://localhost');
    let file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
    if (file !== root && !file.startsWith(root + path.sep)) {
      response.writeHead(403).end();
      return;
    }
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    response.setHeader(
      'Content-Type',
      mime[path.extname(file)] || 'application/octet-stream',
    );
    response.setHeader('Cache-Control', 'no-cache');
    response.end(await readFile(file));
  } catch {
    response.writeHead(404).end('Not found');
  }
}).listen(port, '127.0.0.1', () =>
  console.log(`Befrothed production preview: http://127.0.0.1:${port}/`),
);
