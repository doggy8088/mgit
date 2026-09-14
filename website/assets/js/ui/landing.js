// The three live pieces of the front page: a terminal you can type in, a
// slider over --depth, and a look at which stream each line went to. They all
// drive the same engine the playground uses, so nothing on this page is a
// picture of output that once existed.

import { Session } from '../engine/shell.js';
import { buildScenario } from '../engine/scenarios.js';
import { TARGETS } from '../engine/console.js';
import { discover } from '../engine/discovery.js';
import { run, streamText } from '../engine/run.js';
import { EXIT_MEANINGS } from './inspector.js';
import { Terminal } from './terminal.js';
import { formatNote } from './notes.js';

export function startLanding(config) {
  const labels = config.labels || {};
  initDemoTerminal(labels);
  initDepthExplorer(labels);
  initStreamDemo(labels);
}

function initDemoTerminal(labels) {
  const root = document.querySelector('[data-landing-demo] [data-terminal]');
  if (!root) return;
  const host = root.closest('[data-landing-demo]');

  let built = buildScenario('workbench');
  let session = new Session({ fs: built.fs, cwd: built.cwd, target: TARGETS['unix-tty'] });
  let saved = null;
  let lastCommand = '';

  const terminal = new Terminal(root, {
    historyKey: 'mgit-landing-history',
    labels,
    prompt: () => session.cwd.replace('/home/dev', '~'),
    execute: (line) => {
      lastCommand = line;
      saved = JSON.parse(JSON.stringify(session.fs.root));
      return decorate(session.execute(line), labels);
    },
    interrupt: (completed) => {
      session.fs.root = JSON.parse(JSON.stringify(saved));
      const rerun = session.executeInterrupted(lastCommand, completed);
      if (!rerun) return decorate({ lines: [], exitCode: 130, notes: [] }, labels);
      rerun.notes = [{ kind: 'interrupt' }];
      return decorate(rerun, labels);
    },
    formatNote: (note) => formatNote(note, labels),
    onReset: () => {
      built = buildScenario('workbench');
      session = new Session({ fs: built.fs, cwd: built.cwd, target: TARGETS['unix-tty'] });
    },
  });

  for (const chip of host.querySelectorAll('[data-demo-command]')) {
    chip.addEventListener('click', () => {
      terminal.focus();
      terminal.submit(chip.dataset.demoCommand);
    });
  }

  const auto = host.dataset.autorun;
  if (auto) {
    const start = () => terminal.submit(auto);
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          start();
        }
      }, { threshold: 0.25 });
      observer.observe(root);
    } else {
      start();
    }
  }
}

function initDepthExplorer(labels) {
  const root = document.querySelector('[data-depth-explorer]');
  if (!root) return;
  const range = root.querySelector('[data-depth-range]');
  const value = root.querySelector('[data-depth-value]');
  const answer = root.querySelector('[data-depth-answer]');
  const treeBox = root.querySelector('[data-depth-tree]');
  const outputBox = root.querySelector('[data-depth-output]');

  const render = () => {
    const depth = Number.parseInt(range.value, 10);
    const built = buildScenario('nested');
    const session = new Session({ fs: built.fs, cwd: built.cwd, target: TARGETS.pipe });
    const found = discover(built.fs, built.cwd, depth);
    const result = run({
      fs: built.fs,
      cwd: built.cwd,
      argv: ['--depth', String(depth), '--list'],
      target: TARGETS.pipe,
    });

    value.textContent = String(depth);
    answer.textContent = (labels.depth_found || '{n} repositories found')
      .replace('{n}', String(found.repositories.length));
    treeBox.textContent = session.execute('tree -L 2').lines.map((line) => line.text).join('');
    outputBox.textContent = streamText(result.chunks, 1) || '—';
  };

  range.addEventListener('input', render);
  render();
}

function initStreamDemo(labels) {
  const root = document.querySelector('[data-stream-demo]');
  if (!root) return;
  const commandsBox = root.querySelector('[data-stream-commands]');
  const fileBox = root.querySelector('[data-stream-file]');
  const screenBox = root.querySelector('[data-stream-screen]');
  const noteBox = root.querySelector('[data-stream-note]');

  const commands = [
    'mgit status -s > status.txt',
    'mgit --summary > status.txt',
    'mgit pull > status.txt',
  ];

  const render = (command) => {
    const built = buildScenario('workbench');
    const session = new Session({ fs: built.fs, cwd: built.cwd, target: TARGETS.pipe });
    const result = session.execute(command);
    const file = session.fs.lookup(built.cwd + '/status.txt');
    fileBox.textContent = (file && file.node.content) || '—';
    screenBox.textContent = result.lines.map((line) => line.text).join('') || '—';
    noteBox.textContent = (result.notes || []).join(' ');
    for (const chip of commandsBox.querySelectorAll('button')) {
      chip.setAttribute('aria-pressed', String(chip.textContent === command));
    }
  };

  for (const command of commands) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = command;
    chip.setAttribute('aria-pressed', 'false');
    chip.addEventListener('click', () => render(command));
    commandsBox.append(chip);
  }
  render(commands[1]);
}

function decorate(result, labels) {
  const meaning = EXIT_MEANINGS[result.exitCode];
  return { ...result, exitMeaning: meaning ? labels['exit_' + meaning] : labels.exit_git };
}
