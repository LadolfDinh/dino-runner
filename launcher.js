'use strict';
// Mo Dino Runner nhu mot ung dung rieng:
// build (neu can) -> bat server an -> mo cua so app (Edge/Chrome --app) -> dong cua so thi tat server.
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn, execFileSync } = require('child_process');

const APP_DIR = __dirname;
const DATA_DIR = path.join(process.env.LOCALAPPDATA || require('os').tmpdir(), 'DinoRunner');
const LOCK = path.join(DATA_DIR, 'running.json');
const LOG = path.join(DATA_DIR, 'launcher.log');
const PROFILE = path.join(DATA_DIR, 'browser-profile');
const ALIVE_TIMEOUT_MS = 120000;   // khong con trang nao ping trong 2 phut -> tat

fs.mkdirSync(DATA_DIR, { recursive: true });
function log(msg) {
  try { fs.appendFileSync(LOG, new Date().toISOString() + '  ' + msg + '\n'); } catch (e) { /* bo qua */ }
}

function newestMtime(dir) {
  let t = 0;
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    t = Math.max(t, f.isDirectory() ? newestMtime(p) : fs.statSync(p).mtimeMs);
  }
  return t;
}

function buildIfNeeded() {
  const src = path.join(APP_DIR, 'src');
  const out = path.join(APP_DIR, 'dist', 'index.html');
  if (fs.existsSync(out) && newestMtime(path.join(APP_DIR, 'dist')) >= newestMtime(src)) return;
  log('build...');
  execFileSync(process.execPath, [path.join(APP_DIR, 'build.js')], { cwd: APP_DIR, windowsHide: true });
}

function findBrowser() {
  const pf = process.env['ProgramFiles'] || 'C:\\Program Files';
  const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const local = process.env.LOCALAPPDATA || '';
  const list = [
    path.join(pf86, 'Microsoft\\Edge\\Application\\msedge.exe'),
    path.join(pf, 'Microsoft\\Edge\\Application\\msedge.exe'),
    path.join(pf, 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(pf86, 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(local, 'Google\\Chrome\\Application\\chrome.exe'),
  ];
  return list.find((p) => p && fs.existsSync(p)) || null;
}

function openWindow(url) {
  const browser = findBrowser();
  if (!browser) {
    log('khong thay Edge/Chrome, mo trinh duyet mac dinh');
    spawn('cmd', ['/c', 'start', '', url], { windowsHide: true, detached: true, stdio: 'ignore' }).unref();
    return null;
  }
  const args = [
    '--app=' + url,
    '--user-data-dir=' + PROFILE,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-features=Translate,msEdgeTranslate',
    '--disable-translate',
    '--window-size=1000,560',
  ];
  log('mo cua so: ' + path.basename(browser));
  return spawn(browser, args, { detached: false, stdio: 'ignore' });
}

function ping(port) {
  return new Promise((resolve) => {
    const req = http.get({ host: '127.0.0.1', port, path: '/__alive', timeout: 1500 }, (res) => {
      res.resume();
      resolve(res.statusCode === 204);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function main() {
  // Da co mot ban dang chay -> chi mo them cua so
  try {
    const old = JSON.parse(fs.readFileSync(LOCK, 'utf8'));
    if (old && old.port && await ping(old.port)) {
      log('dang chay san o cong ' + old.port + ', mo them cua so');
      openWindow('http://127.0.0.1:' + old.port + '/');
      return;
    }
  } catch (e) { /* chua chay */ }

  buildIfNeeded();

  let lastAlive = Date.now();
  const { server, port } = await require('./server').start(5173, { onAlive: () => { lastAlive = Date.now(); } });
  const url = 'http://127.0.0.1:' + port + '/';
  fs.writeFileSync(LOCK, JSON.stringify({ port, pid: process.pid }));
  log('server tai ' + url);

  let closing = false;
  function quit(reason) {
    if (closing) return;
    closing = true;
    log('tat: ' + reason);
    try { fs.unlinkSync(LOCK); } catch (e) { /* bo qua */ }
    server.close();
    setTimeout(() => process.exit(0), 300);
  }

  const startedAt = Date.now();
  const child = openWindow(url);
  if (child) {
    child.on('exit', () => {
      // Neu trinh duyet thoat ngay (giao viec cho tien trinh khac) thi dua vao heartbeat
      if (Date.now() - startedAt > 4000) quit('da dong cua so');
      else log('trinh duyet thoat som, theo doi bang heartbeat');
    });
  }
  setInterval(() => {
    if (Date.now() - lastAlive > ALIVE_TIMEOUT_MS) quit('khong con cua so nao mo');
  }, 5000);
  process.on('SIGINT', () => quit('Ctrl+C'));
}

main().catch((e) => { log('LOI: ' + (e && e.stack || e)); process.exit(1); });
