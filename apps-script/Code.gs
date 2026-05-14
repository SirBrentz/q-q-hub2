var SHARED_SECRET = "qdgt-7k9m-trk-ax42-2026";
var SHEET_NAME = "Sessions";

// ─── CHANGE THIS to your team's email addresses ───
var DIGEST_RECIPIENTS = ["brent@qualiphy.me"];

// ─── Slack incoming webhook for real-time demo-click pings ───
// Leave empty ("") to disable.
var SLACK_WEBHOOK_URL = "";

// Total columns in the Sessions sheet (34 → 36 with skip-ahead tracking)
var TOTAL_COLS = 36;

// Column headers — single source of truth for migration + new-sheet setup
var HEADERS = [
  "Session ID",            // 0  A
  "Started At",            // 1  B
  "Referrer",              // 2  C
  "Device",                // 3  D
  "Browser",               // 4  E
  "UTM Source",            // 5  F
  "UTM Medium",            // 6  G
  "UTM Campaign",          // 7  H
  "City",                  // 8  I
  "State",                 // 9  J
  "Country",               // 10 K
  "Has Account",           // 11 L
  "Has Med Director",      // 12 M
  "Has API Key",           // 13 N
  "Has WordPress",         // 14 O
  "Exam Types",            // 15 P
  "Has Subscriptions",     // 16 Q
  "Has Products",          // 17 R
  "Gates Hit",             // 18 S
  "Booked Demo",           // 19 T
  "Demo Scheduled",        // 20 U
  "API Quickstart",        // 21 V
  "Furthest Question",     // 22 W
  "Intake Completed",      // 23 X
  "Furthest Guide Step",   // 24 Y
  "Downloaded Plugin",     // 25 Z
  "Printed Guide",         // 26 AA
  "Guide Completed",       // 27 AB
  "Abandoned At",          // 28 AC
  "Question Times",        // 29 AD
  "Last Activity",         // 30 AE
  "Duration (sec)",        // 31 AF
  "Total Events",          // 32 AG
  "Variant",               // 33 AH
  "Expert Panel Expanded", // 34 AI  ← NEW
  "Skip-Ahead Download"    // 35 AJ  ← NEW
];

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    if (payload.secret !== SHARED_SECRET) {
      return ContentService.createTextOutput("unauthorized");
    }

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(SHEET_NAME);
      if (!sheet) {
        sheet = ss.insertSheet(SHEET_NAME);
        sheet.appendRow(HEADERS);
        sheet.setFrozenRows(1);
        sheet.getRange(1, 1, 1, TOTAL_COLS).setFontWeight("bold").setBackground("#f3f3f3");
      }

      // ─── MIGRATION: ensure all trailing columns exist on older sheets ───
      // Cheap check on every event; only writes headers when columns are missing.
      var existingCols = sheet.getLastColumn();
      if (existingCols < TOTAL_COLS) {
        for (var c = existingCols + 1; c <= TOTAL_COLS; c++) {
          sheet.getRange(1, c).setValue(HEADERS[c - 1]).setFontWeight("bold").setBackground("#f3f3f3");
        }
      }

      var sid = payload.session_id || "";
      var evt = payload.event || "";
      var d = payload.data || {};
      var utms = payload.utms || {};
      var geo = payload.geo || {};
      var now = new Date(payload.timestamp || Date.now());
      var elapsed = payload.elapsed_sec || 0;

      // Find existing row
      var rowIdx = -1;
      if (sheet.getLastRow() > 1) {
        var sessionCol = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
        for (var i = 0; i < sessionCol.length; i++) {
          if (sessionCol[i][0] === sid) {
            rowIdx = i + 2;
            break;
          }
        }
      }

      if (rowIdx === -1) {
        sheet.appendRow([
          sid, now, payload.referrer || "",
          detectDevice(payload.user_agent || ""),
          detectBrowser(payload.user_agent || ""),
          utms.utm_source || "", utms.utm_medium || "", utms.utm_campaign || "",
          geo.city || "", geo.region || "", geo.country || "",
          "", "", "", "", "", "", "",
          "", "", "", "", 0, "", "", "", "", "", "",
          "", "",
          now, elapsed, 1,
          payload.variant || "",
          "", "" // NEW: Expert Panel Expanded, Skip-Ahead Download
        ]);
        rowIdx = sheet.getLastRow();
      }

      var range = sheet.getRange(rowIdx, 1, 1, TOTAL_COLS);
      var row = range.getValues()[0];

      // Always update
      row[30] = now;                  // Last Activity
      row[31] = elapsed;              // Duration
      row[32] = (row[32] || 0) + 1;   // Total Events

      // Backfill UTMs if not set
      if (utms.utm_source && !row[5]) row[5] = utms.utm_source;
      if (utms.utm_medium && !row[6]) row[6] = utms.utm_medium;
      if (utms.utm_campaign && !row[7]) row[7] = utms.utm_campaign;

      // Backfill geo if not set
      if (geo.city && !row[8]) row[8] = geo.city;
      if (geo.region && !row[9]) row[9] = geo.region;
      if (geo.country && !row[10]) row[10] = geo.country;

      // Backfill variant if not set
      if (payload.variant && !row[33]) row[33] = payload.variant;

      switch (evt) {
        case "location_resolved":
          if (d.city) row[8] = d.city;
          if (d.region) row[9] = d.region;
          if (d.country) row[10] = d.country;
          break;

        case "question_viewed":
          var qIdx = d.question_index || 0;
          if (qIdx > (row[22] || 0)) row[22] = qIdx;
          break;

        case "answer_submitted":
          var qid = d.question_id || "";
          var ans = d.answer || "";
          if (qid === "hasAccount") row[11] = ans;
          if (qid === "hasMedDirector") row[12] = ans;
          if (qid === "hasApiKey") row[13] = ans;
          if (qid === "hasWordPress") row[14] = ans;
          if (qid === "examType") row[15] = ans;
          if (qid === "hasSubscriptions") row[16] = ans;
          if (qid === "hasProducts") row[17] = ans;
          break;

        case "gate_shown":
          var gates = row[18] ? row[18].toString() : "";
          var gateId = d.question_id || "";
          if (gates.indexOf(gateId) === -1) {
            row[18] = gates ? gates + ", " + gateId : gateId;
          }
          break;

        case "clicked_book_demo":
          var alreadyClicked = row[19] === "Yes";
          row[19] = "Yes";
          if (!alreadyClicked) notifySlack(row, payload);
          break;

        case "demo_scheduled":
          row[20] = "Yes";
          break;

        case "api_quickstart_viewed":
          var step = d.step !== undefined ? d.step : "";
          if (step === 0) row[21] = "Viewed";
          if (step === 1) row[21] = "Picked services";
          if (step === 2) row[21] = "Generated plan";
          break;

        case "api_quickstart_copied":
          row[21] = "Copied plan";
          break;

        case "intake_completed":
          row[23] = "Yes";
          if (d.has_account) row[11] = d.has_account;
          if (d.has_med_director) row[12] = d.has_med_director;
          if (d.has_api_key) row[13] = d.has_api_key;
          if (d.has_wordpress) row[14] = d.has_wordpress;
          if (d.exam_types) row[15] = d.exam_types;
          if (d.has_subscriptions) row[16] = d.has_subscriptions;
          if (d.has_products) row[17] = d.has_products;
          if (d.question_times) row[29] = JSON.stringify(d.question_times);
          break;

        case "guide_step_viewed":
          var sIdx = d.step_index || 0;
          if (sIdx > (row[24] || 0)) row[24] = sIdx;
          break;

        case "clicked_download_plugin":
          row[25] = "Yes";
          // NEW: flag skip-ahead path downloads separately so we can
          // measure how many experts bypass the wizard entirely.
          if (d.source === "expert_panel") row[35] = "Yes";
          break;

        case "clicked_print_guide":
          row[26] = "Yes";
          break;

        case "guide_completed":
          row[27] = "Yes";
          break;

        // NEW: someone opened the "Already know what you're doing?" collapsible
        // on the first slide. Lets us compute expand → download conversion.
        case "expert_panel_expanded":
          row[34] = "Yes";
          break;

        case "page_unloaded":
          if (d.abandoned_at) row[28] = d.abandoned_at;
          if (d.question_times) row[29] = JSON.stringify(d.question_times);
          if (d.total_duration_sec) row[31] = d.total_duration_sec;
          break;
      }

      range.setValues([row]);
    } finally {
      lock.releaseLock();
    }

    return ContentService.createTextOutput("ok");
  } catch (err) {
    return ContentService.createTextOutput("error: " + err.toString());
  }
}

function doGet(e) {
  var action = e && e.parameter && e.parameter.action;
  var secret = e && e.parameter && e.parameter.secret;

  if (action === "data") {
    if (secret !== SHARED_SECRET) {
      return ContentService.createTextOutput(JSON.stringify({ error: "unauthorized" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet || sheet.getLastRow() < 2) {
      return ContentService.createTextOutput(JSON.stringify({ sessions: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var rows = data.slice(1).map(function(row) {
      var obj = {};
      headers.forEach(function(h, i) {
        var val = row[i];
        if (val instanceof Date) val = val.toISOString();
        obj[h] = val;
      });
      return obj;
    });
    return ContentService.createTextOutput(JSON.stringify({ sessions: rows, updated: new Date().toISOString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput("Quidget tracking webhook is live.");
}

function detectDevice(ua) {
  if (!ua) return "";
  if (/iPad|Tablet/i.test(ua)) return "Tablet";
  if (/iPhone|Android.*Mobile|Mobile/i.test(ua)) return "Mobile";
  return "Desktop";
}

function detectBrowser(ua) {
  if (!ua) return "";
  if (/Edg\//.test(ua)) return "Edge";
  if (/Chrome\//.test(ua)) return "Chrome";
  if (/Safari\//.test(ua)) return "Safari";
  if (/Firefox\//.test(ua)) return "Firefox";
  return "Other";
}

/* ═══════════════════════════════════════════════════════════════════
   SLACK NOTIFICATION ON DEMO CLICK
   ═══════════════════════════════════════════════════════════════════ */
function notifySlack(row, payload) {
  if (!SLACK_WEBHOOK_URL) return;
  try {
    var city = row[8] || "";
    var state = row[9] || "";
    var country = row[10] || "";
    var device = row[3] || "unknown";
    var source = row[5] || "direct";
    var medium = row[6] || "";
    var examTypes = row[15] || "";
    var furthest = row[22] || 0;
    var duration = row[31] || 0;
    var variant = row[33] || "";

    var loc = [city, state].filter(function(x){return x;}).join(", ") || country || "unknown";
    var minutes = Math.floor(duration / 60);
    var seconds = duration % 60;
    var durStr = duration < 60 ? duration + "s" : minutes + "m " + seconds + "s";
    var srcStr = source + (medium ? " / " + medium : "");

    var slackPayload = {
      text: "🚀 Demo click from " + loc,
      blocks: [
        { type: "section", text: { type: "mrkdwn", text: "*🚀 Quidget demo click*" } },
        { type: "section", fields: [
          { type: "mrkdwn", text: "*Location:*\n" + loc },
          { type: "mrkdwn", text: "*Device:*\n" + device },
          { type: "mrkdwn", text: "*Source:*\n" + srcStr },
          { type: "mrkdwn", text: "*Session length:*\n" + durStr },
          { type: "mrkdwn", text: "*Furthest question:*\nq" + furthest + (examTypes ? " · " + examTypes : "") },
          { type: "mrkdwn", text: "*Variant:*\n" + (variant || "—") }
        ]},
        { type: "context", elements: [
          { type: "mrkdwn", text: "Reach out within an hour for the highest conversion lift." }
        ]}
      ]
    };

    UrlFetchApp.fetch(SLACK_WEBHOOK_URL, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(slackPayload),
      muteHttpExceptions: true
    });
  } catch (e) { /* silent */ }
}

/* ═══════════════════════════════════════════════════════════════════
   WEEKLY DIGEST EMAIL
   ═══════════════════════════════════════════════════════════════════ */

function setupWeeklyDigest() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "sendWeeklyDigest") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger("sendWeeklyDigest")
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(8)
    .create();
  Logger.log("Weekly digest trigger created. Runs every Monday at 8 AM.");
}

function sendWeeklyDigest() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return;

  var data = sheet.getDataRange().getValues();
  var rows = data.slice(1);

  var cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  var weekRows = rows.filter(function(r) { return new Date(r[1]) >= cutoff; });

  var total = weekRows.length;
  if (total === 0) {
    var emptyHtml = '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">'
      + '<h2 style="color:#4D3D71">Quidget Weekly Digest</h2>'
      + '<p style="color:#666">No get-started sessions in the past 7 days.</p></div>';
    DIGEST_RECIPIENTS.forEach(function(email) {
      MailApp.sendEmail({ to: email, subject: "Quidget Weekly Digest — No Activity", htmlBody: emptyHtml });
    });
    return;
  }

  var intakeCompleted = 0, guideCompleted = 0, downloadedPlugin = 0;
  var bookedDemo = 0, demoScheduled = 0, apiQuickstart = 0;
  var skipAheadExpanded = 0, skipAheadDownloaded = 0; // NEW
  var examTypes = {}, gates = {}, devices = {}, utmSources = {};
  var states = {}, cities = {};
  var totalDuration = 0, durationCount = 0;
  var variants = {};

  weekRows.forEach(function(r) {
    if (r[23] === "Yes") intakeCompleted++;
    if (r[27] === "Yes") guideCompleted++;
    if (r[25] === "Yes") downloadedPlugin++;
    if (r[19] === "Yes") bookedDemo++;
    if (r[20] === "Yes") demoScheduled++;
    if (r[21]) apiQuickstart++;
    if (r[34] === "Yes") skipAheadExpanded++;   // NEW
    if (r[35] === "Yes") skipAheadDownloaded++; // NEW

    var et = r[15] ? r[15].toString() : "";
    if (et) et.split(",").forEach(function(t) { t = t.trim(); if (t) examTypes[t] = (examTypes[t] || 0) + 1; });

    var g = r[18] ? r[18].toString() : "";
    if (g) g.split(",").forEach(function(gt) { gt = gt.trim(); if (gt) gates[gt] = (gates[gt] || 0) + 1; });

    devices[r[3] || "Unknown"] = (devices[r[3] || "Unknown"] || 0) + 1;
    utmSources[r[5] || "Direct"] = (utmSources[r[5] || "Direct"] || 0) + 1;

    var st = r[9] ? r[9].toString() : "";
    if (st) states[st] = (states[st] || 0) + 1;

    var ct = r[8] ? r[8].toString() : "";
    if (ct) cities[ct + (st ? ", " + st : "")] = (cities[ct + (st ? ", " + st : "")] || 0) + 1;

    var dur = parseInt(r[31]) || 0;
    if (dur > 0) { totalDuration += dur; durationCount++; }

    var v = r[33] ? r[33].toString() : "";
    if (v) variants[v] = (variants[v] || 0) + 1;
  });

  var avgDuration = durationCount > 0 ? Math.round(totalDuration / durationCount) : 0;
  var avgMin = Math.floor(avgDuration / 60);
  var avgSec = avgDuration % 60;
  var completionRate = total > 0 ? Math.round((intakeCompleted / total) * 100) : 0;
  var guideRate = intakeCompleted > 0 ? Math.round((guideCompleted / intakeCompleted) * 100) : 0;
  var skipConvRate = skipAheadExpanded > 0 ? Math.round((skipAheadDownloaded / skipAheadExpanded) * 100) : 0;

  var html = '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8f6fb">'
    + '<div style="background:#4D3D71;color:#fff;padding:24px;border-radius:12px 12px 0 0">'
    + '<h1 style="margin:0;font-size:22px">Quidget Weekly Digest</h1>'
    + '<p style="margin:6px 0 0;opacity:.7;font-size:14px">' + Utilities.formatDate(cutoff, Session.getScriptTimeZone(), "MMM d") + ' — ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "MMM d, yyyy") + '</p>'
    + '</div><div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e2e0e8;border-top:none">';

  html += '<h2 style="font-size:16px;color:#4D3D71;margin:0 0 16px">Key Numbers</h2>'
    + '<table style="width:100%;border-collapse:collapse;margin-bottom:24px">'
    + mRow("Total Sessions", total)
    + mRow("Completed Intake", intakeCompleted + " (" + completionRate + "%)")
    + mRow("Completed Guide", guideCompleted + (intakeCompleted > 0 ? " (" + guideRate + "% of intake)" : ""))
    + mRow("Downloaded Plugin", downloadedPlugin)
    + mRow("Clicked Book Demo", bookedDemo)
    + mRow("Demo Scheduled", demoScheduled)
    + mRow("Used API Quickstart", apiQuickstart)
    + mRow("Avg. Session Duration", avgMin + "m " + avgSec + "s")
    + '</table>';

  // NEW: Skip-Ahead Path section — only shown if any expansion happened this week
  if (skipAheadExpanded > 0 || skipAheadDownloaded > 0) {
    html += '<h2 style="font-size:16px;color:#4D3D71;margin:0 0 12px">Skip-Ahead Path</h2>'
      + '<p style="font-size:12px;color:#888;margin:0 0 10px;line-height:1.5">'
      + 'Users who expanded the "Already know what you\'re doing?" collapsible on the first slide and downloaded directly, bypassing the wizard.'
      + '</p>'
      + '<table style="width:100%;border-collapse:collapse;margin-bottom:24px">'
      + mRow("Expanded Panel", skipAheadExpanded)
      + mRow("Downloaded (skip-ahead)", skipAheadDownloaded + " (" + skipConvRate + "% of expansions)")
      + '</table>';
  }

  if (Object.keys(examTypes).length > 0) {
    html += '<h2 style="font-size:16px;color:#4D3D71;margin:0 0 12px">Exam Types Selected</h2><table style="width:100%;border-collapse:collapse;margin-bottom:24px">';
    Object.keys(examTypes).sort(function(a,b){ return examTypes[b]-examTypes[a]; }).forEach(function(k) {
      var label = k === "gfe" ? "Good Faith Exam"
                : k === "rx" ? "Rx Consultation"
                : k === "urgent_care" ? "Urgent Care"
                : k;
      html += mRow(label, examTypes[k]);
    });
    html += '</table>';
  }

  if (Object.keys(gates).length > 0) {
    html += '<h2 style="font-size:16px;color:#4D3D71;margin:0 0 12px">Friction Points</h2><table style="width:100%;border-collapse:collapse;margin-bottom:24px">';
    Object.keys(gates).sort(function(a,b){ return gates[b]-gates[a]; }).forEach(function(k) {
      html += mRow(k, gates[k] + " sessions");
    });
    html += '</table>';
  }

  if (Object.keys(states).length > 0) {
    html += '<h2 style="font-size:16px;color:#4D3D71;margin:0 0 12px">Top States</h2><table style="width:100%;border-collapse:collapse;margin-bottom:24px">';
    Object.keys(states).sort(function(a,b){ return states[b]-states[a]; }).slice(0, 10).forEach(function(k) {
      html += mRow(k, states[k] + " (" + Math.round(states[k]/total*100) + "%)");
    });
    html += '</table>';
  }

  if (Object.keys(cities).length > 0) {
    html += '<h2 style="font-size:16px;color:#4D3D71;margin:0 0 12px">Top Cities</h2><table style="width:100%;border-collapse:collapse;margin-bottom:24px">';
    Object.keys(cities).sort(function(a,b){ return cities[b]-cities[a]; }).slice(0, 10).forEach(function(k) {
      html += mRow(k, cities[k]);
    });
    html += '</table>';
  }

  html += '<h2 style="font-size:16px;color:#4D3D71;margin:0 0 12px">Devices</h2><table style="width:100%;border-collapse:collapse;margin-bottom:24px">';
  Object.keys(devices).sort(function(a,b){ return devices[b]-devices[a]; }).forEach(function(k) {
    html += mRow(k, devices[k] + " (" + Math.round(devices[k]/total*100) + "%)");
  });
  html += '</table>';

  if (Object.keys(utmSources).length > 1 || !utmSources["Direct"]) {
    html += '<h2 style="font-size:16px;color:#4D3D71;margin:0 0 12px">Traffic Sources</h2><table style="width:100%;border-collapse:collapse;margin-bottom:24px">';
    Object.keys(utmSources).sort(function(a,b){ return utmSources[b]-utmSources[a]; }).forEach(function(k) {
      html += mRow(k, utmSources[k]);
    });
    html += '</table>';
  }

  if (Object.keys(variants).length > 0) {
    html += '<h2 style="font-size:16px;color:#4D3D71;margin:0 0 12px">A/B Experiments</h2><table style="width:100%;border-collapse:collapse;margin-bottom:24px">';
    Object.keys(variants).sort(function(a,b){ return variants[b]-variants[a]; }).forEach(function(k) {
      html += mRow(k, variants[k] + " sessions");
    });
    html += '</table>';
  }

  html += '<p style="font-size:12px;color:#999;margin:16px 0 0;text-align:center">View full data: <a href="' + ss.getUrl() + '" style="color:#4D3D71">Open Sheet</a></p></div></div>';

  var subject = "Quidget Weekly — " + total + " session" + (total !== 1 ? "s" : "") + ", " + completionRate + "% completion";
  DIGEST_RECIPIENTS.forEach(function(email) {
    MailApp.sendEmail({ to: email, subject: subject, htmlBody: html });
  });
}

function mRow(label, value) {
  return '<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:14px;color:#444">' + label + '</td>'
    + '<td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:14px;font-weight:700;color:#1B1B1B;text-align:right">' + value + '</td></tr>';
}
