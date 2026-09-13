# mgit

`mgit` 是一個用 Rust 寫成的跨平台命令列工具，讓你在**一個指令**內，把同一個 Git 指令套用到當前目錄下所有 Git 儲存庫。

```console
$ mgit
================================================================================
📂 Folder: repo-a │ Branch: main
================================================================================
 M src/main.rs

================================================================================
📂 Folder: repo-b │ Branch: feature/login
================================================================================
（乾淨，沒有任何輸出）

================================================================================
```

只要打一次，就能同時掌握所有子專案的狀態；`mgit pull`、`mgit log -n 1`、`mgit fetch --all` 也都一樣。

- **單一 Rust 二進位檔**：macOS、Linux、Windows 共用同一套程式與同一組測試，不再有 Bash 與 PowerShell 兩份行為不一致的腳本。
- **零執行期相依**：不需要 Python、Node.js 或任何套件管理器，下載即可執行。
- **安全**：發行檔附帶 SHA-256 檢查碼，官方安裝腳本一律先驗證再安裝；所有 git 參數都以陣列傳遞，不經過 shell，不會發生參數注入或 glob 展開問題。

---

## 安裝

### 一行指令安裝

**macOS / Linux（POSIX sh）**

```sh
curl -fsSL https://raw.githubusercontent.com/doggy8088/mgit/main/install.sh | sh
```

**Windows PowerShell（也支援 macOS 與 Linux 上的 PowerShell 7+）**

```powershell
irm https://raw.githubusercontent.com/doggy8088/mgit/main/install.ps1 | iex
```

安裝腳本會自動偵測作業系統與 CPU 架構、下載對應的發行檔、以 `SHA256` 驗證後才安裝，並在需要時提示你把安裝目錄加入 `PATH`。

### 透過 npm / npx

需要 Node.js 20 以上。套件內已包含 6 個平台的官方二進位檔，安裝時不會執行任何程式碼（沒有 `postinstall`）：

```sh
npm install -g @willh/mgit      # 或 pnpm add -g @willh/mgit、yarn global add @willh/mgit
npx @willh/mgit                 # 不安裝直接執行
bunx @willh/mgit
```

維護者請參考 [npm/PUBLISHING.md](npm/PUBLISHING.md)：首次發佈步驟與 trusted publishing（無 token 的 CI 發佈）設定。

### 手動下載發行檔

從 [GitHub Releases](https://github.com/doggy8088/mgit/releases) 下載對應平台的壓縮檔：

| 平台 | 發行檔 |
| --- | --- |
| Linux x86_64（靜態連結，相容所有發行版） | `mgit-x86_64-unknown-linux-musl.tar.gz` |
| Linux aarch64（靜態連結） | `mgit-aarch64-unknown-linux-musl.tar.gz` |
| Linux x86_64（glibc） | `mgit-x86_64-unknown-linux-gnu.tar.gz` |
| Linux aarch64（glibc） | `mgit-aarch64-unknown-linux-gnu.tar.gz` |
| macOS Apple Silicon | `mgit-aarch64-apple-darwin.tar.gz` |
| macOS Intel | `mgit-x86_64-apple-darwin.tar.gz` |
| Windows x64 | `mgit-x86_64-pc-windows-msvc.zip` |
| Windows on ARM | `mgit-aarch64-pc-windows-msvc.zip` |

每個壓縮檔都有對應的 `.sha256` 檢查碼，所有檢查碼也會彙整在 `SHA256SUMS.txt`：

```sh
shasum -a 256 -c mgit-aarch64-apple-darwin.tar.gz.sha256    # macOS
sha256sum -c mgit-x86_64-unknown-linux-musl.tar.gz.sha256    # Linux
```

### 從原始碼建置

需要 Rust 1.85 或更新版本（`rust-version` 已宣告，CI 會驗證）：

```sh
git clone https://github.com/doggy8088/mgit.git
cd mgit
cargo build --release          # 產出 target/release/mgit（Windows 為 mgit.exe）
cargo install --path .         # 或直接安裝到 ~/.cargo/bin
```

---

## 使用方式

### 預設行為

不帶任何參數時等同於在每個儲存庫執行 `git status -s`：

```sh
mgit
```

### 傳遞任何 Git 指令

第一個不是 `mgit` 選項的參數之後，所有內容都會原封不動交給 `git`：

```sh
mgit pull                       # 每個儲存庫都 git pull
mgit fetch --all --prune
mgit log --oneline -n 3
mgit checkout main
mgit -c core.pager=cat status   # git 的全域選項照樣可用
mgit -- --version               # `--` 之後即使和 mgit 選項同名也會交給 git
```

> 解析規則：`mgit` 只認得自己文件上列出的選項，遇到不認得的選項（例如 `-c`、`--git-dir`）就會直接轉給 `git`，與舊版腳本的透明行為一致。若指令的第一個參數剛好和 mgit 選項同名（例如 `--version`），請用 `--` 分隔。

### 選項

| 選項 | 說明 |
| --- | --- |
| `-h`, `--help` | 顯示說明並結束 |
| `-V`, `--version` | 顯示版本並結束 |
| `-l`, `--list` | 只列出找到的儲存庫（每行一個絕對路徑），不執行 git |
| `-d`, `--depth <N>` | 向下搜尋的目錄層數，預設 `1`（只找第一層子目錄） |
| `-q`, `--quiet` | 不輸出每個儲存庫的標題，只留下 git 自己的輸出 |
| `--color <WHEN>` | `auto`（預設）、`always`、`never` |
| `--no-color` | 等同 `--color=never` |
| `--ascii` | 只使用 ASCII 符號（不使用 emoji），適合舊版終端機 |
| `--summary` | 結束時一律印出統計摘要 |
| `-k`, `--keep-going` | 某個儲存庫失敗仍繼續（預設行為） |
| `--fail-fast` | 遇到第一個失敗就停止 |
| `--allow-empty` | 找不到任何儲存庫時仍以 `0` 結束 |
| `--` | 之後的參數全部交給 `git` |

### 常用範例

```sh
mgit --depth 2 fetch                  # 連第二層目錄的儲存庫一起更新
mgit --list                           # 確認到底會被操作哪些目錄
mgit -q log --oneline -n 1            # 安靜模式，只看每個儲存庫的最新一筆
mgit --fail-fast pull                 # 一有衝突就停下來處理
mgit --color=never status             # 輸出到檔案或 CI 日誌時關閉顏色
mgit --ascii                          # 在舊版 Windows 主控台使用純 ASCII 輸出
```

---

## 跨平台行為

`mgit` 在多個平台上都刻意處理了終端機差異：

| 情境 | 行為 |
| --- | --- |
| 輸出被重導向（pipe、檔案、CI 日誌） | 自動關閉顏色，只輸出純文字 |
| Windows `cmd.exe` / Windows PowerShell 5.1 | 啟動時嘗試開啟虛擬終端（VT）模式讓 ANSI 顏色生效；若無法開啟則自動停用顏色 |
| Windows 主控台代碼頁不是 UTF-8 | 自動改用 ASCII 符號（`Folder: … \| Branch: …`），避免 emoji 變亂碼 |
| PowerShell 7、Windows Terminal、macOS、Linux | 使用 Unicode 符號（`📂`、`│`、`✗`、`─`） |
| POSIX locale 非 UTF-8（`LANG=C`、`LC_ALL=POSIX`） | 自動改用 ASCII 符號，可用 `MGIT_ASCII=0` 強制回復 Unicode |
| `NO_COLOR` / `CLICOLOR_FORCE` | 遵循社群慣例，詳見下方環境變數 |
| `mgit … \| head` | 還原 `SIGPIPE` 預設行為，管線中斷時安靜結束，不會噴出 panic 訊息 |
| Windows 上的 `git` | 透過 `PATH`（含 `PATHEXT`）尋找 `git.exe`，也可用 `MGIT_GIT` 指定完整路徑 |

---

## 結束代碼

| 代碼 | 意義 |
| --- | --- |
| `0` | 所有儲存庫都成功（或搭配 `--allow-empty` 且找不到儲存庫） |
| `1` | 有儲存庫失敗，或找不到任何儲存庫 |
| `2` | 命令列參數無法解析 |
| `127` | 找不到或無法執行 `git` |
| `130` | 被 Ctrl+C（`SIGINT`／`SIGTERM`）中斷 |
| 其他 | 第一個失敗的 git 指令所回傳的結束代碼會原樣成為 `mgit` 的結束代碼 |

多個儲存庫的執行結果會被彙總：預設會全部跑完（`--keep-going`），並以**第一個失敗**的結束代碼作為整體結果；摘要會寫到標準錯誤輸出，不會汙染標準輸出，因此 `mgit status -s > status.txt` 這種用法依然安全。

---

## 環境變數

| 變數 | 說明 |
| --- | --- |
| `MGIT_GIT` | 指定 `git` 執行檔名稱或路徑（預設 `git`） |
| `MGIT_COLOR` | `auto`、`always` 或 `never`，優先於終端機偵測 |
| `MGIT_ASCII` | `1` 強制 ASCII 符號；`0` 強制 Unicode 符號 |
| `NO_COLOR` | 設為非空值時關閉顏色（[no-color.org](https://no-color.org/) 慣例） |
| `CLICOLOR_FORCE` | 設為非空且非 `0` 的值時強制開啟顏色 |
| `CLICOLOR` | 設為 `0` 時關閉顏色 |
| `MGIT_VERSION` | 安裝腳本要安裝的版本，例如 `2.0.0`（預設最新版） |
| `MGIT_INSTALL_DIR` | 安裝腳本的安裝目錄 |
| `MGIT_DOWNLOAD_BASE` | 安裝腳本的下載來源網址（測試用） |

優先順序：命令列選項 → `MGIT_*` → `CLICOLOR_FORCE` → `NO_COLOR` → 終端機偵測。

---

## 它怎麼找儲存庫

1. 從當前目錄開始，逐層往下找（預設只找第一層，`--depth` 可調整）。
2. 目錄內只要有 `.git` **目錄**或 `.git` **檔案**都算儲存庫，因此 `git worktree` 與 submodule 都能正確辨識。
3. 找到儲存庫後**不會**再往下進入該儲存庫，避免把 submodule 或 vendored 的專案重複算進來。
4. 符號連結（symlink）會被跟進，且以「看到的名字」為準：若 `repo` 與 `link -> repo` 並存，兩個名字都會被執行，與舊版 shell 版本的 `*/` glob 行為相同；同時走訪過的實際目錄只會進入一次，因此連結迴圈不會造成無限迴圈。
5. 結果依名稱排序（忽略大小寫），順序在 macOS、Linux、Windows 上完全一致。
6. 如果一個儲存庫都沒找到，但**當前目錄本身**是儲存庫，`mgit` 會直接在那個目錄執行 git，行為等同直接呼叫 `git`（沿用舊版邏輯）。

---

## 與舊版（1.0.0 Shell 版）的差異

舊版是 `mgit`（Bash）與 `mgit.ps1`（PowerShell）兩份腳本；完整原檔已封存於 [`archive/`](archive/README.md)。新版本的原則：**預設行為與輸出格式盡量不變**，但把明顯的缺陷修掉。

| 項目 | 舊版（1.0.0） | 新版（2.0.0 起） |
| --- | --- | --- |
| 執行形式 | Bash 腳本 + PowerShell 腳本（各自維護） | 單一 Rust 二進位檔，跨平台共用 |
| 預設指令 | `git status -s` | 相同 |
| 輸出格式 | 80 個 `=`、`📂 Folder: … │ Branch: …` | 相同（再加上可切換的 ASCII 模式） |
| 找不到儲存庫 | 完全靜默、結束代碼 `0` | 印出警告並以 `1` 結束（可用 `--allow-empty` 回復舊行為） |
| 結束代碼 | 多儲存庫模式永遠回傳 `0` | 彙總結果，回傳第一個失敗的結束代碼 |
| 選項 | 無，所有參數都給 git | 新增 `--list`、`--depth`、`--quiet`、`--color`、`--ascii`、`--summary`、`--fail-fast`、`--allow-empty`；不認得的選項仍全部轉給 git |
| 顏色 | 一律輸出 ANSI 跳脫序列 | 依終端機能力自動決定，並支援 `NO_COLOR`／`CLICOLOR_FORCE` |
| 網頁與安裝腳本 | `public/`、`install.sh`、`install.ps1` 直接提供腳本 | 網頁已封存；安裝腳本改為下載並驗證官方發行檔 |

---

## 開發

### 專案結構

```
Makefile       常用開發目標（`make help` 可列出全部）
CHANGELOG.md   版本變更記錄（GitHub Release 發行說明來源）
npm/           npm 包裝套件（啟動器、平台對照表、vendor 腳本與測試）
src/
  main.rs       進入點：解析參數、偵測終端機能力、組裝 App
  cli.rs        命令列解析（純函式，不讀取環境）
  env.rs        會影響預設值的環境變數
  color.rs      ANSI 上色（關閉時不輸出任何跳脫序列）
  console.rs    終端機能力偵測與顏色／符號政策
  discovery.rs  尋找子目錄中的 Git 儲存庫
  gitcmd.rs     GitRunner 抽象與 SystemGit 實作
  report.rs     輸出排版（標題、摘要）
  app.rs        流程編排與結束代碼
  platform.rs   平台細節（SIGPIPE）
tests/          對應每個模組的整合測試與端對端測試
scripts/        版本升級工具
archive/        舊版腳本、網頁與 workflow 的封存區
```

### 測試策略（TDD）

每個模組都是先寫測試、再寫實作。測試分成四層：

| 檔案 | 內容 |
| --- | --- |
| `tests/cli_test.rs`、`env_test.rs`、`color_test.rs`、`console_test.rs`、`report_test.rs` | 純函式與排版行為，完全不需要真實終端機或 git |
| `tests/discovery_test.rs`、`app_test.rs` | 檔案系統走訪，以及用「假的 GitRunner」驅動的流程控制（結束代碼、中斷、BrokenPipe） |
| `tests/gitcmd_test.rs` | 對真實 `git` 的整合測試（分支偵測、worktree、detached HEAD、signal） |
| `tests/e2e_test.rs`、`install_scripts_test.rs` | 直接執行編譯後的二進位檔與安裝腳本的端對端測試 |

```sh
cargo test --all-targets         # 全部測試
cargo clippy --all-targets -- -D warnings
cargo fmt --all -- --check
cargo llvm-cov --all-targets --summary-only    # 覆蓋率（CI 要求 ≥ 90%）
```

最常用的動作都包成 Makefile 目標，`make` 或 `make help` 可列出全部：

```console
$ make check                # 與 CI 相同的關卡：fmt --check + clippy -D warnings + 全部測試
$ make test                 # 只跑測試
$ make e2e                  # 只跑端對端測試
$ make lint-scripts         # shellcheck 與 actionlint
$ make msrv                 # 以 Cargo.toml 宣告的 rust-version 再跑一次測試
$ make coverage             # 覆蓋率摘要（需先安裝 cargo-llvm-cov）
$ make package              # 產生 dist/mgit-<target>.tar.gz 與 .sha256（格式與正式發行檔相同）
$ make bump VERSION=patch   # 版本升級（2.0.0 -> 2.0.1）
$ make clean                # 清除 target/ 與 dist/
```

npm 包裝套件有自己的測試與打包流程，發佈方式見 [npm/PUBLISHING.md](npm/PUBLISHING.md)：

```console
$ make npm-test              # 執行包裝套件測試（node --test）
$ make npm-pack              # 以目前平台打包出可試裝的 tarball
$ npm i -g ./npm/willh-mgit-2.0.0.tgz && mgit --version
```

CI（[`.github/workflows/ci.yml`](.github/workflows/ci.yml)）會在 Ubuntu、macOS、Windows 上執行完整測試，另外檢查 MSRV 1.85、8 個發行目標的交叉編譯、shellcheck 與 actionlint，並強制覆蓋率門檻。

### 版本與發行

版本從 `2.0.0` 起（舊版 Shell 實作最後一版是 `1.0.0`），遵循 [SemVer](https://semver.org/)；`Cargo.toml`、`Cargo.lock`、`npm/package.json`、`CHANGELOG.md` 與 git 標籤必須全部一致。

每個版本都必須先在 [`CHANGELOG.md`](CHANGELOG.md) 建立 `## [X.Y.Z] - YYYY-MM-DD` 區段：GitHub Release 的發行說明就是該區段（加上安裝說明），由 `scripts/release-notes.sh` 取出，缺少區段會讓 Release workflow 在 `prepare` 階段直接失敗。

```sh
scripts/bump-version.sh patch      # 2.0.0 -> 2.0.1（同步 Cargo.toml、Cargo.lock、npm/package.json）
scripts/bump-version.sh minor      # 0.1.1 -> 0.2.0
scripts/bump-version.sh 1.0.0-rc.1 # 指定版本
scripts/bump-version.sh --dry-run patch

git add Cargo.toml Cargo.lock && git commit -m "chore(release): 0.1.1"
git tag -a v0.1.1 -m "mgit 0.1.1"
git push origin HEAD v0.1.1        # 推送標籤即觸發發行流程
```

[`.github/workflows/release.yml`](.github/workflows/release.yml) 會驗證版本一致性、跑完整測試、為 8 個目標建置並產生檢查碼、發佈到 GitHub Releases（含 `SHA256SUMS.txt`），最後在三平台用官方安裝腳本安裝**已發佈**的版本做最終驗證。版本含 `-` 尾碼（例如 `0.2.0-rc.1`）時會自動標記為 pre-release。

推送標籤後，`Release` workflow 會建置並發佈 GitHub Release；接著 `Publish to npm` workflow 會把 `@willh/mgit` 發佈到 npm（使用 trusted publishing，不需要任何 token），詳見 [npm/PUBLISHING.md](npm/PUBLISHING.md)。

在支援 Agent Skills 的環境中，可以直接呼叫專案內的 [`bump-and-release`](.agents/skills/bump-and-release/SKILL.md) 技能完成整套流程：

```console
$ /bump-and-release              # 預設 patch
$ /bump-and-release minor        # 指定 minor
$ /bump-and-release v2.1.0       # 指定版號
```

技能會依相同規則執行：確認 main、工作區乾淨與 CI 綠燈 → `scripts/bump-version.sh` → 完整 zh-TW 提交 → 推送標籤 → 驗證兩個 workflow、GitHub Release 資產、npm 版本與 provenance。

也可以在 GitHub 上以 `Release` workflow 手動指定版本執行，流程會自動建立並推送對應標籤。

---

## 授權

[MIT](LICENSE)
