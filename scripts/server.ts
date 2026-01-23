import fs from 'node:fs';
import http from 'node:http';
import { extname, join } from 'node:path';
import open from 'open';
import { projectRoot } from './constants';

const hostname = '127.0.0.1';
const PORT = 5500;

export function startServer() {
  const server = http.createServer((req, res) => {
    const filePath = join(projectRoot, req.url === '/' ? 'index.html' : req.url!);
    const fileExtname = String(extname(filePath)).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
    };
    const contentType = mimeTypes[fileExtname] || 'application/octet-stream';
    fs.readFile(filePath, (err, content) => {
      if (err) {
        if (err.code === 'ENOENT') {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
        }
        else {
          res.writeHead(500);
          res.end(`Server Error: ${err.code}`);
        }
      }
      else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf8');
      }
    });
  });

  server.listen(PORT, hostname, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    open(`http://localhost:${PORT}/docs/index.html`)
      .catch((error) => {
        console.error('Failed to open browser:', error);
      });
  });

  return server;
}
