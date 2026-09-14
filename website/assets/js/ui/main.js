// The single entry point every page loads. It reads the page configuration,
// wires the furniture, and starts whichever interactive parts this page has.

import { initSite } from './site.js';

function readConfig() {
  const element = document.getElementById('site-config');
  if (!element) return { labels: {} };
  try {
    return JSON.parse(element.textContent);
  } catch (error) {
    console.error('mgit site: the page configuration could not be parsed', error);
    return { labels: {} };
  }
}

const config = readConfig();
initSite(config.labels || {});

if (document.querySelector('[data-playground]')) {
  import('./playground.js')
    .then((module) => module.startPlayground(document.querySelector('[data-playground]').closest('body')))
    .catch((error) => console.error('mgit playground failed to start', error));
}

if (document.querySelector('[data-landing]')) {
  import('./landing.js')
    .then((module) => module.startLanding(config))
    .catch((error) => console.error('mgit landing demo failed to start', error));
}
