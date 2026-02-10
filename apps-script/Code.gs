const SHEET_NAME = "TaskLines";
const REQUIRED_HEADERS = [
  "Barcode",
  "ProductName",
  "Qty",
  "Shelf",
  "WarehouseBin",
  "Inventory",
  "Checklist",
];

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
      const inventoryRaw = row[headerIndex["Inventory"]];
      const checklistRaw = row[headerIndex["Checklist"]];

      return {
        barcode: row[headerIndex["Barcode"]] ?? "",
        productName: row[headerIndex["ProductName"]] ?? "",
        qty: row[headerIndex["Qty"]] ?? "",
        shelf: row[headerIndex["Shelf"]] ?? "",
        warehouseBin: row[headerIndex["WarehouseBin"]] ?? "",
        shouldShowByChecklist: isChecklistVisible(checklistRaw),
        isInventoryFalse: isInventoryValueFalse(inventoryRaw),
      };
    })
    .filter((item) => item.shouldShowByChecklist)
    .map((item) => ({
      barcode: item.barcode,
      productName: item.productName,
      qty: item.qty,
      shelf: item.shelf,
      warehouseBin: item.warehouseBin,
      inventoryFlag: item.isInventoryFalse ? "FALSE" : "",
    }));

  return jsonResponse({ items });
}

function isChecklistVisible(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "" || normalized === "false";
}


function isInventoryValueFalse(value) {
  return String(value ?? "").trim().toLowerCase() === "false";
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
