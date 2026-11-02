# 國中英文全方位複習與測驗｜English Orbit

這是依照《國中英語大滿貫主題探索》及《國中英語大滿貫文法總匯》的單元架構所整理的練習網站。題目是重新撰寫的練習題，並非整本講義逐題轉錄。

## 檔案
- `index.html`：單頁式網站，含主題複習、測驗及成績報告。
- `Code.gs`：將測驗資料寫入 Google Sheets 的 Apps Script 後端。

## 部署 Google Sheets 收件端
1. 在 Google Sheets 建立試算表，前往「擴充功能 → Apps Script」。
2. 將 `Code.gs` 貼入編輯器並儲存。
3. 選「部署 → 新增部署作業 → 網頁應用程式」，執行身分選「我」，存取權限選「任何人（Anyone）」。
4. 完成授權後複製結尾為 `/exec` 的網頁應用程式網址。
5. 在 `index.html` 最上方搜尋 `GAS_WEB_APP_URL`，換成上述網址並提交變更。
6. 用測試姓名作答並交卷，確認試算表新增紀錄。

**注意**：GAS 的 ContentService 沒有提供自行設定任意 CORS 標頭的方式；此網站使用 POST 與回查方式處理。不要把學生敏感資料或 API 密鑰放進公開儲存庫。

## GitHub Pages
前往本儲存庫 **Settings → Pages**，將 **Build and deployment → Source** 設為 **Deploy from a branch**，選 `main` / `/(root)` 並儲存。發布後的預期網址：

https://quuuiii.github.io/junior-english-review/

首次發布可能需要稍後才會生效；Google Sheets 後端仍需要自行部署及填入 GAS URL。
