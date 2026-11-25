// Render index.html to entry.png at exactly 1024x1024 with headless Chrome
// over the DevTools protocol. Usage: node render.mjs
// Do NOT use --screenshot: it silently produces no file on this machine.
import { spawn } from 'node:child_process';
import { rmSync, statSync, writeFileSync } from 'node:fs';

const PAGE = 'file:///home/hatch/workspace/makefun/news-image-20261125-entry/index.html';
const OUT = '/home/hatch/workspace/makefun/news-image-20261125-entry/entry.png';
const CHROME = '/opt/meta-chromium/chrome';
const PROFILE = '/tmp/meridian-chrome-profile';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitOk(url, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url); if (r.ok) return true; } catch {}
    await sleep(250);
  }
  return false;
}

rmSync(PROFILE, { recursive: true, force: true });
const chrome = spawn(CHROME, [
  '--headless', '--no-sandbox', '--disable-gpu',
  '--remote-allow-origins=*',
  '--hatch-webgl-allowed-domains-file=/var/lib/hatch-browser/rootfs-base/usr/share/hatch/chromium/webgl-allowed-domains.txt',
  '--hatch-webgl-allowed-domains-sha256=8097045f0459c96c4cdc76e3a1af4e0f43f640b4b59c43d6db35e3641c0264c6',
  '--remote-debugging-port=9231',
  `--user-data-dir=${PROFILE}`,
  '--window-size=1024,1024', '--force-device-scale-factor=1',
  'about:blank',
], { stdio: 'ignore' });

try {
  if (!await waitOk('http://127.0.0.1:9231/json/version')) throw new Error('chrome did not start');
  const t = await (await fetch(`http://127.0.0.1:9231/json/new?${encodeURIComponent(PAGE)}`, { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0;
  const pending = new Map();
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
  };
  const cmd = (method, params = {}) => new Promise((res) => {
    const i = ++id;
    pending.set(i, res);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  await cmd('Page.enable');
  await cmd('Emulation.setDeviceMetricsOverride', { width: 1024, height: 1024, deviceScaleFactor: 1, mobile: false });
  await sleep(1500);
  const shot = await cmd('Page.captureScreenshot', { format: 'png' });
  if (!shot.result?.data) throw new Error('no screenshot data');
  writeFileSync(OUT, Buffer.from(shot.result.data, 'base64'));
  const size = statSync(OUT).size;
  console.log('entry.png', size + ' bytes');
  if (size > 1048576) throw new Error('entry.png over the 1 MiB cap');
  ws.close();
} finally {
  chrome.kill('SIGTERM');
}
