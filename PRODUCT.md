# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**主要使用者（已確認）：個人開發者**，在一個父目錄底下同時放著多個 Git 儲存庫（自己的專案、實驗、fork、`git worktree`），需要用一個指令就掌握全部狀態，或對它們批次執行同一個 git 指令。

情境：日常工作目錄本身就是「多 repo 的工作台」；不想每次重寫 `for d in */; do (cd "$d" && git status -s); done`；需要能安心 pipe 或放進腳本的輸出與結束代碼。

README 另外記錄了自動化會用到的行為（結束代碼彙總、摘要走 stderr、`--color=never`、`--allow-empty`），但那些是已實作的能力，不是已確認的主要對象。

## Product Purpose

**經典用法（使用者的初衷）**：應用程式、共用套件、範例、部署腳本、文件站各自是一個 repo，散在同一個
工作目錄底下，彼此用相對路徑互相參考，卻沒有用 `git submodule` 綁在一起。mgit 就是為此而寫：
**一個指令，管理多個子資料夾下的 git repo**（`mgit`、`mgit pull`、`mgit log -n 1`…）。
它不改變任何 repo 的內容，也不處理版本關係——需要精確鎖定版本用 submodule，需要單一 CI 與發佈用 monorepo。

`mgit` 把「對每個儲存庫做同一件事」變成一個指令：不帶參數等同在每個子目錄的儲存庫執行 `git status -s`，`mgit pull`、`mgit fetch --all --prune`、`mgit log -n 1` 則把 git 指令原封不動套用到全部儲存庫。

存在的理由：把多 repo 工作台上重複的 shell 迴圈、以及 Bash／PowerShell 兩份腳本各自為政的不一致收斂成單一、可預期、可驗證的工具。

成功＝使用者能一眼看完所有子專案的狀態，並且信任它的輸出與結束代碼（可安全 pipe、可放進 CI、可被另一個腳本判斷成敗）。

## Positioning

相鄰工具不容易同時宣稱的四件事：

1. **單一 Rust 二進位檔，跨平台共用**：8 個發行目標（macOS arm64／x64、Linux musl 與 glibc 的 x64／aarch64、Windows x64／arm64）跑同一套程式與同一組測試；1.0 的 Bash 與 PowerShell 雙腳本已封存。
2. **零執行期相依**：不需要 Python、Node.js 或任何套件管理器，下載即可執行；npm 版 `@willh/mgit` 內含 6 平台官方二進位，且沒有 `postinstall`。
3. **可驗證的安裝**：發行檔附 SHA-256，官方安裝腳本一律先驗證再安裝；所有 git 參數以陣列傳遞、不經過 shell，因此沒有參數注入或 glob 展開問題。
4. **不重新發明 git**：只認自己文件列出的選項，不認得的選項（`-c`、`--git-dir`…）直接轉給 git，維持舊版腳本的透明行為。

## Operating Context

- **執行環境**：macOS、Linux、Windows 的終端機（`cmd.exe`、Windows PowerShell 5.1／7、Windows Terminal）；輸出也常被 pipe 到檔案、CI 日誌，或被 `head` 截斷。
- **目錄慣例**：父目錄下每個子目錄是一個儲存庫；`.git` 目錄與 `.git` 檔案（worktree、submodule）都算；symlink 以「看到的名字」為準且不重複走訪。
- **開發流程**：`make check`（fmt --check + clippy -D warnings + 全部測試）、`make test`、`make e2e`、`make coverage`；CI 在 Ubuntu／macOS／Windows 執行，另有 MSRV 1.85、8 個目標交叉編譯、shellcheck 與 actionlint，覆蓋率門檻 90%。
- **發行流程**：推送 `vX.Y.Z` 標籤 → Release workflow 驗證版本一致性、建置 8 個平台並發佈 GitHub Release（含 `SHA256SUMS.txt`）→ Publish to npm workflow 以 trusted publishing 發佈 `@willh/mgit`。
- **視覺介面**：mgit 本身是終端機 CLI。1.0 時代的專案網頁（`archive/website/`）與 2.x 的第一版網站（`archive/website_v2/`）都已封存、不再維護，因此本檔記錄的 `web` 平台指的是「產品網站／文件網站」這個視覺介面，而非既有產品的一部分。目前上線的是 `website/`：zh-TW 為主、`en/` 為完整鏡像，並帶有一個在瀏覽器裡執行的沙箱試用場。

## Capabilities and Constraints

- **選項**：`-h/--help`、`-V/--version`、`-l/--list`、`-d/--depth <N>`、`-q/--quiet`、`--color <WHEN>`、`--no-color`、`--ascii`、`--summary`、`-k/--keep-going`、`--fail-fast`、`--allow-empty`、`--`；其餘參數全部交給 git。
- **結束代碼**：`0` 全部成功、`1` 有失敗或找不到儲存庫、`2` 參數無法解析、`127` 找不到 git、`130` 被中斷，其他則沿用第一個失敗的 git 指令代碼；摘要寫到 stderr，不汙染 stdout。
- **環境變數**：`MGIT_GIT`、`MGIT_COLOR`、`MGIT_ASCII`，並遵循 `NO_COLOR`、`CLICOLOR_FORCE`、`CLICOLOR`；安裝腳本另用 `MGIT_VERSION`、`MGIT_INSTALL_DIR`、`MGIT_DOWNLOAD_BASE`。優先序：命令列 → `MGIT_*` → `CLICOLOR_FORCE` → `NO_COLOR` → 終端機偵測。
- **相容承諾（binding）**：1.0.0 的預設指令與輸出格式為基準——80 個 `=` 的標題列、`📂 Folder: … │ Branch: …`、乾淨時無輸出；差異一律是修掉缺陷（找不到儲存庫要警告、結束代碼要彙總），行為變更以選項 opt-in。
- **技術限制**：Rust 2024 edition、MSRV 1.85、MIT 授權、無執行期相依；`Cargo.toml`、`Cargo.lock`、`npm/package.json`、`CHANGELOG.md` 與 git 標籤的版本必須一致。
- **發行必備**：每個版本都必須先在 `CHANGELOG.md` 建立 `## [X.Y.Z] - YYYY-MM-DD` 區段，GitHub Release 說明直接取自該區段（缺少會讓 Release workflow 在 prepare 階段失敗）。
- **網站形式（已決定）**：產品首頁＋七章文件＋瀏覽器沙箱試用場，zh-TW 與 EN 各一份，由 `website/build/` 的產生器輸出靜態 HTML，部署在 GitHub Pages 的 `mgit.gh.miniasp.com`。試用場裡的參數解析、儲存庫搜尋、輸出格式與結束代碼是 Rust 原始碼的移植，並以對照測試與真正的執行檔逐字比對；git 本身是模擬的，頁面上明說這條界線。

## Brand Commitments

- **名稱與授權**：`mgit`（GitHub `doggy8088/mgit`、npm `@willh/mgit`），MIT。
- **文件語言（binding）**：`README.md` 以 zh-TW 為主，`README.en.md` 為英文鏡像；commit 訊息使用完整、詳細的 zh-TW。
- **發行承諾（binding）**：單一 Rust 二進位、零執行期相依、發行檔 SHA-256 可驗證、安裝腳本先驗證再安裝、MIT 授權。這些是對使用者的承諾，文案與介面不得削弱或模糊它們。

## Evidence on Hand

- **真實文件**：`README.md`（zh-TW，安裝三途、完整選項表、跨平台行為表、結束代碼、環境變數、找儲存庫規則、與 1.0 的差異表、開發與發行流程）、`README.en.md` 英文鏡像、`CHANGELOG.md`（逐版本記錄，也是 Release notes 的來源）。
- **可驗證的發行證據**：GitHub Releases 上的 8 個平台壓縮檔、`SHA256SUMS.txt`、npm `@willh/mgit`（trusted publishing，附 provenance）。
- **測試資產**：`tests/` 10 個檔案（純函式、檔案系統走訪、假 GitRunner 的流程控制、真實 git 整合、直接執行編譯後二進位的 E2E、安裝腳本測試），`npm/test/` 3 個檔案（node --test）；CI 強制覆蓋率 ≥ 90%。
- **安裝入口**：`install.sh`（POSIX sh）與 `install.ps1`（PowerShell），是真的在使用的入口，不是文件樣板。
- **封存素材**：`archive/assets/banner.jpg`、`archive/assets/screenshot.jpg`、`archive/website/assets/og-image-v2.png`，以及 `archive/website/index.html`／`style.css`（1.0 網站原樣封存）。**使用者未確認這些素材可重用**；若要沿用，需先確認畫面與文案是否仍與 2.x 相符。
- **網站材質**：`website/assets/img/textures/` 的五張圖是 **AI 生成的表面顆粒**（`website/build/make-textures.py` 把生成的顆粒重新鋪在設計系統自己的 token 色上），只做材質、不描繪物件；生成 prompt 以 JPEG 註解內嵌並附同名 `.prompt.txt`，生成原稿留在 `website/build/texture-sources/`。社群分享卡的底圖同樣是生成的抽象表面。網站上沒有任何偽裝成產品照片的影像，也沒有敘事型配圖。
- **網站示範資料**：不再是事先錄好的畫面，而是由 `website/assets/js/engine/` 當場執行產生；該引擎與真正的執行檔之間有逐字對照測試（`website/tests/parity.test.mjs`：8 個工作目錄 × 37 條指令）。
- **不存在、也不得捏造**：使用者見證、客戶案例、下載數或採用數字、效能 benchmark、付費方案、roadmap 承諾。

## Product Principles

1. **一次指令，全部儲存庫**：預設就要能回答「我手上這些 repo 現在怎麼了」，而不是要求使用者先寫迴圈。
2. **透明代理 git**：mgit 只新增「多儲存庫」這一層，不重新詮釋 git 的語意或參數。
3. **下載即可執行**：單一二進位、零相依、可驗證；安裝體驗本身就是產品的一部分。
4. **終端機現實優先**：顏色、符號、locale、Windows 主控台、SIGPIPE 由工具吸收，不要求使用者改環境。
5. **相容是預設，改進用選項**：1.0 的行為與輸出格式是基準，缺陷直接修掉，增強一律以 opt-in 提供。

## Accessibility & Inclusion

- 非 UTF-8 環境（舊版 Windows 代碼頁、`LANG=C`／`LC_ALL=POSIX`）自動改用 ASCII 符號（`Folder: … | Branch: …`），可用 `MGIT_ASCII=0`／`1` 強制覆寫；符號失效時輸出仍必須完整可讀。
- 遵循 `NO_COLOR`、`CLICOLOR`、`CLICOLOR_FORCE`，且輸出被重導向時自動關閉顏色：顏色永遠不是唯一承載資訊的方式，純文字輸出必須完整可讀。
- 沒有已知的輔具需求或指定的無障礙標準（未指定 WCAG 等級）。
