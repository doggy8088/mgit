"""Shared components for the mgit website build.

The site ships as static HTML; this module only assembles strings. Nothing here
runs in the browser.
"""

import html
import json

REPO = "https://github.com/doggy8088/mgit"
RELEASE = REPO + "/releases"
NPM = "https://www.npmjs.com/package/@willh/mgit"
VERSION = "2.0.2"

INSTALL_SH = (
    "curl -fsSL https://raw.githubusercontent.com/doggy8088/mgit/main/install.sh | sh"
)
INSTALL_PS = "irm https://raw.githubusercontent.com/doggy8088/mgit/main/install.ps1 | iex"

CHAPTERS = [
    (
        "use-cases",
        "01",
        "使用情境",
        "When to use it",
        "為什麼會有 mgit：散落各處、彼此互相參考、又沒有用 submodule 的 repo",
        "Why mgit exists: repositories that reference each other and are not wired together with submodules",
    ),
    (
        "install",
        "02",
        "安裝",
        "Install",
        "三種安裝方式、驗證檢查碼，以及從原始碼建置",
        "Three install paths, checksum verification, and building from source",
    ),
    (
        "options",
        "03",
        "選項",
        "Options",
        "十三個選項、解析規則與常用範例",
        "The thirteen options, the parsing rule, and everyday examples",
    ),
    (
        "output",
        "04",
        "輸出與行為",
        "Output and behavior",
        "標題格式、安靜的儲存庫、摘要與顏色政策",
        "Headers, quiet repositories, the summary and the color policy",
    ),
    (
        "discovery",
        "05",
        "它怎麼找儲存庫",
        "Repository discovery",
        "深度、worktree、submodule、symlink 與跨平台一致的排序",
        "Depth, worktrees, submodules, symlinks and one ordering on every OS",
    ),
    (
        "exit-codes",
        "06",
        "結束代碼與環境變數",
        "Exit codes and environment",
        "成敗如何回報，環境如何覆寫預設值",
        "How the run reports success, and how the environment overrides it",
    ),
    (
        "platforms",
        "07",
        "跨平台行為",
        "Cross-platform behavior",
        "Windows 主控台、locale、SIGPIPE 與 git 的尋找方式",
        "Windows consoles, locales, SIGPIPE and how git is located",
    ),
    (
        "changes",
        "08",
        "版本、發行與 npm",
        "Versions, releases and npm",
        "與 1.0 的差異、標籤驅動的發行流程與 npm 套件",
        "Differences from 1.0, the tag-driven release flow and the npm package",
    ),
]

UI = {
    "zh": {
        "skip": "跳至主要內容",
        "docs": "文件",
        "github": "GitHub",
        "releases": "發行檔",
        "npm": "npm",
        "lang_label": "語言",
        "nav_site": "網站",
        "theme_toggle": "深色主題",
        "copy": "複製",
        "copied": "已複製",
        "copy_failed": "請手動複製",
        "replay": "重播",
        "chapters": "章節",
        "prev": "上一章",
        "next": "下一章",
    },
    "en": {
        "skip": "Skip to content",
        "docs": "Docs",
        "github": "GitHub",
        "releases": "Releases",
        "npm": "npm",
        "lang_label": "Language",
        "nav_site": "Site",
        "theme_toggle": "Dark theme",
        "copy": "Copy",
        "copied": "Copied",
        "copy_failed": "Copy manually",
        "replay": "Replay",
        "chapters": "Chapters",
        "prev": "Previous chapter",
        "next": "Next chapter",
    },
}

SVG_ARROW = (
    '<svg class="logbook__arrow" viewBox="0 0 20 20" aria-hidden="true" focusable="false">'
    '<path d="M4 10h11M11 5.5 15.5 10 11 14.5" fill="none" stroke="currentColor" '
    'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
)

SVG_COPY = (
    '<svg class="switch__glyph" viewBox="0 0 16 16" aria-hidden="true" focusable="false">'
    '<rect x="2.5" y="2.5" width="8" height="11" fill="none" stroke="currentColor" stroke-width="1.4"/>'
    '<path d="M5.5 2.5V1h8v11h-1.5" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>'
)

SVG_REPLAY = (
    '<svg class="replay__glyph" viewBox="0 0 16 16" aria-hidden="true" focusable="false">'
    '<path d="M2.5 8a5.5 5.5 0 1 1 1.7 4" fill="none" stroke="currentColor" stroke-width="1.5" '
    'stroke-linecap="round"/><path d="M2.5 8V4.4M2.5 8h3.6" fill="none" stroke="currentColor" '
    'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
)

# The theme switch's mark: the switch is drawn like the copy switch (sharp
# corners, 1.4 stroke) and the left half of the field is inked, so the control
# says "paper, or ink" at 16px without a second colour.
SVG_THEME = (
    '<svg class="themeswitch__glyph" viewBox="0 0 16 16" aria-hidden="true" focusable="false">'
    '<rect x="2.5" y="2.5" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.4"/>'
    '<path d="M2.5 2.5h5.5v11H2.5z" fill="currentColor"/></svg>'
)

# Decided in <head>, before the stylesheet, so the first paint is already the
# right paper. A stored choice wins; without one the system decides. Nothing
# here may throw: a blocked localStorage (private mode) must not break the page.
THEME_SCRIPT = (
    "<script>(function () {\n"
    '  var stored = null;\n'
    '  var system = "light";\n'
    "  try {\n"
    '    stored = window.localStorage.getItem("mgit-theme");\n'
    "  } catch (error) {\n"
    "    stored = null;\n"
    "  }\n"
    "  try {\n"
    '    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) system = "dark";\n'
    "  } catch (error) {\n"
    '    system = "light";\n'
    "  }\n"
    '  document.documentElement.setAttribute("data-theme", stored === "light" || stored === "dark" ? stored : system);\n'
    "})();</script>"
)


def esc(text):
    return html.escape(text, quote=False)


def window(command, lang, label=None, plate=False):
    """A punched window around one command.

    `plate=True` is reserved for the official install commands: the page's one
    primary action, printed on the instrument's graphite.
    """
    t = UI[lang]
    head = '<span class="label">' + esc(label) + "</span>" if label else ""
    return (
        '<div class="window' + (" window--plate" if plate else "") + '">'
        + head
        + '<span class="window__cmd" tabindex="0">'
        + esc(command)
        + "</span>"
        + '<button type="button" class="switch" data-copy="'
        + html.escape(command, quote=True)
        + '" data-label-copied="'
        + esc(t["copied"])
        + '" data-label-failed="'
        + esc(t["copy_failed"])
        + '">'
        + SVG_COPY
        + "<span data-copy-label aria-live=\"polite\">"
        + esc(t["copy"])
        + "</span></button></div>"
    )


def cmdline(command, lang, label=None):
    """One command printed on the paper, with a quiet copy control."""
    t = UI[lang]
    note = '<span class="cmdline__note">' + esc(label) + "</span>" if label else ""
    return (
        '<div class="cmdline"><span class="cmdline__text" tabindex="0">'
        + esc(command)
        + "</span>"
        + note
        + '<button type="button" class="switch switch--ghost" data-copy="'
        + html.escape(command, quote=True)
        + '" data-label-copied="'
        + esc(t["copied"])
        + '" data-label-failed="'
        + esc(t["copy_failed"])
        + '"><span data-copy-label aria-live="polite">'
        + esc(t["copy"])
        + "</span></button></div>"
    )


def logbook_rows(lang, root=""):
    """The seven chapters as logbook rows; used by the landing and the index."""
    rows = []
    for slug, ch, zh_title, en_title, zh_desc, en_desc in CHAPTERS:
        rows.append(
            '<a class="logbook__row" href="'
            + root
            + slug
            + '.html"><span class="logbook__ch">'
            + esc(ch)
            + '</span><span><span class="logbook__name">'
            + esc(zh_title if lang == "zh" else en_title)
            + '</span><span class="logbook__desc">'
            + esc(zh_desc if lang == "zh" else en_desc)
            + "</span></span>"
            + SVG_ARROW
            + "</a>"
        )
    return "".join(rows)


def photo(src, alt, caption, label, wide=False, lazy=True):
    """A photographic plate with its printed caption and its honest label."""
    return (
        '<figure class="plate-photo'
        + (" plate-photo--wide" if wide else "")
        + '"><img src="'
        + src
        + '" alt="'
        + html.escape(alt, quote=True)
        + '"'
        + (' loading="lazy" decoding="async"' if lazy else "")
        + '><figcaption><span class="label">'
        + esc(label)
        + "</span><span>"
        + caption
        + "</span></figcaption></figure>"
    )


def table(headers, rows, cls="table", caption=None):
    out = ['<table class="' + cls + '">']
    if caption:
        out.append("<caption>" + esc(caption) + "</caption>")
    out.append("<thead><tr>")
    for h in headers:
        out.append("<th>" + esc(h) + "</th>")
    out.append("</tr></thead><tbody>")
    for row in rows:
        out.append("<tr>")
        for cell in row:
            out.append("<td>" + cell + "</td>")
        out.append("</tr>")
    out.append("</tbody></table>")
    return "".join(out)


def code(text):
    return "<code>" + esc(text) + "</code>"


def runlog(title, meta, raw_text, lang="zh"):
    lines = []
    for line in raw_text.rstrip("\n").split("\n"):
        cls = ""
        stripped = line.strip()
        if stripped and set(stripped) == {"="}:
            cls = "rule"
        elif stripped.startswith("📂 Folder:"):
            cls = "folder"
        elif stripped.startswith("──"):
            cls = "rule"
        elif stripped.startswith("error:") or stripped.startswith("✗"):
            cls = "err"
        elif stripped.startswith("mgit:"):
            cls = "sum"
        elif stripped == "":
            cls = "quiet"
        lines.append('<span class="' + cls + '">' + (esc(line) if line else " ") + "</span>")
    hint = (
        '<p class="runlog__hint">'
        + esc("← 可橫向捲動" if lang == "zh" else "← scrolls sideways")
        + "</p>"
    )
    # The body is real output and can be wider than the frame: it stays
    # scrollable and focusable, and the hint is shown by the recorder whenever
    # the container actually overflows.
    body_label = title + (" 的輸出" if lang == "zh" else " output")
    return (
        '<div class="runlog"><div class="runlog__bar"><span>'
        + esc(title)
        + "</span><span>"
        + esc(meta)
        + '</span></div><div class="runlog__body" tabindex="0" role="group" aria-label="'
        + esc(body_label)
        + '">'
        + "\n".join(lines)
        + "</div>"
        + hint
        + "</div>"
    )


def plate(title, spec, body):
    return (
        '<div class="plate"><div class="plate__head"><span class="plate__title">'
        + esc(title)
        + '</span><span class="plate__spec">'
        + esc(spec)
        + '</span></div><div class="plate__body">'
        + body
        + "</div></div>"
    )


def plate_rows(rows):
    out = ['<div class="plate__rows">']
    for term, definition in rows:
        out.append(
            '<div class="plate__row"><div class="plate__term">'
            + term
            + '</div><div class="plate__def">'
            + definition
            + "</div></div>"
        )
    out.append("</div>")
    return "".join(out)


def plate_figures(figures):
    out = ['<dl class="plate__grid">']
    for term, value, note in figures:
        out.append(
            '<div class="plate__figure"><dt>'
            + esc(term)
            + "</dt><dd>"
            + value
            + ("<span>" + note + "</span>" if note else "")
            + "</dd></div>"
        )
    out.append("</dl>")
    return "".join(out)


def head(lang, root, *, counterpart=None):
    t = UI[lang]
    other_label = "EN" if lang == "zh" else "中文"
    current_label = "中文" if lang == "zh" else "EN"
    home = root + ("index.html" if lang == "zh" else "en/index.html")
    docs_home = root + ("docs/" if lang == "zh" else "en/docs/")
    return "\n".join(
        [
            '<a class="skip" href="#main">' + esc(t["skip"]) + "</a>",
            '<header class="head"><div class="shell head__inner">',
            '<a class="wordmark" href="' + home + '">',
            '<span class="wordmark__mark">mgit</span>',
            "</a>",
            '<nav class="head__links" aria-label="' + esc(t["nav_site"]) + '">',
            '<a href="' + docs_home + '">' + esc(t["docs"]) + "</a>",
            '<a href="' + REPO + '">' + esc(t["github"]) + "</a>",
            '<a href="' + RELEASE + '">' + esc(t["releases"]) + "</a>",
            '<a href="' + NPM + '">' + esc(t["npm"]) + "</a>",
            "</nav>",
            '<button class="themeswitch" type="button" data-theme-toggle aria-pressed="false" aria-label="'
            + esc(t["theme_toggle"])
            + '">'
            + SVG_THEME
            + "</button>",
            '<span class="lang" role="group" aria-label="' + esc(t["lang_label"]) + '">',
            '<a href="' + home + '" aria-current="true">' + current_label + "</a>",
            '<a href="' + (counterpart or home) + '">' + other_label + "</a>",
            "</span>",
            "</div></header>",
        ]
    )


def footer(lang, root):
    if lang == "zh":
        colophon = (
            "© 2026 Will 保哥 · MIT 授權 · 示範資料是 "
            + VERSION
            + " 版二進位在示範工作台錄下來的真實 session"
        )
        groups = [
            ("發行", [("Release " + VERSION, RELEASE), ("CHANGELOG.md", REPO + "/blob/main/CHANGELOG.md")]),
            ("安裝", [("install.sh", REPO + "/blob/main/install.sh"), ("install.ps1", REPO + "/blob/main/install.ps1")]),
            ("套件", [("@willh/mgit", NPM), ("npm/PUBLISHING.md", REPO + "/blob/main/npm/PUBLISHING.md")]),
        ]
    else:
        colophon = (
            "© 2026 Will 保哥 · MIT licensed · Demo data is a real session recorded with the "
            + VERSION
            + " binary in a demo workspace"
        )
        groups = [
            ("Release", [("Release " + VERSION, RELEASE), ("CHANGELOG.md", REPO + "/blob/main/CHANGELOG.md")]),
            ("Install", [("install.sh", REPO + "/blob/main/install.sh"), ("install.ps1", REPO + "/blob/main/install.ps1")]),
            ("Package", [("@willh/mgit", NPM), ("npm/PUBLISHING.md", REPO + "/blob/main/npm/PUBLISHING.md")]),
        ]
    out = ['<footer class="foot"><div class="shell foot__inner">']
    for term, links in groups:
        out.append('<dl class="foot__group"><dt>' + esc(term) + "</dt>")
        for label, href in links:
            out.append('<dd><a href="' + href + '">' + esc(label) + "</a></dd>")
        out.append("</dl>")
    out.append("</div>")
    out.append(
        '<div class="shell foot__colophon"><span>'
        + esc(colophon)
        + '</span><span><a href="'
        + REPO
        + '/blob/main/LICENSE">MIT</a></span></div>'
    )
    out.append("</footer>")
    return "\n".join(out)


def page(*, lang, root, title, description, body, counterpart, canonical, body_class="", runs=None):
    head_extra = ""
    if canonical:
        head_extra += '<link rel="canonical" href="' + canonical + '">\n'
    # No rel=alternate/hreflang until the site has a real origin to point at: an
    # absolute URL is required there, and inventing one would be a false claim.
    # The visible language switch already links the two trees.
    runs_tag = ""
    if runs is not None:
        runs_tag = (
            '<script type="application/json" id="mgit-runs">'
            + json.dumps(runs, ensure_ascii=False, indent=1)
            + "</script>\n"
        )
    return (
        '<!doctype html>\n<html lang="'
        + ("zh-Hant-TW" if lang == "zh" else "en")
        + '">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        "<title>"
        + esc(title)
        + "</title>\n"
        '<meta name="description" content="'
        + esc(description)
        + '">\n'
        + head_extra
        + THEME_SCRIPT
        + "\n"
        + '<link rel="stylesheet" href="'
        + root
        + 'assets/site.css">\n'
        '<link rel="icon" href="'
        + root
        + 'assets/favicon.svg" type="image/svg+xml">\n'
        '<meta name="color-scheme" content="light dark">\n'
        "</head>\n<body"
        + (' class="' + body_class + '"' if body_class else "")
        + ">\n"
        + head(lang, root, counterpart=counterpart)
        + '\n<main id="main">\n'
        + body
        + "\n</main>\n"
        + footer(lang, root)
        + "\n"
        + runs_tag
        + '<script src="'
        + root
        + 'assets/recorder.js" defer></script>\n</body>\n</html>\n'
    )
