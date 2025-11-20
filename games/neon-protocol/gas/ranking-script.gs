// Google Apps Script for Neon Protocol Ranking System
// このコードをGoogle Apps Scriptエディタにコピーして使用してください

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Rankings');
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Sheet not found'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const action = e.parameter.action;
  
  if (action === 'submit') {
    return handleSubmit(e, sheet);
  } else if (action === 'get') {
    return handleGetRankings(sheet);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: 'Invalid action'
  })).setMimeType(ContentService.MimeType.JSON);
}

function handleSubmit(e, sheet) {
  try {
    const name = e.parameter.name || 'Anonymous';
    const score = parseInt(e.parameter.score) || 0;
    const layer = parseInt(e.parameter.layer) || 1;
    const phase = e.parameter.phase || 'child';
    const timestamp = new Date();
    
    // 重複チェック（同じ名前、スコア、レイヤーの組み合わせ）
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === name && data[i][1] === score && data[i][2] === layer) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: 'Duplicate entry'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // スコアを追加
    sheet.appendRow([name, score, layer, phase, timestamp]);
    
    // スコアでソート（降順）
    const range = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5);
    range.sort({column: 2, ascending: false});
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Score submitted successfully'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleGetRankings(sheet) {
  try {
    const data = sheet.getDataRange().getValues();
    const rankings = [];
    
    // ヘッダー行をスキップして、上位10件を取得
    for (let i = 1; i < Math.min(data.length, 11); i++) {
      rankings.push({
        rank: i,
        name: data[i][0],
        score: data[i][1],
        layer: data[i][2],
        phase: data[i][3],
        timestamp: data[i][4]
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      rankings: rankings
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// スプレッドシート初期化用関数（手動実行）
function initializeSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Rankings');
  
  if (!sheet) {
    sheet = ss.insertSheet('Rankings');
  }
  
  // ヘッダー行を設定
  sheet.getRange(1, 1, 1, 5).setValues([['Name', 'Score', 'Layer', 'Phase', 'Timestamp']]);
  sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
  
  Logger.log('Sheet initialized successfully');
}
