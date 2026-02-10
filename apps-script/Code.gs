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
      const inventoryValue = String(row[headerIndex["Inventory"]] ?? "").trim();
      const checklistValue = String(row[headerIndex["Checklist"]] ?? "").trim();
      return {
        barcode: row[headerIndex["Barcode"]] ?? "",
        productName: row[headerIndex["ProductName"]] ?? "",
        qty: row[headerIndex["Qty"]] ?? "",
        shelf: row[headerIndex["Shelf"]] ?? "",
        warehouseBin: row[headerIndex["WarehouseBin"]] ?? "",
        isChecklistEmpty: checklistValue === "",
        isInventoryFalse: isInventoryValueFalse(inventoryValue),
      };
    })
    .filter((item) => item.isChecklistEmpty)
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

function isInventoryValueFalse(value) {
  return String(value).trim().toLowerCase() === "false";
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
