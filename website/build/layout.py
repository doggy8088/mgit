"""Page shells: the document head, the header, the footer, and the three page
types the site has (landing, documentation chapter, playground)."""

from __future__ import annotations

from render import attrs, esc, icon, inline, render_blocks

ORIGIN = "https://mgit.gh.miniasp.com"


def rel(depth: int, path: str) -> str:
    """A path relative to a page that sits `depth` directories below the root."""
    prefix = "../" * depth
    return (prefix + path) if path else (prefix or "./")


def theme_script() -> str:
    """Runs before the stylesheet, so the first paint is already the right theme."""
    return (
        "<script>(function(){var t=null;try{t=localStorage.getItem('mgit-theme')}catch(e){}"
        "if(t!=='light'&&t!=='dark'){t='light';try{if(matchMedia('(prefers-color-scheme: dark)').matches)"
        "t='dark'}catch(e){}}document.documentElement.setAttribute('data-theme',t)})()</script>"
    )


def head(page, site, depth: int) -> str:
    assets = rel(depth, "assets")
    canonical = ORIGIN + page["url"]
    title = page["title"]
    description = page["description"]
    image = ORIGIN + "/assets/img/og-cover.png"

    alternates = "".join(
        f'<link rel="alternate" hreflang="{esc(entry["hreflang"])}" href="{esc(ORIGIN + entry["url"])}">'
        for entry in page["alternates"]
    )

    json_ld = page.get("json_ld", "")

    return f"""<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(description)}">
<meta name="robots" content="index, follow">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#fbfbfa" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0d1013" media="(prefers-color-scheme: dark)">
<link rel="canonical" href="{esc(canonical)}">
{alternates}<link rel="alternate" hreflang="x-default" href="{esc(ORIGIN + page['alternates'][0]['url'])}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="mgit">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(description)}">
<meta property="og:url" content="{esc(canonical)}">
<meta property="og:locale" content="{esc(site['og_locale'])}">
<meta property="og:image" content="{esc(image)}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{esc(site['og_image_alt'])}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(description)}">
<meta name="twitter:image" content="{esc(image)}">
<meta name="twitter:image:alt" content="{esc(site['og_image_alt'])}">
{theme_script()}
<link rel="stylesheet" href="{assets}/css/site.css">
<link rel="icon" href="{assets}/favicon.svg" type="image/svg+xml">
<link rel="icon" href="{assets}/favicon.ico" sizes="32x32">
<link rel="icon" href="{assets}/img/icon-192.png" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="{assets}/img/apple-touch-icon.png">
<link rel="manifest" href="{rel(depth, 'site.webmanifest')}">
<script type="application/ld+json">{json_ld}</script>"""


def header(page, site, depth: int) -> str:
    links = []
    for item in site["nav"]:
        href = item["href"] if item["href"].startswith("http") else rel(depth, item["href"])
        current = ' aria-current="page"' if item["id"] == page.get("nav_id") else ""
        external = item.get("external", False)
        extra = ' rel="noopener"' if external else ""
        links.append(f'<a href="{esc(href)}"{current}{extra}>{esc(item["label"])}</a>')

    other = page["alternates"][1] if page["alternates"][0]["hreflang"] == site["hreflang"] else page["alternates"][0]
    langs = "".join(
        f'<a href="{esc(rel(depth, entry["path"]) if not entry["path"].startswith("http") else entry["path"])}"'
        f'{attrs(aria_current="true" if entry["hreflang"] == site["hreflang"] else None, hreflang=entry["hreflang"], lang=entry["hreflang"])}>'
        f'{esc(entry["short"])}</a>'
        for entry in page["alternates"]
    )

    return f"""<header class="hdr">
<div class="shell shell--wide hdr__inner">
<a class="wordmark" href="{esc(rel(depth, ''))}">mgit<span class="wordmark__version">{esc(site['version'])}</span></a>
<nav class="hdr__nav" aria-label="{esc(site['nav_label'])}">{''.join(links)}</nav>
<div class="hdr__tools">
<button type="button" class="btn btn--icon" data-theme-toggle aria-pressed="false" data-label-dark="{esc(site['theme_dark'])}" data-label-light="{esc(site['theme_light'])}" aria-label="{esc(site['theme_dark'])}">{icon('moon')}</button>
<span class="langswitch" role="group" aria-label="{esc(site['language_label'])}">{langs}</span>
</div>
</div>
</header>"""


def footer(site, depth: int) -> str:
    columns = ""
    for column in site["footer"]["columns"]:
        items = "".join(
            f'<li><a href="{esc(link["href"] if link["href"].startswith("http") else rel(depth, link["href"]))}"'
            f'{" rel=\"noopener\"" if link["href"].startswith("http") else ""}>{esc(link["label"])}</a></li>'
            for link in column["links"]
        )
        columns += f'<div><h2>{esc(column["title"])}</h2><ul>{items}</ul></div>'

    return f"""<footer class="foot">
<div class="shell shell--wide">
<div class="foot__grid">{columns}</div>
<div class="foot__bottom">
<span>{inline(site['footer']['legal'])}</span>
<span>{inline(site['footer']['built'])}</span>
</div>
</div>
</footer>"""


def document(page, site, depth: int, body: str, scripts: str = "") -> str:
    return f"""<!doctype html>
<html lang="{esc(site['lang'])}" data-theme="light">
<head>
{head(page, site, depth)}
</head>
<body>
<a class="skip" href="#main">{esc(site['skip'])}</a>
{header(page, site, depth)}
<main id="main">
{body}
</main>
{footer(site, depth)}
{scripts}
</body>
</html>
"""
