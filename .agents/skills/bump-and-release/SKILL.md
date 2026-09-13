---
name: bump-and-release
description: 在 mgit 專案中提升語意化版本並完成標籤驅動的正式發行。當使用者要求 bump 版本、發佈新版本、release、發行下一個 patch/minor 或指定版號時使用。版本必須同時更新 Cargo.toml、Cargo.lock 與 npm/package.json（一律使用 scripts/bump-version.sh，不得手改），未明確指定時預設 patch，只有明確指定 minor、major 或版號才使用對應類型。發行流程只允許在 main 分支、工作區乾淨、且該 commit 的 CI 全部成功時執行；發行方式是把 vX.Y.Z 標籤推上 GitHub，由 Release workflow 建置 8 個平台並發佈 GitHub Release，再由 Publish to npm workflow 以 trusted publishing 發佈 @willh/mgit（附 provenance），因此不得手動 npm publish。發行前必須在 CHANGELOG.md 建立對應版本區段（release workflow 直接以該區段產生 GitHub Release 說明，缺少區段會讓發行失敗，且不得以 commit log 充當發行說明）；發佈完成後必須驗證 GitHub Release 的 17 個資產、Release notes 與 CHANGELOG 區段一致（不一致時用 gh release edit 更新）、npm registry 版本、npx 執行結果與 provenance 簽章，並在失敗時依「npm 是否已發佈」決定是否可移動標籤，不得重用已發佈的版號。
---

# Bump And Release（mgit）

## 目的

依 mgit 專案現有的版本腳本與 GitHub Actions 流程，完成版本提升、品質驗證、推送、建立標籤、觸發正式發行，並逐項驗證發行結果。所有操作都必須保留可追溯的提交紀錄，不得虛構未由程式碼或執行結果支持的變更與狀態。

本技能只處理 mgit 這個專案（Rust CLI + npm 包裝套件），不適用於其他 repository。

### 版本與發行的唯一真相

| 項目 | 來源 |
| --- | --- |
| 版本號 | `Cargo.toml`（`[package] version`）、`Cargo.lock`（mgit 套件）、`npm/package.json` 三處必須一致 |
| 版本升級工具 | `scripts/bump-version.sh`（會一次同步三處，並印出後續指令） |
| 發行說明 | `CHANGELOG.md` 的 `## [X.Y.Z] - YYYY-MM-DD` 區段；`scripts/release-notes.sh <version>` 取出該區段，release workflow 會再加上 `.github/release-install-section.md` 的安裝說明 |
| 發行觸發點 | 推送 `vX.Y.Z` 標籤（**不是** push main） |
| 建置與 GitHub Release | `.github/workflows/release.yml`（8 個平台、`SHA256SUMS.txt`） |
| npm 發佈 | `.github/workflows/npm.yml`（trusted publishing / OIDC，自動產生 provenance） |
| CI 驗證 | `.github/workflows/ci.yml`（三平台測試、MSRV、覆蓋率、交叉編譯、安裝腳本、npm 套件） |

`scripts/bump-version.sh` 支援 `patch`、`minor`、`major` 或明確版號（例如 `2.1.0`、`2.1.0-rc.1`），也支援 `--dry-run` 與 `--manifest`。**任何情況都不得手動編輯這三個檔案的版本號。**

---

## 參數解析

使用者輸入放在指令後面，可能是空的，也可能夾雜 `version`、`release` 這類填充字。取第一個有意義的 token 來判斷，其餘忽略：

| 輸入 | 行為 |
| --- | --- |
| `/bump-and-release` | patch（預設） |
| `/bump-and-release patch`、`patch version` | patch |
| `/bump-and-release minor`、`minor version` | minor |
| `/bump-and-release major` | major |
| `/bump-and-release v2.0.2`、`2.0.2` | 明確版號（`v` 前綴要去掉） |
| `/bump-and-release 2.1.0-rc.1` | 明確的 pre-release 版號 |

規則：

- 未指定時一律 patch，不得依變更規模自行推測 minor 或 major。
- 明確版號必須是合法語意化版本，且**大於**目前版本、**尚未**存在於 git 標籤與 npm registry；否則立即停止並回報。
- pre-release 版號（含 `-`）會自動以 npm `next` dist-tag 發佈、GitHub Release 標為 prerelease，`latest` 不受影響。
- 使用者要求「重發同一個版號」時直接拒絕：npm 版本不可覆蓋，請改發下一個版號。

---

## 執行流程

### 1. 前置檢查（硬性閘門，任一項不成立就停止）

先讀取 `README.md`、`CHANGELOG.md`、`npm/PUBLISHING.md`、`Cargo.toml`、`scripts/bump-version.sh`、`scripts/release-notes.sh`、`scripts/verify-release-notes.sh` 與三個 workflow，確認流程沒有變動，再檢查狀態：

~~~sh
git status --short --branch
git branch --show-current
git log -5 --oneline --decorate
git tag --sort=-v:refname | head -10
git fetch --prune origin
git pull --rebase
~~~

- 目前分支必須是 `main`；detached HEAD 或空輸出都要立即停止，不得修改檔案或推送。
- 工作區必須乾淨。若有未提交變更，先依內容判斷是否屬於本次發行：屬於的就用完整正體中文提交訊息提交（見步驟 3 的提交規則），不屬於或範圍不明的就停止回報，不要靜默混入。
- 必須與 `origin/main` 同步（`git pull --rebase` 後沒有分歧）；落後或衝突時先解決。
- 最近一次 `main` 的 CI 必須成功：

~~~sh
main_sha="$(git rev-parse HEAD)"
gh run list --workflow ci.yml --branch main --limit 20 \
  --json databaseId,headSha,status,conclusion \
  --jq ".[] | select(.headSha == \"$main_sha\") | \"\(.databaseId) \(.status) \(.conclusion)\""
~~~

  找不到對應 run 或結論不是 `success` 時，**不得繼續發行**；先修好並讓 CI 在 main 上綠燈。

- 本機品質閘門必須通過（與 CI 相同）：

~~~sh
make check
~~~

- 確認三處版本一致，並記下目前版本：

~~~sh
awk -F'"' '/^\[/ { s = $0 } s == "[package]" && /^version = / { print "Cargo.toml:", $2; exit }' Cargo.toml
awk -F'"' '/^\[\[package\]\]/ { n = "" } /^name = / { n = $2 } n == "mgit" && /^version = / { print "Cargo.lock:", $2; exit }' Cargo.lock
node -p "'npm/package.json: ' + require('./npm/package.json').version"
~~~

### 2. 提升版本並更新 CHANGELOG.md

**a. 提升版本**

~~~sh
scripts/bump-version.sh <patch|minor|major|X.Y.Z>
~~~

執行後立即檢查（三處必須一致，且只有版本行改變）：

~~~sh
git diff --stat
git diff -- Cargo.toml Cargo.lock npm/package.json
git diff --check
~~~

若 `scripts/bump-version.sh` 失敗、三處版本不一致，或 diff 出現版本行以外的改動，停止並回報，不要繼續提交。

**b. 更新 CHANGELOG.md（發行說明唯一來源）**

只有版本提升完成後才動 CHANGELOG.md。以實際的程式碼差異、提交紀錄、測試與文件變更為依據，不得只複製提交標題，也不得新增沒有證據的敘述：

- `## [Unreleased]` 必須保留在最上方。
- 把本次要發佈的項目移到新的 `## [X.Y.Z] - YYYY-MM-DD` 區段，日期使用發行當天的台灣時區日期，版本號必須與剛 bump 的版本完全一致。
- 依內容使用既有的 `### 新增`、`### 改進`、`### 修正`、`### 變更` 分類標題，並保留檔案既有的語氣與格式。
- 尚未納入本次版本的內容留在 `Unreleased`；即使沒有內容也要保留空的 `Unreleased`，不要捏造條目。
- pre-release 版號（例如 `2.1.0-rc.1`）同樣要建立對應區段。

完成後驗證區段確實可被取出，且只有新增的區段與版本行變動：

~~~sh
version="$(node -p "require('./npm/package.json').version")"
scripts/release-notes.sh "$version" | head -n 20
git diff --check
git diff -- CHANGELOG.md
~~~

`scripts/release-notes.sh` 必須成功並印出本次版本的區段；失敗代表區段標題格式錯誤或還沒建立，修正後才可提交。release workflow 也會在 `prepare` 階段做同樣檢查，缺少區段時直接讓發行失敗。

### 3. 提交版本變更（完整正體中文訊息）

提交訊息必須使用 UTF-8 暫存檔，不可使用 `git commit -m`：

~~~sh
commit_msg_file="$(mktemp -t mgit-commit-message)"
# 將完整正體中文提交訊息寫入 "$commit_msg_file"
git commit -F "$commit_msg_file"
rm -f "$commit_msg_file"
~~~

訊息至少包含：本次版號與 bump 類型（或指定版號的理由）、`CHANGELOG.md` 新增的區段摘要（使用者可見行為、相容性影響）、以及實際執行過的驗證（`make check`、`make msrv` 等）與未執行的項目。版本檔與 `CHANGELOG.md` 必須一起提交。標題使用 Conventional Commits，例如 `chore(release): 2.0.2`。

提交後確認 `git status --short` 乾淨，且**尚未**建立任何標籤。

### 4. 推送 main 並等 CI 綠燈

~~~sh
git push origin main
release_sha="$(git rev-parse HEAD)"
run_id="$(gh run list --workflow ci.yml --branch main --limit 20 \
  --json databaseId,headSha \
  --jq ".[] | select(.headSha == \"$release_sha\") | .databaseId" | head -n 1)"
[ -n "$run_id" ] || { echo "找不到對應的 CI run"; exit 1; }
gh run watch "$run_id" --exit-status
gh run view "$run_id" --json headSha,status,conclusion,url
~~~

`headSha` 必須等於 `release_sha`，`conclusion` 必須是 `success`，且所有 job 都成功。**CI 未綠燈前不得建立標籤。**

### 5. 建立並推送標籤（真正的發行動作）

~~~sh
version="$(node -p "require('./npm/package.json').version")"
release_tag="v${version}"
git tag -a "$release_tag" -m "mgit ${version}"
git push origin "$release_tag"
~~~

推送標籤會同時觸發 `.github/workflows/release.yml` 與 `.github/workflows/npm.yml`。取得兩個 run 的 id：

~~~sh
gh run list --limit 10 --json databaseId,name,status,headBranch \
  --jq '.[] | select(.headBranch == "'"$release_tag"'") | "\(.databaseId) \(.name) \(.status)"'
~~~

### 6. 驗證發行結果（全部通過才能回報成功）

**a. Release workflow（建置與 GitHub Release）**

~~~sh
gh run watch <release_run_id> --exit-status
gh run view <release_run_id> --json status,conclusion,jobs \
  --jq '.jobs[] | "\(.conclusion)\t\(.name)"'
gh release view "$release_tag" --json tagName,isDraft,isPrerelease,assets \
  --jq '"\(.tagName) draft=\(.isDraft) prerelease=\(.isPrerelease) assets=\(.assets|length)"'
~~~

必須全 job `success`，且 release 有 **17 個資產**（8 個封存檔 + 8 個 `.sha256` + `SHA256SUMS.txt`），其中包含三平台的 `Install from the release` 與 `Verify the release assets`。

**b. Publish to npm workflow（npm 發佈）**

~~~sh
gh run watch <npm_run_id> --exit-status
gh run view --job <npm_job_id> --log | grep -E "npm publish --access|Signed provenance"
~~~

日誌必須出現 `npm publish --access public --tag <latest|next> (version X.Y.Z)` 與 `Signed provenance statement`。若 workflow 成功但只是在等待或跳過（例如套件尚未在 registry 上、版本已存在），不得宣稱已發佈。

**c. registry 與終端實測**

~~~sh
npm view @willh/mgit version dist-tags versions
npx --yes @willh/mgit --version      # 必須印出 mgit X.Y.Z
~~~

需要驗證 provenance 時，在暫存目錄安裝後執行簽章驗證：

~~~sh
work_dir="$(mktemp -d)"; cd "$work_dir" && npm init -y > /dev/null && npm install @willh/mgit > /dev/null && npm audit signatures
~~~

必須出現 `has a verified attestation`。最後清理暫存目錄。

**d. 驗證並修復 GitHub Release notes**

GitHub Release 的說明必須等於 `CHANGELOG.md` 的本次版本區段加上安裝說明，**不得**保留只由 commit log 或 `--generate-notes` 產生的內容。用專案腳本逐字比對（會忽略行尾空白與 GitHub 在結尾補的換行）：

~~~sh
version="$(node -p "require('./npm/package.json').version")"
release_tag="v${version}"
scripts/verify-release-notes.sh "$version" --tag "$release_tag"
~~~

必須看到 `release notes of vX.Y.Z match CHANGELOG.md [X.Y.Z]`。若不一致（例如 Release 由舊流程建立或被手動改過），以 CHANGELOG 區段覆寫並重新驗證：

~~~sh
scripts/verify-release-notes.sh "$version" --tag "$release_tag" --fix
~~~

`--fix` 會執行 `gh release edit --notes-file`，並在更新後再比對一次；仍然不一致時停止並回報 Release tag 與 diff 內容，不得宣稱發行說明正確。

**e. 回報**

回報內容必須包含：版號、bump 類型、發布提交 SHA、標籤、兩個 workflow 的 run id 與結論、GitHub Release 資產數與**發行說明是否等於 CHANGELOG 區段**、npm `dist-tags`、`npx` 輸出，以及未執行或未通過的項目。不得只說「完成」。

### 7. 失敗處理

| 情況 | 處理 |
| --- | --- |
| 建置或測試失敗、release job 被跳過（尚未發佈任何 release） | 在 main 修正後重新 `git push`，再把標籤移到新 commit：`git tag -d "$release_tag"`、重新建立、`git push --force origin "$release_tag"`。**只有 npm 尚未發佈該版號時才可以這樣做。** |
| npm 已發佈該版號 | **不可**重推或移動標籤；改為 bump 下一個 patch 版號重跑流程 |
| npm workflow 失敗（ENEEDAUTH、資產逾時等） | 先確認 npm 上的 trusted publisher 設定（`npm trust list @willh/mgit`，workflow 檔名必須是 `npm.yml`），修正後用 `gh run rerun <run_id> --failed` 重跑，不需重建置 |
| 標籤已存在但內容不符 | 停止並回報，不要覆蓋既有標籤與 release |
| Release notes 與 CHANGELOG 不一致 | `scripts/verify-release-notes.sh "$version" --tag "$release_tag" --fix` 覆寫並重新驗證；不得改用 commit log 產生的說明 |
| CHANGELOG 缺少本次版本區段 | release workflow 會在 `prepare` 階段失敗；補上區段後重新提交並移動標籤（僅限 npm 尚未發佈該版號） |
| 只想重跑 CI | `gh run rerun <run_id> --failed` |

---

## 不可違反的檢查

- 只在 `main` 分支、工作區乾淨、且該 commit 的 CI 成功時發行。
- 版本一律用 `scripts/bump-version.sh` 更新；`Cargo.toml`、`Cargo.lock`、`npm/package.json` 與標籤四者必須完全一致。
- 發行動作只有一個：推送 `vX.Y.Z` 標籤。**不得手動 `npm publish`**，也不得自行上傳發行檔。
- 每個版本發行前都必須在 `CHANGELOG.md` 建立對應區段，且與版本檔一起提交；缺少區段時不得發行。
- GitHub Release 的發行說明必須等於 `CHANGELOG.md` 區段加安裝說明；不得只依賴 `--generate-notes` 或 commit log，發佈後必須用 `scripts/verify-release-notes.sh` 驗證，不一致就用 `--fix` 修正並重新驗證。
- npm 已發佈的版號不可重用、不可覆蓋、不可移動標籤。
- 未取得兩個 workflow 的成功結論與 registry/npx 實測結果前，不得宣稱發行完成。
- 不虛構版號、run id、資產數量、測試結果或 provenance 狀態。
- 不修改與本次發行無關的程式碼、文件或 workflow；不建立空提交。
- 發現版本不同步、CI 紅燈、標籤衝突、trusted publisher 設定不符或驗證失敗時，停止在可驗證的狀態並完整回報。
