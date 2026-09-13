"""Logbook chapters (Read surface). Real content, taken from the project README."""

from common import (
    cmdline,
    INSTALL_PS,
    INSTALL_SH,
    REPO,
    RELEASE,
    NPM,
    VERSION,
    code,
    esc,
    plate,
    runlog,
    table,
    window,
)

OPTIONS_ZH = [
    ("<code>-h</code>, <code>--help</code>", "顯示說明並結束"),
    ("<code>-V</code>, <code>--version</code>", "顯示版本並結束"),
    ("<code>-l</code>, <code>--list</code>", "只列出找到的儲存庫（每行一個絕對路徑），不執行 git"),
    ("<code>-d</code>, <code>--depth &lt;N&gt;</code>", "向下搜尋的目錄層數，預設 <code>1</code>"),
    ("<code>-q</code>, <code>--quiet</code>", "不輸出每個儲存庫的標題，只留下 git 自己的輸出"),
    ("<code>--color &lt;WHEN&gt;</code>", "<code>auto</code>（預設）、<code>always</code>、<code>never</code>"),
    ("<code>--no-color</code>", "等同 <code>--color=never</code>"),
    ("<code>--ascii</code>", "只使用 ASCII 符號（不使用 emoji），適合舊版終端機"),
    ("<code>--summary</code>", "結束時一律印出統計摘要"),
    ("<code>-k</code>, <code>--keep-going</code>", "某個儲存庫失敗仍繼續（預設行為）"),
    ("<code>--fail-fast</code>", "遇到第一個失敗就停止"),
    ("<code>--allow-empty</code>", "找不到任何儲存庫時仍以 <code>0</code> 結束"),
    ("<code>--</code>", "之後的參數全部交給 git"),
]

OPTIONS_EN = [
    ("<code>-h</code>, <code>--help</code>", "Print the help and exit"),
    ("<code>-V</code>, <code>--version</code>", "Print the version and exit"),
    ("<code>-l</code>, <code>--list</code>", "List the repositories that were found (one absolute path per line)"),
    ("<code>-d</code>, <code>--depth &lt;N&gt;</code>", "How many directory levels to search, default <code>1</code>"),
    ("<code>-q</code>, <code>--quiet</code>", "Suppress the per repository header"),
    ("<code>--color &lt;WHEN&gt;</code>", "<code>auto</code> (default), <code>always</code> or <code>never</code>"),
    ("<code>--no-color</code>", "The same as <code>--color=never</code>"),
    ("<code>--ascii</code>", "ASCII only glyphs, no emoji"),
    ("<code>--summary</code>", "Always print the closing summary"),
    ("<code>-k</code>, <code>--keep-going</code>", "Continue after a failing repository (default)"),
    ("<code>--fail-fast</code>", "Stop at the first repository that fails"),
    ("<code>--allow-empty</code>", "Exit with <code>0</code> when no repository was found"),
    ("<code>--</code>", "Everything that follows is passed to git verbatim"),
]

EXIT_ZH = [
    ("0", "所有儲存庫都成功（或搭配 <code>--allow-empty</code> 且找不到儲存庫）"),
    ("1", "有儲存庫失敗，或找不到任何儲存庫"),
    ("2", "命令列參數無法解析"),
    ("127", "找不到或無法執行 <code>git</code>"),
    ("130", "被 Ctrl+C（<code>SIGINT</code>／<code>SIGTERM</code>）中斷"),
    ("其他", "第一個失敗的 git 指令所回傳的結束代碼會原樣成為 mgit 的結束代碼"),
]

EXIT_EN = [
    ("0", "Every repository succeeded (or nothing was found with <code>--allow-empty</code>)"),
    ("1", "A repository failed, or no repository was found"),
    ("2", "The command line could not be parsed"),
    ("127", "<code>git</code> could not be started"),
    ("130", "Interrupted with Ctrl+C (<code>SIGINT</code> / <code>SIGTERM</code>)"),
    ("other", "The exit code of the first failing git invocation, reported unchanged"),
]

ENV_ZH = [
    ("<code>MGIT_GIT</code>", "指定 <code>git</code> 執行檔名稱或路徑（預設 <code>git</code>）"),
    ("<code>MGIT_COLOR</code>", "<code>auto</code>、<code>always</code> 或 <code>never</code>，優先於終端機偵測"),
    ("<code>MGIT_ASCII</code>", "<code>1</code> 強制 ASCII 符號；<code>0</code> 強制 Unicode 符號"),
    ("<code>NO_COLOR</code>", "設為非空值時關閉顏色（no-color.org 慣例）"),
    ("<code>CLICOLOR_FORCE</code>", "設為非空且非 <code>0</code> 的值時強制開啟顏色"),
    ("<code>CLICOLOR</code>", "設為 <code>0</code> 時關閉顏色"),
    ("<code>MGIT_VERSION</code>", "安裝腳本要安裝的版本，例如 <code>2.0.0</code>（預設最新版）"),
    ("<code>MGIT_INSTALL_DIR</code>", "安裝腳本的安裝目錄"),
    ("<code>MGIT_DOWNLOAD_BASE</code>", "安裝腳本的下載來源網址（測試用）"),
]

ENV_EN = [
    ("<code>MGIT_GIT</code>", "Name or path of the git executable (default <code>git</code>)"),
    ("<code>MGIT_COLOR</code>", "<code>auto</code>, <code>always</code> or <code>never</code>; overrides the terminal detection"),
    ("<code>MGIT_ASCII</code>", "<code>1</code> forces ASCII glyphs, <code>0</code> forces Unicode glyphs"),
    ("<code>NO_COLOR</code>", "Disables color when set to a non empty value (no-color.org)"),
    ("<code>CLICOLOR_FORCE</code>", "Forces color when set to a non empty value other than <code>0</code>"),
    ("<code>CLICOLOR</code>", "<code>0</code> disables color"),
    ("<code>MGIT_VERSION</code>", "Release to install, for example <code>2.0.0</code> (default: the latest one)"),
    ("<code>MGIT_INSTALL_DIR</code>", "Install directory used by the installers"),
    ("<code>MGIT_DOWNLOAD_BASE</code>", "Base URL the installers download from (used by the tests)"),
]

PLATFORM_ZH = [
    ("輸出被重導向（pipe、檔案、CI 日誌）", "自動關閉顏色，只輸出純文字"),
    ("Windows <code>cmd.exe</code>／PowerShell 5.1", "啟動時嘗試開啟虛擬終端（VT）模式讓 ANSI 顏色生效；開不起來就自動停用顏色"),
    ("Windows 主控台代碼頁不是 UTF-8", "自動改用 ASCII 符號（<code>Folder: … | Branch: …</code>），避免 emoji 變亂碼"),
    ("PowerShell 7、Windows Terminal、macOS、Linux", "使用 Unicode 符號（<code>📂</code>、<code>│</code>、<code>✗</code>、<code>─</code>）"),
    ("POSIX locale 非 UTF-8（<code>LANG=C</code>）", "自動改用 ASCII 符號，可用 <code>MGIT_ASCII=0</code> 強制回復 Unicode"),
    ("<code>NO_COLOR</code>／<code>CLICOLOR_FORCE</code>", "遵循社群慣例（見環境變數一章）"),
    ("<code>mgit … | head</code>", "還原 <code>SIGPIPE</code> 預設行為，管線中斷時安靜結束，不會噴出 panic 訊息"),
    ("Windows 上的 git", "透過 <code>PATH</code>（含 <code>PATHEXT</code>）尋找 <code>git.exe</code>，也可以用 <code>MGIT_GIT</code> 指定完整路徑"),
]

PLATFORM_EN = [
    ("Output redirected (pipe, file, CI log)", "Color is switched off automatically; plain text only"),
    ("Windows <code>cmd.exe</code> / PowerShell 5.1", "Tries to enable virtual terminal (VT) mode so ANSI color works; falls back to no color when it cannot"),
    ("Windows console code page is not UTF-8", "Switches to ASCII glyphs (<code>Folder: … | Branch: …</code>) so no emoji turns into noise"),
    ("PowerShell 7, Windows Terminal, macOS, Linux", "Uses Unicode glyphs (<code>📂</code>, <code>│</code>, <code>✗</code>, <code>─</code>)"),
    ("POSIX locale that is not UTF-8 (<code>LANG=C</code>)", "Switches to ASCII glyphs; <code>MGIT_ASCII=0</code> forces Unicode back"),
    ("<code>NO_COLOR</code> / <code>CLICOLOR_FORCE</code>", "Follows the community conventions (see the environment chapter)"),
    ("<code>mgit … | head</code>", "Restores the default <code>SIGPIPE</code> behaviour and exits quietly instead of panicking"),
    ("git on Windows", "Found through <code>PATH</code> (including <code>PATHEXT</code>); <code>MGIT_GIT</code> takes a full path"),
]

CHANGES_ZH = [
    ("執行形式", "Bash 腳本 + PowerShell 腳本（各自維護）", "單一 Rust 二進位檔，跨平台共用同一組測試"),
    ("預設指令", "<code>git status -s</code>", "相同"),
    ("輸出格式", "80 個 <code>=</code>、<code>📂 Folder: … │ Branch: …</code>", "相同，再加上可切換的 ASCII 模式"),
    ("找不到儲存庫", "完全靜默、結束代碼 <code>0</code>", "印出警告並以 <code>1</code> 結束（<code>--allow-empty</code> 回復舊行為）"),
    ("結束代碼", "多儲存庫模式永遠回傳 <code>0</code>", "彙總結果，回傳第一個失敗的結束代碼"),
    ("選項", "無，所有參數都給 git", "新增 <code>--list</code>、<code>--depth</code>、<code>--quiet</code>、<code>--color</code>、<code>--ascii</code>、<code>--summary</code>、<code>--fail-fast</code>、<code>--allow-empty</code>"),
    ("顏色", "一律輸出 ANSI 跳脫序列", "依終端機能力自動決定，並支援 <code>NO_COLOR</code>／<code>CLICOLOR_FORCE</code>"),
    ("網頁與安裝腳本", "<code>public/</code>、<code>install.sh</code>、<code>install.ps1</code> 直接提供腳本", "安裝腳本改為下載並驗證官方發行檔"),
]

CHANGES_EN = [
    ("Form", "A Bash script and a PowerShell script, maintained separately", "One Rust binary, one test suite, every platform"),
    ("Default command", "<code>git status -s</code>", "Unchanged"),
    ("Output format", "80 <code>=</code>, <code>📂 Folder: … │ Branch: …</code>", "Unchanged, plus an ASCII mode"),
    ("Nothing found", "Completely silent, exit code <code>0</code>", "Warns and exits with <code>1</code> (<code>--allow-empty</code> restores the old behaviour)"),
    ("Exit codes", "Always <code>0</code> in multi repository mode", "Aggregated: the first failing exit code becomes the result"),
    ("Options", "None, every argument went to git", "Adds <code>--list</code>, <code>--depth</code>, <code>--quiet</code>, <code>--color</code>, <code>--ascii</code>, <code>--summary</code>, <code>--fail-fast</code>, <code>--allow-empty</code>"),
    ("Color", "Always emitted ANSI escapes", "Decided from the terminal's capabilities, honoring <code>NO_COLOR</code> / <code>CLICOLOR_FORCE</code>"),
    ("Website and installers", "<code>public/</code> plus the scripts themselves", "The installers download and verify the published release"),
]


def chapter(slug, lang, captures):
    zh = lang == "zh"
    body = []

    if slug == "install":
        body.append(("h2", "三條路" if zh else "Three paths"))
        body.append(
            (
                "p",
                "安裝腳本會偵測 OS 與 CPU 架構、下載對應發行檔、驗 SHA-256 後才安裝，必要時提示加入 <code>PATH</code>。"
                if zh
                else "The installers detect the OS and architecture, download the matching release, verify "
                "SHA-256, then install, offering to add the directory to <code>PATH</code>.",
            )
        )
        body.append(("window", (INSTALL_SH, "macOS · Linux")))
        body.append(("window", (INSTALL_PS, "Windows PowerShell")))
        body.append(("window", ("npm install -g @willh/mgit", "npm")))
        body.append(("cmdline", ("npx @willh/mgit", "npx")))
        body.append(
            (
                "p",
                "需要 Node.js 20 以上；內含 6 平台官方二進位，安裝時不執行任何程式碼（沒有 <code>postinstall</code>）。"
                if zh
                else "Node.js 20+; ships the official binaries for six platforms and runs no code on install "
                "(no <code>postinstall</code>).",
            )
        )
        body.append(("h3", "自己驗一次" if zh else "Verify it yourself"))
        body.append(("cmdline", ("shasum -a 256 -c mgit-aarch64-apple-darwin.tar.gz.sha256", "macOS")))
        body.append(("cmdline", ("sha256sum -c mgit-x86_64-unknown-linux-musl.tar.gz.sha256", "Linux")))
        body.append(
            (
                "p",
                '所有檢查碼也彙整在 <a href="'
                + RELEASE
                + "/download/v"
                + VERSION
                + '/SHA256SUMS.txt">SHA256SUMS.txt</a>。',
            )
        )
        body.append(("h3", "從原始碼建置" if zh else "Build from source"))
        body.append(
            (
                "p",
                "需要 Rust 1.85 或更新版本（<code>rust-version</code> 已宣告，CI 會驗證）。"
                if zh
                else "Needs Rust 1.85 or newer (<code>rust-version</code> is declared and CI enforces it).",
            )
        )
        body.append(("cmdline", ("cargo build --release", "cargo")))
        body.append(("cmdline", ("cargo install --path .", "cargo")))
        body.append(("h3", "安裝腳本的三個環境變數" if zh else "Three environment variables for the installers"))
        body.append(
            (
                "ul",
                [
                    "<code>MGIT_VERSION</code>：要安裝的版本，例如 <code>2.0.2</code>（預設最新版）。"
                    if zh
                    else "<code>MGIT_VERSION</code>: the release to install, for example <code>2.0.2</code> (default: latest).",
                    "<code>MGIT_INSTALL_DIR</code>：安裝目錄。"
                    if zh
                    else "<code>MGIT_INSTALL_DIR</code>: where the binary lands.",
                    "<code>MGIT_DOWNLOAD_BASE</code>：下載來源網址（測試用）。"
                    if zh
                    else "<code>MGIT_DOWNLOAD_BASE</code>: the base URL to download from (used by the tests).",
                ],
            )
        )

    elif slug == "options":
        body.append(("h2", "解析規則" if zh else "The parsing rule"))
        body.append(
            (
                "p",
                "只認自己文件列出的選項；不認得的（<code>-c</code>、<code>--git-dir</code>…）直接轉給 git。"
                "第一個參數與 mgit 選項同名時（例如 <code>--version</code>），用 <code>--</code> 分隔。"
                if zh
                else "Only the options in this manual belong to mgit; anything else (<code>-c</code>, "
                "<code>--git-dir</code>, …) goes straight to git. When the first argument collides with an "
                "option name (<code>--version</code>), separate it with <code>--</code>.",
            )
        )
        body.append(
            (
                "table",
                (
                    ["Option", "Description" if not zh else "說明"],
                    [row for row in (OPTIONS_ZH if zh else OPTIONS_EN)],
                ),
            )
        )
        body.append(("h2", "常用範例" if zh else "Everyday examples"))
        body.append(("cmdline", ("mgit --depth 2 fetch", "# 連第二層目錄的儲存庫一起更新" if zh else "# also update repositories one level deeper")))
        body.append(("cmdline", ("mgit --list", "# 確認到底會被操作哪些目錄" if zh else "# which directories will be touched?")))
        body.append(("cmdline", ("mgit -q log --oneline -n 1", "# 只看每個儲存庫的最新一筆" if zh else "# one line of history per repository")))
        body.append(("cmdline", ("mgit --fail-fast pull", "# 一有衝突就停下來處理" if zh else "# stop at the first conflict")))
        body.append(("cmdline", ("mgit --color=never status", "# 輸出到檔案或 CI 日誌時關閉顏色" if zh else "# no colors when writing into a file or CI log")))
        body.append(("cmdline", ("mgit --ascii", "# 舊版 Windows 主控台用純 ASCII" if zh else "# ASCII only output for legacy Windows consoles")))
        body.append(("cmdline", ("mgit -c core.pager=cat status", "# git 的全域選項照樣可用" if zh else "# git's own global options still work")))
        body.append(
            (
                "callout",
                (
                    "注意分隔線" if zh else "Separator",
                    "mgit 的選項只在第一個參數之前有效；一旦遇到不認得的參數，後面全部交給 git。"
                    if zh
                    else "mgit's own options only apply before the first argument that is not its own; everything "
                    "after that goes to git.",
                ),
            )
        )

    elif slug == "output":
        body.append(("h2", "每個儲存庫一段" if zh else "One section per repository"))
        body.append(
            (
                "p",
                "80 個 <code>=</code> 加一行 <code>📂 Folder: … │ Branch: …</code>，接著是 git 自己的輸出；乾淨的 repo 就只有標題。"
                if zh
                else "80 <code>=</code> and one <code>📂 Folder: … │ Branch: …</code>, then git's own output; a "
                "clean repository shows the header alone.",
            )
        )
        body.append(("runlog", ("RUN A · mgit --summary", "exit 0 · 6 succeeded", captures["run_calm"])))
        body.append(("h2", "失敗的那一次" if zh else "When a repository fails"))
        body.append(
            (
                "p",
                "預設全部跑完（<code>--keep-going</code>），摘要列出每個失敗與其代碼，整體以<b>第一個失敗</b>的代碼結束；"
                "<code>--fail-fast</code> 則第一次失敗就停。"
                if zh
                else "Every repository runs by default (<code>--keep-going</code>); the summary lists each "
                "failure with its code and the run ends on the <b>first</b> one. <code>--fail-fast</code> "
                "stops there instead.",
            )
        )
        body.append(("runlog", ("RUN B · mgit pull", "exit 128 · 5 succeeded, 1 failed", captures["run_pull"])))
        body.append(("h2", "摘要與標準輸出" if zh else "The summary and standard output"))
        body.append(
            (
                "p",
                "摘要寫到<b>標準錯誤</b>，所以 <code>mgit status -s &gt; status.txt</code> 不會被汙染；"
                "<code>--summary</code> 可以要求每次執行都印出摘要，<code>--quiet</code> 則只留下 git 自己的輸出。"
                if zh
                else "The summary goes to <b>standard error</b>, so <code>mgit status -s &gt; status.txt</code> stays "
                "clean. <code>--summary</code> always prints it, and <code>--quiet</code> keeps git's own output "
                "only.",
            )
        )
        body.append(("h2", "顏色與符號" if zh else "Color and glyphs"))
        body.append(
            (
                "ul",
                [
                    "輸出被重導向、<code>--color=never</code> 或 <code>NO_COLOR</code> 時，完全不會有 ANSI 跳脫序列。"
                    if zh
                    else "When output is redirected, or with <code>--color=never</code> / <code>NO_COLOR</code>, no "
                    "ANSI escapes are emitted at all.",
                    "<code>--ascii</code> 或非 UTF-8 的環境會用 <code>Folder: … | Branch: …</code>，功能完全相同。"
                    if zh
                    else "<code>--ascii</code>, or a non UTF-8 environment, uses <code>Folder: … | Branch: …</code> "
                    "with identical behaviour.",
                    "顏色永遠不是唯一承載資訊的方式：標題、符號與摘要都能單獨讀懂。"
                    if zh
                    else "Color is never the only carrier: headers, glyphs and the summary all read on their own.",
                ],
            )
        )

    elif slug == "discovery":
        body.append(("h2", "規則" if zh else "The rules"))
        body.append(
            (
                "ul",
                [
                    "從當前目錄開始，逐層往下找（預設只找第一層，<code>--depth</code> 可調整）。"
                    if zh
                    else "The walk starts in the current directory (level 1 by default; <code>--depth</code> goes deeper).",
                    "目錄內只要有 <code>.git</code> 目錄或 <code>.git</code> 檔案都算儲存庫，因此 <code>git worktree</code> 與 submodule 都能正確辨識。"
                    if zh
                    else "A <code>.git</code> directory or a <code>.git</code> file both count, so <code>git worktree</code> and submodules are recognised.",
                    "找到儲存庫後不會再往下進入該儲存庫，避免把 submodule 或 vendored 的專案重複算進來。"
                    if zh
                    else "The walk stops at a repository, so nothing vendored or nested inside it is counted twice.",
                    "符號連結會被跟進，且以「看到的名字」為準；走訪過的實際目錄只會進入一次，連結迴圈不會無限迴圈。"
                    if zh
                    else "Symlinks are followed under the name you see, and each real directory is visited once, so link loops terminate.",
                    "結果依名稱排序（忽略大小寫），順序在 macOS、Linux、Windows 上完全一致。"
                    if zh
                    else "Results are sorted by name, ignoring case, identically on macOS, Linux and Windows.",
                    "如果一個儲存庫都沒找到，但<b>當前目錄本身</b>是儲存庫，就直接在該目錄執行 git。"
                    if zh
                    else "If nothing is found but the <b>current directory</b> is itself a repository, git runs right there.",
                ],
            )
        )
        body.append(("h2", "先看它會動到誰" if zh else "See what will be touched first"))
        body.append(("cmdline", ("mgit --list", "--list")))
        body.append(("runlog", ("mgit --list", "/tmp/mgit-mixed", captures["list"])))
        body.append(("h2", "深度" if zh else "Depth"))
        body.append(
            (
                "p",
                "同一個示範工作台：<code>--depth 1</code> 找到 6 個儲存庫，<code>--depth 2</code> 找到 7 個，多出來的是埋在 <code>vendor/</code> 下的 <code>legacy-auth</code>。"
                if zh
                else "In the demo workspace <code>--depth 1</code> found 6 repositories and <code>--depth 2</code> "
                "found 7: the extra one is <code>legacy-auth</code>, buried under <code>vendor/</code>.",
            )
        )
        body.append(("runlog", ("mgit --depth 2 --summary", "7 repositories" if not zh else "7 個儲存庫", captures["depth"])))

    elif slug == "exit-codes":
        body.append(("h2", "結束代碼" if zh else "Exit codes"))
        body.append(
            (
                "table",
                (
                    ["Code", "Meaning" if not zh else "意義"],
                    [row for row in (EXIT_ZH if zh else EXIT_EN)],
                ),
            )
        )
        body.append(
            (
                "p",
                "多個儲存庫的結果會被彙總：預設全部跑完（<code>--keep-going</code>），並以<b>第一個失敗</b>的結束代碼作為整體結果；摘要寫到標準錯誤，不會汙染標準輸出。"
                if zh
                else "Results are aggregated: every repository runs by default (<code>--keep-going</code>) and the "
                "<b>first</b> failing exit code becomes the exit code of mgit. The summary goes to standard error, "
                "so standard output stays clean.",
            )
        )
        body.append(("h2", "環境變數" if zh else "Environment variables"))
        body.append(
            (
                "table",
                (
                    ["Variable", "Description" if not zh else "說明"],
                    [row for row in (ENV_ZH if zh else ENV_EN)],
                ),
            )
        )
        body.append(
            (
                "p",
                "優先順序：命令列選項 → <code>MGIT_*</code> → <code>CLICOLOR_FORCE</code> → <code>NO_COLOR</code> → 終端機偵測。"
                if zh
                else "Precedence: command line → <code>MGIT_*</code> → <code>CLICOLOR_FORCE</code> → "
                "<code>NO_COLOR</code> → terminal detection.",
            )
        )
        body.append(("cmdline", ("NO_COLOR=1 mgit status", "# 強制關閉顏色" if zh else "# force color off")))
        body.append(("cmdline", ("MGIT_ASCII=0 mgit", "# LANG=C 時仍用 Unicode 符號" if zh else "# keep Unicode glyphs even under LANG=C")))
        body.append(("cmdline", ("MGIT_GIT=/usr/local/bin/git mgit fetch", "# 指定 git" if zh else "# point at a specific git")))

    elif slug == "platforms":
        body.append(("h2", "三個作業系統上的行為" if zh else "Behaviour on all three systems"))
        body.append(
            (
                "table",
                (
                    ["Situation" if not zh else "情境", "Behaviour" if not zh else "行為"],
                    [row for row in (PLATFORM_ZH if zh else PLATFORM_EN)],
                ),
            )
        )
        body.append(("h2", "Windows 的兩個細節" if zh else "Two Windows details"))
        body.append(
            (
                "ul",
                [
                    "啟動時會嘗試開啟 VT 模式；開不起來就自動關閉顏色，不會輸出看不懂的跳脫序列。"
                    if zh
                    else "VT mode is requested at start-up; when it cannot be enabled, color is switched off "
                    "instead of printing escapes a console cannot render.",
                    "主控台代碼頁不是 UTF-8 時自動改用 ASCII 符號，可用 <code>MGIT_ASCII=0</code> 覆寫。"
                    if zh
                    else "A console code page that is not UTF-8 switches to ASCII glyphs; "
                    "<code>MGIT_ASCII=0</code> overrides it.",
                ],
            )
        )
        body.append(("h2", "管線" if zh else "Pipes"))
        body.append(
            (
                "p",
                "<code>mgit … | head</code> 會還原 <code>SIGPIPE</code> 的預設行為，管線中斷時安靜結束，不會噴出 panic 訊息。"
                if zh
                else "<code>mgit … | head</code> restores the default <code>SIGPIPE</code> behaviour: the run ends "
                "quietly when the pipe closes, with no panic message.",
            )
        )

    elif slug == "changes":
        body.append(("h2", "與 1.0（Shell 版）的差異" if zh else "Differences from 1.0 (the shell version)"))
        body.append(
            (
                "p",
                "舊版是 <code>mgit</code>（Bash）與 <code>mgit.ps1</code>（PowerShell）兩份腳本，原檔封存在 <code>archive/</code>。"
                "新版的原則是<b>預設行為與輸出格式盡量不變</b>，但把明顯的缺陷修掉。"
                if zh
                else "The old version was two scripts, <code>mgit</code> (Bash) and <code>mgit.ps1</code> "
                "(PowerShell); both are archived under <code>archive/</code>. The rule for the new version: "
                "<b>keep the default behaviour and the output format</b>, fix the real defects.",
            )
        )
        body.append(
            (
                "table",
                (
                    ["Item" if not zh else "項目", "1.0.0", "2.x"],
                    [row for row in (CHANGES_ZH if zh else CHANGES_EN)],
                ),
            )
        )
        body.append(("h2", "版本與發行" if zh else "Versions and releases"))
        body.append(
            (
                "p",
                "版本以 <code>Cargo.toml</code> 為單一來源，遵循 SemVer；<code>Cargo.toml</code>、<code>Cargo.lock</code>、"
                "<code>npm/package.json</code>、<code>CHANGELOG.md</code> 與 git 標籤必須一致。"
                if zh
                else "The version lives in <code>Cargo.toml</code> and follows SemVer; <code>Cargo.toml</code>, "
                "<code>Cargo.lock</code>, <code>npm/package.json</code>, <code>CHANGELOG.md</code> and the git tag "
                "must all agree.",
            )
        )
        body.append(("cmdline", ("scripts/bump-version.sh patch", "# 2.0.2 → 2.0.3（同步三個檔案）" if zh else "# 2.0.2 → 2.0.3, one command, three files")))
        body.append(("cmdline", ("git tag -a v2.0.3 -m \"mgit 2.0.3\" && git push origin HEAD v2.0.3", "# 推送標籤即觸發發行" if zh else "# the tag starts the release")))
        body.append(
            (
                "ul",
                [
                    "每個版本都必須先在 <code>CHANGELOG.md</code> 建立 <code>## [X.Y.Z] - YYYY-MM-DD</code> 區段；GitHub Release 的說明就是該區段。"
                    if zh
                    else "Every version must first add a <code>## [X.Y.Z] - YYYY-MM-DD</code> section to "
                    "<code>CHANGELOG.md</code>; that section becomes the GitHub Release notes.",
                    "Release workflow 驗證版本一致性、跑完整測試、為 8 個目標建置並產生檢查碼，最後釋出到 GitHub Releases（含 <code>SHA256SUMS.txt</code>）。"
                    if zh
                    else "The release workflow verifies the version, runs the full test suite, builds all eight "
                    "targets with checksums, and publishes the GitHub Release with <code>SHA256SUMS.txt</code>.",
                    "接著 Publish to npm workflow 用 trusted publishing 發佈 <code>@willh/mgit</code>，不需要任何 token。"
                    if zh
                    else "The npm workflow then publishes <code>@willh/mgit</code> with trusted publishing, no "
                    "token involved.",
                ],
            )
        )
        body.append(
            (
                "callout",
                (
                    "發行後驗證" if zh else "After a release",
                    "官方安裝腳本會在三平台安裝<b>已發佈</b>的版本做最終驗證；npm 版本附 provenance 簽章。"
                    if zh
                    else "The installers run on three platforms against the <b>published</b> release as a final "
                    "check, and the npm package ships with a provenance signature.",
                ),
            )
        )

    return body


def heading_list(blocks):
    """The chapter's own index: every h2 and h3 with the id the renderer gives it."""
    out = []
    n = 0
    for kind, value in blocks:
        if kind in ("h2", "h3"):
            n += 1
            out.append((kind, value, "sec-%d" % n))
    return out


def render(blocks, lang):
    out = []
    n = 0
    for kind, value in blocks:
        if kind == "h2":
            n += 1
            out.append('<h2 id="sec-%d">' % n + esc(value) + "</h2>")
        elif kind == "h3":
            n += 1
            out.append('<h3 id="sec-%d">' % n + esc(value) + "</h3>")
        elif kind == "p":
            out.append("<p>" + value + "</p>")
        elif kind == "ul":
            out.append("<ul>" + "".join("<li>" + item + "</li>" for item in value) + "</ul>")
        elif kind == "table":
            headers, rows = value
            out.append(table(headers, rows))
        elif kind == "window":
            command, label = value
            out.append(window(command, lang, label=label))
        elif kind == "cmdline":
            command, label = value
            out.append(cmdline(command, lang, label=label))
        elif kind == "runlog":
            title, meta, text = value
            out.append(runlog(title, meta, text, lang))
        elif kind == "callout":
            label, text = value
            out.append(
                '<div class="callout"><span class="callout__label label">'
                + esc(label)
                + "</span><p>"
                + text
                + "</p></div>"
            )
        else:
            raise ValueError("unknown block: " + kind)
    return "\n".join(out)
