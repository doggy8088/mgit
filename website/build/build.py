#!/usr/bin/env python3
"""Build the mgit website.

    python3 website/build/build.py

Writes every page under website/ from the content modules. The output is plain
static HTML: no build step is needed to view or host the site, only to change
its text. Run website/build/capture-cli.sh first if the binary's help text
changed, and node --test website/tests/*.test.mjs after, because the parity
test is what keeps the playground honest.
"""

from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SITE_DIR = HERE.parent
sys.path.insert(0, str(HERE))

import components  # noqa: E402
import content_en  # noqa: E402
import content_zh  # noqa: E402
from layout import ORIGIN, document, rel  # noqa: E402
from render import esc, icon, inline, quote, render_blocks, set_link_resolver, table  # noqa: E402

LOCALES = [content_zh, content_en]

# key -> (zh path, en path). The paths are directories, so every URL ends in /.
PAGE_URLS = {
    "home": ("/", "/en/"),
    "playground": ("/playground/", "/en/playground/"),
    "docs": ("/docs/", "/en/docs/"),
}
for chapter in content_zh.CHAPTERS:
    PAGE_URLS["docs:" + chapter["id"]] = (
        f"/docs/{chapter['id']}/",
        f"/en/docs/{chapter['id']}/",
    )


def url_for(key: str, locale) -> str:
    zh_url, en_url = PAGE_URLS[key]
    return zh_url if locale.SITE["code"] == "zh" else en_url


def output_path(key: str, locale) -> Path:
    url = url_for(key, locale)
    return SITE_DIR / url.strip("/") / "index.html" if url != "/" else SITE_DIR / "index.html"


def depth_for(key: str, locale) -> int:
    url = url_for(key, locale)
    return len([part for part in url.split("/") if part])


def alternates(key: str):
    zh_url, en_url = PAGE_URLS[key]
    return [
        {"hreflang": "zh-Hant", "url": zh_url, "path": zh_url.lstrip("/"), "short": "中文"},
        {"hreflang": "en", "url": en_url, "path": en_url.lstrip("/"), "short": "EN"},
    ]


def json_ld(locale, page_key: str) -> str:
    site = locale.SITE
    if page_key == "home":
        data = {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "mgit",
            "description": locale.LANDING["description"],
            "url": ORIGIN + url_for("home", locale),
            "applicationCategory": "DeveloperApplication",
            "operatingSystem": "macOS, Linux, Windows",
            "softwareVersion": site["version"],
            "license": "https://opensource.org/licenses/MIT",
            "inLanguage": site["hreflang"],
            "downloadUrl": "https://github.com/doggy8088/mgit/releases",
            "codeRepository": "https://github.com/doggy8088/mgit",
            "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
            "author": {"@type": "Person", "name": "Will Huang", "url": "https://github.com/doggy8088"},
        }
    else:
        data = {
            "@context": "https://schema.org",
            "@type": "TechArticle",
            "headline": page_title(locale, page_key),
            "description": page_description(locale, page_key),
            "url": ORIGIN + url_for(page_key, locale),
            "inLanguage": site["hreflang"],
            "isPartOf": {"@type": "WebSite", "name": "mgit", "url": ORIGIN + url_for("home", locale)},
            "author": {"@type": "Person", "name": "Will Huang", "url": "https://github.com/doggy8088"},
        }
    return json.dumps(data, ensure_ascii=False, separators=(",", ":"))


def chapter_by_id(locale, chapter_id):
    for chapter in locale.CHAPTERS:
        if chapter["id"] == chapter_id:
            return chapter
    raise KeyError(chapter_id)


def page_title(locale, key: str) -> str:
    if key == "home":
        return locale.LANDING["title"]
    if key == "playground":
        return locale.PLAYGROUND["title"]
    if key == "docs":
        return locale.DOCS_INDEX["title"]
    chapter = chapter_by_id(locale, key.split(":", 1)[1])
    suffix = " — mgit 文件" if locale.SITE["code"] == "zh" else " — mgit docs"
    return chapter["title"] + suffix


def page_description(locale, key: str) -> str:
    if key == "home":
        return locale.LANDING["description"]
    if key == "playground":
        return locale.PLAYGROUND["description"]
    if key == "docs":
        return locale.DOCS_INDEX["description"]
    return chapter_by_id(locale, key.split(":", 1)[1])["description"]


def page_meta(locale, key: str, nav_id: str | None):
    return {
        "url": url_for(key, locale),
        "title": page_title(locale, key),
        "description": page_description(locale, key),
        "alternates": alternates(key),
        "nav_id": nav_id,
        "json_ld": json_ld(locale, key),
    }


def site_config(locale, depth: int) -> str:
    config = {
        "labels": locale.SITE["labels"],
        "scenarios": locale.SCENARIOS,
        "playgroundUrl": rel(depth, locale.SITE["base"] + "playground/"),
    }
    return (
        '<script type="application/json" id="site-config">'
        + json.dumps(config, ensure_ascii=False)
        + "</script>"
    )


def scripts(locale, depth: int) -> str:
    return (
        site_config(locale, depth)
        + f'\n<script type="module" src="{rel(depth, "assets/js/ui/main.js")}"></script>'
    )


def block_ctx(locale, depth: int) -> dict:
    # Everything rendered after this call resolves its content links against
    # this page's position in the tree.
    set_link_resolver(lambda href: rel(depth, href))
    return {
        "copy": locale.SITE["labels"]["copy"],
        "anchor_label": locale.SITE["labels"]["anchor_label"],
        "playground_url": rel(depth, locale.SITE["base"] + "playground/"),
    }


# --------------------------------------------------------------- the pages --


def render_landing(locale) -> str:
    site = locale.SITE
    landing = locale.LANDING
    labels = site["labels"]
    depth = depth_for("home", locale)
    ctx = block_ctx(locale, depth)
    hero = landing["hero"]
    demo = landing["demo"]

    facts = "".join(f"<li>{icon('check')}<span>{inline(fact)}</span></li>" for fact in hero["facts"])
    chips = "".join(
        f'<button type="button" class="chip" data-demo-command="{esc(command)}">{esc(command)}</button>'
        for command in demo["chips"]
    )

    terminal = components.terminal(
        ident="landing-terminal",
        title=labels["terminal_title"],
        labels=labels,
        fixed=True,
        with_input=True,
        actions="",
        hints=[("Enter", labels["hint_run"]), ("Tab", labels["hint_complete"]), ("Ctrl+C", labels["hint_interrupt"])],
        fallback=labels["terminal_fallback"],
    )

    body = f"""<section class="hero" data-landing>
<div class="shell shell--wide">
<div class="hero__grid">
<div>
<span class="eyebrow">{esc(hero['eyebrow'])}</span>
<h1>{inline(hero['h1'])}</h1>
<p class="lede">{inline(hero['lede'])}</p>
<div class="hero__actions">
<a class="btn btn--primary" href="{rel(depth, hero['primary']['href'])}">{icon('terminal')} {esc(hero['primary']['label'])}</a>
<a class="btn" href="{rel(depth, hero['secondary']['href'])}">{icon('book')} {esc(hero['secondary']['label'])}</a>
</div>
<ul class="hero__facts">{facts}</ul>
</div>
<div data-landing-demo data-autorun="{esc(demo['auto'])}">
<h2 class="demo__title">{esc(demo['title'])}</h2>
{terminal}
<div class="chips" style="margin-top:var(--s3)">{chips}</div>
<p class="cmd__note">{inline(demo['note'])} <a href="{rel(depth, site['base'] + 'playground/')}">{esc(demo['more'])}</a></p>
</div>
</div>
</div>
</section>
"""

    for section in landing["sections"]:
        inner = ""
        if "blocks" in section:
            inner += render_blocks(section["blocks"], ctx)
        if "cards" in section:
            cards = "".join(
                f'<div class="card"><span class="card__meta">{esc(card["meta"])}</span>'
                f'<h3>{inline(card["title"])}</h3><p>{inline(card["text"])}</p></div>'
                for card in section["cards"]
            )
            inner += f'<div class="grid">{cards}</div>'
        if section.get("component") == "depth":
            inner += components.depth_explorer(labels)
        if section.get("component") == "streams":
            inner += components.stream_demo(labels)
        if section.get("component") == "install":
            inner += components.install_tabs("install", locale.INSTALL_ITEMS, labels)
            inner += (
                f'<p class="cmd__note">{esc(labels["install_verify"])} '
                f"<code>mgit --version</code></p>"
            )
        if "after" in section:
            inner += render_blocks(section["after"], ctx)

        head = f'<span class="eyebrow">{esc(section["eyebrow"])}</span>' if section.get("eyebrow") else ""
        head += f'<h2>{inline(section["h2"])}</h2>'
        if section.get("lede"):
            head += f'<p class="lede">{inline(section["lede"])}</p>'

        body += f"""<section class="section" id="{esc(section['id'])}" aria-labelledby="{esc(section['id'])}-title">
<div class="shell">
<div class="section__head"><h2 class="visually-hidden" id="{esc(section['id'])}-title">{esc(section['h2'])}</h2>{head}</div>
{inner}
</div>
</section>
"""

    body += render_docs_cards(locale, depth, wrap=True)
    return document(page_meta(locale, "home", "home"), site, depth, body, scripts(locale, depth))


def render_docs_cards(locale, depth: int, wrap: bool, level: int = 3) -> str:
    cards = "".join(
        f'<a class="card card--link" href="{rel(depth, locale.SITE["base"] + "docs/" + chapter["id"] + "/")}">'
        f'<span class="card__meta">{index + 1:02d}</span>'
        f'<h{level}>{esc(chapter["title"])}</h{level}><p>{esc(chapter["lede"])}</p></a>'
        for index, chapter in enumerate(locale.CHAPTERS)
    )
    grid = f'<div class="grid">{cards}</div>'
    if not wrap:
        return grid
    title = locale.DOCS_INDEX["h1"]
    return f"""<section class="section" id="docs" aria-labelledby="docs-title">
<div class="shell">
<div class="section__head"><h2 id="docs-title">{esc(title)}</h2>
<p class="lede">{esc(locale.DOC_CARDS_INTRO)}</p></div>
{grid}
</div>
</section>
"""


def render_playground(locale) -> str:
    site = locale.SITE
    page = locale.PLAYGROUND
    labels = site["labels"]
    depth = depth_for("playground", locale)
    set_link_resolver(lambda href: rel(depth, href))

    scenarios = [
        {"id": key, "name": value["name"]}
        for key, value in locale.SCENARIOS.items()
    ]
    fidelity = "".join(f"<li>{inline(item)}</li>" for item in page["fidelity"])

    body = f"""<div class="shell shell--wide" style="padding-top:var(--s6)">
<h1>{esc(page['h1'])}</h1>
<p class="lede" style="max-width:70ch">{inline(page['lede'])}</p>
</div>
{components.playground_layout(labels, scenarios, locale.TARGETS)}
<section class="section">
<div class="shell">
<div class="section__head"><h2>{esc(page['fidelity_title'])}</h2></div>
<ul>{fidelity}</ul>
</div>
</section>
"""
    return document(page_meta(locale, "playground", "playground"), site, depth, body, scripts(locale, depth))


def render_docs_index(locale) -> str:
    site = locale.SITE
    depth = depth_for("docs", locale)
    set_link_resolver(lambda href: rel(depth, href))
    index = locale.DOCS_INDEX
    body = f"""<div class="shell" style="padding:var(--s7) 0 0">
<div class="prose__head">
<h1>{esc(index['h1'])}</h1>
<p class="lede">{inline(index['lede'])}</p>
</div>
</div>
<section class="section section--flush"><div class="shell">
{render_docs_cards(locale, depth, wrap=False, level=2)}
</div></section>
"""
    return document(page_meta(locale, "docs", "docs"), site, depth, body, scripts(locale, depth))


def render_chapter(locale, position: int) -> str:
    site = locale.SITE
    chapter = locale.CHAPTERS[position]
    key = "docs:" + chapter["id"]
    depth = depth_for(key, locale)
    ctx = block_ctx(locale, depth)

    nav_items = "".join(
        f'<li><a href="{rel(depth, site["base"] + "docs/" + entry["id"] + "/")}"'
        f'{" aria-current=\"page\"" if entry["id"] == chapter["id"] else ""}>'
        f'<span>{esc(entry["nav"])}</span></a></li>'
        for entry in locale.CHAPTERS
    )

    toc_items = "".join(
        f'<li><a href="#{esc(block[1])}">{esc(block[2])}</a></li>'
        for block in chapter["blocks"]
        if block[0] == "h2"
    )

    previous = locale.CHAPTERS[position - 1] if position > 0 else None
    following = locale.CHAPTERS[position + 1] if position + 1 < len(locale.CHAPTERS) else None
    pager = ""
    if previous:
        pager += (
            f'<a href="{rel(depth, site["base"] + "docs/" + previous["id"] + "/")}">'
            f'<span>{"上一章" if site["code"] == "zh" else "Previous"}</span>{esc(previous["nav"])}</a>'
        )
    if following:
        pager += (
            f'<a href="{rel(depth, site["base"] + "docs/" + following["id"] + "/")}">'
            f'<span>{"下一章" if site["code"] == "zh" else "Next"}</span>{esc(following["nav"])}</a>'
        )

    toc_title = "本章內容" if site["code"] == "zh" else "On this page"
    nav_title = "文件" if site["code"] == "zh" else "Documentation"

    body = f"""<div class="shell shell--wide">
<div class="docs">
<nav class="docs__nav" aria-label="{esc(nav_title)}">
<span class="docs__nav-title">{esc(nav_title)}</span>
<ol>{nav_items}</ol>
</nav>
<article class="prose">
<div class="prose__head">
<span class="eyebrow">{position + 1:02d} / {len(locale.CHAPTERS):02d}</span>
<h1>{esc(chapter['title'])}</h1>
<p class="lede">{inline(chapter['lede'])}</p>
</div>
{render_blocks(chapter['blocks'], ctx)}
<nav class="pager" aria-label="{esc(nav_title)}">{pager}</nav>
</article>
<nav class="toc" data-toc aria-label="{esc(toc_title)}">
<p class="toc__title">{esc(toc_title)}</p>
<ul>{toc_items}</ul>
</nav>
</div>
</div>
"""
    return document(page_meta(locale, key, "docs"), site, depth, body, scripts(locale, depth))


# ------------------------------------------------------------- extra files --


def render_404(locale) -> str:
    site = locale.SITE
    page = {
        "url": "/404.html",
        "title": ("找不到這一頁 — mgit" if site["code"] == "zh" else "Page not found — mgit"),
        "description": ("這個網址在 mgit 的網站上不存在。" if site["code"] == "zh" else "That address does not exist on the mgit site."),
        "alternates": alternates("home"),
        "nav_id": None,
        "json_ld": json_ld(locale, "docs"),
    }
    if site["code"] == "zh":
        heading, text, action = "找不到這一頁", "這個網址在這個網站上不存在。可以從文件或試用場重新開始。", "回首頁"
    else:
        heading, text, action = "Page not found", "That address does not exist on this site. The documentation and the playground are good places to restart.", "Back to the front page"

    set_link_resolver(lambda href: rel(0, href))
    body = f"""<section class="section section--flush"><div class="shell">
<div class="section__head">
<span class="eyebrow">404</span>
<h1>{esc(heading)}</h1>
<p class="lede">{esc(text)}</p>
</div>
<div class="hero__actions">
<a class="btn btn--primary" href="/">{esc(action)}</a>
<a class="btn" href="/docs/">{esc(locale.DOCS_INDEX['h1'])}</a>
<a class="btn" href="/playground/">{esc(locale.PLAYGROUND['h1'])}</a>
</div>
</div></section>
"""
    # The 404 page can be served from any depth, so it uses absolute paths.
    return document(page, site, 0, body, scripts(locale, 0))


def render_sitemap() -> str:
    entries = []
    for key in PAGE_URLS:
        for locale in LOCALES:
            url = ORIGIN + url_for(key, locale)
            links = "".join(
                f'<xhtml:link rel="alternate" hreflang="{entry["hreflang"]}" href="{ORIGIN + entry["url"]}"/>'
                for entry in alternates(key)
            )
            priority = "1.0" if key == "home" else "0.8" if key in ("playground", "docs") else "0.6"
            entries.append(
                f"<url><loc>{url}</loc>{links}"
                f"<changefreq>monthly</changefreq><priority>{priority}</priority></url>"
            )
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
        'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
        + "\n".join(entries)
        + "\n</urlset>\n"
    )


def render_robots() -> str:
    return f"User-agent: *\nAllow: /\n\nSitemap: {ORIGIN}/sitemap.xml\n"


def render_manifest() -> str:
    return json.dumps(
        {
            "name": "mgit",
            "short_name": "mgit",
            "description": "One command for every Git repository in the directory.",
            "start_url": "/",
            "scope": "/",
            "display": "minimal-ui",
            "background_color": "#fbfbfa",
            "theme_color": "#0d1013",
            "icons": [
                {"src": "/assets/img/icon-192.png", "sizes": "192x192", "type": "image/png"},
                {"src": "/assets/img/icon-512.png", "sizes": "512x512", "type": "image/png"},
                {"src": "/assets/img/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
            ],
        },
        indent=2,
        ensure_ascii=False,
    ) + "\n"


# ---------------------------------------------------------------- checking --


def check_labels() -> None:
    """Every label the interface asks for has to exist in both languages.

    A missing key used to fall back to the English default silently, which is
    the kind of bug that ships. The scan is deliberately dumb: it reads the
    literal `labels.x` and `labels['x']` lookups out of the scripts, and the
    dynamic ones (`labels['state_' + state]`) are listed by prefix here.
    """
    import re

    literal = set()
    for path in sorted((SITE_DIR / "assets" / "js" / "ui").glob("*.js")):
        source = path.read_text(encoding="utf-8")
        literal.update(re.findall(r"labels\.([a-z][a-z0-9_]*)", source))
        literal.update(re.findall(r"labels\['([a-z][a-z0-9_]*)'\]", source))

    # Keys built at runtime from a prefix plus a value the engine produces.
    dynamic = {
        "state_": ["clean", "dirty", "behind", "ahead", "blocked"],
        "action_": ["dirty", "behind", "block", "remove"],
        "action_title_": ["dirty", "behind", "block", "remove"],
        "step_": ["scan", "repository", "descend", "depth-limit", "already-visited", "skip-file", "unreadable"],
        "exit_": ["ok", "failure", "usage", "notFound", "git", "interrupted", "brokenPipe"],
    }
    for prefix, values in dynamic.items():
        literal.update(prefix + value for value in values)

    for locale in LOCALES:
        missing = sorted(key for key in literal if key not in locale.SITE["labels"])
        assert not missing, f"{locale.SITE['code']} is missing labels: {missing}"

    declared = set(content_zh.SITE["labels"])
    used_by_python = {
        "copy", "install_tablist", "anchor_label", "input_label", "input_placeholder",
        "screen_label", "stop", "terminal_title", "terminal_fallback", "copy_transcript",
        "reset", "share", "scenario", "target", "simulate", "no_git", "animate", "workspace",
        "add_repo", "add", "inspector", "inspector_empty", "hint_run", "hint_complete",
        "hint_history", "hint_interrupt", "hint_clear", "install_verify", "depth_title",
        "depth_label", "depth_found", "depth_tree", "depth_output", "stream_title",
        "stream_file", "stream_screen", "noscript",
    }
    unused = sorted(declared - literal - used_by_python)
    assert not unused, f"labels declared but never used: {unused}"


def check_locales() -> None:
    """The two languages have to stay the same site, not drift into two."""
    zh, en = content_zh, content_en
    assert [c["id"] for c in zh.CHAPTERS] == [c["id"] for c in en.CHAPTERS], "chapter ids differ"
    assert set(zh.SITE["labels"]) == set(en.SITE["labels"]), "label keys differ"
    assert set(zh.SCENARIOS) == set(en.SCENARIOS), "scenario ids differ"
    assert [t["id"] for t in zh.TARGETS] == [t["id"] for t in en.TARGETS], "target ids differ"
    assert [s["id"] for s in zh.LANDING["sections"]] == [s["id"] for s in en.LANDING["sections"]], "landing sections differ"
    for left, right in zip(zh.CHAPTERS, en.CHAPTERS):
        left_kinds = [block[0] for block in left["blocks"]]
        right_kinds = [block[0] for block in right["blocks"]]
        assert left_kinds == right_kinds, f"block shapes differ in {left['id']}"
        left_ids = [block[1] for block in left["blocks"] if block[0] in ("h2", "h3")]
        right_ids = [block[1] for block in right["blocks"] if block[0] in ("h2", "h3")]
        assert left_ids == right_ids, f"heading ids differ in {left['id']}"

    # Every scenario named in a "try it" link has to exist in the engine.
    engine = (SITE_DIR / "assets/js/engine/scenarios.js").read_text(encoding="utf-8")
    for locale in LOCALES:
        for chapter in locale.CHAPTERS:
            for block in chapter["blocks"]:
                if block[0] == "try":
                    assert f"id: '{block[1]}'" in engine, f"unknown scenario {block[1]} in {chapter['id']}"


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def main() -> int:
    check_locales()
    check_labels()
    written = []

    for locale in LOCALES:
        write(output_path("home", locale), render_landing(locale))
        written.append(output_path("home", locale))
        write(output_path("playground", locale), render_playground(locale))
        written.append(output_path("playground", locale))
        write(output_path("docs", locale), render_docs_index(locale))
        written.append(output_path("docs", locale))
        for position, chapter in enumerate(locale.CHAPTERS):
            path = output_path("docs:" + chapter["id"], locale)
            write(path, render_chapter(locale, position))
            written.append(path)

    write(SITE_DIR / "404.html", render_404(content_zh))
    write(SITE_DIR / "sitemap.xml", render_sitemap())
    write(SITE_DIR / "robots.txt", render_robots())
    write(SITE_DIR / "site.webmanifest", render_manifest())
    written += [SITE_DIR / "404.html", SITE_DIR / "sitemap.xml", SITE_DIR / "robots.txt", SITE_DIR / "site.webmanifest"]

    for path in written:
        print("wrote", path.relative_to(SITE_DIR.parent))
    print(f"\n{len(written)} files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
