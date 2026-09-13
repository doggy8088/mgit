"""Landing page content for the mgit website (Persuade surface).

The two recorded runs below are the single source of truth for everything the
page claims about a run: the legend rows are rendered from them, and the same
structure is handed to the page as JSON for recorder.js to draw. The values are
the recorded output of the release binary in /tmp/mgit-mixed on 2026-09-14;
nothing here is invented.
"""

from common import (
    INSTALL_PS,
    INSTALL_SH,
    RELEASE,
    VERSION,
    CHAPTERS,
    SVG_ARROW,
    SVG_REPLAY,
    esc,
    logbook_rows,
    plate,
    plate_figures,
    plate_rows,
    photo,
    runlog,
    table,
    window,
)

WORKSPACE = "/tmp/mgit-mixed"

# mgit --summary → exit 0, 6 succeeded; web-console carries an unstaged change.
RUN_CALM = {
    "id": "RUN A",
    "command": "mgit --summary",
    "exit": 0,
    "summary": "6 repositories, 6 succeeded",
    "channels": [
        {"ch": "CH 01", "name": "api-gateway", "branch": "main", "state": "clean", "changes": 0,
         "detail": "沒有任何輸出", "detail_en": "no output at all"},
        {"ch": "CH 02", "name": "billing-worker", "branch": "main", "state": "clean", "changes": 0,
         "detail": "沒有任何輸出", "detail_en": "no output at all"},
        {"ch": "CH 03", "name": "docs-site", "branch": "main", "state": "clean", "changes": 0,
         "detail": "沒有任何輸出", "detail_en": "no output at all"},
        {"ch": "CH 04", "name": "infra-scripts", "branch": "main", "state": "clean", "changes": 0,
         "detail": "沒有任何輸出", "detail_en": "no output at all"},
        {"ch": "CH 05", "name": "web-console", "branch": "main", "state": "dirty", "changes": 1,
         "detail": "M src/main.rs", "detail_en": "M src/main.rs"},
        {"ch": "CH 06", "name": "web-console-hotfix", "branch": "hotfix", "state": "clean", "changes": 0,
         "detail": "worktree · 沒有任何輸出", "detail_en": "worktree · no output at all"},
    ],
}

# mgit pull → exit 128, 5 succeeded, 1 failed: one pen spikes, five stay flat.
RUN_PULL = {
    "id": "RUN B",
    "command": "mgit pull",
    "exit": 128,
    "summary": "6 repositories, 5 succeeded, 1 failed",
    "channels": [
        {"ch": "CH 01", "name": "api-gateway", "branch": "main", "state": "clean", "changes": 0,
         "detail": "already up to date", "detail_en": "already up to date"},
        {"ch": "CH 02", "name": "billing-worker", "branch": "main", "state": "clean", "changes": 0,
         "detail": "already up to date", "detail_en": "already up to date"},
        {"ch": "CH 03", "name": "docs-site", "branch": "main", "state": "clean", "changes": 0,
         "detail": "already up to date", "detail_en": "already up to date"},
        {"ch": "CH 04", "name": "infra-scripts", "branch": "main", "state": "clean", "changes": 0,
         "detail": "already up to date", "detail_en": "already up to date"},
        {"ch": "CH 05", "name": "web-console", "branch": "main", "state": "failed", "code": 128,
         "detail": "cannot pull with rebase: unstaged changes",
         "detail_en": "cannot pull with rebase: unstaged changes"},
        {"ch": "CH 06", "name": "web-console-hotfix", "branch": "hotfix", "state": "clean", "changes": 0,
         "detail": "already up to date", "detail_en": "already up to date"},
    ],
}

STATE_WORD = {
    "zh": {"clean": "乾淨", "dirty": "有變更", "failed": "失敗"},
    "en": {"clean": "clean", "dirty": "dirty", "failed": "failed"},
}


def legend(run_key, channels, lang):
    zh = lang == "zh"
    head = ("通道", "儲存庫 · 分支", "狀態") if zh else ("Channel", "Repository · branch", "State")
    rows = []
    for lane, channel in enumerate(channels):
        state = channel["state"]
        if state == "failed":
            value = "exit " + str(channel["code"])
        elif state == "dirty":
            changes = channel["changes"]
            value = (
                "{} 項變更".format(changes)
                if zh
                else ("{} change".format(changes) if changes == 1 else "{} changes".format(changes))
            )
        else:
            value = "乾淨" if zh else "clean"
        meta = channel["detail"] if zh else channel["detail_en"]
        # clean channels say it once: branch · clean. Everything else carries its
        # measurement, its state and its detail.
        meta_line = esc(channel["branch"]) + " · "
        if state != "clean":
            meta_line += esc(value) + " · "
        meta_line += (
            '<span class="legend__state" data-state="' + state + '">'
            + esc(STATE_WORD[lang][state])
            + "</span>"
        )
        if meta and state != "clean":
            meta_line += " · " + esc(meta)
        rows.append(
            '<li class="legend__row" data-lane="'
            + str(lane)
            + '"><span class="legend__ch">'
            + esc(channel["ch"])
            + '</span><span class="legend__name">'
            + esc(channel["name"])
            + '</span><span class="legend__meta">'
            + meta_line
            + "</span></li>"
        )
    return (
        '<ul class="legend" data-legend="'
        + run_key
        + '"><li class="legend__head"><span class="label">'
        + esc(head[0])
        + '</span><span class="label">'
        + esc(head[1])
        + "</span></li>"
        + "".join(rows)
        + "</ul>"
    )


def vocab(lang, active):
    words = [
        ("clean", "clean", "乾淨"),
        ("dirty", "dirty", "有變更"),
        ("failed", "failed", "失敗"),
        ("interrupted", "interrupted", "被中斷"),
        ("empty", "no repos", "找不到儲存庫"),
    ]
    out = ['<p class="vocab">']
    for key, en, zh in words:
        word = zh if lang == "zh" else en
        cls = "vocab__word" + (" is-active" if key in active else "")
        out.append(
            '<span class="' + cls + '" data-state="' + (key if key in active else "none") + '">'
            + esc(word) + "</span>"
        )
    out.append("</p>")
    return "".join(out)


def instrument(lang, run, caption, meta, exit_line, active):
    replay = (
        '<button type="button" class="replay" data-replay>'
        + SVG_REPLAY
        + ("<span>重播</span>" if lang == "zh" else "<span>Replay</span>")
        + "</button>"
    )
    return (
        '<div class="instrument__frame">'
        + legend(run["key"], run["channels"], lang)
        + '<div class="strip" data-strip="'
        + run["key"]
        + '"><p class="strip__caption"><span class="strip__run">'
        + esc(caption)
        + '</span><span class="strip__meta">'
        + esc(meta)
        + "</span></p>"
        + '<div class="strip__foot">'
        + vocab(lang, active)
        + '<p class="strip__exit">' + exit_line + "</p>"
        + "</div>"
        + replay
        + "</div></div>"
    )


def build(lang, captures):
    zh = lang == "zh"
    run_calm = dict(RUN_CALM, key="a")
    run_pull = dict(RUN_PULL, key="b")

    parts = []

    # ---------------------------------------------------------------- hero
    parts.append(
        '<section class="instrument" aria-labelledby="hero-title"><div class="shell">'
        '<div class="paperhead"><h1 class="paperhead__title" id="hero-title">'
        + esc(
            "一個指令，掃過這個目錄下每一個 Git 儲存庫"
            if zh
            else "One command, every Git repository under the current directory"
        )
        + '</h1><p class="lede">'
        + (
            "不帶參數＝對每個 repo 跑 <code>git status -s</code>；任何 git 指令都一樣。"
            "乾淨的不出聲，跑完給結束代碼。"
            if zh
            else "No arguments means <code>git status -s</code> in every repository; any git command works "
            "the same way. A clean repository stays quiet, and the run ends on one exit code."
        )
        + "</p>"
        + window(INSTALL_SH, lang, label="macOS · Linux")
        + "</div>"
        + instrument(
            lang,
            run_pull,
            "RUN B · mgit pull",
            (
                "示範工作台 " + WORKSPACE + " · 6 個儲存庫 · 錄製於 2026-09-14"
                if zh
                else "demo workspace " + WORKSPACE + " · 6 repositories · recorded 2026-09-14"
            ),
            "<b>exit 128</b> · mgit: 6 repositories, 5 succeeded, 1 failed",
            {"clean", "failed"},
        )
        + '<p class="instrument__note">'
        + (
            "真實 session：<code>mgit pull</code> 在 <code>/tmp/mgit-mixed</code>（6 個 repo）的錄製結果；"
            "CH 05 的尖峰就是失敗的那一次。"
            if zh
            else "A real session: <code>mgit pull</code> recorded in <code>/tmp/mgit-mixed</code> (six "
            "repositories); the spike on CH 05 is the one that failed."
        )
        + "</p></div></section>"
    )

    # ------------------------------------------------------------ discovery
    rules_zh = [
        "從當前目錄往下找，預設只找第一層（<code>--depth</code> 可以再往下）。",
        "目錄裡有 <code>.git</code> <b>目錄</b>或 <code>.git</code> <b>檔案</b>都算儲存庫，所以 <code>git worktree</code> 與 submodule 都認得。",
        "找到儲存庫之後不再往該儲存庫裡面走，submodule 或 vendored 的專案不會被重複算進來。",
        "symlink 會跟進，而且以「看到的名字」為準；同時走訪過的實際目錄只進入一次，連結迴圈不會無限迴圈。",
        "結果依名稱排序（忽略大小寫），排序在 macOS、Linux、Windows 完全一致。",
        "一個都沒找到時會警告並以 <code>1</code> 結束（<code>--allow-empty</code> 可回復舊行為）；若當前目錄本身就是儲存庫，就直接在該目錄執行 git。",
    ]
    rules_en = [
        "The search starts in the current directory and walks down, one level by default (<code>--depth</code> goes deeper).",
        "A directory counts as a repository when it holds a <code>.git</code> <b>directory</b> or a <code>.git</code> <b>file</b>, so <code>git worktree</code> and submodules are recognised.",
        "Once a repository is found the search does not descend into it, so submodules and vendored projects are never counted twice.",
        "Symlinks are followed and counted under the name you see; the real directory behind them is visited only once, so link loops cannot hang the run.",
        "Results are sorted by name, ignoring case, and the order is identical on macOS, Linux and Windows.",
        "When nothing is found the run warns and exits with <code>1</code> (<code>--allow-empty</code> restores the old behaviour); if the current directory itself is a repository, git runs right there.",
    ]
    rules = rules_zh if zh else rules_en
    parts.append(
        '<section class="band" aria-labelledby="scan-title"><div class="shell">'
        '<div class="band__head"><div>'
        '<h2 class="band__title" id="scan-title">'
        + esc("它怎麼找儲存庫" if zh else "How it finds the repositories")
        + '</h2><p class="band__intro">'
        + (
            "預設只找第一層；結果依名稱排序，三個作業系統一致。<code>--list</code> 先看清楚會動到誰。"
            if zh
            else "Level one only by default; sorted by name, identical on all three systems. "
            "<code>--list</code> shows what will be touched."
        )
        + "</p></div></div>"
        '<ol class="rules">'
        + "".join("<li>" + item + "</li>" for item in rules)
        + "</ol>"
        '<div class="split" style="margin-top:var(--s5)">'
        + runlog(
            "mgit --list",
            WORKSPACE + (" · 6 個路徑" if zh else " · 6 paths"),
            captures["list"],
            lang,
        )
        + runlog(
            "mgit --depth 2 --summary",
            "7 repositories" if not zh else "7 個儲存庫",
            captures["depth"],
            lang,
        )
        + "</div>"
        '<p class="band__footnote">'
        + (
            "同一個工作台：<code>--depth 1</code> → 6 個儲存庫，<code>--depth 2</code> → 7 個"
            "（多出 <code>vendor/legacy-auth</code>）。兩個數字都是實際執行結果。"
            if zh
            else "Same workspace: <code>--depth 1</code> → 6 repositories, <code>--depth 2</code> → 7 "
            "(the extra one is <code>vendor/legacy-auth</code>). Both are actual run results."
        )
        + "</p></div></section>"
    )

    # --------------------------------------------------------------- report
    exit_rows = (
        [
            ("0", "全部成功（或搭配 <code>--allow-empty</code> 找不到任何儲存庫）"),
            ("1", "有儲存庫失敗，或一個儲存庫都找不到"),
            ("2", "命令列參數無法解析"),
            ("127", "找不到或無法執行 git"),
            ("130", "被 Ctrl+C 中斷（SIGINT／SIGTERM）"),
            ("其他", "第一個失敗的 git 指令回傳什麼，mgit 就回傳什麼"),
        ]
        if zh
        else [
            ("0", "Every repository succeeded (or nothing was found with <code>--allow-empty</code>)"),
            ("1", "A repository failed, or no repository was found at all"),
            ("2", "The command line could not be parsed"),
            ("127", "git could not be started"),
            ("130", "Interrupted with Ctrl+C (SIGINT / SIGTERM)"),
            ("other", "The exit code of the first failing git invocation, reported unchanged"),
        ]
    )
    parts.append(
        '<section class="band" aria-labelledby="report-title"><div class="shell">'
        '<div class="band__head"><div>'
        '<h2 class="band__title" id="report-title">'
        + esc("一份可以信的報告" if zh else "A report you can act on")
        + '</h2><p class="band__intro">'
        + (
            "乾淨的 repo 只印標題。摘要走 stderr，所以 <code>mgit status -s &gt; status.txt</code> 永遠乾淨。"
            if zh
            else "A clean repository prints its header and nothing else. The summary goes to stderr, so "
            "<code>mgit status -s &gt; status.txt</code> stays clean."
        )
        + "</p></div></div>"
        + instrument(
            lang,
            run_calm,
            "RUN A · mgit --summary",
            (
                "同一個工作台 · 只讀狀態 · 錄製於 2026-09-14"
                if zh
                else "same workspace · read-only status · recorded 2026-09-14"
            ),
            "<b>exit 0</b> · mgit: 6 repositories, 6 succeeded",
            {"clean", "dirty"},
        )
        + '<div class="split" style="margin-top:var(--s5)">'
        + runlog("RUN B · mgit pull", "exit 128 · 5 succeeded, 1 failed", captures["run_pull"], lang)
        + runlog("RUN A · mgit --summary", "exit 0 · 6 succeeded", captures["run_calm"], lang)
        + "</div>"
        '<p class="note__label label" style="margin-top:var(--s5)">'
        + esc("紙尾的結算" if zh else "The totals band")
        + '</p><p class="prose">'
        + (
            "失敗的那次把出事的 repo 與代碼寫進摘要（<code>✗ web-console (exit code 128)</code>），"
            "整體以第一個失敗的代碼收尾。"
            if zh
            else "The failing run names the repository and its code in the summary "
            "(<code>✗ web-console (exit code 128)</code>); the run ends on that first failing code."
        )
        + "</p>"
        + plate(
            "結束代碼" if zh else "Exit codes",
            "mgit " + VERSION,
            table(
                ["Code", "Meaning" if not zh else "意義"],
                [(cell, meaning) for cell, meaning in exit_rows],
                cls="table table--spec",
            ),
        )
        + "</div></section>"
    )

    # -------------------------------------------------------------- install
    procs = [
        (
            "macOS · Linux",
            "POSIX sh，自動偵測作業系統與 CPU 架構、驗證 SHA-256 之後才安裝。"
            if zh
            else "POSIX sh: detects the OS and CPU architecture, verifies SHA-256, then installs.",
            [INSTALL_SH],
        ),
        (
            "Windows PowerShell",
            "也支援 macOS 與 Linux 上的 PowerShell 7+。"
            if zh
            else "Also works from PowerShell 7+ on macOS and Linux.",
            [INSTALL_PS],
        ),
        (
            "npm · npx",
            "需要 Node.js 20 以上；套件內含 6 個平台的官方二進位，安裝時不執行任何程式碼（沒有 postinstall）。"
            if zh
            else "Node.js 20+; the package ships the official binaries for six platforms and runs no code on "
            "install (there is no postinstall).",
            ["npm install -g @willh/mgit", "npx @willh/mgit"],
        ),
    ]
    proc_html = []
    for name, note, commands in procs:
        proc_html.append(
            '<div class="proc"><div class="proc__head"><span class="proc__name">'
            + esc(name)
            + '</span><span class="proc__note">'
            + esc(note)
            + "</span></div>"
            + "".join(window(command, lang, label=name) for command in commands)
            + "</div>"
        )

    targets = [
        ("Linux x86_64", "mgit-x86_64-unknown-linux-musl.tar.gz", "static"),
        ("Linux aarch64", "mgit-aarch64-unknown-linux-musl.tar.gz", "static"),
        ("Linux x86_64", "mgit-x86_64-unknown-linux-gnu.tar.gz", "glibc"),
        ("Linux aarch64", "mgit-aarch64-unknown-linux-gnu.tar.gz", "glibc"),
        ("macOS Apple Silicon", "mgit-aarch64-apple-darwin.tar.gz", "n/a"),
        ("macOS Intel", "mgit-x86_64-apple-darwin.tar.gz", "n/a"),
        ("Windows x64", "mgit-x86_64-pc-windows-msvc.zip", "n/a"),
        ("Windows on ARM", "mgit-aarch64-pc-windows-msvc.zip", "n/a"),
    ]
    parts.append(
        '<section class="band" aria-labelledby="install-title"><div class="shell">'
        '<div class="band__head"><div>'
        '<h2 class="band__title" id="install-title">'
        + esc("安裝" if zh else "Install")
        + '</h2><p class="band__intro">'
        + (
            "單一 Rust 二進位、零執行期相依；官方安裝腳本先驗 SHA-256 再安裝。"
            if zh
            else "One Rust binary, zero runtime dependencies; the official installers verify SHA-256 first."
        )
        + "</p></div></div>"
        '<div class="stack stack--wide">'
        + "".join(proc_html)
        + "</div>"
        '<div class="split" style="margin-top:var(--s6)"><div class="stack">'
        '<p class="label">'
        + esc("自己驗一次" if zh else "Verify it yourself")
        + "</p>"
        + window("shasum -a 256 -c mgit-aarch64-apple-darwin.tar.gz.sha256", lang, label="macOS")
        + window("sha256sum -c mgit-x86_64-unknown-linux-musl.tar.gz.sha256", lang, label="Linux")
        + '<p class="proc__note">'
        + (
            '所有檢查碼也彙整在 <a href="'
            + RELEASE
            + "/download/v"
            + VERSION
            + '/SHA256SUMS.txt">SHA256SUMS.txt</a>。'
            if zh
            else 'Every checksum is also collected in <a href="'
            + RELEASE
            + "/download/v"
            + VERSION
            + '/SHA256SUMS.txt">SHA256SUMS.txt</a>.'
        )
        + '</p></div><div class="stack">'
        + table(
            ["Target", "Archive" if not zh else "發行檔", "libc"],
            [(esc(name), "<code>" + esc(archive) + "</code>", esc(libc)) for name, archive, libc in targets],
            caption="8 個發行目標" if zh else "8 release targets",
        )
        + window("cargo install --path .", lang, label="from source" if not zh else "從原始碼")
        + "</div></div></div></section>"
    )

    # ------------------------------------------------------------ certificate
    figures = [
        ("8", "release targets", "macOS、Linux、Windows，x86_64 與 aarch64" if zh else "macOS, Linux, Windows, x86_64 and aarch64"),
        ("6", "platform binaries in npm" if not zh else "npm 內含的平台二進位", "安裝時不執行任何程式碼" if zh else "no code runs on install"),
        ("0", "runtime dependencies" if not zh else "執行期相依", "單一 Rust 二進位檔" if zh else "one Rust binary"),
        ("SHA-256", "per archive" if not zh else "每個發行檔", "安裝腳本先驗證再安裝" if zh else "the installers verify before installing"),
    ]
    guarantee_rows = (
        [
            ("透明代理", "mgit 只認自己文件列出的選項，不認得的（<code>-c</code>、<code>--git-dir</code>…）直接轉給 git。"),
            ("不經過 shell", "所有 git 參數以陣列傳遞，沒有參數注入、沒有 glob 展開。"),
            ("管線安全", "<code>mgit … | head</code> 會還原 <code>SIGPIPE</code> 預設行為，安靜結束，不噴 panic。"),
            ("測試", "<code>cargo test --all-targets</code>、<code>clippy -D warnings</code>、覆蓋率門檻 90%，在 Ubuntu、macOS、Windows 上跑。"),
            ("授權", "MIT，沒有附加條款。"),
        ]
        if zh
        else [
            ("Transparent", "mgit only claims the options it documents; anything else (<code>-c</code>, <code>--git-dir</code>…) goes straight to git."),
            ("No shell", "Every git argument is passed as an array: no argument injection, no glob expansion."),
            ("Pipe safe", "<code>mgit … | head</code> restores the default <code>SIGPIPE</code> behaviour and exits quietly instead of panicking."),
            ("Tests", "<code>cargo test --all-targets</code>, <code>clippy -D warnings</code> and a 90% coverage floor, run on Ubuntu, macOS and Windows."),
            ("License", "MIT, with no extra terms."),
        ]
    )
    parts.append(
        '<section class="band" aria-labelledby="cert-title"><div class="shell">'
        '<div class="band__head"><div>'
        '<h2 class="band__title" id="cert-title">'
        + esc("為什麼可以直接信" if zh else "Why you can trust the reading")
        + '</h2><p class="band__intro">'
        + (
            "可驗的數字，不是形容詞。"
            if zh
            else "Numbers you can check, not adjectives."
        )
        + "</p></div></div>"
        + plate(
            "校正表" if zh else "Calibration",
            "mgit " + VERSION,
            plate_figures(
                [(term, '<span class="plate__value">' + value + "</span>", note) for term, value, note in figures]
            )
            + '<div style="margin-top:var(--s5)">'
            + plate_rows(guarantee_rows)
            + "</div>",
        )
        + "</div></section>"
    )

    # -------------------------------------------------------------- logbook
    parts.append(
        '<section class="band" aria-labelledby="log-title"><div class="shell">'
        '<div class="band__head"><div>'
        '<h2 class="band__title" id="log-title">'
        + esc("記錄本" if zh else "The logbook")
        + '</h2><p class="band__intro">'
        + (
            "七章：每個選項、每個結束代碼、每個平台差異。"
            if zh
            else "Seven chapters: every option, every exit code, every platform difference."
        )
        + '</p></div></div><nav class="logbook">'
        + logbook_rows(lang, "docs/")
        + "</nav></div></section>"
    )

    return "\n".join(parts), {"a": RUN_CALM, "b": RUN_PULL}
