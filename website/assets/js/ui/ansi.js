// Turn the escape sequences mgit writes into elements the page can style.
// The terminal renders the very same byte stream the binary produces, so what
// you see here is a parse of real output rather than a re-implementation of it.

const ESC = String.fromCharCode(27);
const PATTERN = new RegExp(ESC + '\\[([0-9;]*)m', 'g');

const CLASS_FOR_CODE = {
  '0;36': 'ansi-cyan',
  '36': 'ansi-cyan',
  '1;33': 'ansi-yellow',
  '33': 'ansi-yellow',
  '1;32': 'ansi-green',
  '32': 'ansi-green',
  '0;31': 'ansi-red',
  '31': 'ansi-red',
  '1': 'ansi-bold',
};

/**
 * Split text into styled runs.
 * @returns {{text: string, className: string|null}[]}
 */
export function parseAnsi(text) {
  const runs = [];
  let index = 0;
  let className = null;
  PATTERN.lastIndex = 0;

  for (;;) {
    const match = PATTERN.exec(text);
    if (!match) break;
    if (match.index > index) {
      runs.push({ text: text.slice(index, match.index), className });
    }
    const code = match[1];
    className = code === '' || code === '0' ? null : CLASS_FOR_CODE[code] || null;
    index = match.index + match[0].length;
  }
  if (index < text.length) runs.push({ text: text.slice(index), className });
  return runs;
}

/** Render a chunk of output into a container element. */
export function appendAnsi(container, text, fd) {
  const wrapper = document.createElement('span');
  wrapper.className = 'term__out';
  wrapper.dataset.fd = String(fd);
  for (const run of parseAnsi(text)) {
    if (run.className) {
      const span = document.createElement('span');
      span.className = run.className;
      span.textContent = run.text;
      wrapper.append(span);
    } else {
      wrapper.append(document.createTextNode(run.text));
    }
  }
  container.append(wrapper);
  return wrapper;
}
