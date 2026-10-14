const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const QRCode = require('qrcode');
const jsQR = require('jsqr');
const { createCanvas, loadImage } = require('canvas');

const TARGET_URL = 'https://poorva-2619.github.io/elysium-pre-strike/';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  console.log('=== STEP 1: GENERATE & VERIFY VECTOR SVG QR CODE ===');
  const rawSvg = await QRCode.toString(TARGET_URL, {
    type: 'svg',
    margin: 1,
    errorCorrectionLevel: 'M'
  });

  // Ensure attributes for crisp scaling
  const cleanSvg = rawSvg
    .replace('<svg ', '<svg class="qr-code-img" style="width:100%;height:100%;display:block;" ')
    .trim();

  // Test decoding the SVG with jsQR to verify 100% mathematical validity
  const testSvgForCanvas = rawSvg.replace('<svg ', '<svg width="280" height="280" ');
  const dataUri = 'data:image/svg+xml;base64,' + Buffer.from(testSvgForCanvas).toString('base64');
  const img = await loadImage(dataUri);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, img.width, img.height);
  const decoded = jsQR(imgData.data, img.width, img.height);

  if (!decoded || decoded.data !== TARGET_URL) {
    throw new Error(`QR Verification Failed! Decoded: ${decoded ? decoded.data : 'null'}`);
  }
  console.log('VERIFIED: Vector QR SVG perfectly decodes to:', decoded.data);

  // Helper to replace QR render boxes
  function injectSvg(content) {
    return content.replace(/<div class="qr-render-box">[\s\S]*?<\/div>/g, `<div class="qr-render-box">${cleanSvg}</div>`);
  }

  // Remove scripts from print templates so headless print is 100% deterministic
  function sanitizePrintTemplate(content) {
    let res = injectSvg(content);
    // Remove postcards.js script tag
    res = res.replace(/<script src="postcards\.js"><\/script>/gi, '');
    // Remove cdnjs qrcode script tag
    res = res.replace(/<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/qrcodejs\/[^"]+"><\/script>/gi, '');
    return res;
  }

  console.log('=== STEP 2: UPDATE PRINT HTML TEMPLATES ===');

  // 1. sheet1_print.html
  let sheet1Print = fs.readFileSync('sheet1_print.html', 'utf8');
  sheet1Print = sanitizePrintTemplate(sheet1Print);
  fs.writeFileSync('sheet1_print.html', sheet1Print, 'utf8');
  console.log('Updated sheet1_print.html');

  // 2. sheet2_print.html -> MUST CONTAIN ONLY SHEET 2!
  let sheet2Print = fs.readFileSync('sheet2_print.html', 'utf8');
  // Check if sheet1 is present in sheet2_print.html
  if (sheet2Print.includes('id="sheet1"')) {
    // Cut out sheet1 block from <div class="a4-sheet show-cut-guides" id="sheet1"> to the end of that div
    const sheet1Start = sheet2Print.indexOf('<div class="a4-sheet show-cut-guides" id="sheet1">');
    const sheet2Start = sheet2Print.indexOf('<div class="a4-sheet show-cut-guides " id="sheet2">');
    if (sheet1Start !== -1 && sheet2Start !== -1) {
      sheet2Print = sheet2Print.substring(0, sheet1Start) + sheet2Print.substring(sheet2Start);
      console.log('Extracted and removed Sheet 1 from sheet2_print.html (now Page 2 only)');
    }
  }
  sheet2Print = sanitizePrintTemplate(sheet2Print);
  fs.writeFileSync('sheet2_print.html', sheet2Print, 'utf8');
  console.log('Updated sheet2_print.html');

  // 3. both_sheets_print.html -> Contains Sheet 1 AND Sheet 2
  let bothPrint = fs.readFileSync('both_sheets_print.html', 'utf8');
  bothPrint = sanitizePrintTemplate(bothPrint);
  fs.writeFileSync('both_sheets_print.html', bothPrint, 'utf8');
  console.log('Updated both_sheets_print.html');

  // 4. Update preview pages (sheet1.html, sheet2.html, postcards.html)
  ['sheet1.html', 'sheet2.html', 'postcards.html'].forEach(file => {
    if (fs.existsSync(file)) {
      let html = fs.readFileSync(file, 'utf8');
      html = injectSvg(html);
      fs.writeFileSync(file, html, 'utf8');
      console.log(`Updated QR codes in ${file}`);
    }
  });

  // 5. Update postcards.js to never use mock dummy bits
  if (fs.existsSync('postcards.js')) {
    let js = fs.readFileSync('postcards.js', 'utf8');
    // Ensure default landing URL is accurate
    js = js.replace(/const defaultLandingUrl = ['"][^'"]+['"];/, `const defaultLandingUrl = '${TARGET_URL}';`);
    fs.writeFileSync('postcards.js', js, 'utf8');
    console.log('Updated postcards.js');
  }

  console.log('=== STEP 3: RENDER PDFs USING HEADLESS CHROME ===');
  const printFiles = [
    { html: 'sheet1_print.html', pdf: 'TECHNORYX_Postcards_Page1.pdf', copyTo: 'Elysium_Postcards_Sheet1.pdf' },
    { html: 'sheet2_print.html', pdf: 'TECHNORYX_Postcards_Page2.pdf', copyTo: 'Elysium_Postcards_Sheet2.pdf' },
    { html: 'both_sheets_print.html', pdf: 'TECHNORYX_Postcards_Both_Sheets.pdf', copyTo: 'Elysium_Postcards_Both_Sheets.pdf' }
  ];

  for (const item of printFiles) {
    const htmlPath = path.resolve(item.html);
    const pdfPath = path.resolve(item.pdf);
    console.log(`Rendering ${item.pdf} from ${item.html}...`);
    
    // Command to render pixel-perfect A4 without headers/footers
    const cmd = `"${CHROME_PATH}" --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf-no-header --print-to-pdf="${pdfPath}" "file:///${htmlPath.replace(/\\/g, '/')}"`;
    execSync(cmd, { stdio: 'inherit' });

    const stats = fs.statSync(pdfPath);
    console.log(`Rendered ${item.pdf} (${stats.size} bytes)`);

    // Copy to alias PDF
    fs.copyFileSync(pdfPath, path.resolve(item.copyTo));
    console.log(`Copied to ${item.copyTo}`);
  }

  console.log('=== ALL POSTCARD PDFS SUCCESSFULLY RECOMPILED & VERIFIED! ===');
}

main().catch(err => {
  console.error('ERROR in rebuild_all_postcards:', err);
  process.exit(1);
});
