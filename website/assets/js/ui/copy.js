// Copying to the clipboard, with the fallback that a page served over plain
// HTTP or opened from a file still needs. Failure is shown on the button
// rather than swallowed: a copy button that quietly does nothing is worse than
// one that admits it.

/**
 * @param {string} text
 * @param {HTMLElement} button feedback is written into [data-copy-label]
 * @param {Record<string, string>} labels
 */
export async function copyText(text, button, labels = {}) {
  const done = labels.copied || 'Copied';
  const failed = labels.copy_failed || 'Press Ctrl+C';
  const label = button.querySelector('[data-copy-label]') || button;
  const original = button.dataset.originalLabel || label.textContent;
  button.dataset.originalLabel = original;

  const restore = () => {
    window.setTimeout(() => {
      label.textContent = original;
      delete button.dataset.state;
    }, 1800);
  };

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else if (!legacyCopy(text)) {
      throw new Error('execCommand copy was refused');
    }
    label.textContent = done;
    button.dataset.state = 'done';
    restore();
    return true;
  } catch (error) {
    label.textContent = failed;
    button.dataset.state = 'failed';
    selectFallback(button, text);
    restore();
    return false;
  }
}

/** The pre-clipboard-API path, which still works on an insecure origin. */
function legacyCopy(text) {
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.top = '-1000px';
  area.style.opacity = '0';
  document.body.append(area);
  area.select();
  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch (error) {
    copied = false;
  }
  area.remove();
  return copied;
}

/**
 * When both paths fail, put the text where the visitor can copy it by hand.
 */
function selectFallback(button, text) {
  const source = button.closest('[data-copy-source]');
  const target = source ? source.querySelector('[data-copy-text]') : null;
  if (!target || !window.getSelection) return;
  const range = document.createRange();
  range.selectNodeContents(target);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

/** Wire every copy button on the page. */
export function initCopyButtons(labels = {}) {
  for (const button of document.querySelectorAll('[data-copy]')) {
    button.addEventListener('click', async () => {
      const value = button.dataset.copy ||
        (button.closest('[data-copy-source]') || document).querySelector('[data-copy-text]').textContent;
      await copyText(value, button, labels);
    });
  }
}
