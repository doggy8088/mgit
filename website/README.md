# mgit website

`mgit` 的產品網站：首頁（Persuade）加上記錄本七章（Read），zh-TW 為主、`en/` 是完整鏡像。
純靜態 HTML／CSS 加一支原生 JS，**沒有任何建置步驟**，也不需要外部服務。

## 本機預覽

```sh
python3 -m http.server 8788 --directory website
# 開 http://localhost:8788/
```

直接開檔也可以（`file://` 下字型、筆跡與複製鈕都正常運作）：

```sh
open website/index.html
```

## 結構

```
index.html          zh-TW 首頁
en/index.html       EN 首頁
docs/*.html         記錄本七章（install／options／output／discovery／exit-codes／platforms／changes）
en/docs/*.html      EN 版本
assets/site.css     設計系統：記錄紙、多色筆墨、儀器面板刻字、打孔白窗、刻字規格板
assets/recorder.js  由頁面自帶的 run record 畫筆跡（含筆的慣性、掃描馬車、重播）、複製鈕
assets/fonts/       三個自架 woff2（見下）
```

## 示範資料是錄下來的

首頁與文件頁上的每一次執行都是**真實 session**：用 `target/release/mgit` 在示範工作台
`/tmp/mgit-mixed`（六個儲存庫：api-gateway、billing-worker、docs-site、infra-scripts、
web-console、web-console-hotfix，其中 web-console 帶著一筆未提交的變更）跑：

```sh
mgit --summary            # exit 0，6 個儲存庫全部成功，web-console 有變更
mgit pull                 # exit 128，5 成功 1 失敗（web-console 的 pull 被未提交變更擋下）
mgit --depth 2 --summary  # 7 個儲存庫（多出 vendor/legacy-auth）
mgit --list               # 六個絕對路徑
```

畫筆跡與圖例的資料只有一份來源：頁面裡的
`<script type="application/json" id="mgit-runs">`，由 `recorder.js` 讀取；左欄圖例由同一份結構產生，
所以圖例與筆跡不可能對不上。要更新示範資料時，重跑上面幾個指令，把輸出換進頁面的 run record
（`.runlog__body`）與該 JSON，兩邊一起改。

## 字型

三個檔案都是自架（OFL 授權），沒有任何外部字型服務：

| 檔案 | 用途 |
| --- | --- |
| `archivo-latin.woff2` | Archivo 可變字型（`wdth` 62–125、`wght` 100–900），拉丁子集，面板刻字與正文 |
| `jetbrains-mono-latin.woff2` | JetBrains Mono（`wght` 100–800），拉丁子集，資料、路徑、指令與表格 |
| `noto-sans-tc-display.woff2` | Noto Sans TC 子集，**只含標題實際用到的 155 個字**（可變 `wght` 100–900） |

CJK 標題走 `--display` 堆疊：`Archivo → "mgit Display"（Noto Sans TC 子集）→ 系統 CJK`。
若標題新增了子集外的字，該字會退回系統字型；要補字就重新產生子集
（Google Fonts `css2?family=Noto+Sans+TC:wght@700;900&text=<所有標題字元>`，取回傳的 woff2）。

## 品質底線

顏色永遠不是唯一承載狀態的方式（狀態另附文字與記號）、內文與標籤對比皆達 WCAG AA、
全鍵盤可達、尊重 `prefers-reduced-motion`（掃描動畫直接給終態）、8px 間距節奏、
380px 到 1600px 都不產生水平溢出。

設計系統的規範層在專案根目錄的 [`DESIGN.md`](../DESIGN.md)（frontmatter 的 token 為準）
與 [`.impeccable/design.json`](../.impeccable/design.json)；本頁面的策略與方向契約在
[`.impeccable/surfaces/website-index-html.md`](../.impeccable/surfaces/website-index-html.md)。
