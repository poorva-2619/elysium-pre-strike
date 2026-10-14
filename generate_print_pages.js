const fs = require('fs');
const path = require('path');

// Read base HTML
const postcardsHtml = fs.readFileSync(path.join(__dirname, 'postcards.html'), 'utf8');

// Function to generate pure SVG QR Code string
function getSvgQR() {
  const size = 21;
  let matrix = Array(size).fill(0).map(() => Array(size).fill(false));

  function drawFinderPattern(startRow, startCol) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[startRow + r][startCol + c] = true;
        }
      }
    }
  }

  drawFinderPattern(0, 0);
  drawFinderPattern(size - 7, 0);
  drawFinderPattern(0, size - 7);

  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = (i % 2 === 0);
    matrix[i][6] = (i % 2 === 0);
  }

  let bitIndex = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) continue;
      if (r <= 7 && c <= 7) continue;
      if (r <= 7 && c >= size - 8) continue;
      if (r >= size - 8 && c <= 7) continue;
      if (r === 6 || c === 6) continue;
      matrix[r][c] = ((r * 7 + c * 13 + bitIndex) % 3 === 0);
      bitIndex++;
    }
  }

  let rects = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) {
        rects += `<rect x="${c}" y="${r}" width="1" height="1" fill="#000000"/>`;
      }
    }
  }

  return `<svg viewBox="0 0 ${size} ${size}" class="qr-code-img" style="width:100%;height:100%;display:block;"><rect width="${size}" height="${size}" fill="#ffffff"/>${rects}</svg>`;
}

const qrSvg = getSvgQR();
let filledHtml = postcardsHtml.replace(/<div class="qr-render-box"><\/div>/g, `<div class="qr-render-box">${qrSvg}</div>`);

// ==========================================
// 1. HEADLESS PRINT CSS (for direct PDF rendering)
// ==========================================
const printStandaloneCSS = `
<style>
  @page {
    size: A4 portrait;
    margin: 0;
  }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #090c1a !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    width: 210mm !important;
    height: 297mm !important;
  }
  .control-bar, .card-modal-backdrop {
    display: none !important;
  }
  .print-sheet-wrapper {
    margin: 0 !important;
    padding: 0 !important;
    width: 210mm !important;
    height: 297mm !important;
    display: flex !important;
    justify-content: center !important;
  }
  .a4-sheet {
    box-shadow: none !important;
    margin: 0 !important;
    padding: 6.5mm 6.5mm !important;
    width: 210mm !important;
    height: 297mm !important;
    min-height: 297mm !important;
    max-height: 297mm !important;
    page-break-after: always !important;
    break-after: page !important;
    display: flex !important;
    flex-direction: column !important;
    box-sizing: border-box !important;
  }
  .a4-sheet:last-of-type {
    page-break-after: avoid !important;
    break-after: avoid !important;
  }
</style>
`;

// Build Sheet 1 Headless Print File
const sheet1Print = filledHtml
  .replace(/<div class="a4-sheet show-cut-guides hidden-sheet" id="sheet2">[\s\S]*?<\/div>\s*<\/main>/, '</main>')
  .replace('</head>', `${printStandaloneCSS}</head>`);
fs.writeFileSync(path.join(__dirname, 'sheet1_print.html'), sheet1Print);

// Build Sheet 2 Headless Print File
const sheet2Print = filledHtml
  .replace(/<div class="a4-sheet show-cut-guides" id="sheet1">[\s\S]*?<\/div>\s*<div class="a4-sheet show-cut-guides hidden-sheet" id="sheet2">/, '<div class="a4-sheet show-cut-guides" id="sheet2">')
  .replace('hidden-sheet', '')
  .replace('</head>', `${printStandaloneCSS}</head>`);
fs.writeFileSync(path.join(__dirname, 'sheet2_print.html'), sheet2Print);

// Build Both Sheets Headless Print File
const bothSheetsPrint = filledHtml
  .replace('hidden-sheet', '')
  .replace('</head>', `${printStandaloneCSS}</head>`);
fs.writeFileSync(path.join(__dirname, 'both_sheets_print.html'), bothSheetsPrint);

// ==========================================
// 2. STANDALONE INTERACTIVE WEB PAGES (sheet1.html & sheet2.html)
// ==========================================
// Sheet 1 Standalone Web Page
const sheet1Web = filledHtml
  .replace(/<div class="a4-sheet show-cut-guides hidden-sheet" id="sheet2">[\s\S]*?<\/div>\s*<\/main>/, '</main>')
  .replace('id="tabSheet1" class="sheet-tab-btn active"', 'id="tabSheet1" class="sheet-tab-btn active" onclick="location.href=\'sheet1.html\'"')
  .replace('id="tabSheet2" class="sheet-tab-btn"', 'id="tabSheet2" class="sheet-tab-btn" onclick="location.href=\'sheet2.html\'"')
  .replace('id="tabSheetAll" class="sheet-tab-btn"', 'id="tabSheetAll" class="sheet-tab-btn" onclick="location.href=\'postcards.html\'"');
fs.writeFileSync(path.join(__dirname, 'sheet1.html'), sheet1Web);

// Sheet 2 Standalone Web Page
const sheet2Web = filledHtml
  .replace(/<div class="a4-sheet show-cut-guides" id="sheet1">[\s\S]*?<\/div>\s*<div class="a4-sheet show-cut-guides hidden-sheet" id="sheet2">/, '<div class="a4-sheet show-cut-guides" id="sheet2">')
  .replace('hidden-sheet', '')
  .replace('id="tabSheet1" class="sheet-tab-btn active"', 'id="tabSheet1" class="sheet-tab-btn" onclick="location.href=\'sheet1.html\'"')
  .replace('id="tabSheet2" class="sheet-tab-btn"', 'id="tabSheet2" class="sheet-tab-btn active" onclick="location.href=\'sheet2.html\'"')
  .replace('id="tabSheetAll" class="sheet-tab-btn"', 'id="tabSheetAll" class="sheet-tab-btn" onclick="location.href=\'postcards.html\'"');
fs.writeFileSync(path.join(__dirname, 'sheet2.html'), sheet2Web);

console.log('Successfully generated standalone print and interactive pages for Sheet 1 & Sheet 2!');
