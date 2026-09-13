# 發佈 `@willh/mgit` 到 npm

這份文件說明**第一次發佈**與**設定 trusted publishing**（無 token 的 CI/CD 發佈）的完整流程。

## 這個 npm 套件是什麼

`@willh/mgit` 是一個「自帶二進位檔」的包裝套件：

- 內含 6 個平台的官方發行檔（`aarch64`／`x86_64` × `apple-darwin`／`unknown-linux-musl`／`pc-windows-msvc`），這些檔案是在發佈時從 GitHub Release 資產 vendoring 進來，經過 SHA-256 驗證。
- `npm i -g @willh/mgit` 會建立 `mgit` 指令；`npx @willh/mgit` 可直接執行，不需安裝。
- **沒有 `postinstall`**：安裝過程不會執行任何程式碼，因此 `--ignore-scripts`、pnpm、yarn、bun 都能正常運作，也沒有安裝期網路請求或代理問題。

---

## 前置需求

| 項目 | 需求 |
| --- | --- |
| npm 帳號 | 具備 `@willh` scope 的發佈權限，並已啟用 2FA |
| GitHub | repo `doggy8088/mgit`（發佈流程會從 Release 資產取二進位檔） |
| 本機（手動首次發佈） | Node.js ≥ 20，`npm login` 可正常登入 |
| CI（trusted publishing） | npm CLI ≥ 11.5.1、Node ≥ 22.14、GitHub-hosted runner |

> npm 官方目前**無法**為「尚未存在」的套件設定 trusted publisher（PyPI 可以，npm 不行），所以第一版一定要先用本機憑證發佈，之後才能全自動化。這是 npm 端的限制，不是本專案的限制。

---

## 第一次發佈（手動，只需做一次）

### 1. 先產生 GitHub Release

發行流程由標籤驅動，**npm 套件內容來自 Release 資產**，所以順序不能顛倒：

```sh
# 版本已由 scripts/bump-version.sh 同步（Cargo.toml、Cargo.lock、npm/package.json）
git tag -a v0.1.0 -m "mgit 0.1.0"
git push origin v0.1.0
```

到 GitHub Actions 確認 `Release` workflow 完成，且 Release 頁面已出現 8 個平台的封存檔、對應的 `.sha256` 與 `SHA256SUMS.txt`。

### 2. 取回資產並 vendoring

```sh
gh release download v0.1.0 --dir assets \
  --pattern '*.tar.gz' --pattern '*.zip' --pattern '*.sha256'

npm/scripts/vendor.sh assets         # 預設處理 6 個平台，逐一驗證 SHA-256
```

在本機開發時也可以只用自己平台的封存檔（`make package` 產生）：

```sh
make package          # 產生 dist/mgit-<target>.tar.gz 與檢查碼
make npm-vendor       # 等同 npm/scripts/vendor.sh dist $(TARGET)
make npm-test         # 執行包裝套件測試
make npm-pack         # 產生可試裝的 tarball（會一併複製 LICENSE）
```

### 3. 檢查版本一致性

`npm/package.json`、`Cargo.toml`、`Cargo.lock` 與 git 標籤必須完全一致：

```sh
scripts/bump-version.sh --dry-run patch      # 看目前版本
node -e "console.log(require('./npm/package.json').version)"
```

`scripts/bump-version.sh` 會一次更新這三個檔案；`npm test` 也有一條測試會在版本不同步時失敗。

### 4. 先在本機試裝

```sh
cd npm
npm test                     # 25 個測試
npm pack                     # 產生 willh-mgit-0.1.0.tgz
npm install -g ./willh-mgit-0.1.0.tgz
mgit --version               # 應該印出 mgit 0.1.0
npm uninstall -g @willh/mgit
```

### 5. 發佈

```sh
cd npm
npm login                    # 瀏覽器登入 + 2FA
npm publish --access public  # scoped 套件第一次必須指定 --access public
```

### 6. 驗證

```sh
npm view @willh/mgit version
npx --yes @willh/mgit --version
```

> **第一次發佈不會有 provenance**：npm 只會在支援的雲端 CI（GitHub Actions/GitLab/CircleCI）中產生 provenance 證明。從第二次（由 CI 發佈）開始就會自動附上。
>
> 這一步不需要建立長期 token：`npm login` 會在瀏覽器完成 2FA，憑證只留在你的本機。萬一你改用 granular access token，請在發佈完成後立刻到 npm 網站撤銷它。

---

## 設定 trusted publishing（之後都交給 CI）

### 1. 在 npm 網站設定 publisher

`npmjs.com` → **Packages** → `@willh/mgit` → **Settings** → **Trusted publishing** → **Add trusted publisher** → **GitHub Actions**

| 欄位 | 值 |
| --- | --- |
| Organization or user | `doggy8088` |
| Repository | `mgit` |
| Workflow filename | `npm.yml` |
| Environment | 留空（要做人工審核時再填，見下方） |

> 欄位**大小寫必須完全一致**，workflow 檔名要含 `.yml`。這是「Unable to authenticate (ENEEDAUTH)」最常見的原因。

### 2. 收緊發佈權限（強烈建議）

`Settings` → **Publishing access** → 選 **"Require two-factor authentication and disallow tokens"** → **Update Package Settings**

這會讓傳統 token 完全無法發佈，但 trusted publisher 不受影響。之後請移除任何已不再需要的自動化 token。

### 3. 之後的發佈流程

```sh
scripts/bump-version.sh patch            # 0.1.0 -> 0.1.1，三個檔案一起改
git commit -am "chore(release): 0.1.1"
git tag -a v0.1.1 -m "mgit 0.1.1"
git push origin HEAD v0.1.1
```

推送標籤後會發生：

1. `Release` workflow：驗證版本 → 跑測試 → 建置 8 個平台 → 發佈 GitHub Release（含檢查碼）
2. `Publish to npm` workflow：等待 Release 資產齊全 → 下載並驗證 → vendoring → 跑套件測試 → `npm publish`（自動產生 provenance）

> **第一次推送標籤時（v0.1.0）**：此時套件尚未在 registry 上，npm 也還不能設定 trusted publisher，所以 npm workflow 會**自動跳過**（印出提示並以成功結束，不會是紅燈）。等手動發佈完並設好 trusted publisher，之後的版本就會全自動。

也可以手動只發佈 npm：Actions → **Publish to npm** → **Run workflow**（可指定版本；未指定時使用最新標籤）。

### 選用：用 GitHub Environment 加上人工審核

若希望在發佈前多一道人工關卡：

1. GitHub repo → Settings → Environments → 建立 `npm`
2. 加入 Required reviewers
3. 把 `npm.yml` 內的 `# environment: npm` 註解打開
4. 回到 npm 的 trusted publisher 設定，把 `Environment` 填成 `npm`

---

## Workflow 行為（`.github/workflows/npm.yml`）

| 步驟 | 說明 |
| --- | --- |
| 觸發 | 推送 `v*` 標籤，或 `workflow_dispatch`（輸入版本，預設最新標籤） |
| 版本檢查 | 標籤 = `Cargo.toml` = `Cargo.lock` = `npm/package.json`，任何一個不一致就中止 |
| 等待資產 | 輪詢 GitHub Release，直到 6 個平台的封存檔與檢查碼都出現（最多 20 分鐘） |
| 驗證 | 以 `sha256sum -c` 驗證每個封存檔，再交給 `npm/scripts/vendor.sh` 解開 |
| 測試 | `npm test`（Node 內建測試框架）與 `node --check` 語法檢查 |
| 首發保護 | 若套件還不存在於 registry（第一次發佈）就跳過，並在摘要中提示手動發佈的步驟 |
| 重複保護 | 若該版本已存在於 registry 就跳過發佈（npm 不允許覆蓋既有版本） |
| 發佈 | `npm publish`；版本含 `-` 時使用 `--tag next` 避免動到 `latest` |
| 權限 | `contents: read` + `id-token: write`（trusted publishing 必要，不需要任何 secret） |

---

## 疑難排解

| 症狀 | 原因與解法 |
| --- | --- |
| `ENEEDAUTH` / `Unable to authenticate` | npm 上的 workflow 檔名與實際檔案不一致（大小寫、`.yml`）、workflow 缺少 `id-token: write`、`package.json` 的 `repository.url` 與 repo 不符，或使用了 self-hosted runner（目前不支援） |
| `cannot publish over the previously published versions` | npm 不允許覆蓋已發佈的版本；workflow 會先檢查並跳過，若確定要重發請 bump 版本 |
| 套件頁面沒有 provenance | 只有透過 trusted publishing（雲端 CI）發佈才會自動產生；本機手動發佈不會有 |
| workflow 一直在等資產 | 代表 `Release` workflow 失敗或還沒跑完；修好 Release 後重跑 npm workflow 即可 |
| `npm i -g` 後找不到 `mgit` | npm 的全域 bin 目錄不在 `PATH`；執行 `npm bin -g` 確認，或用 `npx @willh/mgit` |
| 想改 trusted publisher 設定 | 既有的連線無法編輯，必須先刪除再新增（每個套件最多 10 個 publisher） |

---

## 相關檔案

| 檔案 | 用途 |
| --- | --- |
| `npm/package.json` | 套件定義（無 `postinstall`、`files` 只包含 launcher、lib、vendor） |
| `npm/bin/mgit.js` | 啟動器：解析平台、繼承 stdio 執行原生二進位、轉送 signal 與結束代碼 |
| `npm/lib/platform.js` | 平台／架構 → release target 對照表 |
| `npm/scripts/vendor.sh` | 驗證並解開 release 封存檔到 `npm/vendor/<target>/` |
| `.github/workflows/npm.yml` | trusted publishing 發佈流程（workflow 檔名必須與 npm 設定一致） |
| `.github/workflows/release.yml` | 建置並發佈 GitHub Release（npm workflow 的上游） |
| `scripts/bump-version.sh` | 同步 `Cargo.toml`、`Cargo.lock` 與 `npm/package.json` |
