/**
 * 國中英文測驗 GAS 收件端
 * 1. 建議由目標 Google 試算表「擴充功能 > Apps Script」建立綁定指令碼。
 * 2. 部署為網頁應用程式：執行身分「我」、誰可以存取「任何人 (Anyone)」。
 * 3. 若使用獨立指令碼，將 SPREADSHEET_ID 填入試算表網址 /d/ 與 /edit 之間的 ID。
 * 4. GAS ContentService 無法自行設定 Access-Control-Allow-Origin 標頭。
 *    前端以 no-cors POST + JSONP 查詢收件 ID 驗證，避開讀取跨網域 POST 回應。
 */
const SPREADSHEET_ID = ''; // 綁定試算表時保留空字串
const HEADERS = ['提交時間戳記', '學生姓名/座號', '測驗單元', '得分', '總題數', '正確率', '錯題清單', '作答紀錄(JSON)', '提交ID'];

function spreadsheet_() {
  const ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('找不到試算表，請確認是從試算表開啟 Apps Script，或填入 SPREADSHEET_ID。');
  return ss.getSheets()[0];
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function safeCell_(value) {
  // 防止來自學生裝置的內容被 Sheets 當成公式執行
  const str = String(value == null ? '' : value);
  return /^[\s]*[=+\-@]/.test(str) ? "'" + str : str;
}
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const raw = (e && e.postData && e.postData.contents) || '';
    const data = JSON.parse(raw);
    const id = String(data.submissionId || '');
    const student = String(data.student || '').trim();
    const unit = String(data.unit || '').trim();
    const score = Number(data.score);
    const total = Number(data.total);
    const rate = Number(data.accuracy);
    if (!/^[a-zA-Z0-9-]{15,80}$/.test(id) || !student || student.length > 80 || !unit || unit.length > 120 ||
        !Number.isInteger(score) || !Number.isInteger(total) || total < 1 || total > 200 ||
        score < 0 || score > total || !Number.isFinite(rate) || Math.abs(rate - score / total * 100) > .11) {
      return json_({ ok: false, error: '資料格式不正確' });
    }
    if (!lock.tryLock(20000)) return json_({ ok: false, error: '系統忙碌，請稍後重試' });
    const sheet = spreadsheet_();
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);
    }
    // 避免網路重送產生重複列
    if (sheet.getLastRow() > 1) {
      const match = sheet.getRange(2, 9, sheet.getLastRow() - 1, 1)
        .createTextFinder(id).matchEntireCell(true).findNext();
      if (match) return json_({ ok: true, submissionId: id, duplicate: true });
    }
    const wrong = Array.isArray(data.wrongAnswers) ? data.wrongAnswers : [];
    const answers = Array.isArray(data.answers) ? data.answers : [];
    const wrongSummary = wrong.map(x => `第${Number(x.number)}題：作答 ${String(x.given || '未作答')}；正解 ${String(x.correct || '')}`).join(' | ');
    const stamp = data.timestamp && !isNaN(Date.parse(data.timestamp)) ? new Date(data.timestamp) : new Date();
    sheet.appendRow([
      stamp, safeCell_(student), safeCell_(unit), score, total, rate / 100,
      safeCell_(wrongSummary), safeCell_(JSON.stringify(answers)), id
    ]);
    const row = sheet.getLastRow();
    sheet.getRange(row, 6).setNumberFormat('0.0%');
    SpreadsheetApp.flush();
    return json_({ ok: true, submissionId: id });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: String(err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

/**
 * JSONP 狀態查詢。只回傳隨機 submissionId 是否已出現在試算表，不洩漏學生成績。
 * URL 形式：.../exec?action=status&id=隨機ID&callback=合法JS函式名稱
 */
function doGet(e) {
  const p = e && e.parameter || {};
  const cb = String(p.callback || '');
  if (p.action !== 'status' || !/^[a-zA-Z0-9-]{15,80}$/.test(String(p.id || ''))) {
    return json_({ ok: false, error: 'Invalid request' });
  }
  let saved = false;
  try {
    const sheet = spreadsheet_();
    if (sheet.getLastRow() > 1) {
      saved = !!sheet.getRange(2, 9, sheet.getLastRow() - 1, 1)
        .createTextFinder(String(p.id)).matchEntireCell(true).findNext();
    }
  } catch (err) { console.error(err); }
  const result = JSON.stringify({ ok: true, saved: saved });
  if (/^[A-Za-z_$][A-Za-z0-9_$]{0,80}$/.test(cb)) {
    return ContentService.createTextOutput(cb + '(' + result + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(result).setMimeType(ContentService.MimeType.JSON);
}