'use strict';
// Server tinh toi gian, khong can cai them thu vien nao.
// - Chay truc tiep: node server.js  (PORT mac dinh 5173)
// - Dung trong launcher: require('./server').start(port, { onAlive })
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, 'dist');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

function rootDir() {
  return fs.existsSync(path.join(DIST, 'index.html')) ? DIST : path.join(__dirname, 'src');
}

function createServer(opts) {
  const onAlive = (opts && opts.onAlive) || function () {};
  const ROOT = rootDir();
  return http.createServer((req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch (e) {
      res.writeHead(400);
      return res.end('Bad request');
    }
    if (pathname === '/__alive') {          // trang game bao "con mo"
      onAlive();
      res.writeHead(204, { 'Cache-Control': 'no-store' });
      return res.end();
    }
    if (pathname.includes('\0')) {
      res.writeHead(400);
      return res.end('Bad request');
    }
    if (pathname.endsWith('/')) pathname += 'index.html';

    const file = path.normalize(path.join(ROOT, pathname));
    if (file !== ROOT && !file.startsWith(ROOT + path.sep)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Not found');
      }
      res.writeHead(200, {
        'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
      res.end(data);
    });
  });
}

// Mo server tren cong `port`; neu bi chiem thi thu cac cong tiep theo.
function start(port, opts, tries) {
  tries = tries === undefined ? 20 : tries;
  return new Promise((resolve, reject) => {
    const server = createServer(opts);
    server.once('error', (e) => {
      if (e.code === 'EADDRINUSE' && tries > 0) resolve(start(port + 1, opts, tries - 1));
      else reject(e);
    });
    server.listen(port, '127.0.0.1', () => resolve({ server, port }));
  });
}

module.exports = { start, createServer };

if (require.main === module) {
  const PORT = Number(process.env.PORT) || 5173;
  start(PORT, null, 0).then(({ port }) => {
    console.log('Dino game dang chay tai http://localhost:' + port + '  (phuc vu thu muc: ' + path.basename(rootDir()) + ')');
    console.log('Nhan Ctrl+C de dung.');
  }).catch((e) => {
    if (e.code === 'EADDRINUSE') console.error('Cong ' + PORT + ' dang bi chiem. Thu: set PORT=5174 && node server.js');
    else console.error(e);
    process.exit(1);
  });
}
