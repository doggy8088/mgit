---

## 安裝

**macOS / Linux（POSIX sh）**

```sh
curl -fsSL https://raw.githubusercontent.com/doggy8088/mgit/main/install.sh | sh
```

**Windows PowerShell（也支援 macOS 與 Linux 的 PowerShell 7+）**

```powershell
irm https://raw.githubusercontent.com/doggy8088/mgit/main/install.ps1 | iex
```

**npm / npx**

```sh
npm install -g @willh/mgit
npx @willh/mgit
```

每個封存檔都列在 `SHA256SUMS.txt`，官方安裝腳本會先驗證對應的 `.sha256`，
才會把 `mgit` 放進你的 `PATH`。
