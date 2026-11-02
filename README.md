# 國中英文全方位複習與測驗｜English Orbit

這是依照《國中英語大滿貫主題探索》及《國中英語大滿貫文法總匯》的單元架構所整理的練習網站。題目是重新撰寫的練習題，並非整本講義逐題轉錄。

## 檔案
- `index.html`：單頁式網站，含主題複習、測驗及成績報告。
- `Code.gs`：將測驗資料寫入 Google Sheets 的 Apps Script 後端，並提供老師端資料查詢。\n- `TeacherDashboard.html`：只在試算表內開啟的老師端成績管理側邊欄。

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


## 老師端成績管理（Google 試算表側邊欄）
1. 在目標 Google 試算表選「擴充功能 → Apps Script」，將 GitHub 的完整 `Code.gs` 內容貼入同名指令碼檔案（取代舊版本）。
2. 左側點「＋ → HTML」，**檔案名稱輸入 `TeacherDashboard`**（不要把 .html 也打進檔名），貼入 GitHub `TeacherDashboard.html` 的完整內容並儲存。
3. 回到試算表重新整理網頁，選 **「📚 English Orbit → 開啟老師成績管理」**。第一次使用可能需授權。
4. 在右側側邊欄依**姓名、單元、填寫日期**篩選成績；點「查看錯題」閱讀詳細錯題。
5. 尚未完成 Google Apps Script 網頁應用程式的同學交卷同步設定時，老師端會顯示沒有紀錄；老師端本身不會自動替你部署收件網址。

安全提醒：老師成績不透過公開測驗網站查詢；請勿把 Google 試算表分享為「知道連結的任何人都可檢視／編輯」，也不要把學生敏感資料放進公開 GitHub。老師端使用者仍受試算表本身共用權限影響。
