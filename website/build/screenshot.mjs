// Capture pages of the local site at an exact device width.
//
//   python3 website/build/serve.py 8801 &
//   node website/build/screenshot.mjs 390 /tmp/shots / /playground/ /docs/
//
// It sets the viewport through the DevTools protocol rather than through the
// window size, because a headless window has a minimum width and silently
// renders a wider layout than the screenshot it hands back.

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const CHROME = process.env.CHROME || [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((path) => existsSync(path));

const BASE = process.env.BASE || 'http://localhost:8801';
const PORT = 9444;

const [widthArg, outDir, ...paths] = process.argv.slice(2);
const width = Number.parseInt(widthArg || '1440', 10);
const height = Number.parseInt(process.env.HEIGHT || '900', 10);
const pages = paths.length > 0 ? paths : ['/'];

if (!CHROME) {
  console.error('screenshot: no Chrome found; set CHROME to its path');
  process.exit(2);
}
mkdirSync(outDir, { recursive: true });

const chrome = spawn(CHROME, [
  '--headless', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  '--user-data-dir=/tmp/mgit-shot-profile', `--remote-debugging-port=${PORT}`, 'about:blank',
], { stdio: 'ignore' });

let target = null;
for (let attempt = 0; attempt < 60 && !target; attempt += 1) {
  await sleep(200);
  try {
    const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((response) => response.json());
    target = list.find((entry) => entry.type === 'page');
  } catch (error) {
    target = null;
  }
}
if (!target) {
  chrome.kill();
  console.error('screenshot: could not reach headless Chrome');
  process.exit(2);
}

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }));
let nextId = 1;
const pending = new Map();
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (pending.has(message.id)) {
    pending.get(message.id)(message.result);
    pending.delete(message.id);
  }
});
const send = (method, params = {}) => new Promise((resolve) => {
  const id = nextId++;
  pending.set(id, resolve);
  socket.send(JSON.stringify({ id, method, params }));
});

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width, height, deviceScaleFactor: 1, mobile: width < 600,
});

for (const path of pages) {
  await send('Page.navigate', { url: BASE + path });
  await sleep(1600);
  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: process.env.FULL_PAGE === '1',
  });
  const name = (path.replace(/[/?&=]/g, '-').replace(/^-|-$/g, '') || 'home') + `-${width}.png`;
  writeFileSync(join(outDir, name), Buffer.from(shot.data, 'base64'));
  console.log('wrote', join(outDir, name));
}

socket.close();
chrome.kill();
