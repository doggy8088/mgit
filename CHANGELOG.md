# 變更記錄

mgit 的版本變更記錄。格式參考 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.1.0/)，
版本號遵循 [Semantic Versioning](https://semver.org/lang/zh-TW/)。

發行流程會把本檔案中對應版本的區段直接當成 GitHub Release 的發行說明
（`scripts/release-notes.sh <version>` 會取出該區段，並在缺少時讓發行失敗），
因此**每個版本發行前都必須先在本檔案建立區段**。使用者可見的行為、影響範圍與
相容性限制都要寫清楚；技術名稱、檔案名稱與選項保留原文。

## [Unreleased]

### 新增

- 新增 `.agents/skills/bump-and-release` 專案技能，可用 `/bump-and-release`、
  `/bump-and-release minor` 或 `/bump-and-release vX.Y.Z` 完成整段發行流程
- 新增本變更記錄，並讓 GitHub Release 的發行說明直接取自對應版本區段

## [2.0.1] - 2026-09-13

### 改進

- `npm/PUBLISHING.md` 的 trusted publishing 設定改用 npm CLI（`npm trust`、
  `npm access set mfa=publish`），附上 `--dry-run` 範例與常見錯誤排除；
  網頁設定保留為替代方案

## [2.0.0] - 2026-09-13

以 Rust 完整重寫，取代 1.0.0 的 Bash／PowerShell 雙腳本實作。舊版資產完整保留於
`archive/`，預設行為與輸出格式維持相容。

### 新增

- 單一 Rust 二進位檔，macOS、Linux、Windows 共用同一套程式與同一組測試，
  且沒有任何執行期相依
- 新選項：`--list`、`--depth`、`--quiet`、`--color`、`--no-color`、`--ascii`、
  `--summary`、`--fail-fast`、`--keep-going`、`--allow-empty` 與 `--` 分隔；
  不認得的選項仍原樣轉交給 git
- 跨平台處理：Windows 自動啟用虛擬終端模式以支援 ANSI 顏色、主控台代碼頁不是
  UTF-8 時自動改用 ASCII 符號、依 POSIX locale 決定符號、還原 SIGPIPE 讓
  `mgit … | head` 不再 panic
- `install.sh`（POSIX sh）與 `install.ps1`（Windows PowerShell 5.1 與
  PowerShell 7+）：下載官方發行檔、強制驗證 SHA-256 後才安裝
- `@willh/mgit` npm 包裝套件：內含 6 個平台的官方二進位檔、沒有 postinstall，
  可用 `npm i -g @willh/mgit` 或 `npx @willh/mgit`
- Makefile 常用目標（`check`、`package`、`msrv`、`cross-check`、`npm-*` 等）
  與 `scripts/bump-version.sh` 版本工具
- GitHub Actions：CI（三平台測試、MSRV 1.85、90% 覆蓋率門檻、8 個發行目標交叉
  編譯、安裝腳本與 npm 套件驗證）與 Release（8 平台建置、`SHA256SUMS.txt`、
  GitHub Release、npm trusted publishing 發佈）

### 修正

- 找不到任何 Git 儲存庫時不再完全靜默：改為輸出警告並以結束代碼 `1` 結束
  （`--allow-empty` 可回復舊行為）
- 多儲存庫模式的結束代碼改為彙總，回傳第一個失敗的儲存庫代碼（舊版永遠回傳 `0`）
- 短選項解析遇到多位元組 UTF-8 參數（例如 `-☃`）不再 panic
- `scripts/bump-version.sh` 支援 CRLF 換行簽出；`.gitattributes` 統一三平台換行為 LF

### 變更

- 輸出格式維持 80 個 `=` 分隔線與 `📂 Folder: … │ Branch: …`，並新增可切換的
  ASCII 模式
- 舊版腳本、網頁與舊 workflow 全數移入 `archive/`

## [1.0.0] - 2026-06-08

舊版 Bash（`mgit`）與 PowerShell（`mgit.ps1`）腳本實作的最後一版，已由 2.0.0
取代並封存於 `archive/`。
