// The terminal view.
//
// It plays a run back repository by repository, because that is how a real
// mgit run arrives: one header, then whatever git had to say, then the next.
// Ctrl+C during the playback is not a trick either — the run is recomputed
// from the same starting state with the interrupt applied, so the exit code
// you get is the one the real program would return.

import { appendAnsi } from './ansi.js';
import { stripAnsi } from '../engine/report.js';

const STEP_DELAY = 90;
const MAX_PLAYBACK = 2400;

export class Terminal {
  /**
   * @param {HTMLElement} root
   * @param {object} options
   */
  constructor(root, options) {
    this.root = root;
    this.options = options;
    this.screen = root.querySelector('[data-term-screen]');
    this.input = root.querySelector('[data-term-input]');
    this.promptLabel = root.querySelector('[data-term-prompt]');
    this.stopButton = root.querySelector('[data-term-stop]');
    this.labels = options.labels || {};
    this.history = loadHistory(options.historyKey);
    this.historyIndex = this.history.length;
    this.draft = '';
    this.playback = null;

    // The screen ships with the "this needs JavaScript" line in it. Now that
    // the script is running, that line is no longer true.
    this.screen.textContent = '';

    if (this.input) {
      this.input.addEventListener('keydown', (event) => this.onKeyDown(event));
      root.addEventListener('click', (event) => {
        if (window.getSelection && String(window.getSelection()).length > 0) return;
        if (event.target.closest('button, a, input, select')) return;
        this.input.focus();
      });
    }
    if (this.stopButton) {
      this.stopButton.hidden = true;
      this.stopButton.addEventListener('click', () => this.interrupt());
    }
    this.updatePrompt();
  }

  get animationEnabled() {
    if (this.options.animate === false) return false;
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  updatePrompt() {
    const prompt = this.options.prompt ? this.options.prompt() : '~';
    if (this.promptLabel) this.promptLabel.textContent = prompt;
    for (const element of this.root.querySelectorAll('[data-term-prompt-live]')) {
      element.textContent = prompt;
    }
  }

  focus() {
    if (this.input) this.input.focus();
  }

  clear() {
    this.screen.textContent = '';
  }

  /** Write a line of the sandbox's own voice, not of a command. */
  info(text) {
    const note = document.createElement('span');
    note.className = 'term__note';
    note.textContent = text;
    this.screen.append(note);
    this.scroll();
  }

  scroll() {
    this.screen.scrollTop = this.screen.scrollHeight;
  }

  onKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      const line = this.input.value;
      this.input.value = '';
      this.submit(line);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.recall(-1);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.recall(1);
      return;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      this.complete();
      return;
    }
    if (event.key === 'c' && (event.ctrlKey || event.metaKey) && this.input.selectionStart === this.input.selectionEnd) {
      if (this.playback) {
        event.preventDefault();
        this.interrupt();
        return;
      }
      if (this.input.value.length > 0) {
        event.preventDefault();
        this.echo(this.input.value + '^C');
        this.input.value = '';
      }
      return;
    }
    if (event.key === 'l' && event.ctrlKey) {
      event.preventDefault();
      this.clear();
    }
  }

  recall(direction) {
    if (this.history.length === 0) return;
    if (this.historyIndex === this.history.length) this.draft = this.input.value;
    const next = Math.min(this.history.length, Math.max(0, this.historyIndex + direction));
    this.historyIndex = next;
    this.input.value = next === this.history.length ? this.draft : this.history[next];
    window.requestAnimationFrame(() => {
      this.input.setSelectionRange(this.input.value.length, this.input.value.length);
    });
  }

  complete() {
    if (!this.options.complete) return;
    const value = this.input.value;
    const parts = value.split(/\s+/);
    const token = parts[parts.length - 1];
    const candidates = this.options.complete(token, value);
    if (candidates.length === 0) return;
    if (candidates.length === 1) {
      parts[parts.length - 1] = candidates[0];
      this.input.value = parts.join(' ') + (candidates[0].endsWith('/') ? '' : ' ');
      return;
    }
    const shared = commonPrefix(candidates);
    if (shared.length > token.length) {
      parts[parts.length - 1] = shared;
      this.input.value = parts.join(' ');
    }
    this.info(candidates.join('   '));
  }

  echo(line) {
    const row = document.createElement('span');
    row.className = 'term__prompt-line';
    const prompt = document.createElement('span');
    prompt.className = 'term__prompt';
    prompt.textContent = (this.options.prompt ? this.options.prompt() : '~') + ' $ ';
    const command = document.createElement('span');
    command.className = 'term__echo';
    command.textContent = line + '\n';
    row.append(prompt, command);
    this.screen.append(row);
    this.scroll();
    return row;
  }

  /** Run a line as if the visitor had typed it. */
  submit(line) {
    if (this.playback) return;
    const trimmed = line.trim();
    this.echo(line);
    if (trimmed.length === 0) return;

    this.history = this.history.filter((entry) => entry !== trimmed).concat(trimmed).slice(-60);
    this.historyIndex = this.history.length;
    saveHistory(this.options.historyKey, this.history);

    const result = this.options.execute(trimmed);
    if (result.cleared) {
      this.clear();
      this.afterCommand(result);
      return;
    }
    if (result.reset && this.options.onReset) {
      this.options.onReset();
      this.clear();
      this.info(this.labels.reset_done || 'The workspace was put back the way it started.');
      this.afterCommand(result);
      return;
    }

    const steps = result.run && result.run.steps ? result.run.steps : null;
    const repoSteps = steps ? steps.filter((step) => step.kind === 'repo').length : 0;

    if (!result.animatable || !steps || repoSteps < 2 || !this.animationEnabled) {
      this.renderChunks(result.lines);
      this.finish(result);
      return;
    }
    this.play(result, steps, repoSteps);
  }

  play(result, steps, repoSteps) {
    const container = document.createElement('span');
    this.screen.append(container);
    const delay = Math.min(STEP_DELAY, Math.max(24, Math.floor(MAX_PLAYBACK / repoSteps)));
    let index = 0;
    let completedRepos = 0;

    this.playback = { result, container, completed: () => completedRepos };
    if (this.stopButton) this.stopButton.hidden = false;
    this.root.dataset.running = 'true';

    const tick = () => {
      if (!this.playback) return;
      if (index >= steps.length) {
        this.endPlayback();
        this.finish(result);
        return;
      }
      const step = steps[index];
      index += 1;
      this.renderChunks(step.chunks, container);
      if (step.kind === 'repo') completedRepos += 1;
      this.scroll();
      this.playback.timer = window.setTimeout(tick, step.kind === 'repo' ? delay : 0);
    };
    tick();
  }

  endPlayback() {
    if (this.playback && this.playback.timer) window.clearTimeout(this.playback.timer);
    this.playback = null;
    if (this.stopButton) this.stopButton.hidden = true;
    delete this.root.dataset.running;
  }

  /** Ctrl+C: recompute the same run with the interrupt applied. */
  interrupt() {
    if (!this.playback || !this.options.interrupt) return;
    const { container, completed } = this.playback;
    const completedRepos = completed();
    this.endPlayback();
    const interrupted = this.options.interrupt(completedRepos);
    container.textContent = '';
    this.renderChunks(interrupted.lines, container);
    const marker = document.createElement('span');
    marker.className = 'term__out';
    marker.textContent = '^C\n';
    container.append(marker);
    this.finish(interrupted);
  }

  renderChunks(chunks, container) {
    const target = container || this.screen;
    for (const chunk of chunks) appendAnsi(target, chunk.text, chunk.fd);
    this.scroll();
  }

  finish(result) {
    const exit = document.createElement('span');
    exit.className = 'term__exit';
    exit.dataset.ok = String(result.exitCode === 0);
    const label = document.createElement('span');
    label.textContent = this.labels.exit || 'exit';
    const code = document.createElement('b');
    code.textContent = String(result.exitCode);
    exit.append(label, code);
    if (result.exitMeaning) {
      const meaning = document.createElement('span');
      meaning.textContent = '· ' + result.exitMeaning;
      exit.append(meaning);
    }
    this.screen.append(exit, document.createTextNode('\n'));

    for (const note of result.notes || []) {
      const text = this.options.formatNote ? this.options.formatNote(note) : String(note);
      if (text) this.info(text);
    }
    this.afterCommand(result);
  }

  afterCommand(result) {
    this.updatePrompt();
    this.scroll();
    if (this.options.onResult) this.options.onResult(result);
  }

  /** The whole screen as plain text, for the copy button. */
  toText() {
    return stripAnsi(this.screen.textContent || '');
  }
}

function commonPrefix(values) {
  let prefix = values[0];
  for (const value of values) {
    while (!value.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return prefix;
}

function loadHistory(key) {
  if (!key) return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((entry) => typeof entry === 'string') : [];
  } catch (error) {
    // Private mode and blocked storage are fine; the session just forgets.
    return [];
  }
}

function saveHistory(key, history) {
  if (!key) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(history));
  } catch (error) {
    // Nothing to do: history stays in memory for this page view.
  }
}
