// The playground: a working directory, a terminal and an explanation, wired
// together. Nothing leaves the tab — the filesystem is an object in memory and
// the binary is the port of mgit's own logic under assets/js/engine.

import { TARGETS } from '../engine/console.js';
import { Session, BUILTINS, FILTERS } from '../engine/shell.js';
import { buildScenario, restore, SCENARIOS, snapshot } from '../engine/scenarios.js';
import { stripAnsi } from '../engine/report.js';
import { Terminal } from './terminal.js';
import { WorkspaceView } from './workspace.js';
import { Inspector, EXIT_MEANINGS } from './inspector.js';
import { copyText } from './copy.js';
import { formatNote } from './notes.js';

const MGIT_FLAGS = [
  '--help', '--version', '--list', '--depth', '--quiet', '--color', '--no-color',
  '--ascii', '--summary', '--keep-going', '--fail-fast', '--allow-empty', '--',
  '-h', '-V', '-l', '-d', '-q', '-k',
];

const GIT_COMMANDS = [
  'status', 'pull', 'fetch', 'log', 'branch', 'checkout', 'switch', 'remote',
  'diff', 'stash', 'add', 'commit', 'push', 'rev-parse', 'describe', 'tag',
];

export function startPlayground(root) {
  const config = readConfig();
  const labels = config.labels || {};

  const state = {
    scenarioId: 'workbench',
    target: TARGETS['unix-tty'],
    gitAvailable: true,
    animate: true,
    session: null,
    saved: null,
    lastCommand: '',
  };

  // The session exists before anything that reads from it is built: the
  // terminal asks for the prompt while it is still being constructed.
  const initial = buildScenario('workbench');
  state.session = new Session({
    fs: initial.fs,
    cwd: initial.cwd,
    target: state.target,
    gitAvailable: state.gitAvailable,
  });

  const terminalRoot = root.querySelector('[data-terminal]');
  const workspaceRoot = root.querySelector('[data-workspace]');
  const inspectorRoot = root.querySelector('[data-inspector]');
  const chipsRoot = root.querySelector('[data-quick-commands]');
  const scenarioSelect = root.querySelector('[data-scenario]');
  const targetSelect = root.querySelector('[data-target]');
  const scenarioNote = root.querySelector('[data-scenario-note]');
  const gitToggle = root.querySelector('[data-git-toggle]');
  const animateToggle = root.querySelector('[data-animate-toggle]');

  const workspace = new WorkspaceView(workspaceRoot, {
    getFilesystem: () => state.session.fs,
    getCwd: () => state.session.cwd,
    onChange: () => {
      workspace.render();
      terminal.updatePrompt();
    },
    labels,
  });

  const inspector = new Inspector(inspectorRoot, { labels });

  const terminal = new Terminal(terminalRoot, {
    historyKey: 'mgit-playground-history',
    labels,
    prompt: () => (state.session ? state.session.cwd : '/home/dev/work').replace('/home/dev', '~'),
    execute: (line) => {
      state.lastCommand = line;
      state.saved = snapshot(state.session.fs);
      const result = state.session.execute(line);
      return decorate(result, labels);
    },
    interrupt: (completedRepos) => {
      // Put the workspace back the way the run found it, then run the very
      // same line again with the interrupt in place.
      restore(state.session.fs, state.saved);
      const rerun = state.session.executeInterrupted(state.lastCommand, completedRepos);
      if (!rerun) return decorate({ lines: [], exitCode: 130, notes: [] }, labels);
      rerun.notes = [{ kind: 'interrupt' }];
      return decorate(rerun, labels);
    },
    formatNote: (note) => formatNote(note, labels),
    onReset: () => loadScenario(state.scenarioId, { keepTerminal: true }),
    onResult: (result) => {
      workspace.render();
      inspector.render(result);
    },
  });

  function loadScenario(id, options = {}) {
    const built = buildScenario(id);
    state.scenarioId = built.id;
    state.session = new Session({
      fs: built.fs,
      cwd: built.cwd,
      target: state.target,
      gitAvailable: state.gitAvailable,
    });
    if (scenarioSelect) scenarioSelect.value = built.id;
    if (scenarioNote) {
      scenarioNote.textContent = (config.scenarios && config.scenarios[built.id] && config.scenarios[built.id].blurb) || '';
    }
    renderChips(built.id);
    workspace.render();
    inspector.render(null);
    terminal.updatePrompt();
    if (!options.keepTerminal) {
      terminal.clear();
      terminal.info((labels.scenario_loaded || 'Loaded workspace: ') +
        ((config.scenarios && config.scenarios[built.id] && config.scenarios[built.id].name) || built.id));
    }
    updateUrl();
  }

  function renderChips(id) {
    if (!chipsRoot) return;
    const scenario = SCENARIOS.find((entry) => entry.id === id);
    chipsRoot.textContent = '';
    for (const command of (scenario && scenario.commands) || []) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = command;
      chip.addEventListener('click', () => {
        terminal.focus();
        terminal.submit(command);
      });
      chipsRoot.append(chip);
    }
  }

  function updateUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set('scenario', state.scenarioId);
    if (state.lastCommand) url.searchParams.set('cmd', state.lastCommand);
    else url.searchParams.delete('cmd');
    window.history.replaceState(null, '', url);
  }

  if (scenarioSelect) {
    scenarioSelect.addEventListener('change', () => loadScenario(scenarioSelect.value));
  }
  if (targetSelect) {
    targetSelect.addEventListener('change', () => {
      state.target = TARGETS[targetSelect.value] || TARGETS['unix-tty'];
      state.session.target = state.target;
      terminal.info((labels.target_changed || 'Output target: ') +
        targetSelect.options[targetSelect.selectedIndex].text);
    });
  }
  if (gitToggle) {
    gitToggle.addEventListener('click', () => {
      state.gitAvailable = !state.gitAvailable;
      state.session.gitAvailable = state.gitAvailable;
      gitToggle.setAttribute('aria-pressed', String(!state.gitAvailable));
      terminal.info(state.gitAvailable
        ? (labels.git_back || 'git is on PATH again.')
        : (labels.git_gone || 'git has been taken off PATH. Every run now ends in 127.'));
    });
  }
  if (animateToggle) {
    animateToggle.addEventListener('click', () => {
      state.animate = !state.animate;
      terminal.options.animate = state.animate;
      animateToggle.setAttribute('aria-pressed', String(state.animate));
    });
    animateToggle.setAttribute('aria-pressed', 'true');
  }

  const copyButton = root.querySelector('[data-copy-transcript]');
  if (copyButton) {
    copyButton.addEventListener('click', async () => {
      await copyText(terminal.toText(), copyButton, labels);
    });
  }

  const shareButton = root.querySelector('[data-share]');
  if (shareButton) {
    shareButton.addEventListener('click', async () => {
      updateUrl();
      await copyText(window.location.href, shareButton, labels);
    });
  }

  const resetButton = root.querySelector('[data-reset]');
  if (resetButton) {
    resetButton.addEventListener('click', () => loadScenario(state.scenarioId));
  }

  terminal.options.complete = (token, line) => completions(token, line, state);

  const params = new URLSearchParams(window.location.search);
  const requested = params.get('scenario');
  loadScenario(requested && SCENARIOS.some((entry) => entry.id === requested) ? requested : 'workbench');

  const command = params.get('cmd');
  if (command) {
    window.setTimeout(() => terminal.submit(command), 60);
  } else {
    terminal.info(labels.welcome || 'Type a command, or pick one below. Everything runs in this tab.');
  }

  return { terminal, workspace, inspector };
}

function decorate(result, labels) {
  const meaning = EXIT_MEANINGS[result.exitCode];
  return {
    ...result,
    exitMeaning: meaning ? labels['exit_' + meaning] : labels.exit_git,
  };
}

function completions(token, line, state) {
  const words = line.trim().split(/\s+/);
  const first = words[0];

  if (words.length <= 1) {
    return ['mgit', ...BUILTINS].filter((name) => name.startsWith(token)).sort();
  }
  if (first === 'mgit') {
    if (token.startsWith('-')) return MGIT_FLAGS.filter((flag) => flag.startsWith(token));
    return GIT_COMMANDS.filter((name) => name.startsWith(token));
  }
  if (first === 'git') {
    return GIT_COMMANDS.filter((name) => name.startsWith(token));
  }
  if (first === 'cd' || first === 'ls' || first === 'tree' || first === 'cat') {
    const listing = state.session.fs.readDir(state.session.cwd);
    if (!listing.ok) return [];
    return listing.entries.map((entry) => entry.name).filter((name) => name.startsWith(token));
  }
  if (words.length > 1 && line.includes('|')) {
    return FILTERS.filter((name) => name.startsWith(token));
  }
  return [];
}

function readConfig() {
  const element = document.getElementById('site-config');
  if (!element) return {};
  try {
    return JSON.parse(element.textContent);
  } catch (error) {
    console.error('mgit playground: the page configuration could not be parsed', error);
    return {};
  }
}

export { stripAnsi };
