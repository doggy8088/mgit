# 封存區（archive）

這裡保存的是 **mgit 的舊版實作與資產**。它們已經被 Rust 版本取代，不再維護、也不再被 CI 使用；保留在此只是為了讓歷史與舊連結仍可查閱，實際的原始碼歷史仍完整存在於 git 中。

## 內容

| 路徑 | 說明 |
| --- | --- |
| `mgit` | 舊版 Bash/Zsh 腳本（macOS、Linux） |
| `mgit.ps1` | 舊版 PowerShell 腳本（Windows、PowerShell Core） |
| `install.sh` | 舊版安裝腳本，直接下載上面的 Bash 腳本 |
| `install.ps1` | 舊版安裝腳本，直接下載上面的 PowerShell 腳本 |
| `Makefile` | 舊版的 `install` / `test` / `test-pwsh` 目標（新版 Makefile 已放回專案根目錄，目標全面更新為 Rust 工作流程） |
| `README.legacy.md` | 舊版正體中文說明文件 |
| `README.en.legacy.md` | 舊版英文說明文件 |
| `assets/` | 舊版說明文件使用的橫幅與截圖 |
| `website/` | 舊版 GitHub Pages 靜態網頁（`index.html`、`style.css`、SEO 檔案與圖片） |
| `legacy-workflows/deploy-pages.yml` | 舊版：把 `public/` 部署到 GitHub Pages |
| `legacy-workflows/release-scripts.yml` | 舊版：把 `mgit` 與 `mgit.ps1` 兩個腳本檔上傳到 GitHub Releases |

## 為什麼封存

舊版由兩份各自維護的腳本組成（Bash 與 PowerShell），行為、輸出與錯誤處理難以保持一致，也幾乎無法測試。0.1.0 起改以單一 Rust 二進位檔重新實作，並以 TDD 建立完整測試，詳見根目錄的 [README](../README.md)。

## 想回頭使用舊版

舊版仍在 git 歷史中，可以隨時取回：

```sh
git log --oneline -- mgit                 # 找到舊版最後一次提交
git show <commit>:mgit > /tmp/mgit        # 取出該版本的 Bash 腳本
```

也可以直接使用當時的安裝指令（指向舊版的檔案，不再更新）：

```sh
curl -fsSL https://raw.githubusercontent.com/doggy8088/mgit/<commit>/install.sh | bash
```

## 想恢復網頁部署

`legacy-workflows/deploy-pages.yml` 只是被移到封存區，工作流程本身沒有被修改。若要恢復網站部署，把它移回 `.github/workflows/`，並確認它引用的 `path` 指向封存後的新位置（`./archive/website`）：

```sh
git mv archive/legacy-workflows/deploy-pages.yml .github/workflows/deploy-pages.yml
# 然後把 workflow 內的 path: './public' 改成 path: './archive/website'
```

舊版的 release 流程（`legacy-workflows/release-scripts.yml`）**不建議**恢復，它與現在的 Rust 發行流程會互相衝突。
