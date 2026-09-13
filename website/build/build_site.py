"""Emit the mgit website: static HTML, no runtime, no build step for visitors."""

import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import docs  # noqa: E402
import landing  # noqa: E402
from common import CHAPTERS, VERSION, esc, logbook_rows, page  # noqa: E402

SITE = HERE.parent  # the website directory this script lives in
CAPTURES = HERE / "captures"


def read(name):
    return (CAPTURES / name).read_text(encoding="utf-8")


CAPTURES_DATA = {
    "run_calm": read("run-calm.txt"),
    "run_pull": read("run-mixed.txt"),
    "depth": read("depth.txt"),
    "list": read("list.txt"),
}

HEAD_TEXT = {
    "zh": {
        "title": "mgit — 一個指令，掃過這個目錄下每一個 Git 儲存庫",
        "desc": "mgit 掃過當前目錄下的每一個 Git 儲存庫，把同一個 git 指令跑在全部儲存庫上，"
        "並收成一份逐庫報告與一個結束代碼。單一 Rust 二進位檔、零執行期相依。",
    },
    "en": {
        "title": "mgit — one command, every Git repository under the current directory",
        "desc": "mgit runs the same git command in every Git repository below the current directory "
        "and folds the results into one report and one exit code. Single Rust binary, zero runtime "
        "dependencies.",
    },
}


def docnav(lang, current):
    zh = lang == "zh"
    items = []
    for slug, ch, zh_title, en_title, _, _ in CHAPTERS:
        href = slug + ".html"
        current_attr = ' aria-current="page"' if slug == current else ""
        items.append(
            '<a class="docnav__item" href="'
            + href
            + '"'
            + current_attr
            + '><span class="docnav__ch">'
            + esc(ch)
            + "</span><span>"
            + esc(zh_title if zh else en_title)
            + "</span></a>"
        )
    return (
        '<nav class="docnav" aria-label="'
        + ("章節" if zh else "Chapters")
        + '"><p class="docnav__title"><span>'
        + ("記錄本 · mgit " if zh else "Logbook · mgit ")
        + VERSION
        + "</span></p><div class=\"docnav__list\">"
        + "".join(items)
        + "</div></nav>"
    )


def toc(lang, blocks):
    """The chapter's own index, held in the margin column beside the text."""
    zh = lang == "zh"
    items = docs.heading_list(blocks)
    if len(items) < 2:
        return ""
    rows = []
    for kind, text, hid in items:
        rows.append(
            '<a class="toc__item" data-level="'
            + ("3" if kind == "h3" else "2")
            + '" href="#'
            + hid
            + '"><span>'
            + esc(text)
            + "</span></a>"
        )
    return (
        '<nav class="toc" aria-label="'
        + ("本章內容" if zh else "On this page")
        + '"><p class="toc__title">'
        + ("本章內容" if zh else "On this page")
        + '</p><div class="toc__list">'
        + "".join(rows)
        + "</div></nav>"
    )


def pager(lang, slug):
    zh = lang == "zh"
    index = [c[0] for c in CHAPTERS].index(slug)
    out = ['<nav class="pager">']
    if index > 0:
        prev_slug, prev_ch, prev_zh, prev_en, _, _ = CHAPTERS[index - 1]
        out.append(
            '<a href="'
            + prev_slug
            + '.html"><span>'
            + ("上一章" if zh else "Previous chapter")
            + " · "
            + esc(prev_ch)
            + "</span>"
            + esc(prev_zh if zh else prev_en)
            + "</a>"
        )
    if index < len(CHAPTERS) - 1:
        nxt_slug, nxt_ch, nxt_zh, nxt_en, _, _ = CHAPTERS[index + 1]
        out.append(
            '<a class="pager__next" href="'
            + nxt_slug
            + '.html"><span>'
            + ("下一章" if zh else "Next chapter")
            + " · "
            + esc(nxt_ch)
            + "</span>"
            + esc(nxt_zh if zh else nxt_en)
            + "</a>"
        )
    out.append("</nav>")
    return "".join(out)


def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    return path


def main():
    written = []

    body_zh, runs_zh = landing.build("zh", CAPTURES_DATA)
    body_en, runs_en = landing.build("en", CAPTURES_DATA)

    written.append(
        write(
            SITE / "index.html",
            page(
                lang="zh",
                root="",
                title=HEAD_TEXT["zh"]["title"],
                description=HEAD_TEXT["zh"]["desc"],
                body=body_zh,
                counterpart="en/index.html",
                canonical="",
                body_class="paper-chart",
                runs=runs_zh,
            ),
        )
    )
    written.append(
        write(
            SITE / "en" / "index.html",
            page(
                lang="en",
                root="../",
                title=HEAD_TEXT["en"]["title"],
                description=HEAD_TEXT["en"]["desc"],
                body=body_en,
                counterpart="../index.html",
                canonical="",
                body_class="paper-chart",
                runs=runs_en,
            ),
        )
    )

    for lang, root, counterpart_root in (
        ("zh", "../", "../en/docs/"),
        ("en", "../../", "../../docs/"),
    ):
        zh = lang == "zh"
        for slug, ch, zh_title, en_title, zh_desc, en_desc in CHAPTERS:
            title = (zh_title if zh else en_title) + " — mgit " + VERSION
            blocks = docs.chapter(slug, lang, CAPTURES_DATA)
            body = (
                '<div class="shell doc">'
                + docnav(lang, slug)
                + '<article class="docmain">'
                + '<header class="docmain__head"><h1 class="docmain__title">'
                + esc(zh_title if zh else en_title)
                + '</h1><p class="docmain__intro">'
                + esc(zh_desc if zh else en_desc)
                + "</p></header>"
                + toc(lang, blocks)
                + '<div class="prose">'
                + docs.render(blocks, lang)
                + "</div>"
                + pager(lang, slug)
                + "</article></div>"
            )
            path = SITE / ("docs" if zh else "en/docs") / (slug + ".html")
            written.append(
                write(
                    path,
                    page(
                        lang=lang,
                        root=root,
                        title=title,
                        description=zh_desc if zh else en_desc,
                        body=body,
                        counterpart=counterpart_root + slug + ".html",
                        canonical="",
                        body_class="paper-log",
                    ),
                )
            )

    # The docs tree needs its own door: /docs/ must not be a directory listing.
    for lang, root, counterpart_root in (("zh", "../", "../en/docs/"), ("en", "../../", "../../docs/")):
        zh = lang == "zh"
        body = (
            '<div class="shell band"><div class="band__head"><div>'
            '<h1 class="band__title">'
            + esc("記錄本" if zh else "Logbook")
            + '</h1><p class="band__intro">'
            + esc(
                "七章：每個選項、每個結束代碼、每個平台差異。"
                if zh
                else "Seven chapters: every option, every exit code, every platform difference."
            )
            + "</p></div></div>"
            '<nav class="logbook">'
            + logbook_rows(lang)
            + "</nav><p style=\"margin-top:var(--s5)\"><a href=\""
            + ("../index.html" if zh else "../../index.html")
            + '">'
            + esc("← 回網站首頁" if zh else "← Back to the site")
            + "</a></p></div>"
        )
        path = SITE / ("docs" if zh else "en/docs") / "index.html"
        written.append(
            write(
                path,
                page(
                    lang=lang,
                    root=root,
                    title=("記錄本" if zh else "Logbook") + " — mgit " + VERSION,
                    description="mgit 的文件：安裝、選項、輸出、找儲存庫、結束代碼、跨平台與發行。"
                    if zh
                    else "mgit documentation: install, options, output, discovery, exit codes, platforms and releases.",
                    body=body,
                    counterpart=counterpart_root + "index.html",
                    canonical="",
                    body_class="paper-log",
                ),
            )
        )

    for path in written:
        print("wrote", path.relative_to(SITE.parent), path.stat().st_size, "bytes")


if __name__ == "__main__":
    main()
