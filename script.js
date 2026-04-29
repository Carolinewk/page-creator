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

function getSettings() {
  return {
    pageWidth: numberValue("pageWidth"),
    pageHeight: numberValue("pageHeight"),
    squareSize: numberValue("squareSize"),
    lineWidth: numberValue("lineWidth"),
    previewScale: numberValue("previewScale") / 100,
    gridColor: fields.gridColor.value || defaults.gridColor,
  };
}

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
  const { pageWidth, pageHeight, squareSize, lineWidth, previewScale, gridColor } = getSettings();

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

function exportPng() {
  const { pageWidth, pageHeight, squareSize, lineWidth, gridColor } = getSettings();
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
  field.addEventListener("input", updatePage);
});

document.querySelector("#exportPng").addEventListener("click", exportPng);

document.querySelector("#printPage").addEventListener("click", () => {
  window.print();
});

document.querySelector("#resetPage").addEventListener("click", resetPage);

updatePage();
