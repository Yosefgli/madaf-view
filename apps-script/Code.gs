const SHEET_NAME = "מילוי מדף";
const REQUIRED_HEADERS = ["ברקוד", "שם מוצר", "עמודה", "מדף", "סטטוס"];

function doGet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    return jsonResponse({
      items: [],
      error: `Sheet not found: ${SHEET_NAME}`,
    });
  }

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    return jsonResponse({ items: [] });
  }

  const headers = data[0].map((header) => String(header).trim());
  const headerIndex = REQUIRED_HEADERS.reduce((acc, header) => {
    acc[header] = headers.indexOf(header);
    return acc;
  }, {});

  const missing = REQUIRED_HEADERS.filter((header) => headerIndex[header] === -1);
  if (missing.length) {
    return jsonResponse({
      items: [],
      error: `Missing headers: ${missing.join(", ")}`,
    });
  }

  const items = data
    .slice(1)
    .map((row) => {
      const status = String(row[headerIndex["סטטוס"]] ?? "").trim();
      return {
        barcode: row[headerIndex["ברקוד"]] ?? "",
        productName: row[headerIndex["שם מוצר"]] ?? "",
        column: row[headerIndex["עמודה"]] ?? "",
        shelf: row[headerIndex["מדף"]] ?? "",
        status,
        isActive: isActiveStatus(status),
      };
    })
    .filter((item) => item.isActive)
    .map((item) => ({
      barcode: item.barcode,
      productName: item.productName,
      column: item.column,
      shelf: item.shelf,
      status: item.status,
    }));

  return jsonResponse({ items });
}

function isActiveStatus(status) {
  const normalized = String(status).trim().toLowerCase();
  return ["פעיל", "כן", "true", "1", "active"].includes(normalized);
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
