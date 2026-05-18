/**
 * Quidget Hub — email capture endpoint
 * ----------------------------------------------------------------------------
 * Receives POSTs from /get-started and appends a row to the marketing sheet.
 *
 * DEPLOY STEPS (one-time):
 *   1. Open the target sheet:
 *        https://docs.google.com/spreadsheets/d/1HcYD8_pBLOorUS3na849T4i2qBTvg4zZ30Cjv5lGlnE/edit
 *   2. Extensions -> Apps Script. Replace the default Code.gs with this file's contents.
 *   3. Save. Then Run -> select function "ensureHeaders" once to seed the header row
 *      (you'll be asked to authorize; click "Advanced" -> "Go to <project> (unsafe)"
 *      -> "Allow" — this is your own script).
 *   4. Deploy -> New deployment.
 *        Type:   Web app
 *        Execute as: Me (your account)
 *        Who has access: Anyone
 *      Click Deploy. Copy the resulting Web app URL (ends in /exec).
 *   5. In q-q-hub2/get-started/index.html, replace the value of GSHEET_ENDPOINT
 *      with that /exec URL. Commit & push.
 *
 * RE-DEPLOYING after edits:
 *   Deploy -> Manage deployments -> pencil icon -> Version: New version -> Deploy.
 *   The /exec URL stays the same.
 *
 * The page POSTs JSON as text/plain (no-cors), so we read e.postData.contents.
 */

var SPREADSHEET_ID = "1HcYD8_pBLOorUS3na849T4i2qBTvg4zZ30Cjv5lGlnE";
var SHEET_NAME = "Emails";

var HEADERS = [
  "Timestamp (UTC)",
  "Email",
  "Page",
  "UTM Source",
  "UTM Medium",
  "UTM Campaign",
  "City",
  "Region",
  "Country",
  "Referrer",
  "User Agent",
];

function getSheet_() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  return sh;
}

function ensureHeaders() {
  var sh = getSheet_();
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
}

function doPost(e) {
  try {
    ensureHeaders();
    var raw = (e && e.postData && e.postData.contents) ? e.postData.contents : "{}";
    var data = {};
    try { data = JSON.parse(raw); } catch (_) { data = {}; }

    var email = String(data.email || "").trim();
    if (!email || email.indexOf("@") === -1) {
      return jsonOut_({ ok: false, error: "invalid_email" });
    }

    var utms = data.utms || {};
    var geo = data.geo || {};

    var row = [
      new Date(),
      email,
      String(data.page || ""),
      String(utms.utm_source || ""),
      String(utms.utm_medium || ""),
      String(utms.utm_campaign || ""),
      String(geo.city || ""),
      String(geo.region || ""),
      String(geo.country || ""),
      String(data.referrer || ""),
      String(data.userAgent || ""),
    ];

    getSheet_().appendRow(row);
    return jsonOut_({ ok: true });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}

function doGet() {
  return jsonOut_({ ok: true, service: "quidget-email-capture" });
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
