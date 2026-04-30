const defaults = {
  pageWidth: 798,
  pageHeight: 1121,
  cellWidth: 19,
  cellHeight: 19,
  columns: 42,
  rows: 59,
  lineWidth: 1,
  previewScale: 80,
  gridColor: "#cfd6df",
};

const fields = {
  pageWidth: document.querySelector("#pageWidth"),
  pageHeight: document.querySelector("#pageHeight"),
  cellWidth: document.querySelector("#cellWidth"),
  cellHeight: document.querySelector("#cellHeight"),
  columns: document.querySelector("#columns"),
  rows: document.querySelector("#rows"),
  lineWidth: document.querySelector("#lineWidth"),
  previewScale: document.querySelector("#previewScale"),
  gridColor: document.querySelector("#gridColor"),
};

const output = {
  pageSize: document.querySelector("#pageSize"),
  totalSquares: document.querySelector("#totalSquares"),
  cellSize: document.querySelector("#cellSize"),
};

const root = document.documentElement;

function getSettings() {
  return {
    pageWidth: numberValue("pageWidth"),
    pageHeight: numberValue("pageHeight"),
    cellWidth: numberValue("cellWidth"),
    cellHeight: numberValue("cellHeight"),
    columns: numberValue("columns"),
    rows: numberValue("rows"),
    lineWidth: numberValue("lineWidth"),
    previewScale: numberValue("previewScale") / 100,
    gridColor: fields.gridColor.value || defaults.gridColor,
  };
}

function numberValue(fieldName) {
  const field = fields[fieldName];
  const rawValue = String(field.value).trim();
  const value = rawValue === "" ? NaN : Number(rawValue);

  if (Number.isNaN(value)) {
    return defaults[fieldName];
  }

  return clampToFieldLimits(value, field);
}

function syncGrid(changedField) {
  const settings = getSettings();
  let pageWidth = settings.pageWidth;
  let pageHeight = settings.pageHeight;
  const cellWidth = settings.cellWidth;
  const cellHeight = settings.cellHeight;
  let columns = clampCount(settings.columns, "columns");
  let rows = clampCount(settings.rows, "rows");

  if (changedField === "pageWidth") {
    columns = countForCellSize(pageWidth, cellWidth, "columns");
  } else if (changedField === "columns" || changedField === "cellWidth") {
    pageWidth = columns * cellWidth;
  }

  if (changedField === "pageHeight") {
    rows = countForCellSize(pageHeight, cellHeight, "rows");
  } else if (changedField === "rows" || changedField === "cellHeight") {
    pageHeight = rows * cellHeight;
  }

  fields.pageWidth.value = formatNumberForInput(pageWidth);
  fields.pageHeight.value = formatNumberForInput(pageHeight);
  fields.cellWidth.value = formatNumberForInput(cellWidth);
  fields.cellHeight.value = formatNumberForInput(cellHeight);
  fields.columns.value = columns;
  fields.rows.value = rows;

  return {
    ...settings,
    pageWidth,
    pageHeight,
    cellWidth,
    cellHeight,
    columns,
    rows,
  };
}

function countForCellSize(totalSize, cellSize, fieldName) {
  return clampCount(Math.ceil(totalSize / cellSize), fieldName);
}

function clampCount(value, fieldName) {
  const field = fields[fieldName];
  const count = Number.isFinite(value) ? value : defaults[fieldName];

  return Math.round(clampToFieldLimits(count, field));
}

function clampToFieldLimits(value, field) {
  const min = fieldLimit(field, "min");
  const max = fieldLimit(field, "max");
  let limitedValue = value;

  if (min !== null) {
    limitedValue = Math.max(limitedValue, min);
  }

  if (max !== null) {
    limitedValue = Math.min(limitedValue, max);
  }

  return limitedValue;
}

function fieldLimit(field, key) {
  const value = String(field[key] ?? "").trim();

  if (value === "") {
    return null;
  }

  return Number(value);
}

function formatMeasurement(value) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatNumberForInput(value) {
  if (!Number.isFinite(value)) {
    return "";
  }

  return Number.parseFloat(value.toFixed(4)).toString();
}

function hasPendingNumberInput(fieldName) {
  const field = fields[fieldName];

  if (!field || field.type !== "number") {
    return false;
  }

  const rawValue = String(field.value).trim();
  const value = rawValue === "" ? NaN : Number(rawValue);

  return Number.isNaN(value);
}

function updatePage(changedField, forceSync = false) {
  if (!forceSync && changedField && hasPendingNumberInput(changedField)) {
    return;
  }

  const { pageWidth, pageHeight, cellWidth, cellHeight, columns, rows, lineWidth, previewScale, gridColor } =
    syncGrid(changedField);

  root.style.setProperty("--page-width", `${pageWidth}px`);
  root.style.setProperty("--page-height", `${pageHeight}px`);
  root.style.setProperty("--cell-width", `${cellWidth}px`);
  root.style.setProperty("--cell-height", `${cellHeight}px`);
  root.style.setProperty("--line-width", `${lineWidth}px`);
  root.style.setProperty("--preview-scale", previewScale);
  root.style.setProperty("--grid-color", gridColor);

  output.pageSize.textContent = `${pageWidth.toLocaleString()} x ${pageHeight.toLocaleString()}`;
  output.totalSquares.textContent = (columns * rows).toLocaleString();
  output.cellSize.textContent = `${formatMeasurement(cellWidth)} x ${formatMeasurement(cellHeight)} px`;
}

function exportPng() {
  const { pageWidth, pageHeight, cellWidth, cellHeight, columns, rows, lineWidth, gridColor } =
    syncGrid();
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = pageWidth;
  canvas.height = pageHeight;

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, pageWidth, pageHeight);
  context.fillStyle = gridColor;

  for (let column = 0; column <= columns; column += 1) {
    const x = Math.min(column * cellWidth, pageWidth);
    context.fillRect(x, 0, lineWidth, pageHeight);
  }

  for (let row = 0; row <= rows; row += 1) {
    const y = Math.min(row * cellHeight, pageHeight);
    context.fillRect(0, y, pageWidth, lineWidth);
  }

  canvas.toBlob((blob) => {
    if (!blob) {
      return;
    }

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.download = `squared-page-${pageWidth}x${pageHeight}.png`;
    link.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

function resetPage() {
  Object.entries(defaults).forEach(([key, value]) => {
    fields[key].value = value;
  });

  updatePage();
}

Object.values(fields).forEach((field) => {
  field.addEventListener("input", (event) => updatePage(event.currentTarget.id));

  if (field.type === "number") {
    field.addEventListener("blur", (event) => updatePage(event.currentTarget.id, true));
  }
});

document.querySelector("#exportPng").addEventListener("click", exportPng);

document.querySelector("#printPage").addEventListener("click", () => {
  window.print();
});

document.querySelector("#resetPage").addEventListener("click", resetPage);

updatePage();
