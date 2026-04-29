const defaults = {
  pageWidth: 794,
  pageHeight: 1123,
  squareSize: 19,
  lineWidth: 1,
  previewScale: 80,
  gridColor: "#cfd6df",
};

const fields = {
  pageWidth: document.querySelector("#pageWidth"),
  pageHeight: document.querySelector("#pageHeight"),
  squareSize: document.querySelector("#squareSize"),
  lineWidth: document.querySelector("#lineWidth"),
  previewScale: document.querySelector("#previewScale"),
  gridColor: document.querySelector("#gridColor"),
};

const output = {
  columns: document.querySelector("#columns"),
  rows: document.querySelector("#rows"),
  totalSquares: document.querySelector("#totalSquares"),
};

const root = document.documentElement;

function numberValue(fieldName) {
  const field = fields[fieldName];
  const value = Number(field.value);
  const min = Number(field.min);
  const max = Number(field.max);

  if (Number.isNaN(value)) {
    return defaults[fieldName];
  }

  return Math.min(Math.max(value, min), max);
}

function updatePage() {
  const pageWidth = numberValue("pageWidth");
  const pageHeight = numberValue("pageHeight");
  const squareSize = numberValue("squareSize");
  const lineWidth = numberValue("lineWidth");
  const previewScale = numberValue("previewScale") / 100;
  const gridColor = fields.gridColor.value || defaults.gridColor;

  root.style.setProperty("--page-width", `${pageWidth}px`);
  root.style.setProperty("--page-height", `${pageHeight}px`);
  root.style.setProperty("--square-size", `${squareSize}px`);
  root.style.setProperty("--line-width", `${lineWidth}px`);
  root.style.setProperty("--preview-scale", previewScale);
  root.style.setProperty("--grid-color", gridColor);

  const columns = Math.floor(pageWidth / squareSize);
  const rows = Math.floor(pageHeight / squareSize);

  output.columns.textContent = columns.toLocaleString();
  output.rows.textContent = rows.toLocaleString();
  output.totalSquares.textContent = (columns * rows).toLocaleString();
}

function resetPage() {
  Object.entries(defaults).forEach(([key, value]) => {
    fields[key].value = value;
  });

  updatePage();
}

Object.values(fields).forEach((field) => {
  field.addEventListener("input", updatePage);
});

document.querySelector("#printPage").addEventListener("click", () => {
  window.print();
});

document.querySelector("#resetPage").addEventListener("click", resetPage);

updatePage();
