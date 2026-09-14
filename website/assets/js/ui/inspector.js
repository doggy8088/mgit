// The inspector: what mgit just did, in the order it did it.
//
// The terminal shows the output; this panel shows the decisions behind it —
// which directories were opened, which were skipped and why, what git returned
// in each repository, and how those results became one exit code.

const EXIT_MEANINGS = {
  0: 'ok',
  1: 'failure',
  2: 'usage',
  127: 'notFound',
  128: 'git',
  129: 'git',
  130: 'interrupted',
  141: 'brokenPipe',
};

export class Inspector {
  constructor(root, options = {}) {
    this.root = root;
    this.labels = options.labels || {};
    this.body = root.querySelector('[data-inspector-body]');
    this.empty = root.querySelector('[data-inspector-empty]');
  }

  /** Render the trace of the most recent mgit run. */
  render(result) {
    if (!result || !result.run) {
      if (this.empty) this.empty.hidden = false;
      this.body.textContent = '';
      return;
    }
    if (this.empty) this.empty.hidden = true;
    const { trace, exitCode } = result.run;
    this.body.textContent = '';

    this.body.append(this.commandBlock(trace, exitCode));
    if (trace.discovery && trace.discovery.length > 0) {
      this.body.append(this.discoveryBlock(trace));
    }
    if (trace.gitRuns && trace.gitRuns.length > 0) {
      this.body.append(this.gitBlock(trace));
    }
    if (trace.aggregation) {
      this.body.append(this.aggregationBlock(trace.aggregation, exitCode));
    }
  }

  block(title) {
    const section = document.createElement('section');
    section.className = 'inspector__block';
    const heading = document.createElement('h3');
    heading.textContent = title;
    section.append(heading);
    return section;
  }

  commandBlock(trace, exitCode) {
    const section = this.block(this.labels.command || 'The command');
    const list = document.createElement('dl');
    list.className = 'kv';
    const parsed = trace.parsed || {};
    const rows = [
      [this.labels.search_root || 'Searched', trace.root],
      [this.labels.depth || 'Depth', String(trace.depth)],
      [this.labels.git_args || 'Handed to git', (trace.gitArgs || []).join(' ') || '—'],
      [this.labels.colour || 'Colour', trace.color ? (this.labels.on || 'on') : (this.labels.off || 'off')],
      [this.labels.glyphs || 'Glyphs', trace.glyphs === 'ascii' ? 'ASCII' : 'Unicode'],
      [this.labels.mode || 'Mode', parsed.mode || 'run'],
      [this.labels.exit_code || 'Exit code', String(exitCode)],
    ];
    for (const [key, value] of rows) {
      const dt = document.createElement('dt');
      dt.textContent = key;
      const dd = document.createElement('dd');
      dd.textContent = value;
      list.append(dt, dd);
    }
    section.append(list);
    return section;
  }

  discoveryBlock(trace) {
    const section = this.block(this.labels.discovery || 'The walk');
    const list = document.createElement('ol');
    list.className = 'steps';
    for (const step of trace.discovery) {
      const item = document.createElement('li');
      const tag = document.createElement('span');
      tag.className = 'steps__tag';
      tag.dataset.kind = step.kind;
      tag.textContent = this.labels['step_' + step.kind] || step.kind;
      const text = document.createElement('span');
      text.className = 'steps__text';
      text.textContent = shorten(step.path) + (step.kind === 'unreadable' && step.detail ? ' — ' + step.detail : '');
      item.append(tag, text);
      list.append(item);
    }
    section.append(list);
    return section;
  }

  gitBlock(trace) {
    const section = this.block(this.labels.git_runs || 'git, once per repository');
    const list = document.createElement('ol');
    list.className = 'steps';
    for (const entry of trace.gitRuns) {
      const item = document.createElement('li');
      const tag = document.createElement('span');
      tag.className = 'steps__tag';
      tag.dataset.kind = entry.exitCode === 0 ? 'repository' : 'unreadable';
      tag.textContent = String(entry.exitCode);
      const text = document.createElement('span');
      text.className = 'steps__text';
      text.textContent = entry.repo + ' — git ' + entry.argv.join(' ') +
        (entry.modelled === false ? ' · ' + (this.labels.not_modelled || 'not modelled in the sandbox') : '');
      item.append(tag, text);
      list.append(item);
    }
    section.append(list);
    return section;
  }

  aggregationBlock(aggregation, exitCode) {
    const section = this.block(this.labels.result || 'How that became one exit code');
    const list = document.createElement('dl');
    list.className = 'kv';
    const rows = [];
    if (aggregation.interrupted) {
      rows.push([this.labels.interrupted || 'Interrupted', this.labels.interrupted_note || 'Ctrl+C stops the whole run at once']);
    } else {
      rows.push([this.labels.total || 'Repositories', String(aggregation.total)]);
      rows.push([this.labels.succeeded || 'Succeeded', String(aggregation.succeeded)]);
      if (aggregation.failures.length > 0) {
        rows.push([
          this.labels.failed || 'Failed',
          aggregation.failures.map((failure) => failure.name + ' (' + failure.exitCode + ')').join(', '),
        ]);
      }
      if (aggregation.skipped > 0) rows.push([this.labels.skipped || 'Skipped', String(aggregation.skipped)]);
      rows.push([
        this.labels.summary_stream || 'Summary went to',
        aggregation.summaryStream === 'none'
          ? (this.labels.summary_none || 'nowhere: nothing failed and --summary was not given')
          : aggregation.summaryStream,
      ]);
    }
    rows.push([
      this.labels.exit_code || 'Exit code',
      exitCode + ' · ' + (this.labels['exit_' + (EXIT_MEANINGS[exitCode] || 'git')] || ''),
    ]);
    for (const [key, value] of rows) {
      const dt = document.createElement('dt');
      dt.textContent = key;
      const dd = document.createElement('dd');
      dd.textContent = value;
      list.append(dt, dd);
    }
    section.append(list);
    return section;
  }
}

function shorten(path) {
  return path.replace('/home/dev/work', '.');
}

export { EXIT_MEANINGS };
