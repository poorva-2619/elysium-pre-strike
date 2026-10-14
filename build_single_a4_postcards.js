const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const QRCode = require('qrcode');

const TARGET_URL = 'https://poorva-2619.github.io/elysium-pre-strike/';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  console.log('=== EXTRACTING CARDS FROM POSTCARDS.HTML ===');
  const postcardsHtml = fs.readFileSync('postcards.html', 'utf8');

  // Match all <article class="postcard-card ..."> ... </article>
  const cardRegex = /<article class="postcard-card (theme-[^"]+)" title="([^"]+)">([\s\S]*?)<\/article>/g;
  const cards = [];
  let match;
  while ((match = cardRegex.exec(postcardsHtml)) !== null) {
    cards.push({
      themeClass: match[1],
      title: match[2],
      innerHtml: match[3]
    });
  }

  console.log(`Found ${cards.length} cards.`);
  if (cards.length !== 8) {
    throw new Error(`Expected 8 cards, found ${cards.length}`);
  }

  // Generate verified Vector QR SVG
  const rawSvg = await QRCode.toString(TARGET_URL, {
    type: 'svg',
    margin: 1,
    errorCorrectionLevel: 'M'
  });
  const cleanSvg = rawSvg
    .replace('<svg ', '<svg class="qr-code-img" style="width:100%;height:100%;display:block;" ')
    .trim();

  // Helper to construct a single A4 page
  function buildA4PageHtml(card, idx) {
    const cardNum = idx + 1;
    // Replace QR render box inside innerHtml with cleanSvg
    let cardInner = card.innerHtml.replace(
      /<div class="qr-render-box">[\s\S]*?<\/div>/g,
      `<div class="qr-render-box">${cleanSvg}</div>`
    );

    return `
    <!-- CARD ${cardNum}: ${card.title} (FULL A4 PAGE) -->
    <div class="a4-sheet single-card-sheet" id="posterCard${cardNum}">
      <div class="sheet-meta-bar">
        <span>SYS://ELYSIUM-SERIES-0${cardNum} &bull; FULL A4 POSTER EDITION &bull; 300 DPI READY</span>
        <span class="meta-cut-hint">⭐ PASS 0${cardNum}/08 &bull; 210mm &times; 297mm</span>
      </div>
      <article class="postcard-card poster-card ${card.themeClass}" title="${card.title}">
        ${cardInner}
      </article>
    </div>`;
  }

  // Generate single_cards_print.html (Combined 8 pages)
  const combinedPagesHtml = cards.map((c, i) => buildA4PageHtml(c, i)).join('\n');

  const fullPrintHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ELYSIUM: PRE-STRIKE | All 8 Postcards (1 per A4 Page)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bungee&family=Fredoka:wght@600;700;800;900&family=Press+Start+2P&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="postcards.css">
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
    }
    .print-sheet-wrapper {
      margin: 0 !important;
      padding: 0 !important;
      width: 210mm !important;
      display: block !important;
    }
  </style>
</head>
<body>
  <main class="print-sheet-wrapper">
    ${combinedPagesHtml}
  </main>
</body>
</html>`;

  fs.writeFileSync('single_cards_print.html', fullPrintHtml, 'utf8');
  console.log('Generated single_cards_print.html (8 pages, 1 card per A4 page)');

  // Generate individual print files for each card (card1_print.html to card8_print.html)
  cards.forEach((card, i) => {
    const cardNum = i + 1;
    const singleCardHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ELYSIUM: PRE-STRIKE | Card ${cardNum} - ${card.title} (A4 Poster)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bungee&family=Fredoka:wght@600;700;800;900&family=Press+Start+2P&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="postcards.css">
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
    .print-sheet-wrapper {
      margin: 0 !important;
      padding: 0 !important;
      width: 210mm !important;
      height: 297mm !important;
      display: flex !important;
      justify-content: center !important;
    }
  </style>
</head>
<body>
  <main class="print-sheet-wrapper">
    ${buildA4PageHtml(card, i)}
  </main>
</body>
</html>`;
    fs.writeFileSync(`card${cardNum}_print.html`, singleCardHtml, 'utf8');
    console.log(`Generated card${cardNum}_print.html`);
  });

  console.log('=== RENDERING FULL A4 PDFs WITH HEADLESS CHROME ===');

  // 1. Render Combined 8-Page PDF
  const combinedPdfPath = path.resolve('TECHNORYX_Postcards_All_8_A4_Pages.pdf');
  const combinedHtmlPath = path.resolve('single_cards_print.html');
  console.log('Rendering TECHNORYX_Postcards_All_8_A4_Pages.pdf...');
  const cmdAll = `"${CHROME_PATH}" --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf-no-header --print-to-pdf="${combinedPdfPath}" "file:///${combinedHtmlPath.replace(/\\/g, '/')}"`;
  execSync(cmdAll, { stdio: 'inherit' });
  console.log(`Rendered TECHNORYX_Postcards_All_8_A4_Pages.pdf (${fs.statSync(combinedPdfPath).size} bytes)`);

  // 2. Render each individual card PDF (Card 1 to Card 8)
  for (let i = 1; i <= 8; i++) {
    const cardHtml = path.resolve(`card${i}_print.html`);
    const cardPdf = path.resolve(`TECHNORYX_Postcard_Card${i}_A4.pdf`);
    console.log(`Rendering TECHNORYX_Postcard_Card${i}_A4.pdf...`);
    const cmd = `"${CHROME_PATH}" --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf-no-header --print-to-pdf="${cardPdf}" "file:///${cardHtml.replace(/\\/g, '/')}"`;
    execSync(cmd, { stdio: 'inherit' });
    console.log(`Rendered TECHNORYX_Postcard_Card${i}_A4.pdf (${fs.statSync(cardPdf).size} bytes)`);
  }

  console.log('=== ALL SINGLE A4 POSTCARD PDFs SUCCESSFULLY GENERATED! ===');
}

main().catch(err => {
  console.error('ERROR in build_single_a4_postcards:', err);
  process.exit(1);
});
