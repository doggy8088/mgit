# mgit website

`mgit` 的產品網站：首頁（Persuade）加上文件八章（Read），zh-TW 為主、`en/` 是完整鏡像。
**瀏覽網站不需要任何建置步驟**：倉庫裡的 HTML／CSS／JS 就是成品，開檔案或丟上任何靜態主機都能跑。

`build/` 是**產生器**（作者工具，不是執行期相依）：文案、表格、錄製輸出與兩個語言版本都在
`build/*.py` 裡，跑一次就會重寫 `website/` 底下的 HTML。要改一頁文字時改資料再重跑，比手改
18 個 HTML 檔（還要中英同步）安全：

```sh
python3 website/build/build_site.py     # 重寫 index.html、docs/、en/ 底下所有頁面
```

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
docs/index.html     文件首頁（八章索引）
docs/*.html         文件八章（use-cases／install／options／output／discovery／exit-codes／platforms／changes）
en/docs/*.html      EN 版本
assets/site.css     設計系統：紙與其纖維、石墨板、通道欄、打孔白窗、刻字規格板、亮／暗兩個主題
assets/recorder.js  由頁面自帶的 run record 畫筆跡（含筆的慣性、掃描馬車、重播）、複製鈕、溢出提示
assets/favicon.svg  分頁圖示：紙＋一條石墨板＋一條藍筆跡，與頁面同一組材質
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

驗證方式（頁面上寫的是 2.0.2 版二進位錄下來的，這句話必須能重現）：`cargo build --release`
之後在 `/tmp/mgit-mixed` 重跑上面四個指令，輸出要與 `build/captures/*.txt` 逐字相同；
`depth.txt` 是完整輸出的最後六行（頁面上是截錄，不是全部）。

## 材質（AI 生成的背景圖）

`assets/plates/` 三張圖全部是 **AI 生成的背景材質**，只做材質、不描繪物件；每張的生成
prompt 以 JPEG 註解內嵌在檔案裡，並附同名 `.prompt.txt`（`impeccable embed-prompt --scan
website/assets/plates` 可檢查）。生成原稿留在 `build/texture-sources/`。

生成的原稿太均勻，直接鋪（即使加遮罩）在畫面上只量到 σ 0.5/255、spread 3，也就是「看不出來的材質」。
`build/make-textures.py` 因此把原稿的顆粒重新鋪在設計系統自己的顏色上：均值＝token 的色值，
只有顆粒起伏，振幅由腳本決定（紙 3.2、石墨 4.0、圖表紙 4.4）。產出後要重新內嵌 provenance：

```sh
cd website/build && python3 make-textures.py
cd .. && ../.github/skills/impeccable/scripts/impeccable embed-prompt \
  assets/plates/paper-fibre.jpg --prompt-file assets/plates/paper-fibre.prompt.txt
```

| 檔案 | 用在哪 | 實測（材質單獨渲染，σ/255） |
| --- | --- | --- |
| `paper-fibre.jpg` | 整頁底色（`900px auto`） | 3.44 |
| `graphite-plate.jpg` | 規格板、footer、通道欄、石墨安裝窗、run log 的 bar（`900px auto`） | 3.9–4.7 |
| `chart-paper.jpg` | 只用在條帶的紙窗裡（`1200px auto`，上面另加 40px 印刷格線） | 5.2（含格線） |
| `graphite-plate-2.jpg` | **暗色主題的面板**（規格板、footer、通道欄、run log 的 bar；`900px auto`） | 3.6–4.4 |

因為紙的纖維是真的，`--ink-3`（12px 標籤）必須對**紙最暗的那一角**仍達 4.5。紙的粒紋尾部比
高斯重，用 ±2.2σ 估會高估，要用實測最暗值：目前值 `#616369` 對最暗粒紋（226/255）是 4.64、
對 token 紙是 5.51。改材質振幅或這個 token 時要一起重算。

網站上沒有偽裝成產品照片的影像，也沒有敘事型配圖。要換材質就重新生成、同樣附上 prompt，
再把舊檔刪掉——不要留下沒有來源的點陣圖。

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

## 主題（亮／暗）

兩個主題是**同一個世界的材質變體，不是色相反轉**。亮色＝亮桌上的儀器；暗色＝同一台儀器入夜：
**桌與面板轉石墨，紙仍然是紙**。所以暗色的圖表紙條維持 `#f5f6f4`＋chart-paper，run log 的
輸出紙與官方安裝窗改鋪 `paper-fibre`——安裝窗因此成為暗色頁面上最亮的物件，讓「全頁只有一個
最重動作」的不變量在兩個主題都成立。打孔窗、語言／主題鍵帽與重播鍵**刻意維持平填**（鏡射亮色
的平白打孔）：顆粒只給桌與面板，洞和鍵帽是平的。

- 狀態放在 `document.documentElement.dataset.theme`（`light`／`dark`），CSS 的暗色 token 區塊
  key 為 `:root[data-theme="dark"]`；`color-scheme` 由 CSS 跟著主題設，`@media print` 一律還原成紙。
- 頁首有一支**在 stylesheet 之前**的 inline script，於首繪前決定主題：有 `localStorage["mgit-theme"]`
  就用它，否則跟隨 `prefers-color-scheme`；`recorder.js` 的 `initTheme()` 負責點擊切換、寫入儲存，
  並在「使用者還沒選過」時跟隨系統變更。儲存被鎖（隱私模式）時頁面照常，只是不持久。
- 紙張物件共用 `--sheet-*` token 群（`--sheet`／`--sheet-ink`／`--sheet-blue`…）：亮色的
  `--paper`／`--ink`／`--rule`／`--window` 是它們的**純別名**，所以紙物件在暗色可以就地重新宣告
  同一組墨色，而不必把亮色 token 全域翻掉。
- 動暗色時只准動暗色。亮色在這一輪的唯一變動是頁首多了切換鈕、以及條帶三個 12px chip 的紙紋
  （`.strip__meta`／`.vocab`／`.strip__exit` 由 chart-paper 改 paper-fibre，讓 `--ink-3` 對最壞
  粒紋由 4.415 升到 4.761）。

## 品質底線

顏色永遠不是唯一承載狀態的方式（狀態另附文字與記號）、內文與標籤對比皆達 WCAG AA（**對材質的
最壞粒紋，不是對 token 的平均值**——紙的纖維尾部比高斯重，所以要量實測最暗像素）、
全鍵盤可達、尊重 `prefers-reduced-motion`（掃描動畫直接給終態）、8px 間距節奏、
380px 到 1600px 都不產生水平溢出（兩個主題都要）。

設計系統的規範層在專案根目錄的 [`DESIGN.md`](../DESIGN.md)（frontmatter 的 token 為準）
與 [`.impeccable/design.json`](../.impeccable/design.json)；本頁面的策略與方向契約在
[`.impeccable/surfaces/website-index-html.md`](../.impeccable/surfaces/website-index-html.md)。
