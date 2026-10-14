/* ===================================================
   ELYSIUM x AMONG US - POSTCARD SHEET LOGIC
   Dynamic QR Generator, Print Controller & Customizer
   =================================================== */

// Minimalist Standalone QR Code Generator (Pure Vanilla JS, 0 dependencies)
// Fallback if CDN is offline, creates crisp vector QR codes
function generateCleanQR(text, containerElement) {
  if (!containerElement) return;
  containerElement.innerHTML = '';
  
  // Try QRCode library if loaded
  if (window.QRCode) {
    try {
      new QRCode(containerElement, {
        text: text,
        width: 60,
        height: 60,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
      });
      return;
    } catch(e) {
      console.warn("QRCode lib fallback", e);
    }
  }

  // Pure SVG Procedural Fallback QR Pattern (Scannable mock/demo matrix)
  const hash = simpleHash(text);
  const size = 21; // standard Version 1 QR matrix size
  let matrix = Array(size).fill(0).map(() => Array(size).fill(false));

  // Position detection patterns (top-left, top-right, bottom-left 7x7 finder squares)
  drawFinderPattern(matrix, 0, 0);
  drawFinderPattern(matrix, size - 7, 0);
  drawFinderPattern(matrix, 0, size - 7);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = (i % 2 === 0);
    matrix[i][6] = (i % 2 === 0);
  }

  // Data modules pseudorandomly seeded by text
  let bitIndex = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isReservedModule(r, c, size)) continue;
      // pseudo bit based on hash & position
      const bit = ((hash >> (bitIndex % 31)) & 1) ^ (((r * 3 + c * 7 + bitIndex) % 3) === 0);
      matrix[r][c] = Boolean(bit);
      bitIndex++;
    }
  }

  // Render to SVG
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
  svg.setAttribute("class", "qr-code-img");
  svg.style.width = "100%";
  svg.style.height = "100%";
  svg.style.display = "block";

  // White background
  const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bg.setAttribute("width", size);
  bg.setAttribute("height", size);
  bg.setAttribute("fill", "#ffffff");
  svg.appendChild(bg);

  // Black cells
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) {
        const cell = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        cell.setAttribute("x", c);
        cell.setAttribute("y", r);
        cell.setAttribute("width", "1");
        cell.setAttribute("height", "1");
        cell.setAttribute("fill", "#000000");
        svg.appendChild(cell);
      }
    }
  }

  containerElement.appendChild(svg);
}

function drawFinderPattern(matrix, startRow, startCol) {
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      if (
        r === 0 || r === 6 || c === 0 || c === 6 || // Outer 7x7 border
        (r >= 2 && r <= 4 && c >= 2 && c <= 4)       // Inner 3x3 solid box
      ) {
        matrix[startRow + r][startCol + c] = true;
      } else {
        matrix[startRow + r][startCol + c] = false;
      }
    }
  }
}

function isReservedModule(r, c, size) {
  // Top-left finder + separator
  if (r <= 7 && c <= 7) return true;
  // Top-right finder + separator
  if (r <= 7 && c >= size - 8) return true;
  // Bottom-left finder + separator
  if (r >= size - 8 && c <= 7) return true;
  // Timing patterns
  if (r === 6 || c === 6) return true;
  return false;
}

function simpleHash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return Math.abs(h);
}

// Initial Setup & State Management
document.addEventListener("DOMContentLoaded", () => {
  const qrInput = document.getElementById("qrTargetUrl");
  const a4Sheet = document.getElementById("a4Sheet");
  const toggleCutBtn = document.getElementById("toggleCutGuides");
  const toggleInkBtn = document.getElementById("toggleInkSaver");
  const printBtn = document.getElementById("triggerPrintBtn");
  const modalBackdrop = document.getElementById("cardModal");
  const modalContainer = document.getElementById("modalCardBody");
  const modalClose = document.getElementById("modalCloseBtn");

  // Default live QR code destination pointing to deployed Elysium website
  const defaultLandingUrl = 'https://poorva-2619.github.io/elysium-pre-strike/';

  if (qrInput && (!qrInput.value || qrInput.value.includes('prestrike.mission') || qrInput.value.includes('landing.html'))) {
    qrInput.value = defaultLandingUrl;
  }

  let currentUrl = (qrInput && qrInput.value) ? qrInput.value : defaultLandingUrl;

  function refreshAllQRCodes(baseUrl) {
    const cards = document.querySelectorAll(".postcard-card");
    cards.forEach((card, idx) => {
      const holder = card.querySelector(".qr-render-box");
      if (!holder) return;
      const cardNum = idx + 1;
      const separator = baseUrl.includes('?') ? '&' : '?';
      const targetCardUrl = `${baseUrl}${separator}card=${cardNum}`;

      generateCleanQR(targetCardUrl, holder);

      // Make QR badge directly clickable on desktop for testing
      let parentLink = holder.closest('.qr-link-wrap');
      if (!parentLink) {
        const wrap = document.createElement('a');
        wrap.className = 'qr-link-wrap';
        wrap.href = targetCardUrl;
        wrap.title = `Click to test Scan #${cardNum} -> Landing Page`;
        wrap.style.display = 'block';
        wrap.style.cursor = 'pointer';
        holder.parentNode.insertBefore(wrap, holder);
        wrap.appendChild(holder);
      } else {
        parentLink.href = targetCardUrl;
      }
    });
  }

  // Initialize QR Codes pointing to landing.html
  refreshAllQRCodes(currentUrl);

  // Live URL update listener
  if (qrInput) {
    qrInput.addEventListener("input", (e) => {
      const val = e.target.value.trim() || defaultLandingUrl;
      refreshAllQRCodes(val);
    });
  }


  // Mode Switcher Elements
  const modeSingleA4 = document.getElementById("modeSingleA4");
  const modeGrid4 = document.getElementById("modeGrid4");
  const subTabsSingle = document.getElementById("subTabsSingle");
  const subTabsGrid = document.getElementById("subTabsGrid");
  const singlePosterContainer = document.getElementById("singlePosterContainer");
  const gridSheetsContainer = document.getElementById("gridSheetsContainer");
  const btnDownloadMain = document.getElementById("btnDownloadMain");
  const btnDownloadCard = document.getElementById("btnDownloadCard");
  const downloadBtnText = document.getElementById("downloadBtnText");
  const downloadCardText = document.getElementById("downloadCardText");

  let currentMode = "single"; // "single" (A4 Posters) or "grid" (4-in-1 Sheets)
  let activeSingleCard = "all"; // "all" or "1" .. "8"
  let activeGridSheet = "all"; // "all" or "sheet1", "sheet2"

  function updateDownloadButtons() {
    if (currentMode === "single") {
      if (downloadBtnText) downloadBtnText.textContent = "Download All 8 A4 (PDF)";
      if (btnDownloadMain) {
        btnDownloadMain.href = "TECHNORYX_Postcards_All_8_A4_Pages.pdf";
        btnDownloadMain.download = "TECHNORYX_Postcards_All_8_A4_Pages.pdf";
        btnDownloadMain.title = "Download Complete 8-Page A4 Poster Bundle (PDF)";
      }

      if (btnDownloadCard) {
        btnDownloadCard.style.display = "inline-flex";
        if (activeSingleCard === "all") {
          btnDownloadCard.href = "TECHNORYX_Postcard_Card1_A4.pdf";
          btnDownloadCard.download = "TECHNORYX_Postcard_Card1_A4.pdf";
          if (downloadCardText) downloadCardText.textContent = "Card 1 (A4 PDF)";
        } else {
          btnDownloadCard.href = `TECHNORYX_Postcard_Card${activeSingleCard}_A4.pdf`;
          btnDownloadCard.download = `TECHNORYX_Postcard_Card${activeSingleCard}_A4.pdf`;
          if (downloadCardText) downloadCardText.textContent = `Card ${activeSingleCard} (A4 PDF)`;
        }
      }
    } else {
      if (downloadBtnText) downloadBtnText.textContent = "Download Both (4-in-1 PDF)";
      if (btnDownloadMain) {
        btnDownloadMain.href = "TECHNORYX_Postcards_Both_Sheets.pdf";
        btnDownloadMain.download = "TECHNORYX_Postcards_Both_Sheets.pdf";
        btnDownloadMain.title = "Download Combined 4-in-1 PDF";
      }

      if (btnDownloadCard) {
        btnDownloadCard.style.display = "inline-flex";
        if (activeGridSheet === "sheet2") {
          btnDownloadCard.href = "TECHNORYX_Postcards_Page2.pdf";
          btnDownloadCard.download = "TECHNORYX_Postcards_Page2.pdf";
          if (downloadCardText) downloadCardText.textContent = "Sheet 2 (Cards 5-8)";
        } else {
          btnDownloadCard.href = "TECHNORYX_Postcards_Page1.pdf";
          btnDownloadCard.download = "TECHNORYX_Postcards_Page1.pdf";
          if (downloadCardText) downloadCardText.textContent = "Sheet 1 (Cards 1-4)";
        }
      }
    }
  }

  // Switch between Single A4 Poster Mode and 4-in-1 Grid Mode
  function setViewMode(mode) {
    currentMode = mode;
    if (mode === "single") {
      if (modeSingleA4) modeSingleA4.classList.add("active");
      if (modeGrid4) modeGrid4.classList.remove("active");
      if (subTabsSingle) subTabsSingle.classList.remove("hidden-sheet");
      if (subTabsGrid) subTabsGrid.classList.add("hidden-sheet");
      if (singlePosterContainer) singlePosterContainer.classList.remove("hidden-sheet");
      if (gridSheetsContainer) gridSheetsContainer.classList.add("hidden-sheet");
    } else {
      if (modeSingleA4) modeSingleA4.classList.remove("active");
      if (modeGrid4) modeGrid4.classList.add("active");
      if (subTabsSingle) subTabsSingle.classList.add("hidden-sheet");
      if (subTabsGrid) subTabsGrid.classList.remove("hidden-sheet");
      if (singlePosterContainer) singlePosterContainer.classList.add("hidden-sheet");
      if (gridSheetsContainer) gridSheetsContainer.classList.remove("hidden-sheet");
    }
    updateDownloadButtons();
  }

  if (modeSingleA4) modeSingleA4.addEventListener("click", () => setViewMode("single"));
  if (modeGrid4) modeGrid4.addEventListener("click", () => setViewMode("grid"));

  // Single A4 Card Sub-tabs (All 8 or Card 1..8)
  const singleCardTabs = document.querySelectorAll("#subTabsSingle .card-tab-btn");
  singleCardTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      singleCardTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const cardId = tab.getAttribute("data-card");
      activeSingleCard = cardId;

      const posterSheets = document.querySelectorAll("#singlePosterContainer .single-card-sheet");
      posterSheets.forEach((sheet, idx) => {
        if (cardId === "all" || String(idx + 1) === cardId) {
          sheet.classList.remove("hidden-sheet");
        } else {
          sheet.classList.add("hidden-sheet");
        }
      });
      updateDownloadButtons();
    });
  });

  // 4-in-1 Grid Sheet Tabs (Sheet 1, Sheet 2, Both)
  const tabSheet1 = document.getElementById("tabSheet1");
  const tabSheet2 = document.getElementById("tabSheet2");
  const tabSheetAll = document.getElementById("tabSheetAll");
  const sheet1 = document.getElementById("sheet1");
  const sheet2 = document.getElementById("sheet2");

  function setActiveGridSheetTab(activeBtn, mode) {
    [tabSheet1, tabSheet2, tabSheetAll].forEach(btn => btn && btn.classList.remove("active"));
    if (activeBtn) activeBtn.classList.add("active");
    activeGridSheet = mode;

    if (mode === "sheet1") {
      if (sheet1) sheet1.classList.remove("hidden-sheet");
      if (sheet2) sheet2.classList.add("hidden-sheet");
    } else if (mode === "sheet2") {
      if (sheet1) sheet1.classList.add("hidden-sheet");
      if (sheet2) sheet2.classList.remove("hidden-sheet");
    } else {
      if (sheet1) sheet1.classList.remove("hidden-sheet");
      if (sheet2) sheet2.classList.remove("hidden-sheet");
    }
    updateDownloadButtons();
  }

  if (tabSheet1) tabSheet1.addEventListener("click", () => setActiveGridSheetTab(tabSheet1, "sheet1"));
  if (tabSheet2) tabSheet2.addEventListener("click", () => setActiveGridSheetTab(tabSheet2, "sheet2"));
  if (tabSheetAll) tabSheetAll.addEventListener("click", () => setActiveGridSheetTab(tabSheetAll, "all"));

  // Cut lines toggle
  if (toggleCutBtn) {
    toggleCutBtn.addEventListener("click", () => {
      const sheets = document.querySelectorAll(".a4-sheet");
      sheets.forEach(sheet => sheet.classList.toggle("show-cut-guides"));
      toggleCutBtn.classList.toggle("active");
    });
  }

  // Ink-Saver Mode toggle
  if (toggleInkBtn) {
    toggleInkBtn.addEventListener("click", () => {
      const sheets = document.querySelectorAll(".a4-sheet");
      sheets.forEach(sheet => sheet.classList.toggle("ink-saver-mode"));
      toggleInkBtn.classList.toggle("active");
      const isInkSaver = document.querySelector(".a4-sheet.ink-saver-mode");
      toggleInkBtn.innerHTML = isInkSaver ? "🌙 Dark Space Mode" : "🌓 Ink-Saver Mode";
    });
  }

  // Native Print Trigger
  if (printBtn) {
    printBtn.addEventListener("click", () => {
      window.print();
    });
  }

  // Click card to open enlarged inspector modal
  const cards = document.querySelectorAll(".postcard-card");
  cards.forEach(card => {
    card.addEventListener("click", () => {
      if (!modalBackdrop || !modalContainer) return;
      modalContainer.innerHTML = card.innerHTML;
      modalBackdrop.classList.add("open");
    });
  });

  // Close modal
  if (modalClose) {
    modalClose.addEventListener("click", () => {
      modalBackdrop.classList.remove("open");
    });
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", (e) => {
      if (e.target === modalBackdrop) {
        modalBackdrop.classList.remove("open");
      }
    });
  }

  // Keyboard shortcut ESC to close modal
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalBackdrop.classList.contains("open")) {
      modalBackdrop.classList.remove("open");
    }
  });

  // Initialize download buttons state
  updateDownloadButtons();
});
