const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const PRODUCTION_URL = 'https://poorva-2619.github.io/elysium-pre-strike/';

async function buildAllPrintPages() {
  const postcardsHtml = fs.readFileSync(path.join(__dirname, 'postcards.html'), 'utf8');

  // Generate 8 unique, 100% camera-scannable QR codes for cards 1 to 8
  const qrSvgs = [];
  for (let i = 1; i <= 8; i++) {
    const cardUrl = `${PRODUCTION_URL}?card=${i}`;
    const svg = await QRCode.toString(cardUrl, {
      type: 'svg',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    // Add class for postcard styling
    const styledSvg = svg.replace('<svg ', '<svg class="qr-code-img" style="width:100%;height:100%;display:block;" ');
    qrSvgs.push(styledSvg);
  }

  // Replace each <div class="qr-render-box">...</div> sequentially with its corresponding card's QR code
  let cardIndex = 0;
  let filledHtml = postcardsHtml.replace(/<div class="qr-render-box">[\s\S]*?<\/div>/g, () => {
    const svg = qrSvgs[cardIndex % qrSvgs.length];
    cardIndex++;
    return `<div class="qr-render-box">${svg}</div>`;
  });

  // Also update default input value in postcards.html
  filledHtml = filledHtml.replace(/value="landing\.html"/g, `value="${PRODUCTION_URL}"`);
  filledHtml = filledHtml.replace(/<a href="index\.html" class="btn-portal">/g, '<a href="index.html" target="_blank" class="btn-portal" title="Open Elysium Main Website in a separate browser tab">');

  // Print CSS for headless / native browser print
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

  // Build Standalone Interactive Web Pages
  const sheet1Web = filledHtml
    .replace(/<div class="a4-sheet show-cut-guides hidden-sheet" id="sheet2">[\s\S]*?<\/div>\s*<\/main>/, '</main>')
    .replace('id="tabSheet1" class="sheet-tab-btn active"', 'id="tabSheet1" class="sheet-tab-btn active" onclick="location.href=\'sheet1.html\'"')
    .replace('id="tabSheet2" class="sheet-tab-btn"', 'id="tabSheet2" class="sheet-tab-btn" onclick="location.href=\'sheet2.html\'"')
    .replace('id="tabSheetAll" class="sheet-tab-btn"', 'id="tabSheetAll" class="sheet-tab-btn" onclick="location.href=\'postcards.html\'"');
  fs.writeFileSync(path.join(__dirname, 'sheet1.html'), sheet1Web);

  const sheet2Web = filledHtml
    .replace(/<div class="a4-sheet show-cut-guides" id="sheet1">[\s\S]*?<\/div>\s*<div class="a4-sheet show-cut-guides hidden-sheet" id="sheet2">/, '<div class="a4-sheet show-cut-guides" id="sheet2">')
    .replace('hidden-sheet', '')
    .replace('id="tabSheet1" class="sheet-tab-btn active"', 'id="tabSheet1" class="sheet-tab-btn" onclick="location.href=\'sheet1.html\'"')
    .replace('id="tabSheet2" class="sheet-tab-btn"', 'id="tabSheet2" class="sheet-tab-btn active" onclick="location.href=\'sheet2.html\'"')
    .replace('id="tabSheetAll" class="sheet-tab-btn"', 'id="tabSheetAll" class="sheet-tab-btn" onclick="location.href=\'postcards.html\'"');
  fs.writeFileSync(path.join(__dirname, 'sheet2.html'), sheet2Web);

  // Also update postcards.html with the embedded scannable SVGs and default URL
  fs.writeFileSync(path.join(__dirname, 'postcards.html'), filledHtml);

  console.log('Successfully generated all postcard sheets with camera-scannable QR codes for:', PRODUCTION_URL);
}

buildAllPrintPages();
