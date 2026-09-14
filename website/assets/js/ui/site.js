// Page furniture: the theme switch, copy buttons, the table of contents that
// follows the reading position, and the small tab groups on the install
// section. Everything degrades to a usable page when this file never loads.

import { initCopyButtons } from './copy.js';

const THEME_KEY = 'mgit-theme';

export function initTheme() {
  const toggle = document.querySelector('[data-theme-toggle]');
  const media = window.matchMedia('(prefers-color-scheme: dark)');

  const current = () => document.documentElement.dataset.theme || 'light';
  const label = () => (current() === 'dark'
    ? toggle.dataset.labelLight
    : toggle.dataset.labelDark);

  const sync = () => {
    if (!toggle) return;
    toggle.setAttribute('aria-pressed', String(current() === 'dark'));
    if (toggle.dataset.labelDark) toggle.setAttribute('title', label());
    if (toggle.dataset.labelDark) toggle.setAttribute('aria-label', label());
  };

  if (toggle) {
    toggle.addEventListener('click', () => {
      const next = current() === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try {
        window.localStorage.setItem(THEME_KEY, next);
      } catch (error) {
        // A locked store only means the choice does not outlive the tab.
      }
      sync();
    });
    sync();
  }

  const onSystemChange = (event) => {
    let stored = null;
    try {
      stored = window.localStorage.getItem(THEME_KEY);
    } catch (error) {
      stored = null;
    }
    if (stored === 'light' || stored === 'dark') return;
    document.documentElement.dataset.theme = event.matches ? 'dark' : 'light';
    sync();
  };

  if (media.addEventListener) media.addEventListener('change', onSystemChange);
  else if (media.addListener) media.addListener(onSystemChange);
}

export function initTabs() {
  for (const group of document.querySelectorAll('[data-tabs]')) {
    const tabs = [...group.querySelectorAll('[role="tab"]')];
    const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));

    const select = (index) => {
      tabs.forEach((tab, position) => {
        const selected = position === index;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
        if (panels[position]) panels[position].hidden = !selected;
      });
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(index));
      tab.addEventListener('keydown', (event) => {
        const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
        if (direction === 0) return;
        event.preventDefault();
        const next = (index + direction + tabs.length) % tabs.length;
        select(next);
        tabs[next].focus();
      });
    });
    select(0);
  }
}

export function initToc() {
  const toc = document.querySelector('[data-toc]');
  if (!toc) return;
  const links = [...toc.querySelectorAll('a[href^="#"]')];
  if (links.length === 0) return;

  const headings = links
    .map((link) => document.getElementById(decodeURIComponent(link.hash.slice(1))))
    .filter(Boolean);

  const mark = (id) => {
    for (const link of links) {
      link.setAttribute('aria-current', String(link.hash === '#' + id));
    }
  };

  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top);
    if (visible.length > 0) mark(visible[0].target.id);
  }, { rootMargin: '-80px 0px -70% 0px', threshold: 0 });

  for (const heading of headings) observer.observe(heading);
}

/** Give every section heading a link you can copy. */
export function initAnchors() {
  for (const heading of document.querySelectorAll('.prose h2[id], .prose h3[id]')) {
    if (heading.querySelector('.anchor')) continue;
    const anchor = document.createElement('a');
    anchor.className = 'anchor';
    anchor.href = '#' + heading.id;
    anchor.textContent = '#';
    anchor.setAttribute('aria-label', (heading.dataset.anchorLabel || 'Link to this section') + ': ' + heading.textContent);
    heading.append(anchor);
  }
}

export function initSite(labels = {}) {
  initTheme();
  initCopyButtons(labels);
  initTabs();
  initToc();
  initAnchors();
}
