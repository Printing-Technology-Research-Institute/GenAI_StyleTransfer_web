# GenAI_StyleTransfer_web

用生成式 AI 做風格轉換與合照圖。目前主線入口是 **`ChatGPT.html`（風格魔法師）**，走 OpenAI Images API；舊版 ComfyUI／多頁工具仍保留。

---

## 這次「古文物版本」跟以前差在哪

| | 以前 | 現在（古文物版本） |
|---|---|---|
| 主流程 | 單頁選風格／IP，選項散落 | **Wizard 分步**：先選「經典」或「IP 合照」，再往下選 |
| 經典路線 | 多半是純風格轉換 | **角色 → 玉器／文物 → 風格 → 輸出**；可依角色走「與文物互動」或「純風格」 |
| 文物圖 | 少數參考圖 | 擴充陶器、鐵器、玉器、陶偶神像、人面陶飾、大碗、儲藏甕等 |
| 互動 prompt | 固定或共用一句 | **每件文物 × 每個角色** 可寫不同互動情境（`interactions`） |
| 合成方式 | 多半單張參考 | 經典文物路線可做 **左文物／右人像** 並排合成參考圖 |
| 設定維護 | 改 HTML／JS 程式碼 | 新增 **`admin.html` 後台**，目錄存在瀏覽器 `localStorage` |
| 輸出 | 少比例選項 | 直式海報、2:3、明信片、胸章等；可再套 **外框 PNG** |
| 素材路徑 | `img/` 混用 | **`img/ChatGPT/`**（魔法師）與 **`img/style_transfer_with_tabs/`**（舊分頁版）分開 |

舊頁面（`style_transfer_with_tabs.html`、`Gemini _app.html`、`Ollama.html` 等）仍可用；ComfyUI 路線仍需自行架好伺服器並填 API URL。

---

## 新增了什麼

### 前台（`ChatGPT.html`）
- **經典流程**：考古學家／原始人（與文物互動）＋「風格轉換」（不需玉器）
- **IP 合照流程**：選 IP（如石人、Omu）→ 背景／輸出
- **外框**：`frame1`、`frame2`，生成後套進透明窗，避免被框邊裁切
- 右上角可進 **後台**；金鑰仍只存在本機、不會進 git

### 後台（`admin.html`）
- 管理角色、玉器庫、風格、IP、背景、外框、輸出比例
- 經典「中項」依角色流程切換（文物互動 vs 純風格）
- 玉器／風格可用預設範本快速新增

### 設定與腳本
- `js/catalog.js`：預設目錄（v3）＋ localStorage CRUD
- `js/wizard.js`：分步 Wizard、文物合成、外框偵測與貼合
- `img/ChatGPT/ref-data.js`、`IP/ip-data.js`：`file://` 本機開啟時預載參考圖／IP 圖

---

## 怎麼用（簡短）

1. 用本機伺服器或直接開 `ChatGPT.html`（本機檔案建議搭配上述 data URL 腳本）
2. 填入 OpenAI API Key（勿提交到 repo；見 `.gitignore`）
3. 依 Wizard 選經典或 IP → 生成 → 可選外框下載
4. 要改選項：開 `admin.html` 編輯後，前台會讀同一套 catalog

金鑰檔（如 `openAI-key.txt`、`.env`、`ChatGPT-img/`）已忽略，請勿上傳。
