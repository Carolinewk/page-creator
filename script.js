const defaults = {
  pageWidth: 798,
  pageHeight: 1121,
  squareSize: 19,
  columns: 42,
  rows: 59,
  lineWidth: 1,
  previewScale: 80,
  gridColor: "#cfd6df",
};

const fields = {
  pageWidth: document.querySelector("#pageWidth"),
  pageHeight: document.querySelector("#pageHeight"),
  squareSize: document.querySelector("#squareSize"),
  columns: document.querySelector("#columns"),
  rows: document.querySelector("#rows"),
  lineWidth: document.querySelector("#lineWidth"),
  previewScale: document.querySelector("#previewScale"),
  gridColor: document.querySelector("#gridColor"),
};

const output = {
  pageSize: document.querySelector("#pageSize"),
  totalSquares: document.querySelector("#totalSquares"),
};

const root = document.documentElement;

function getSettings() {
  return {
    pageWidth: numberValue("pageWidth"),
    pageHeight: numberValue("pageHeight"),
    squareSize: numberValue("squareSize"),
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
  const squareSize = settings.squareSize;
  let pageWidth = settings.pageWidth;
  let pageHeight = settings.pageHeight;
  let columns = clampCount(settings.columns, "columns", squareSize);
  let rows = clampCount(settings.rows, "rows", squareSize);

  if (changedField === "pageWidth") {
    columns = clampCount(countFromDimension(pageWidth, squareSize), "columns", squareSize);
  } else if (changedField === "pageHeight") {
    rows = clampCount(countFromDimension(pageHeight, squareSize), "rows", squareSize);
  } else if (changedField === "columns") {
    pageWidth = columns * squareSize;
  } else if (changedField === "rows") {
    pageHeight = rows * squareSize;
  } else if (changedField === "squareSize") {
    pageWidth = columns * squareSize;
    pageHeight = rows * squareSize;
  }

  fields.pageWidth.value = pageWidth;
  fields.pageHeight.value = pageHeight;
  fields.squareSize.value = squareSize;
  fields.columns.value = columns;
  fields.rows.value = rows;

  return {
    ...settings,
    pageWidth,
    pageHeight,
    squareSize,
    columns,
    rows,
  };
}

function clampCount(value, fieldName, squareSize) {
  const field = fields[fieldName];
  const count = Number.isFinite(value) ? value : defaults[fieldName];

  return Math.round(clampToFieldLimits(count, field));
}

function countFromDimension(dimension, squareSize) {
  return Math.max(1, Math.ceil(dimension / squareSize));
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

  const { pageWidth, pageHeight, squareSize, columns, rows, lineWidth, previewScale, gridColor } =
    syncGrid(changedField);

  root.style.setProperty("--page-width", `${pageWidth}px`);
  root.style.setProperty("--page-height", `${pageHeight}px`);
  root.style.setProperty("--square-size", `${squareSize}px`);
  root.style.setProperty("--line-width", `${lineWidth}px`);
  root.style.setProperty("--preview-scale", previewScale);
  root.style.setProperty("--grid-color", gridColor);

  output.pageSize.textContent = `${pageWidth.toLocaleString()} x ${pageHeight.toLocaleString()}`;
  output.totalSquares.textContent = (columns * rows).toLocaleString();
}

function exportPng() {
  const { pageWidth, pageHeight, squareSize, lineWidth, gridColor } = syncGrid();
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = pageWidth;
  canvas.height = pageHeight;

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, pageWidth, pageHeight);
  context.fillStyle = gridColor;

  for (let x = 0; x < pageWidth; x += squareSize) {
    context.fillRect(x, 0, lineWidth, pageHeight);
  }

  for (let y = 0; y < pageHeight; y += squareSize) {
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
