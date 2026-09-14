// The sandbox reports what it did as data; this turns that data into the
// sentence the visitor reads, in the language of the page.

/**
 * @param {object|string} note
 * @param {Record<string, string>} labels
 * @returns {string}
 */
export function formatNote(note, labels = {}) {
  if (typeof note === 'string') return note;
  if (!note || typeof note !== 'object') return '';

  const fill = (template, values) =>
    Object.entries(values).reduce(
      (text, [key, value]) => text.split('{' + key + '}').join(String(value)),
      template,
    );

  switch (note.kind) {
    case 'redirect':
      return fill(labels.note_redirect || '{stream} went to {path} ({lines} lines). Read it back with `cat {path}`.', note);
    case 'sigpipe':
      return fill(labels.note_sigpipe || 'head closed the pipe after {count} lines.', note);
    case 'unmodelled':
      return fill(labels.note_unmodelled || '{command} is not modelled in the sandbox.', note);
    case 'unknown-command':
      return fill(labels.note_unknown_command || 'The sandbox knows mgit plus {commands}.', note);
    case 'interrupt':
      return labels.interrupt_note || '';
    default:
      return '';
  }
}
