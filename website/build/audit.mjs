// A small responsive and accessibility audit for the built site.
//
//   python3 website/build/serve.py 8801 &
//   node website/build/audit.mjs
//
// It drives headless Chrome over the DevTools protocol, loads every page at a
// phone width and a desktop width, and reports the things that are easy to
// break and hard to see: horizontal overflow, elements wider than the
// viewport, images without alt text, controls without an accessible name,
// heading levels that skip, and duplicate element ids.

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const CHROME = process.env.CHROME || [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((path) => existsSync(path));

const BASE = process.env.BASE || 'http://localhost:8801';
const PORT = 9333;

const PAGES = [
  '/', '/playground/', '/docs/', '/docs/install/', '/docs/usage/', '/docs/discovery/',
  '/docs/output/', '/docs/exit-codes/', '/docs/environment/', '/docs/recipes/', '/404.html',
  '/en/', '/en/playground/', '/en/docs/', '/en/docs/install/', '/en/docs/usage/',
  '/en/docs/discovery/', '/en/docs/output/', '/en/docs/exit-codes/', '/en/docs/environment/',
  '/en/docs/recipes/',
];

const VIEWPORTS = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

const CHECK = `(() => {
  const problems = [];
  const limit = window.innerWidth + 1;

  if (document.documentElement.scrollWidth > limit) {
    problems.push('page scrolls horizontally: ' + document.documentElement.scrollWidth + 'px in a ' + window.innerWidth + 'px viewport');
    const seen = new Set();
    for (const element of document.querySelectorAll('body *')) {
      const box = element.getBoundingClientRect();
      if (box.width === 0 || box.right <= limit) continue;
      // Report the outermost offender only.
      let parent = element.parentElement, nested = false;
      while (parent) { if (seen.has(parent)) { nested = true; break; } parent = parent.parentElement; }
      if (nested) continue;
      seen.add(element);
      const name = element.tagName.toLowerCase() +
        (element.className && typeof element.className === 'string' ? '.' + element.className.trim().split(/\\s+/).join('.') : '');
      problems.push('  overflowing: ' + name + ' right edge ' + Math.round(box.right));
      if (seen.size >= 6) break;
    }
  }

  for (const image of document.querySelectorAll('img')) {
    if (!image.hasAttribute('alt')) problems.push('img without alt: ' + image.src);
  }

  for (const control of document.querySelectorAll('button, a[href], input, select, textarea')) {
    const text = (control.textContent || '').trim();
    const label = control.getAttribute('aria-label') || control.getAttribute('title') ||
      (control.labels && control.labels.length > 0 ? control.labels[0].textContent : '');
    if (!text && !label && control.type !== 'hidden') {
      problems.push('control without an accessible name: <' + control.tagName.toLowerCase() + '> ' + (control.className || ''));
    }
  }

  const ids = new Map();
  for (const element of document.querySelectorAll('[id]')) {
    ids.set(element.id, (ids.get(element.id) || 0) + 1);
  }
  for (const [id, count] of ids) {
    if (count > 1) problems.push('duplicate id: ' + id + ' (x' + count + ')');
  }

  const headings = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')]
    .filter((heading) => heading.offsetParent !== null || heading.classList.contains('visually-hidden'));
  let previous = 0;
  for (const heading of headings) {
    const level = Number(heading.tagName.slice(1));
    if (previous && level > previous + 1) {
      problems.push('heading level jumps from h' + previous + ' to h' + level + ': ' + heading.textContent.trim().slice(0, 40));
    }
    previous = level;
  }
  if (document.querySelectorAll('h1').length !== 1) {
    problems.push('the page has ' + document.querySelectorAll('h1').length + ' h1 elements');
  }

  for (const target of ['main', 'header', 'footer']) {
    if (!document.querySelector(target)) problems.push('no <' + target + '> landmark');
  }

  return problems;
})()`;

async function connect() {
  const chrome = spawn(CHROME, [
    '--headless', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    '--user-data-dir=/tmp/mgit-audit-profile',
    `--remote-debugging-port=${PORT}`, 'about:blank',
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
    throw new Error('could not reach headless Chrome on port ' + PORT);
  }

  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  let nextId = 1;
  const pending = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    }
  });

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });

  return { chrome, socket, send };
}

async function main() {
  if (!CHROME) {
    console.error('audit: no Chrome found; set CHROME to its path');
    process.exit(2);
  }
  const { chrome, socket, send } = await connect();
  await send('Page.enable');
  await send('Runtime.enable');

  let failures = 0;
  let checks = 0;

  for (const viewport of VIEWPORTS) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.name === 'phone',
    });

    for (const page of PAGES) {
      await send('Page.navigate', { url: BASE + page });
      await sleep(550);
      const { result } = await send('Runtime.evaluate', {
        expression: CHECK,
        returnByValue: true,
        awaitPromise: false,
      });
      checks += 1;
      const problems = result.value || [];
      if (problems.length > 0) {
        failures += problems.filter((line) => !line.startsWith('  ')).length;
        console.log(`\n${viewport.name} ${viewport.width}px  ${page}`);
        for (const problem of problems) console.log('  ' + problem);
      }
    }
  }

  socket.close();
  chrome.kill();

  console.log(`\n${checks} page/viewport combinations checked, ${failures} problems`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error('audit failed:', error.message);
  process.exit(2);
});
