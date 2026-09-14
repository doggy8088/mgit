"""HTML rendering helpers for the mgit site.

The generator writes plain HTML: no framework, no build step for the visitor.
Everything here is a small function that returns a string, so a page is a list
of blocks and a block is a tuple the content modules can read at a glance.
"""

from __future__ import annotations

import html
import re

INLINE_CODE = re.compile(r"`([^`]+)`")
BOLD = re.compile(r"\*\*([^*]+)\*\*")
LINK = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")


def esc(text: str) -> str:
    """Escape text for HTML, including quotes."""
    return html.escape(text, quote=True)


# Links written inside the content are relative to the site root ("docs/usage/"),
# because the content should not have to know how deep the page that shows it
# sits. The generator installs a resolver for each page before rendering it.
_RESOLVER = None


def set_link_resolver(resolver) -> None:
    """Install the function that turns a site root path into a page relative one."""
    global _RESOLVER
    _RESOLVER = resolver


def resolve(href: str) -> str:
    """Resolve one href, leaving absolute URLs and fragments alone."""
    if _RESOLVER is None:
        return href
    if href.startswith(("http://", "https://", "mailto:", "#", "/")):
        return href
    return _RESOLVER(href)


def inline(text: str) -> str:
    """Escape text, then re-apply the small inline markup the content uses.

    `code`, **bold** and [label](href) are the only three, which keeps the
    content files readable without pulling in a Markdown dependency.
    """
    out = esc(text)
    out = LINK.sub(lambda m: f'<a href="{esc(resolve(m.group(2)))}">{m.group(1)}</a>', out)
    out = INLINE_CODE.sub(lambda m: f"<code>{m.group(1)}</code>", out)
    out = BOLD.sub(lambda m: f"<b>{m.group(1)}</b>", out)
    return out


def attrs(**values) -> str:
    """Render HTML attributes, skipping the ones that are None or False."""
    parts = []
    for key, value in values.items():
        if value is None or value is False:
            continue
        name = key.rstrip("_").replace("_", "-")
        if value is True:
            parts.append(name)
        else:
            parts.append(f'{name}="{esc(str(value))}"')
    return (" " + " ".join(parts)) if parts else ""


def icon(name: str) -> str:
    """One of the few line icons the site uses, inline so nothing is fetched."""
    paths = {
        "copy": '<rect x="5.5" y="5.5" width="8" height="9" rx="1.5"/><path d="M10.5 5.5V3.5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h2"/>',
        "check": '<path d="M3 8.5 6.5 12 13 4.5"/>',
        "play": '<path d="M5 3.5 13 8l-8 4.5z"/>',
        "stop": '<rect x="4.5" y="4.5" width="7" height="7" rx="1"/>',
        "reset": '<path d="M3 8a5 5 0 1 0 1.6-3.7"/><path d="M3 3.5V7h3.5"/>',
        "link": '<path d="M6.5 9.5a3 3 0 0 1 0-4.2l1.8-1.8a3 3 0 0 1 4.2 4.2l-.9.9"/><path d="M9.5 6.5a3 3 0 0 1 0 4.2l-1.8 1.8a3 3 0 0 1-4.2-4.2l.9-.9"/>',
        "sun": '<circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M12.8 3.2l-1.4 1.4M4.6 11.4l-1.4 1.4"/>',
        "moon": '<path d="M13 9.5A5.5 5.5 0 0 1 6.5 3a5.5 5.5 0 1 0 6.5 6.5z"/>',
        "terminal": '<path d="M3.5 4.5 7 8l-3.5 3.5"/><path d="M8.5 11.5h4"/>',
        "book": '<path d="M2.5 3.5h4a2 2 0 0 1 2 2v8a1.6 1.6 0 0 0-1.6-1.6H2.5z"/><path d="M13.5 3.5h-4a2 2 0 0 0-2 2v8a1.6 1.6 0 0 1 1.6-1.6h4.4z"/>',
        "download": '<path d="M8 2.5v8"/><path d="M4.5 7.5 8 11l3.5-3.5"/><path d="M2.5 13.5h11"/>',
        "external": '<path d="M9.5 2.5h4v4"/><path d="M13.5 2.5 7 9"/><path d="M12 9.5v3a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3"/>',
        "shield": '<path d="M8 1.8 13 3.6v4.1c0 3-2 5.4-5 6.5-3-1.1-5-3.5-5-6.5V3.6z"/><path d="M5.8 8 7.4 9.6 10.4 6.6"/>',
        "search": '<circle cx="7.2" cy="7.2" r="4.2"/><path d="M10.4 10.4 13.5 13.5"/>',
    }
    body = paths.get(name, "")
    return (
        f'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" '
        f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">{body}</svg>'
    )


# ------------------------------------------------------------------ blocks --


def heading(level: int, ident: str, text: str, anchor_label: str) -> str:
    return f'<h{level} id="{esc(ident)}" data-anchor-label="{esc(anchor_label)}">{inline(text)}</h{level}>'


def paragraph(text: str) -> str:
    return f"<p>{inline(text)}</p>"


def unordered(items: list[str]) -> str:
    rows = "".join(f"<li>{inline(item)}</li>" for item in items)
    return f"<ul>{rows}</ul>"


def ordered(items: list[str]) -> str:
    rows = "".join(f"<li>{inline(item)}</li>" for item in items)
    return f"<ol>{rows}</ol>"


def command(text: str, copy_label: str, note: str | None = None, large: bool = False) -> str:
    classes = "cmd cmd--lg" if large else "cmd"
    block = (
        f'<div class="{classes}" data-copy-source>'
        f'<code class="cmd__text" data-copy-text>{esc(text)}</code>'
        f'<button type="button" class="cmd__copy" data-copy="{esc(text)}">'
        f'{icon("copy")}<span data-copy-label>{esc(copy_label)}</span></button>'
        f"</div>"
    )
    if note:
        block += f'<p class="cmd__note">{inline(note)}</p>'
    return block


def pre(text: str) -> str:
    return f'<pre class="block"><code>{esc(text)}</code></pre>'


def table(caption: str | None, headers: list[str], rows: list[list[str]], compact: bool = False) -> str:
    head = "".join(f"<th scope=\"col\">{inline(cell)}</th>" for cell in headers)
    body = ""
    for row in rows:
        cells = "".join(f"<td>{inline(cell)}</td>" for cell in row)
        body += f"<tr>{cells}</tr>"
    caption_html = f"<caption>{inline(caption)}</caption>" if caption else ""
    classes = "table--compact" if compact else ""
    return (
        f'<div class="table-wrap"><table class="{classes}">{caption_html}'
        f"<thead><tr>{head}</tr></thead><tbody>{body}</tbody></table></div>"
    )


def callout(kind: str, title: str, text: str) -> str:
    suffix = {"note": "", "warn": " callout--warn", "danger": " callout--danger"}[kind]
    return (
        f'<div class="callout{suffix}">'
        f'<b class="callout__title">{inline(title)}</b>{inline(text)}</div>'
    )


def try_it(href: str, label: str, command_text: str) -> str:
    return (
        f'<p class="cmd__note"><a class="btn btn--small" href="{esc(href)}">'
        f'{icon("terminal")} {esc(label)}<span class="visually-hidden">: {esc(command_text)}</span></a></p>'
    )


def render_blocks(blocks, ctx) -> str:
    """Turn the content tuples of one page into HTML."""
    out = []
    for block in blocks:
        kind = block[0]
        if kind == "h2":
            out.append(heading(2, block[1], block[2], ctx["anchor_label"]))
        elif kind == "h3":
            out.append(heading(3, block[1], block[2], ctx["anchor_label"]))
        elif kind == "p":
            out.append(paragraph(block[1]))
        elif kind == "ul":
            out.append(unordered(block[1]))
        elif kind == "ol":
            out.append(ordered(block[1]))
        elif kind == "cmd":
            out.append(command(block[1], ctx["copy"], block[2] if len(block) > 2 else None))
        elif kind == "pre":
            out.append(pre(block[1]))
        elif kind == "table":
            out.append(table(block[1], block[2], block[3]))
        elif kind == "note":
            out.append(callout("note", block[1], block[2]))
        elif kind == "warn":
            out.append(callout("warn", block[1], block[2]))
        elif kind == "try":
            scenario, cmd_text, label = block[1], block[2], block[3]
            href = f"{ctx['playground_url']}?scenario={scenario}&cmd={quote(cmd_text)}"
            out.append(try_it(href, label, cmd_text))
        elif kind == "html":
            out.append(block[1])
        else:
            raise ValueError(f"unknown block: {kind}")
    return "\n".join(out)


def quote(text: str) -> str:
    from urllib.parse import quote as urlquote

    return urlquote(text, safe="")
