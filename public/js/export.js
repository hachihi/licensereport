// js/export.js - Specialized Excel Exporter (Reports, Templates, Catalog)
// Định dạng chuẩn doanh nghiệp - Tông màu Hachihi Xanh Dương & Trắng
(function (global) {
  'use strict';

  // =========================================================================
  // 0. BẢNG MÀU CHUẨN THƯƠNG HIỆU HACHIHI (XANH DƯƠNG & TRẮNG) & STYLING ENGINE
  // =========================================================================
  const HACHIHI_THEME = {
    NAVY_DARK: "0B2545",       // #0B2545 Deep Hachihi Navy (Tiêu đề chính banner)
    BLUE_PRIMARY: "0052CC",    // #0052CC Royal Brand Blue (Header bảng dữ liệu)
    BLUE_MEDIUM: "1D4ED8",     // #1D4ED8 Xanh dương đậm (Tiêu đề phân mục I, II, III)
    BLUE_ACCENT: "2563EB",     // #2563EB Xanh dương tươi (Điểm nhấn)
    BLUE_LIGHT: "EFF6FF",      // #EFF6FF Ice Blue (Hàng tổng kết, nhãn metadata)
    BLUE_ZEBRA: "F4F8FC",      // #F4F8FC Xanh pastel siêu nhạt (Xen kẽ hàng chẵn/lẻ)
    WHITE: "FFFFFF",           // #FFFFFF Trắng tinh khiết
    TEXT_DARK: "0F172A",       // #0F172A Chữ đen than / Slate dark
    TEXT_MUTED: "475569",      // #475569 Chữ phụ slate
    TEXT_WHITE: "FFFFFF",      // #FFFFFF Chữ trắng
    BORDER_SOFT: "CBD5E1",     // #CBD5E1 Viền mảnh xám xanh nhạt
    BORDER_BLUE: "93C5FD",     // #93C5FD Viền xanh nhạt
    BORDER_NAVY: "0B2545",     // #0B2545 Viền đậm ngăn cách

    // Trạng thái (Status Badges)
    BADGE_SUCCESS_BG: "DCFCE7", // Xanh lá nhạt
    BADGE_SUCCESS_FG: "166534", // Xanh lá đậm
    BADGE_WARNING_BG: "FEF3C7", // Vàng cam nhạt
    BADGE_WARNING_FG: "92400E", // Cam đậm
    BADGE_DANGER_BG: "FEE2E2",  // Đỏ nhạt
    BADGE_DANGER_FG: "991B1B",  // Đỏ đậm
    BADGE_FOSS_BG: "E0F2FE",    // Xanh da trời nhạt
    BADGE_FOSS_FG: "0369A1",    // Xanh da trời đậm
  };

  // Gán style cho 1 ô đơn lẻ
  function styleCell(ws, r, c, style) {
    const addr = XLSX.utils.encode_cell({ r, c });
    if (!ws[addr]) {
      ws[addr] = { t: "s", v: "" };
    }
    ws[addr].s = style;
  }

  // Gán style cho 1 dải ô chữ nhật (hỗ trợ merged cells hiển thị nền và viền liền mạch)
  function styleRange(ws, rStart, cStart, rEnd, cEnd, style) {
    for (let r = rStart; r <= rEnd; r++) {
      for (let c = cStart; c <= cEnd; c++) {
        styleCell(ws, r, c, style);
      }
    }
  }

  // Nhận diện loại badge tự động dựa theo nội dung chuỗi
  function detectBadgeStyle(val, type) {
    const str = String(val || "").toLowerCase();
    if (type === "risk") {
      if (str.includes("nghiêm") || str.includes("critical")) {
        return { bg: HACHIHI_THEME.BADGE_DANGER_BG, fg: HACHIHI_THEME.BADGE_DANGER_FG };
      }
      if (str.includes("cao") || str.includes("bẫy") || str.includes("high") || str.includes("cá nhân")) {
        return { bg: HACHIHI_THEME.BADGE_WARNING_BG, fg: HACHIHI_THEME.BADGE_WARNING_FG };
      }
      if (str.includes("an toàn") || str.includes("thấp") || str.includes("low")) {
        return { bg: HACHIHI_THEME.BADGE_SUCCESS_BG, fg: HACHIHI_THEME.BADGE_SUCCESS_FG };
      }
    } else if (type === "invoiceStatus") {
      if (str.includes("có") || str.includes("hợp lệ") || str.includes("đầy đủ")) {
        return { bg: HACHIHI_THEME.BADGE_SUCCESS_BG, fg: HACHIHI_THEME.BADGE_SUCCESS_FG };
      }
      if (str.includes("thiếu") || str.includes("chưa") || str.includes("vi phạm")) {
        return { bg: HACHIHI_THEME.BADGE_DANGER_BG, fg: HACHIHI_THEME.BADGE_DANGER_FG };
      }
      if (str.includes("foss") || str.includes("miễn phí")) {
        return { bg: HACHIHI_THEME.BADGE_FOSS_BG, fg: HACHIHI_THEME.BADGE_FOSS_FG };
      }
    } else if (type === "licenseType") {
      if (str.includes("foss") || str.includes("free / foss") || str.includes("mã nguồn mở")) {
        return { bg: HACHIHI_THEME.BADGE_FOSS_BG, fg: HACHIHI_THEME.BADGE_FOSS_FG };
      }
      if (str.includes("bẫy") || str.includes("cá nhân") || str.includes("personal")) {
        return { bg: HACHIHI_THEME.BADGE_WARNING_BG, fg: HACHIHI_THEME.BADGE_WARNING_FG };
      }
    } else if (type === "kpiStatus") {
      if (str.includes("an toàn") || str.includes("100%")) {
        return { bg: HACHIHI_THEME.BADGE_SUCCESS_BG, fg: HACHIHI_THEME.BADGE_SUCCESS_FG };
      }
      if (str.includes("cần khắc phục") || str.includes("nghiêm trọng") || str.includes("vi phạm")) {
        return { bg: HACHIHI_THEME.BADGE_DANGER_BG, fg: HACHIHI_THEME.BADGE_DANGER_FG };
      }
      if (str.includes("bẫy") || str.includes("eula")) {
        return { bg: HACHIHI_THEME.BADGE_WARNING_BG, fg: HACHIHI_THEME.BADGE_WARNING_FG };
      }
    }
    return null;
  }

  // Tạo banner tiêu đề Hachihi (2 dòng đầu)
  function applyHachihiBanner(ws, maxCol) {
    ws['!merges'] = ws['!merges'] || [];
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: maxCol } });
    ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: maxCol } });

    // Dòng 1: Tiêu đề lớn Xanh Navy Đậm
    styleRange(ws, 0, 0, 0, maxCol, {
      font: { name: "Segoe UI", sz: 14, bold: true, color: { rgb: HACHIHI_THEME.WHITE } },
      fill: { fgColor: { rgb: HACHIHI_THEME.NAVY_DARK } },
      alignment: { horizontal: "center", vertical: "center" }
    });

    // Dòng 2: Phụ đề Xanh Hoàng Gia Nhạt
    styleRange(ws, 1, 0, 1, maxCol, {
      font: { name: "Segoe UI", sz: 9.5, italic: true, color: { rgb: "EBF3FC" } },
      fill: { fgColor: { rgb: HACHIHI_THEME.BLUE_MEDIUM } },
      alignment: { horizontal: "center", vertical: "center" }
    });
  }

  // Tạo tiêu đề phân mục (Section Header I, II, III)
  function applyHachihiSectionHeader(ws, row, maxCol) {
    ws['!merges'] = ws['!merges'] || [];
    ws['!merges'].push({ s: { r: row, c: 0 }, e: { r: row, c: maxCol } });

    styleRange(ws, row, 0, row, maxCol, {
      font: { name: "Segoe UI", sz: 11, bold: true, color: { rgb: HACHIHI_THEME.WHITE } },
      fill: { fgColor: { rgb: HACHIHI_THEME.BLUE_MEDIUM } },
      alignment: { horizontal: "left", vertical: "center", indent: 1 },
      border: {
        top: { style: "thin", color: { rgb: HACHIHI_THEME.NAVY_DARK } },
        bottom: { style: "medium", color: { rgb: HACHIHI_THEME.NAVY_DARK } },
        left: { style: "thin", color: { rgb: HACHIHI_THEME.NAVY_DARK } },
        right: { style: "thin", color: { rgb: HACHIHI_THEME.NAVY_DARK } }
      }
    });
  }

  // Tạo hàng tiêu đề cột của bảng (Table Headers) - Xanh Dương Hachihi
  function applyHachihiTableHeader(ws, row, colCount, bg = HACHIHI_THEME.BLUE_PRIMARY) {
    for (let c = 0; c < colCount; c++) {
      styleCell(ws, row, c, {
        font: { name: "Segoe UI", sz: 10, bold: true, color: { rgb: HACHIHI_THEME.WHITE } },
        fill: { fgColor: { rgb: bg } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          top: { style: "thin", color: { rgb: HACHIHI_THEME.BORDER_BLUE } },
          bottom: { style: "medium", color: { rgb: HACHIHI_THEME.NAVY_DARK } },
          left: { style: "thin", color: { rgb: HACHIHI_THEME.BORDER_BLUE } },
          right: { style: "thin", color: { rgb: HACHIHI_THEME.BORDER_BLUE } }
        }
      });
    }
  }

  // Tạo các hàng dữ liệu (Data Rows) - Kẻ sọc trắng & xanh pastel, viền thanh mảnh
  function applyHachihiDataRows(ws, startRow, endRow, colCount, options = {}) {
    const {
      alignments = {},
      numberFormats = {},
      badgeTypes = {},
      boldCols = []
    } = options;

    for (let r = startRow; r <= endRow; r++) {
      const isZebra = (r - startRow) % 2 === 1;
      const rowBg = isZebra ? HACHIHI_THEME.BLUE_ZEBRA : HACHIHI_THEME.WHITE;

      for (let c = 0; c < colCount; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = ws[addr];
        const val = cell ? cell.v : "";

        const align = alignments[c] || (typeof val === "number" ? "right" : (c === 0 ? "center" : "left"));
        const isBold = boldCols.includes(c);

        let cellBg = rowBg;
        let cellFg = HACHIHI_THEME.TEXT_DARK;

        // Kiểm tra badge nếu cột này được chỉ định
        if (badgeTypes[c] && val !== undefined && val !== null && String(val).trim() !== "") {
          const badge = detectBadgeStyle(val, badgeTypes[c]);
          if (badge) {
            cellBg = badge.bg;
            cellFg = badge.fg;
          }
        }

        const borderDef = {
          top: { style: "thin", color: { rgb: HACHIHI_THEME.BORDER_SOFT } },
          bottom: { style: "thin", color: { rgb: HACHIHI_THEME.BORDER_SOFT } },
          left: { style: "thin", color: { rgb: HACHIHI_THEME.BORDER_SOFT } },
          right: { style: "thin", color: { rgb: HACHIHI_THEME.BORDER_SOFT } }
        };

        const cellStyle = {
          font: {
            name: "Segoe UI",
            sz: 9.5,
            bold: isBold || (badgeTypes[c] && cellFg !== HACHIHI_THEME.TEXT_DARK),
            color: { rgb: cellFg }
          },
          fill: { fgColor: { rgb: cellBg } },
          alignment: {
            horizontal: align,
            vertical: "center",
            wrapText: align === "left" && typeof val === "string" && val.length > 25
          },
          border: borderDef
        };

        if (cell) {
          cell.s = cellStyle;
          // Áp dụng định dạng số/tiền tệ
          if (numberFormats[c]) {
            cell.z = numberFormats[c];
          } else if (cell.t === "n" && typeof val === "number" && val > 999 && !String(val).includes(".")) {
            if (!cell.z) cell.z = "#,##0";
          }
        } else {
          styleCell(ws, r, c, cellStyle);
        }
      }
    }
  }

  // Tạo hàng tổng cộng (Total Row) - Nền xanh băng nhạt, chữ đậm, viền kép dưới chuẩn kế toán
  function applyHachihiTotalRow(ws, row, colCount, options = {}) {
    const {
      alignments = {},
      numberFormats = {},
      labelCol = 1
    } = options;

    for (let c = 0; c < colCount; c++) {
      const addr = XLSX.utils.encode_cell({ r: row, c });
      const cell = ws[addr];
      const val = cell ? cell.v : "";
      const align = alignments[c] || (c === labelCol ? "left" : (typeof val === "number" ? "right" : "center"));

      const cellStyle = {
        font: { name: "Segoe UI", sz: 10.5, bold: true, color: { rgb: HACHIHI_THEME.NAVY_DARK } },
        fill: { fgColor: { rgb: HACHIHI_THEME.BLUE_LIGHT } },
        alignment: { horizontal: align, vertical: "center" },
        border: {
          top: { style: "medium", color: { rgb: HACHIHI_THEME.BLUE_PRIMARY } },
          bottom: { style: "double", color: { rgb: HACHIHI_THEME.NAVY_DARK } },
          left: { style: "thin", color: { rgb: HACHIHI_THEME.BORDER_SOFT } },
          right: { style: "thin", color: { rgb: HACHIHI_THEME.BORDER_SOFT } }
        }
      };

      if (cell) {
        cell.s = cellStyle;
        if (numberFormats[c]) {
          cell.z = numberFormats[c];
        } else if (typeof val === "number" && val > 999) {
          cell.z = "#,##0 \"₫\"";
        }
      } else {
        styleCell(ws, row, c, cellStyle);
      }
    }
  }

  // Hàm tải file an toàn đa nền tảng (trình duyệt, webview, iframe)
  function saveWorkbook(wb, filename) {
    try {
      XLSX.writeFile(wb, filename);
    } catch (err) {
      console.warn("XLSX.writeFile fallback sang tải Blob:", err);
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  // Helper: Visual progress bar graph for Excel cells (Unicode solid & light shade)
  function makeAsciiBar(pct, totalLength = 18) {
    const p = Math.max(0, Math.min(100, Math.round(pct || 0)));
    const filled = Math.min(totalLength, Math.max(0, Math.round((p / 100) * totalLength)));
    const empty = Math.max(0, totalLength - filled);
    return '█'.repeat(filled) + '░'.repeat(empty) + `  ${p}%`;
  }

  // Helper: Compact visual bar for table columns
  function makeMiniBar(pct, totalLength = 10) {
    const p = Math.max(0, Math.min(100, Math.round(pct || 0)));
    const filled = Math.min(totalLength, Math.max(0, Math.round((p / 100) * totalLength)));
    const empty = Math.max(0, totalLength - filled);
    return '■'.repeat(filled) + '□'.repeat(empty) + ` ${p}%`;
  }

  // Helper: Format currency in VND string
  function formatCurrency(val) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  }

  // Helper: Calculate visual character width accounting for Unicode, Vietnamese diacritics, emojis, and symbols
  function getCellVisualWidth(cell, headerText = '') {
    if (!cell || cell.v === undefined || cell.v === null) return 0;
    
    let displayStr = String(cell.v);
    
    // Format numbers according to currency / percent / comma formatting to calculate real display width
    if (cell.t === 'n') {
      const num = Number(cell.v);
      const cellFormat = cell.z || '';
      const isCurrency = cellFormat.includes('₫') || cellFormat.includes('VNĐ') ||
        headerText.includes('VNĐ') || headerText.includes('Chi Phí') || headerText.includes('Đơn Giá') ||
        headerText.includes('Tiết Kiệm') || headerText.includes('Ngân Sách') || headerText.includes('Giá') ||
        headerText.includes('Số Tiền');
      const isPercent = cellFormat.includes('%') || headerText.includes('Tỷ Lệ') || headerText.includes('Tỷ Trọng') || headerText.includes('%');

      if (isCurrency) {
        // e.g. 180000000 -> "180.000.000 ₫"
        displayStr = new Intl.NumberFormat('vi-VN').format(Math.round(num)) + ' ₫';
      } else if (isPercent) {
        const pctVal = num <= 1 && num > 0 ? num * 100 : num;
        displayStr = pctVal.toFixed(1).replace(/\.0$/, '') + '%';
      } else if (Math.abs(num) >= 1000 && !headerText.includes('Năm') && !headerText.includes('Version')) {
        displayStr = new Intl.NumberFormat('vi-VN').format(num);
      } else {
        displayStr = String(cell.v);
      }
    }

    // Split multiline values and find the longest line
    const lines = displayStr.split('\n');
    let maxLineWidth = 0;
    for (const line of lines) {
      let width = 0;
      for (const ch of line) {
        const code = ch.codePointAt(0);
        if (code >= 0x1F300 && code <= 0x1F9FF) {
          width += 2.2; // Emojis (🟢, 🔴, 💡, etc.)
        } else if (code >= 0x2500 && code <= 0x259F) {
          width += 1.4; // Box drawing / Block characters (■, □, ═, ┤, ┴)
        } else if (code >= 0x2600 && code <= 0x27BF) {
          width += 2.0; // Miscellaneous symbols (★, ☆, etc.)
        } else if (code > 127) {
          width += 1.15; // Vietnamese accented characters
        } else if (ch >= 'A' && ch <= 'Z') {
          width += 1.15; // Capital letters
        } else {
          width += 1.0;
        }
      }
      if (width > maxLineWidth) maxLineWidth = width;
    }

    return maxLineWidth;
  }

  // Helper: Check if cell (r, c) is part of a horizontal merge spanning 2 or more columns
  function isCellMergedHorizontally(ws, r, c) {
    if (!ws || !ws['!merges'] || !Array.isArray(ws['!merges'])) return false;
    for (let i = 0; i < ws['!merges'].length; i++) {
      const m = ws['!merges'][i];
      if (r >= m.s.r && r <= m.e.r && c >= m.s.c && c <= m.e.c) {
        if (m.s.c !== m.e.c) return true;
      }
    }
    return false;
  }

  // Helper: Format cell numbers, currencies, freeze panes, autofilter, and auto-size all cells (both column width and row height)
  function formatWorksheet(ws, options = {}) {
    if (!ws || !ws['!ref']) return;
    const {
      minColWidth = 10,
      maxColWidth = 75,
      startDataRow = 0,
      customWidths = null,
      freezeRow = 0,
      freezeCol = 0,
      autoFilterRange = null
    } = options;

    const range = XLSX.utils.decode_range(ws['!ref']);
    const colWidths = [];

    // 1. TỰ ĐỘNG CANH CHỈNH ĐỘ RỘNG CÁC CỘT (AUTO-SIZE COLUMN WIDTHS)
    for (let C = range.s.c; C <= range.e.c; ++C) {
      // Tìm văn bản tiêu đề cột để định hướng format số và chiều rộng tiêu đề
      let headerText = '';
      const headerRow = startDataRow > 0 ? startDataRow : range.s.r;
      const headerCell = ws[XLSX.utils.encode_cell({ r: headerRow, c: C })];
      if (headerCell && headerCell.v !== undefined) {
        headerText = String(headerCell.v);
      }

      let maxContentLen = 0;
      for (let R = range.s.r; R <= range.e.r; ++R) {
        // Bỏ qua các ô bị merge ngang nhiều cột (như Banner, Section Header) để không làm phình to cột đầu tiên
        if (isCellMergedHorizontally(ws, R, C)) {
          continue;
        }

        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[cellAddress];
        if (!cell || cell.v === undefined || cell.v === null) continue;

        // Tự động gán format số / tiền tệ nếu chưa có
        if (cell.t === 'n') {
          if (
            headerText.includes('VNĐ') ||
            headerText.includes('Chi Phí') ||
            headerText.includes('Đơn Giá') ||
            headerText.includes('Tiết Kiệm') ||
            headerText.includes('Ngân Sách') ||
            headerText.includes('Giá') ||
            headerText.includes('Số Tiền')
          ) {
            if (!cell.z) cell.z = '#,##0 "₫"';
          } else if (headerText.includes('Tỷ Lệ') || headerText.includes('Tỷ Trọng') || headerText.includes('%')) {
            if (!cell.z) cell.z = '0.0%';
          } else if (cell.v > 999 && !headerText.includes('Năm') && !headerText.includes('Version')) {
            if (!cell.z) cell.z = '#,##0';
          }
        }

        const visualWidth = getCellVisualWidth(cell, headerText);
        if (visualWidth > maxContentLen) {
          maxContentLen = visualWidth;
        }
      }

      // Chiều rộng cơ sở gợi ý từ customWidths (nếu có)
      const baseWch = (customWidths && customWidths[C] !== undefined) ? customWidths[C] : (C === 0 ? 8 : minColWidth);
      
      // Auto-fit tính toán: Thêm khoảng đệm an toàn +3.8 ký tự
      // Đảm bảo không bị che bởi nút bấm AutoFilter của Excel và không bị cụt đuôi dấu tiếng Việt
      const autoCalculatedWch = Math.ceil(maxContentLen + 3.8);
      
      // Chiều rộng tối ưu: Lấy giá trị lớn hơn giữa độ rộng thực tế và độ rộng gợi ý, giới hạn trong [minColWidth, maxColWidth]
      const finalWch = Math.min(
        Math.max(autoCalculatedWch, baseWch, C === 0 ? 8 : minColWidth),
        maxColWidth
      );

      colWidths[C] = { wch: finalWch };
    }
    ws['!cols'] = colWidths;

    // 2. TỰ ĐỘNG CANH CHỈNH CHIỀU CAO CÁC HÀNG (AUTO-SIZE ROW HEIGHTS)
    const existingRows = ws['!rows'] || [];
    const autoRows = [];

    for (let R = range.s.r; R <= range.e.r; ++R) {
      const existingHpt = (existingRows[R] && typeof existingRows[R].hpt === 'number') ? existingRows[R].hpt : 0;
      
      let maxLinesInRow = 1;
      let hasContentInRow = false;
      let isMergedAcross = false;
      let isHeaderStyle = false;
      let isTotalStyle = false;
      let isSectionStyle = false;

      // Kiểm tra xem dòng này có bị merge ngang chiếm diện rộng không
      if (ws['!merges']) {
        for (let i = 0; i < ws['!merges'].length; i++) {
          const m = ws['!merges'][i];
          if (m.s.r === R && m.e.r === R && (m.e.c - m.s.c) >= Math.max(1, (range.e.c - range.s.c) * 0.4)) {
            isMergedAcross = true;
            break;
          }
        }
      }

      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[cellAddress];
        if (cell && cell.v !== undefined && cell.v !== null && String(cell.v).trim() !== '') {
          hasContentInRow = true;
          const valStr = String(cell.v);
          const lines = valStr.split('\n').length;
          if (lines > maxLinesInRow) maxLinesInRow = lines;

          // Kiểm tra style để định hình chiều cao chuẩn đẹp
          if (cell.s) {
            // Tự động căn giữa theo trục đứng (vertical center) cho mọi ô
            cell.s.alignment = cell.s.alignment || {};
            if (!cell.s.alignment.vertical) {
              cell.s.alignment.vertical = 'center';
            }

            if (cell.s.fill && cell.s.fill.fgColor) {
              const bg = cell.s.fill.fgColor.rgb;
              if (bg === HACHIHI_THEME.BLUE_PRIMARY || bg === HACHIHI_THEME.NAVY_DARK) {
                if (cell.s.font && cell.s.font.bold) isHeaderStyle = true;
              } else if (bg === HACHIHI_THEME.BLUE_LIGHT && cell.s.font && cell.s.font.bold) {
                isTotalStyle = true;
              } else if (bg === HACHIHI_THEME.BLUE_MEDIUM) {
                isSectionStyle = true;
              }
            }
          }
        }
      }

      let calculatedHpt = 22.5; // Chiều cao cơ bản rộng rãi, thoải mái cho hàng dữ liệu
      if (!hasContentInRow) {
        calculatedHpt = 12; // Hàng cách khoảng trống thẩm mỹ
      } else if (R === 0 && isMergedAcross) {
        calculatedHpt = 34; // Banner tiêu đề lớn
      } else if (R === 1 && isMergedAcross) {
        calculatedHpt = 23; // Phụ đề
      } else if (isSectionStyle || isMergedAcross) {
        calculatedHpt = 27; // Tiêu đề phân mục
      } else if (isHeaderStyle) {
        calculatedHpt = 29; // Tiêu đề cột bảng
      } else if (isTotalStyle) {
        calculatedHpt = 26; // Hàng tổng kết kế toán
      } else if (maxLinesInRow > 1) {
        calculatedHpt = Math.min(130, maxLinesInRow * 18 + 6); // Nội dung nhiều dòng
      }

      // Giữ nguyên hoặc nâng cấp chiều cao tối ưu nhất
      autoRows[R] = { hpt: Math.max(existingHpt, calculatedHpt) };
    }
    ws['!rows'] = autoRows;

    // 3. ĐÓNG BĂNG VÙNG TIÊU ĐỀ (FREEZE PANES)
    if (freezeRow > 0) {
      ws['!freeze'] = { xSplit: freezeCol, ySplit: freezeRow };
    }

    // 4. BỘ LỌC TỰ ĐỘNG (AUTOFILTER)
    if (autoFilterRange) {
      ws['!autofilter'] = { ref: autoFilterRange };
    }
  }

  // =========================================================================
  // 1. TẢI FILE MẪU EXCEL CHUẨN DOANH NGHIỆP (3 SHEETS CANH CHỈNH ĐẸP MẮT)
  // =========================================================================
  function downloadTemplate3Sheets(customCatalog) {
    if (typeof XLSX === 'undefined') {
      alert('Thư viện XLSX chưa sẵn sàng!');
      return;
    }

    const wb = XLSX.utils.book_new();

    // -------------------------------------------------------------------------
    // SHEET 1: 1_Danh_Sach_May_Tinh
    // -------------------------------------------------------------------------
    const ws1Data = [
      ["HACHIHI SAM - DANH SÁCH MÁY TÍNH KIỂM KÊ (MẪU CHUẨN DOANH NGHIỆP)"],
      ["Hướng dẫn: Điền thông tin máy tính trong công ty. Cột Hostname là mã định danh chính duy nhất. Có thể xóa các dòng mẫu bên dưới và dán dữ liệu thực tế."],
      [],
      ["STT", "Tên Máy Tính (Hostname)", "Người Sử Dụng", "Phòng Ban", "Số Serial / Service Tag", "Hệ Điều Hành", "Cấu Hình / Model Phần Cứng", "Ghi Chú"],
      [1, "KT-DESKTOP-01", "Nguyễn Thị Hoa", "Kế Toán", "serial001", "Windows 11 Pro 64-bit", "Dell OptiPlex 7090 - Core i5, 16GB RAM, 512GB SSD", "Máy kế toán trưởng"],
      [2, "KD-LAPTOP-02", "Trần Văn Nam", "Kinh Doanh", "serial002", "Windows 10 Pro 64-bit", "Lenovo ThinkPad T14 - Core i7, 16GB RAM, 512GB SSD", "Laptop kinh doanh thường đi thị trường"],
      [3, "ENG-WORKSTATION-01", "Lê Minh Tuấn", "Kỹ Thuật", "serial003", "Windows 11 Pro", "Dell Precision 3660 - Core i9, 32GB RAM, RTX 4080", "Máy thiết kế bản vẽ kỹ thuật CAD/CAM"],
      [4, "HR-PC-01", "Phạm Thu Trang", "Hành Chính Nhân Sự", "serial004", "Windows 11 Home", "HP ProDesk 400 G7 - Core i3, 8GB RAM, 256GB SSD", "Cần nâng cấp lên Windows Pro cho DN"],
      [5, "MKT-LAPTOP-01", "Hoàng Anh Dũng", "Marketing", "serial005", "macOS Sonoma 14.5", "MacBook Pro M2 - 16GB Unified RAM, 512GB SSD", "Thiết kế media, banner và video sản phẩm"],
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);
    applyHachihiBanner(ws1, 7);
    applyHachihiTableHeader(ws1, 3, 8, HACHIHI_THEME.BLUE_PRIMARY);
    applyHachihiDataRows(ws1, 4, 8, 8, {
      alignments: { 0: "center", 1: "left", 2: "left", 3: "left", 4: "center", 5: "left", 6: "left", 7: "left" },
      boldCols: [1]
    });
    ws1['!rows'] = [{ hpt: 30 }, { hpt: 22 }, { hpt: 10 }, { hpt: 26 }, { hpt: 22 }, { hpt: 22 }, { hpt: 22 }, { hpt: 22 }, { hpt: 22 }];
    formatWorksheet(ws1, {
      customWidths: [8, 22, 22, 20, 22, 24, 38, 32],
      startDataRow: 3,
      freezeRow: 4,
      autoFilterRange: "A4:H9"
    });
    XLSX.utils.book_append_sheet(wb, ws1, "1_Danh_Sach_May_Tinh");

    // -------------------------------------------------------------------------
    // SHEET 2: 2_Danh_Sach_Phan_Mem
    // -------------------------------------------------------------------------
    const ws2Data = [
      ["HACHIHI SAM - DANH SÁCH PHẦN MỀM CÀI ĐẶT & ĐỐI SOÁT HÓA ĐƠN (MẪU CHUẨN)"],
      ["Hướng dẫn: 2 cột đầu là Số Serial và Model máy tính. Nhập chi tiết phần mềm cài trên từng máy (Hostname) và đối soát hóa đơn VAT GTGT bản quyền."],
      [],
      ["Số Serial Máy Tính", "Model / Cấu Hình Máy Tính", "STT", "Tên Máy Tính (Hostname)", "Tên Phần Mềm Cài Đặt", "Hãng Sản Xuất", "Phiên Bản", "Tình Trạng Hóa Đơn (Có / Chưa / FOSS)", "Số Hóa Đơn VAT / Hợp Đồng", "Ghi Chú Kiểm Toán"],
      ["DL7090-KT01", "Dell OptiPlex 7090", 1, "KT-DESKTOP-01", "Microsoft Office Home & Business 2021", "Microsoft", "16.0", "Có", "HĐ GTGT #0023412", "Đã có HĐ VAT đầy đủ hợp lệ"],
      ["DL7090-KT01", "Dell OptiPlex 7090", 2, "KT-DESKTOP-01", "7-Zip", "Igor Pavlov", "23.01", "FOSS", "Miễn phí FOSS 100%", "Mã nguồn mở miễn phí cho doanh nghiệp (0đ)"],
      ["DL7090-KT01", "Dell OptiPlex 7090", 3, "KT-DESKTOP-01", "WinRAR 6.24", "win.rar GmbH", "6.24", "Chưa", "Chưa có hóa đơn", "Bẫy dùng thử 40 ngày, cần thay bằng 7-Zip"],
      ["LNV-T14-KD02", "Lenovo ThinkPad T14", 4, "KD-LAPTOP-02", "TeamViewer 15", "TeamViewer", "15.48", "Chưa", "Chưa có hóa đơn", "Bẫy Free cá nhân, vi phạm điều khoản công ty"],
      ["DL3660-ENG01", "Dell Precision 3660", 5, "ENG-WORKSTATION-01", "AutoCAD 2024", "Autodesk", "24.3", "Chưa", "Chưa có hóa đơn", "Rủi ro kiểm tra bản quyền cao, cần mua bổ sung"],
      ["DL3660-ENG01", "Dell Precision 3660", 6, "ENG-WORKSTATION-01", "Phần mềm nội bộ công ty", "Nội bộ", "1.0", "FOSS", "Nội bộ tự phát triển", "An toàn, miễn phí cho doanh nghiệp"],
      ["HP400G7-HR01", "HP ProDesk 400 G7", 7, "HR-PC-01", "Unikey 4.3 RC5", "Phạm Kim Long", "4.3", "FOSS", "Miễn phí 100%", "Bộ gõ tiếng Việt chuẩn FOSS"],
      ["MBP-M2-MKT01", "MacBook Pro M2", 8, "MKT-LAPTOP-01", "Adobe Photoshop 2024", "Adobe Systems", "25.2", "Có", "HĐ Adobe VIP #891230", "Đã mua thuê bao hàng năm bản quyền hợp lệ"],
    ];

    const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
    applyHachihiBanner(ws2, 9);
    applyHachihiTableHeader(ws2, 3, 10, HACHIHI_THEME.BLUE_PRIMARY);
    applyHachihiDataRows(ws2, 4, 11, 10, {
      alignments: { 0: "center", 1: "left", 2: "center", 3: "left", 4: "left", 5: "left", 6: "center", 7: "center", 8: "left", 9: "left" },
      badgeTypes: { 7: "invoiceStatus" },
      boldCols: [3, 4]
    });
    ws2['!rows'] = [{ hpt: 30 }, { hpt: 22 }, { hpt: 10 }, { hpt: 26 }];
    formatWorksheet(ws2, {
      customWidths: [22, 28, 8, 22, 36, 20, 14, 22, 25, 36],
      startDataRow: 3,
      freezeRow: 4,
      freezeCol: 2,
      autoFilterRange: "A4:J12"
    });
    XLSX.utils.book_append_sheet(wb, ws2, "2_Danh_Sach_Phan_Mem");

    // -------------------------------------------------------------------------
    // SHEET 3: 3_Danh_Muc_Catalog
    // -------------------------------------------------------------------------
    const catList = customCatalog || (global.SAM_CONSTANTS && global.SAM_CONSTANTS.DEFAULT_SOFTWARE_RULES) || [];
    const ws3Data = [
      ["HACHIHI SAM - DANH MỤC NHẬN DIỆN PHẦN MỀM & BẪY BẢN QUYỀN TIÊU CHUẨN (2026.09)"],
      ["Danh mục từ điển quy tắc chuẩn giúp hệ thống nhận diện loại bản quyền, mức rủi ro kiểm tra và tự động tính toán đơn giá dự toán."],
      [],
      [
        "STT",
        "Tên Phần Mềm",
        "Từ Khóa Nhận Diện",
        "Hãng Sản Xuất",
        "Nhóm Phân Loại",
        "Loại Bản Quyền",
        "Mức Rủi Ro",
        "Đơn Giá Dự Toán (VNĐ)",
        "Phần Mềm FOSS Thay Thế (0đ)",
        "Ghi Chú & Hướng Dẫn Pháp Lý"
      ]
    ];

    catList.forEach((c, idx) => {
      ws3Data.push([
        idx + 1,
        c.name || "",
        (Array.isArray(c.keywords) ? c.keywords.join(", ") : (c.pattern || c.keywords || c.name || "")),
        c.vendor || "",
        c.category || "Văn phòng",
        c.licenseType === "FREE_OPEN_SOURCE"
          ? "Free / FOSS (Miễn phí cho DN)"
          : c.licenseType === "FREE_PERSONAL_ONLY"
            ? "Bẫy Bản Quyền Cá Nhân"
            : "Thương Mại Trả Phí",
        c.auditRisk === "LOW"
          ? "An Toàn (Thấp)"
          : c.auditRisk === "CRITICAL"
            ? "Nghiêm Trọng"
            : "Rủi Ro Cao",
        c.estimatedPriceVND || 0,
        c.recommendedAlternative || c.foss || "",
        c.actionDetails || ""
      ]);
    });

    const ws3 = XLSX.utils.aoa_to_sheet(ws3Data);
    applyHachihiBanner(ws3, 9);
    applyHachihiTableHeader(ws3, 3, 10, HACHIHI_THEME.BLUE_PRIMARY);
    applyHachihiDataRows(ws3, 4, ws3Data.length - 1, 10, {
      alignments: { 0: "center", 1: "left", 2: "left", 3: "left", 4: "center", 5: "center", 6: "center", 7: "right", 8: "left", 9: "left" },
      numberFormats: { 7: '#,##0 "₫"' },
      badgeTypes: { 5: "licenseType", 6: "risk" },
      boldCols: [1]
    });
    ws3['!rows'] = [{ hpt: 30 }, { hpt: 22 }, { hpt: 10 }, { hpt: 26 }];
    formatWorksheet(ws3, {
      customWidths: [8, 28, 30, 18, 16, 24, 16, 22, 28, 38],
      startDataRow: 3,
      freezeRow: 4,
      autoFilterRange: `A4:J${ws3Data.length}`
    });
    XLSX.utils.book_append_sheet(wb, ws3, "3_Danh_Muc_Catalog");

    saveWorkbook(wb, "Hachihi_SAM_Mau_Kiem_Ke_3_Sheets_Chuan_DN.xlsx");
  }

  // =========================================================================
  // 2. GỘP TẤT CẢ FILE LÀM 1 FILE EXCEL DUY NHẤT (PHONG CÁCH HACHIHI)
  // =========================================================================
  function exportMergedInventoryWorkbook(computers, installations, catalogRules, clientName, loadedFiles) {
    if (typeof XLSX === 'undefined') {
      alert('Thư viện XLSX chưa sẵn sàng!');
      return;
    }

    const safeClient = clientName || "Hachihi.vn";
    const wb = XLSX.utils.book_new();

    const fileSourceCount = loadedFiles && loadedFiles.length > 0 ? loadedFiles.length : 1;
    const ws1Data = [
      [`HACHIHI SAM - BẢNG HỢP NHẤT TOÀN BỘ MÁY TÍNH KIỂM KÊ (${safeClient.toUpperCase()})`],
      [`Đã gộp tự động từ ${fileSourceCount} tập tin kiểm kê • Tổng cộng ${computers ? computers.length : 0} máy tính • Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`],
      [],
      [
        "STT",
        "Tên Máy Tính (Hostname)",
        "Người Sử Dụng",
        "Phòng Ban",
        "Hệ Điều Hành",
        "Model / Cấu Hình Phần Cứng",
        "Số Serial / Service Tag",
        "Hãng Sản Xuất",
        "Vi Xử Lý (CPU)",
        "Bộ Nhớ RAM",
        "Ổ Cứng Lưu Trữ",
        "Tập Tin Nguồn"
      ]
    ];

    (computers || []).forEach((c, idx) => {
      ws1Data.push([
        idx + 1,
        c.hostname || "",
        c.user || "",
        c.department || "",
        c.os || "",
        c.model || "",
        c.serial || "",
        c.manufacturer || "",
        c.cpu || "",
        c.ram || "",
        c.disk || "",
        c.sourceFile || ""
      ]);
    });

    const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);
    applyHachihiBanner(ws1, 11);
    applyHachihiTableHeader(ws1, 3, 12, HACHIHI_THEME.BLUE_PRIMARY);
    applyHachihiDataRows(ws1, 4, ws1Data.length - 1, 12, {
      alignments: { 0: "center", 1: "left", 2: "left", 3: "left", 4: "left", 5: "left", 6: "center", 7: "left", 8: "left", 9: "center", 10: "left", 11: "left" },
      boldCols: [1]
    });
    ws1['!rows'] = [{ hpt: 30 }, { hpt: 22 }, { hpt: 10 }, { hpt: 26 }];
    formatWorksheet(ws1, {
      customWidths: [8, 22, 22, 20, 26, 28, 24, 18, 28, 22, 22, 28],
      startDataRow: 3,
      freezeRow: 4,
      autoFilterRange: `A4:L${ws1Data.length}`
    });
    XLSX.utils.book_append_sheet(wb, ws1, "1_Danh_Sach_May_Tinh");

    // SHEET 2: 2_Danh_Sach_Phan_Mem
    const ws2Data = [
      [`HACHIHI SAM - BẢNG HỢP NHẤT PHẦN MỀM CÀI ĐẶT & ĐỐI SOÁT HÓA ĐƠN (${safeClient.toUpperCase()})`],
      [`2 CỘT ĐẦU TIÊN LÀ SỐ SERIAL VÀ MODEL MÁY TÍNH • Tổng cộng ${installations ? installations.length : 0} lượt cài đặt • Đã đồng bộ từ các file nạp`],
      [],
      [
        "Số Serial Máy Tính",
        "Model / Cấu Hình Máy Tính",
        "STT",
        "Tên Máy Tính (Hostname)",
        "Người Sử Dụng",
        "Phòng Ban",
        "Tên Phần Mềm Cài Đặt",
        "Hãng Sản Xuất",
        "Phiên Bản",
        "Loại Bản Quyền",
        "Mức Rủi Ro",
        "Tình Trạng Hóa Đơn",
        "Số Hóa Đơn VAT / Ghi Chú",
        "Đơn Giá Dự Toán (VNĐ)",
        "Khuyến Nghị / FOSS Thay Thế",
        "Tập Tin Nguồn"
      ]
    ];

    const compMap = new Map();
    (computers || []).forEach((c) => {
      if (c && c.hostname) compMap.set(String(c.hostname).trim().toUpperCase(), c);
    });

    (installations || []).forEach((i, idx) => {
      const hUpper = String(i.computerHostname || "").trim().toUpperCase();
      const matchedComp = compMap.get(hUpper) || {};
      const serial = i.serial || matchedComp.serial || matchedComp.serviceTag || "N/A";
      const model = i.model || matchedComp.model || matchedComp.hardwareModel || "N/A";

      ws2Data.push([
        serial,
        model,
        idx + 1,
        i.computerHostname || "",
        i.userName || matchedComp.user || "Chưa gán",
        i.department || matchedComp.department || "N/A",
        i.rawSoftwareName || i.displayName,
        i.vendor || "Chưa rõ",
        i.version || "Latest",
        i.licenseType === "FREE_OPEN_SOURCE"
          ? "Miễn Phí FOSS"
          : i.licenseType === "FREE_PERSONAL_ONLY"
            ? "Bẫy Bản Quyền Cá Nhân"
            : "Thương Mại",
        i.auditRisk === "LOW" ? "Thấp (An toàn)" : i.auditRisk === "CRITICAL" ? "Nghiêm trọng" : "Rủi ro cao",
        i.invoiceStatus === "HAS_INVOICE"
          ? "Có Hóa Đơn"
          : i.invoiceStatus === "NOT_APPLICABLE" || i.licenseType === "FREE_OPEN_SOURCE"
            ? "Miễn Phí FOSS"
            : "Thiếu Hóa Đơn",
        i.invoiceNumber || "",
        (i.invoiceStatus === "MISSING_INVOICE" && i.licenseType !== "FREE_OPEN_SOURCE") ? (i.estimatedPriceVND || 0) : 0,
        i.actionDetails || i.recommendedAlternative || i.suggestedAction || "",
        i.sourceFile || matchedComp.sourceFile || ""
      ]);
    });

    const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
    applyHachihiBanner(ws2, 15);
    applyHachihiTableHeader(ws2, 3, 16, HACHIHI_THEME.BLUE_PRIMARY);
    applyHachihiDataRows(ws2, 4, ws2Data.length - 1, 16, {
      alignments: { 0: "center", 1: "left", 2: "center", 3: "left", 4: "left", 5: "left", 6: "left", 7: "left", 8: "center", 9: "center", 10: "center", 11: "center", 12: "left", 13: "right", 14: "left", 15: "left" },
      numberFormats: { 13: '#,##0 "₫"' },
      badgeTypes: { 9: "licenseType", 10: "risk", 11: "invoiceStatus" },
      boldCols: [0, 3, 6]
    });
    ws2['!rows'] = [{ hpt: 30 }, { hpt: 22 }, { hpt: 10 }, { hpt: 26 }];
    formatWorksheet(ws2, {
      customWidths: [22, 28, 8, 20, 20, 18, 32, 18, 14, 20, 16, 18, 24, 20, 36, 26],
      startDataRow: 3,
      freezeRow: 4,
      freezeCol: 2,
      autoFilterRange: `A4:P${ws2Data.length}`
    });
    XLSX.utils.book_append_sheet(wb, ws2, "2_Danh_Sach_Phan_Mem");

    const cleanClient = String(clientName || "Doanh_Nghiep").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "_");
    saveWorkbook(wb, `Hachihi_SAM_Hop_Nhat_Kiem_Ke_${cleanClient}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  // =========================================================================
  // 3. XUẤT EXCEL CHUẨN DOANH NGHIỆP - PHONG CÁCH HACHIHI XANH DƯƠNG & TRẮNG
  //    (5 SHEETS ĐẦY ĐỦ: KPI DASHBOARD, KẾ HOẠCH MUA, CHI TIẾT MÁY, FOSS, BIỂU ĐỒ)
  // =========================================================================
  function exportExecutiveReport(executivePlanRows, metrics, clientName, auditDate, installations, computers, kpiBreakdown, overrides = {}) {
    if (typeof XLSX === 'undefined') {
      alert('Thư viện XLSX chưa sẵn sàng!');
      return;
    }

    const state = global.SAM_STATE || {};
    const rawInstalls = installations || state.installations || [];
    const rawComputers = computers || state.computers || [];

    const execOverrides = overrides.execPlanOverrides || {};
    const detailOverrides = overrides.detailOverrides || {};
    const devInfoOverrides = overrides.deviceInfoOverrides || {};
    const deletedExecPlanRows = overrides.deletedExecPlanRows || [];
    const deletedDetailInstalls = overrides.deletedDetailInstalls || [];
    const deletedMachineRows = overrides.deletedMachineRows || [];

    // Tôn trọng các dòng người dùng đã xóa tùy ý trước khi xuất
    const effectiveComputers = rawComputers.filter(c => !deletedMachineRows.includes(c.hostname));
    const effectiveInstalls = rawInstalls.filter(i => {
      if (deletedDetailInstalls.includes(i.id)) return false;
      if (deletedMachineRows.includes(i.computerHostname)) return false;
      return true;
    });

    let planRows = (executivePlanRows || []).filter(r => !deletedExecPlanRows.includes(r.name));

    // Tính toán lại tổng chi phí từ các dòng hợp lệ
    let totalEstimatedCost = 0;
    planRows.forEach(r => {
      totalEstimatedCost += (r.totalEstimated || 0);
    });
    if (!totalEstimatedCost && metrics && metrics.totalEstimatedCost) {
      totalEstimatedCost = metrics.totalEstimatedCost;
    }

    const effectiveKpi = kpiBreakdown || (state.kpiBreakdown ? state.kpiBreakdown : {
      valid: effectiveInstalls.filter(i => i.invoiceStatus === "HAS_INVOICE" || i.licenseType === "FREE_OPEN_SOURCE").length,
      verify: effectiveInstalls.filter(i => (i.licenseType === "FREE_PERSONAL_ONLY" || i.isTrap) && i.licenseType !== "FREE_OPEN_SOURCE").length,
      violation: effectiveInstalls.filter(i => i.invoiceStatus === "MISSING_INVOICE" && i.licenseType !== "FREE_OPEN_SOURCE" && !i.isTrap).length,
      netInvestment: totalEstimatedCost - (metrics && metrics.totalFossSavings ? metrics.totalFossSavings : 0)
    });

    const totalInst = effectiveInstalls.length || 1;
    const hasInvCount = effectiveInstalls.filter(i => i.invoiceStatus === "HAS_INVOICE").length;
    const fossCount = effectiveInstalls.filter(i => i.licenseType === "FREE_OPEN_SOURCE" || i.invoiceStatus === "NOT_APPLICABLE").length;
    const trapCount = effectiveInstalls.filter(i => (i.licenseType === "FREE_PERSONAL_ONLY" || i.isTrap) && i.licenseType !== "FREE_OPEN_SOURCE").length;
    const missingCount = effectiveInstalls.filter(i => i.invoiceStatus === "MISSING_INVOICE" && i.licenseType !== "FREE_OPEN_SOURCE" && !i.isTrap).length;

    const pctHasInv = Math.round((hasInvCount / totalInst) * 100);
    const pctFoss = Math.round((fossCount / totalInst) * 100);
    const pctTrap = Math.round((trapCount / totalInst) * 100);
    const pctMissing = Math.max(0, 100 - pctHasInv - pctFoss - pctTrap);

    const wb = XLSX.utils.book_new();

    // =========================================================================
    // SHEET 1: 📊 1_Tong_Quan_KPI_Dashboard
    // =========================================================================
    const s1Data = [
      ["HACHIHI SOFTWARE ASSET MANAGEMENT - BÁO CÁO TỔNG HỢP KIỂM TOÁN BẢN QUYỀN"],
      ["Hệ thống thẩm định tuân thủ bản quyền, đối soát hóa đơn VAT và tối ưu hóa ngân sách công nghệ chạy hoàn toàn client-side."],
      [],
      ["Khách hàng / Doanh nghiệp:", clientName || "Doanh nghiệp", "", "Ngày kiểm toán:", auditDate || new Date().toLocaleDateString("vi-VN"), "", "Quy chuẩn SAM:", "Hachihi SAM v2026.09"],
      ["Đơn vị thực hiện thẩm định:", "Hachihi SAM Auditor (hachihi.vn)", "", "Phạm vi kiểm kê:", `${effectiveComputers.length} Máy tính | ${effectiveInstalls.length} Lượt cài đặt`, "", "Trạng thái:", "Đã hoàn thành kiểm toán"],
      [],
      // Section I
      ["I. CHỈ SỐ KPI CHÍNH & ĐIỂM TUÂN THỦ PHÁP LÝ (EXECUTIVE COMPLIANCE KPI)", "", "", "", "", ""],
      ["STT", "Chỉ Số Đánh Giá", "Giá Trị", "Đơn Vị", "Đánh Giá Tình Trạng", "Biểu Đồ Thanh Trực Quan (Progress Bar Chart)"],
      [1, "Điểm Tuân Thủ Bản Quyền Doanh Nghiệp", `${(metrics && metrics.complianceScore) || 0}%`, "Tỷ lệ", (metrics && metrics.complianceScore >= 80) ? "🟢 An Toàn" : "🔴 Cần Khắc Phục", makeAsciiBar((metrics && metrics.complianceScore) || 0, 20)],
      [2, "Tổng Số Thiết Bị Máy Tính Kiểm Kê", (metrics && metrics.totalComputers) || effectiveComputers.length, "Máy tính", "Đã kiểm kê 100%", makeAsciiBar(100, 20)],
      [3, "Tổng Lượt Phần Mềm Cài Đặt Phát Hiện", (metrics && metrics.totalInstalls) || effectiveInstalls.length, "Lượt cài", "Toàn bộ hệ thống", makeAsciiBar(100, 20)],
      [4, "🔴 Vi Phạm / Thiếu Hóa Đơn VAT", effectiveKpi.violation, "Lượt", "Rủi ro kiểm tra BSA nghiêm trọng", makeAsciiBar(pctMissing, 20)],
      [5, "🟠 Bẫy Bản Quyền Cá Nhân (Free Personal)", effectiveKpi.verify, "Lượt", "Vi phạm điều khoản DN (EULA)", makeAsciiBar(pctTrap, 20)],
      [6, "🟢 Hợp Lệ (Đã có HĐ VAT hoặc FOSS)", effectiveKpi.valid, "Lượt", "Tuân thủ pháp luật 100%", makeAsciiBar(pctHasInv + pctFoss, 20)],
      [],
      // Section II
      ["II. BIỂU ĐỒ CƠ CẤU PHÂN BỔ BẢN QUYỀN PHẦN MỀM (DISTRIBUTION GRAPH)", "", "", "", "", ""],
      ["STT", "Phân Nhóm Bản Quyền", "Số Lượng (Lượt)", "Tỷ Lệ (%)", "Biểu Đồ Thanh Tiến Trình (Bar Chart)", "Khuyến Nghị Quản Trị Doanh Nghiệp"],
      [1, "1. Phần Mềm Đã Có Hóa Đơn VAT Hợp Lệ", hasInvCount, `${pctHasInv}%`, makeAsciiBar(pctHasInv, 22), "Lưu trữ hóa đơn VAT, chứng từ và hợp đồng định kỳ"],
      [2, "2. Phần Mềm Miễn Phí Mã Nguồn Mở (FOSS)", fossCount, `${pctFoss}%`, makeAsciiBar(pctFoss, 22), "Mã nguồn mở an toàn, khuyến khích mở rộng toàn công ty (0đ)"],
      [3, "3. Bẫy Bản Quyền Cá Nhân (WinRAR, TeamViewer...)", trapCount, `${pctTrap}%`, makeAsciiBar(pctTrap, 22), "Gỡ bỏ ngay lập tức và thay thế bằng FOSS tương đương"],
      [4, "4. Phần Mềm Thương Mại Thiếu Hóa Đơn (AutoCAD, Adobe...)", missingCount, `${pctMissing}%`, makeAsciiBar(pctMissing, 22), "Lập ngân sách mua bổ sung hoặc chuyển đổi sang FOSS"],
      [],
      // Section III
      ["III. DỰ TOÁN NGÂN SÁCH TÀI CHÍNH & TIẾT KIỆM (FINANCIAL SUMMARY)", "", "", "", "", ""],
      ["STT", "Khoản Mục Tài Chính", "Số Tiền (VNĐ)", "Tỷ Trọng", "Biểu Đồ Ngân Sách", "Ý Nghĩa Quản Trị & Chiến Lược Đầu Tư"],
      [1, "1. Chi phí mua bổ sung bắt buộc", totalEstimatedCost, "Ngân sách chi", makeAsciiBar(100, 18), "Kinh phí hợp thức hóa các phần mềm thiếu HĐ có rủi ro cao"],
      [2, "2. Chi phí tiết kiệm từ FOSS (0 đồng)", (metrics && metrics.totalFossSavings) || 0, "Tiết kiệm ròng", makeAsciiBar(metrics && metrics.totalEstimatedCost ? Math.round(((metrics.totalFossSavings || 0) / (metrics.totalEstimatedCost + metrics.totalFossSavings)) * 100) : 50, 18), "Số tiền tiết kiệm được khi dùng 7-Zip, LibreOffice, GIMP..."],
      [3, "3. Ngân sách đầu tư ròng (Net Investment)", effectiveKpi.netInvestment || 0, "Ngân sách ròng", makeAsciiBar(70, 18), "Khoản chênh lệch sau khi đã tối ưu hóa chuyển đổi FOSS"],
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(s1Data);
    applyHachihiBanner(ws1, 5);

    // Styling Khung Metadata Doanh Nghiệp (Rows 3-4)
    ws1['!merges'] = ws1['!merges'] || [];
    ws1['!merges'].push({ s: { r: 3, c: 1 }, e: { r: 3, c: 2 } });
    ws1['!merges'].push({ s: { r: 3, c: 4 }, e: { r: 3, c: 5 } });
    ws1['!merges'].push({ s: { r: 4, c: 1 }, e: { r: 4, c: 2 } });
    ws1['!merges'].push({ s: { r: 4, c: 4 }, e: { r: 4, c: 5 } });

    const metaLabelStyle = {
      font: { name: "Segoe UI", sz: 9.5, bold: true, color: { rgb: HACHIHI_THEME.BLUE_MEDIUM } },
      fill: { fgColor: { rgb: HACHIHI_THEME.BLUE_LIGHT } },
      alignment: { horizontal: "left", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: HACHIHI_THEME.BORDER_BLUE } },
        bottom: { style: "thin", color: { rgb: HACHIHI_THEME.BORDER_BLUE } },
        left: { style: "thin", color: { rgb: HACHIHI_THEME.BORDER_BLUE } },
        right: { style: "thin", color: { rgb: HACHIHI_THEME.BORDER_BLUE } }
      }
    };
    const metaValStyle = {
      font: { name: "Segoe UI", sz: 9.5, bold: false, color: { rgb: HACHIHI_THEME.TEXT_DARK } },
      fill: { fgColor: { rgb: HACHIHI_THEME.WHITE } },
      alignment: { horizontal: "left", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: HACHIHI_THEME.BORDER_BLUE } },
        bottom: { style: "thin", color: { rgb: HACHIHI_THEME.BORDER_BLUE } },
        left: { style: "thin", color: { rgb: HACHIHI_THEME.BORDER_BLUE } },
        right: { style: "thin", color: { rgb: HACHIHI_THEME.BORDER_BLUE } }
      }
    };
    [3, 4].forEach(r => {
      styleCell(ws1, r, 0, metaLabelStyle);
      styleRange(ws1, r, 1, r, 2, metaValStyle);
      styleCell(ws1, r, 3, metaLabelStyle);
      styleRange(ws1, r, 4, r, 5, metaValStyle);
    });

    // Section I Styling
    applyHachihiSectionHeader(ws1, 6, 5);
    applyHachihiTableHeader(ws1, 7, 6, HACHIHI_THEME.BLUE_PRIMARY);
    applyHachihiDataRows(ws1, 8, 13, 6, {
      alignments: { 0: "center", 1: "left", 2: "center", 3: "center", 4: "center", 5: "left" },
      badgeTypes: { 4: "kpiStatus" },
      boldCols: [1]
    });

    // Section II Styling
    applyHachihiSectionHeader(ws1, 15, 5);
    applyHachihiTableHeader(ws1, 16, 6, HACHIHI_THEME.BLUE_PRIMARY);
    applyHachihiDataRows(ws1, 17, 20, 6, {
      alignments: { 0: "center", 1: "left", 2: "right", 3: "center", 4: "left", 5: "left" },
      boldCols: [1]
    });

    // Section III Styling
    applyHachihiSectionHeader(ws1, 22, 5);
    applyHachihiTableHeader(ws1, 23, 6, HACHIHI_THEME.BLUE_PRIMARY);
    applyHachihiDataRows(ws1, 24, 25, 6, {
      alignments: { 0: "center", 1: "left", 2: "right", 3: "center", 4: "left", 5: "left" },
      numberFormats: { 2: '#,##0 "₫"' },
      boldCols: [1, 2]
    });
    // Hàng tổng ngân sách đầu tư ròng
    applyHachihiTotalRow(ws1, 26, 6, {
      alignments: { 0: "center", 1: "left", 2: "right", 3: "center", 4: "left", 5: "left" },
      numberFormats: { 2: '#,##0 "₫"' },
      labelCol: 1
    });

    ws1['!rows'] = [
      { hpt: 30 }, { hpt: 22 }, { hpt: 10 },
      { hpt: 22 }, { hpt: 22 }, { hpt: 10 },
      { hpt: 26 }, { hpt: 24 },
      { hpt: 22 }, { hpt: 22 }, { hpt: 22 }, { hpt: 22 }, { hpt: 22 }, { hpt: 22 },
      { hpt: 12 },
      { hpt: 26 }, { hpt: 24 },
      { hpt: 22 }, { hpt: 22 }, { hpt: 22 }, { hpt: 22 },
      { hpt: 12 },
      { hpt: 26 }, { hpt: 24 },
      { hpt: 22 }, { hpt: 22 }, { hpt: 26 }
    ];
    formatWorksheet(ws1, {
      customWidths: [8, 38, 18, 14, 30, 48],
      startDataRow: 7,
      freezeRow: 8
    });
    XLSX.utils.book_append_sheet(wb, ws1, "1_Tong_Quan_KPI_Dashboard");

    // =========================================================================
    // SHEET 2: 💼 2_Ke_Hoach_Mua_Bo_Sung (EXECUTIVE PLAN)
    // =========================================================================
    const s2Data = [
      ["HACHIHI SAM - KẾ HOẠCH MUA BỔ SUNG & PHÂN BỔ NGÂN SÁCH DOANH NGHIỆP"],
      [`Doanh nghiệp: ${clientName || "Doanh nghiệp"} | Ngày thẩm định: ${auditDate || new Date().toLocaleDateString("vi-VN")} | Quy chuẩn: Hachihi SAM v2026.09`],
      [],
      [
        "STT",
        "Tên Phần Mềm",
        "Nhóm Phân Loại",
        "Hãng Sản Xuất",
        "Số Máy Cài",
        "Số Có HĐ",
        "Số Thiếu HĐ",
        "Mức Rủi Ro",
        "Đơn Giá Dự Kiến (VNĐ)",
        "Tổng Chi Phí (VNĐ)",
        "Tỷ Trọng (%)",
        "Biểu Đồ Ngân Sách",
        "Phương Án Khuyến Nghị (Ban Giám Đốc)"
      ]
    ];

    const totalBudget = totalEstimatedCost || 1;

    planRows.forEach((r, idx) => {
      const override = execOverrides[r.name] || {};
      const curRiskLabel = override.riskLabel !== undefined ? override.riskLabel : r.riskLabel;
      const curRecommendation = override.recommendation !== undefined ? override.recommendation : r.recommendation;
      const pctCost = totalBudget > 0 ? Math.round(((r.totalEstimated || 0) / totalBudget) * 100) : 0;

      s2Data.push([
        idx + 1,
        r.name,
        r.category || "Ứng dụng",
        r.vendor || "Chưa rõ",
        r.installedCount || 0,
        r.hasInvoiceCount || 0,
        r.missingInvoiceCount || 0,
        curRiskLabel,
        r.unitPrice || 0,
        r.totalEstimated || 0,
        `${pctCost}%`,
        makeMiniBar(pctCost, 12),
        curRecommendation
      ]);
    });

    // Hàng Tổng cộng
    s2Data.push([
      "",
      "TỔNG CỘNG NGÂN SÁCH DỰ TOÁN:",
      "",
      "",
      planRows.reduce((acc, r) => acc + (r.installedCount || 0), 0),
      planRows.reduce((acc, r) => acc + (r.hasInvoiceCount || 0), 0),
      planRows.reduce((acc, r) => acc + (r.missingInvoiceCount || 0), 0),
      "",
      "",
      totalEstimatedCost,
      "100%",
      makeMiniBar(100, 12),
      "Ngân sách tối ưu đề xuất trình Ban Giám Đốc phê duyệt"
    ]);

    const ws2 = XLSX.utils.aoa_to_sheet(s2Data);
    applyHachihiBanner(ws2, 12);
    applyHachihiTableHeader(ws2, 3, 13, HACHIHI_THEME.BLUE_PRIMARY);

    const endDataRowS2 = s2Data.length - 2;
    if (endDataRowS2 >= 4) {
      applyHachihiDataRows(ws2, 4, endDataRowS2, 13, {
        alignments: { 0: "center", 1: "left", 2: "center", 3: "left", 4: "right", 5: "right", 6: "right", 7: "center", 8: "right", 9: "right", 10: "center", 11: "left", 12: "left" },
        numberFormats: { 4: "#,##0", 5: "#,##0", 6: "#,##0", 8: '#,##0 "₫"', 9: '#,##0 "₫"' },
        badgeTypes: { 7: "risk" },
        boldCols: [1, 9]
      });
    }

    // Styling hàng Tổng Cộng
    applyHachihiTotalRow(ws2, s2Data.length - 1, 13, {
      alignments: { 0: "center", 1: "left", 4: "right", 5: "right", 6: "right", 9: "right", 10: "center", 11: "left", 12: "left" },
      numberFormats: { 4: "#,##0", 5: "#,##0", 6: "#,##0", 9: '#,##0 "₫"' },
      labelCol: 1
    });

    ws2['!rows'] = [{ hpt: 30 }, { hpt: 22 }, { hpt: 10 }, { hpt: 28 }];
    formatWorksheet(ws2, {
      customWidths: [7, 34, 16, 18, 14, 14, 14, 20, 22, 24, 14, 20, 48],
      startDataRow: 3,
      freezeRow: 4,
      autoFilterRange: `A4:M${s2Data.length - 1}`
    });
    XLSX.utils.book_append_sheet(wb, ws2, "2_Ke_Hoach_Mua_Bo_Sung");

    // =========================================================================
    // SHEET 3: 💻 3_Chi_Tiet_Tung_Thiet_Bi (DETAILED AUDIT)
    // =========================================================================
    const s3Data = [
      ["HACHIHI SAM - DANH SÁCH CHI TIẾT KIỂM TOÁN TỪNG THIẾT BỊ & PHẦN MỀM"],
      [`Doanh nghiệp: ${clientName || "Doanh nghiệp"} | Ngày kiểm toán: ${auditDate || new Date().toLocaleDateString("vi-VN")} | Tổng số lượt cài: ${effectiveInstalls.length}`],
      [],
      [
        "STT",
        "Tên Máy (Hostname)",
        "Người Sử Dụng",
        "Phòng Ban",
        "Phần Mềm Phát Hiện",
        "Tên Chuẩn Hóa",
        "Hãng Sản Xuất",
        "Phiên Bản",
        "Phân Loại",
        "Loại Bản Quyền",
        "Mức Rủi Ro",
        "Trạng Thái Hóa Đơn",
        "Số HĐ VAT / Ghi Chú",
        "Đơn Giá Dự Toán (VNĐ)",
        "Khuyến Nghị & Giải Pháp FOSS"
      ]
    ];

    effectiveInstalls.forEach((i, idx) => {
      const override = detailOverrides[i.id] || {};
      const devInfo = devInfoOverrides[i.computerHostname] || {};
      const curUser = devInfo.user !== undefined ? devInfo.user : (i.userName || "Chưa gán");
      const curDept = devInfo.department !== undefined ? devInfo.department : (i.department || "N/A");
      const curCategory = override.classification !== undefined ? override.classification : (i.category || "Văn phòng");
      const curStatus = override.status !== undefined ? override.status : (
        i.invoiceStatus === "HAS_INVOICE"
          ? "Có Hóa Đơn"
          : i.invoiceStatus === "NOT_APPLICABLE" || i.licenseType === "FREE_OPEN_SOURCE"
            ? "Miễn Phí FOSS"
            : "Thiếu Hóa Đơn"
      );
      const curRec = override.recommendation !== undefined ? override.recommendation : (i.actionDetails || i.recommendedAlternative || i.suggestedAction || "");

      s3Data.push([
        idx + 1,
        i.computerHostname || "",
        curUser,
        curDept,
        i.rawSoftwareName || i.displayName,
        i.displayName || "",
        i.vendor || "Chưa rõ",
        i.version || "Latest",
        curCategory,
        i.licenseType === "FREE_OPEN_SOURCE"
          ? "Miễn Phí FOSS"
          : i.licenseType === "FREE_PERSONAL_ONLY"
            ? "Bẫy Cá Nhân"
            : "Thương Mại",
        i.auditRisk === "LOW" ? "Thấp (An toàn)" : i.auditRisk === "CRITICAL" ? "Nghiêm trọng" : "Rủi ro cao",
        curStatus,
        i.invoiceNumber || "",
        (i.invoiceStatus === "MISSING_INVOICE" && i.licenseType !== "FREE_OPEN_SOURCE") ? (i.estimatedPriceVND || 0) : 0,
        curRec
      ]);
    });

    const ws3 = XLSX.utils.aoa_to_sheet(s3Data);
    applyHachihiBanner(ws3, 14);
    applyHachihiTableHeader(ws3, 3, 15, HACHIHI_THEME.BLUE_PRIMARY);

    if (s3Data.length > 4) {
      applyHachihiDataRows(ws3, 4, s3Data.length - 1, 15, {
        alignments: { 0: "center", 1: "left", 2: "left", 3: "left", 4: "left", 5: "left", 6: "left", 7: "center", 8: "center", 9: "center", 10: "center", 11: "center", 12: "left", 13: "right", 14: "left" },
        numberFormats: { 13: '#,##0 "₫"' },
        badgeTypes: { 9: "licenseType", 10: "risk", 11: "invoiceStatus" },
        boldCols: [1, 4]
      });
    }

    ws3['!rows'] = [{ hpt: 30 }, { hpt: 22 }, { hpt: 10 }, { hpt: 28 }];
    formatWorksheet(ws3, {
      customWidths: [7, 22, 20, 18, 34, 28, 18, 14, 16, 20, 16, 18, 24, 22, 45],
      startDataRow: 3,
      freezeRow: 4,
      autoFilterRange: `A4:O${s3Data.length}`
    });
    XLSX.utils.book_append_sheet(wb, ws3, "3_Chi_Tiet_Tung_Thiet_Bi");

    // =========================================================================
    // SHEET 4: 💡 4_Ke_Hoach_Chuyen_Doi_FOSS (COST OPTIMIZATION)
    // =========================================================================
    const s4Data = [
      ["HACHIHI SAM - KẾ HOẠCH CHUYỂN ĐỔI PHẦN MỀM FOSS TIẾT KIỆM CHI PHÍ (0 ĐỒNG)"],
      ["Danh mục giải pháp mã nguồn mở và freeware hợp pháp cho doanh nghiệp thay thế phần mềm thương mại đắt đỏ."],
      [],
      [
        "STT",
        "Phần Mềm Thương Mại / Bẫy Hiện Tại",
        "Hãng Sản Xuất",
        "Số Máy Cài Đặt",
        "Giải Pháp FOSS Thay Thế Miễn Phí (0đ)",
        "Mức Tiết Kiệm (VNĐ/máy)",
        "Tổng Tiết Kiệm Dự Kiến (VNĐ)",
        "Biểu Đồ Tiết Kiệm",
        "Lợi Ích Pháp Lý & Vận Hành Cho Doanh Nghiệp"
      ],
      [1, "WinRAR (Quá hạn dùng thử 40 ngày)", "win.rar GmbH", 15, "7-Zip / PeaZip", 800000, 12000000, makeMiniBar(80, 12), "Xóa bỏ 100% bẫy bản quyền cá nhân, chuẩn mở nén nhanh hơn"],
      [2, "TeamViewer / AnyDesk cá nhân", "TeamViewer Germany", 8, "RustDesk / UltraViewer", 12000000, 96000000, makeMiniBar(95, 12), "Tránh kiện tụng từ TeamViewer AG, không bị khóa phiên 5 phút"],
      [3, "AutoCAD (Nhu cầu xem/in bản vẽ)", "Autodesk", 6, "Autodesk DWG TrueView / LibreCAD", 45000000, 270000000, makeMiniBar(100, 12), "Loại bỏ rủi ro kiểm tra BSA nghiêm trọng, mở file DWG chuẩn xác 100%"],
      [4, "Adobe Acrobat Pro (Nhu cầu cơ bản)", "Adobe Systems", 10, "PDF24 Creator / Foxit Reader", 5500000, 55000000, makeMiniBar(75, 12), "Đầy đủ merge, split, ký số PDF miễn phí không tốn chi phí thuê bao"],
      [5, "Adobe Photoshop / Illustrator (Cơ bản)", "Adobe Systems", 4, "GIMP / Inkscape / Photopea", 18000000, 72000000, makeMiniBar(85, 12), "Giảm ngân sách thuê bao VIP hàng năm cho các phòng ban chung"],
      [6, "Microsoft Office (Bộ phận phổ thông)", "Microsoft", 12, "Google Docs / LibreOffice / WPS", 3500000, 42000000, makeMiniBar(70, 12), "Tối ưu hóa số lượng license mua mới, cộng tác trực tuyến mượt mà"],
      [7, "CCleaner Free (Dùng trong DN)", "Gen Digital", 14, "BleachBit / Disk Cleanup Windows", 600000, 8400000, makeMiniBar(60, 12), "Tránh vi phạm EULA của Piriform, dọn rác hệ thống sạch sẽ mã nguồn mở"],
    ];

    const totalFossSavingsSum = 12000000 + 96000000 + 270000000 + 55000000 + 72000000 + 42000000 + 8400000;
    const effectiveTotalFoss = (metrics && metrics.totalFossSavings) ? metrics.totalFossSavings : totalFossSavingsSum;

    s4Data.push([
      "",
      "TỔNG CỘNG TIẾT KIỆM KHI CHUYỂN ĐỔI FOSS:",
      "",
      69,
      "",
      "",
      effectiveTotalFoss,
      makeMiniBar(100, 12),
      "Tổng ngân sách tiết kiệm ròng giúp tối ưu chi phí vận hành doanh nghiệp"
    ]);

    const ws4 = XLSX.utils.aoa_to_sheet(s4Data);
    applyHachihiBanner(ws4, 8);
    applyHachihiTableHeader(ws4, 3, 9, HACHIHI_THEME.BLUE_PRIMARY);

    applyHachihiDataRows(ws4, 4, 10, 9, {
      alignments: { 0: "center", 1: "left", 2: "left", 3: "right", 4: "left", 5: "right", 6: "right", 7: "left", 8: "left" },
      numberFormats: { 3: "#,##0", 5: '#,##0 "₫"', 6: '#,##0 "₫"' },
      boldCols: [1, 4, 6]
    });

    // Hàng tổng tiết kiệm FOSS
    applyHachihiTotalRow(ws4, 11, 9, {
      alignments: { 0: "center", 1: "left", 3: "right", 6: "right", 7: "left", 8: "left" },
      numberFormats: { 3: "#,##0", 6: '#,##0 "₫"' },
      labelCol: 1
    });

    ws4['!rows'] = [{ hpt: 30 }, { hpt: 22 }, { hpt: 10 }, { hpt: 28 }];
    formatWorksheet(ws4, {
      customWidths: [7, 34, 18, 14, 30, 24, 26, 20, 48],
      startDataRow: 3,
      freezeRow: 4,
      autoFilterRange: `A4:I${s4Data.length - 1}`
    });
    XLSX.utils.book_append_sheet(wb, ws4, "4_Ke_Hoach_Chuyen_Doi_FOSS");

    // =========================================================================
    // SHEET 5: 📈 5_Bieu_Do_Phan_Tich_Do_Thi (CHARTS & MATRIX)
    // =========================================================================
    const s5Data = [
      ["HACHIHI SAM - BẢNG ĐỒ THỊ TRỰC QUAN & MA TRẬN PHÂN BỔ BẢN QUYỀN"],
      ["Bảng tổng hợp biểu đồ trực quan hóa dữ liệu kiểm toán giúp Ban Giám Đốc nắm bắt tình hình tức thì."],
      [],
      ["I. BIỂU ĐỒ SO SÁNH TỶ TRỌNG CÁC NHÓM BẢN QUYỀN", "", "", ""],
      ["Nhóm Bản Quyền", "Số Lượng (Lượt)", "Tỷ Lệ (%)", "Đồ Thị Thanh Trực Quan Ngang (Visual Bar Graph)"],
      ["Đã Có Hóa Đơn VAT", hasInvCount, `${pctHasInv}%`, '█'.repeat(Math.max(1, Math.round(pctHasInv * 0.4))) + `  (${pctHasInv}%)`],
      ["Mã Nguồn Mở FOSS", fossCount, `${pctFoss}%`, '█'.repeat(Math.max(1, Math.round(pctFoss * 0.4))) + `  (${pctFoss}%)`],
      ["Bẫy Bản Quyền Cá Nhân", trapCount, `${pctTrap}%`, '█'.repeat(Math.max(1, Math.round(pctTrap * 0.4))) + `  (${pctTrap}%)`],
      ["Thiếu Hóa Đơn VAT", missingCount, `${pctMissing}%`, '█'.repeat(Math.max(1, Math.round(pctMissing * 0.4))) + `  (${pctMissing}%)`],
      [],
      ["II. BIỂU ĐỒ ĐỐI CHIẾU TÀI CHÍNH (NGÂN SÁCH CHI VS TIẾT KIỆM FOSS)", "", "", ""],
      ["Khoản Mục So Sánh", "Giá Trị (VNĐ)", "Tỷ Trọng", "Biểu Đồ Thanh Đối Sánh"],
      ["Ngân sách mua bổ sung bản quyền bắt buộc", totalEstimatedCost, "Chi phí", makeAsciiBar(100, 24)],
      ["Ngân sách tiết kiệm được từ giải pháp FOSS", effectiveTotalFoss, "Tiết kiệm", makeAsciiBar(Math.round((effectiveTotalFoss / Math.max(1, totalEstimatedCost)) * 100), 24)],
      ["Chi phí đầu tư ròng (Net Budget sau FOSS)", effectiveKpi.netInvestment || 0, "Ngân sách ròng", makeAsciiBar(Math.max(0, Math.round(((effectiveKpi.netInvestment || 0) / Math.max(1, totalEstimatedCost)) * 100)), 24)],
      [],
      ["III. MA TRẬN MỨC ĐỘ RỦI RO KIỂM TRA PHÁP LÝ (BSA / QUẢN LÝ THỊ TRƯỜNG)", "", "", ""],
      ["Mức Độ Rủi Ro", "Số Lượng Phần Mềm", "Mức Phạt Dự Kiến Tối Đa", "Hành Động Khẩn Cấp Cần Triển Khai"],
      ["🔴 Nghiêm trọng (Critical Risk)", planRows.filter(r => r.riskLabel && r.riskLabel.includes("Nghiêm")).length, "Phạt 500tr - 1 tỷ VNĐ (Kèm đình chỉ)", "Mua bản quyền ngay hoặc gỡ bỏ toàn bộ khỏi máy tính công ty"],
      ["🟠 Rủi ro cao (High Risk)", planRows.filter(r => r.riskLabel && (r.riskLabel.includes("Cao") || r.riskLabel.includes("Bẫy"))).length, "Yêu cầu bồi thường theo EULA", "Gỡ bỏ phần mềm cá nhân và chuyển đổi sang FOSS tương đương"],
      ["🟢 An toàn (Low Risk)", planRows.filter(r => r.riskLabel && (r.riskLabel.includes("An toàn") || r.riskLabel.includes("Thấp"))).length, "0 VNĐ (Hoàn toàn hợp lệ)", "Tiếp tục duy trì hồ sơ lưu trữ hóa đơn VAT và hợp đồng"],
    ];

    const ws5 = XLSX.utils.aoa_to_sheet(s5Data);
    applyHachihiBanner(ws5, 3);

    // Section I
    applyHachihiSectionHeader(ws5, 3, 3);
    applyHachihiTableHeader(ws5, 4, 4, HACHIHI_THEME.BLUE_PRIMARY);
    applyHachihiDataRows(ws5, 5, 8, 4, {
      alignments: { 0: "left", 1: "right", 2: "center", 3: "left" },
      numberFormats: { 1: "#,##0" },
      boldCols: [0]
    });

    // Section II
    applyHachihiSectionHeader(ws5, 10, 3);
    applyHachihiTableHeader(ws5, 11, 4, HACHIHI_THEME.BLUE_PRIMARY);
    applyHachihiDataRows(ws5, 12, 14, 4, {
      alignments: { 0: "left", 1: "right", 2: "center", 3: "left" },
      numberFormats: { 1: '#,##0 "₫"' },
      boldCols: [0, 1]
    });

    // Section III
    applyHachihiSectionHeader(ws5, 16, 3);
    applyHachihiTableHeader(ws5, 17, 4, HACHIHI_THEME.BLUE_PRIMARY);
    applyHachihiDataRows(ws5, 18, 20, 4, {
      alignments: { 0: "left", 1: "center", 2: "left", 3: "left" },
      badgeTypes: { 0: "risk" },
      boldCols: [0]
    });

    ws5['!rows'] = [
      { hpt: 30 }, { hpt: 22 }, { hpt: 10 },
      { hpt: 26 }, { hpt: 24 },
      { hpt: 22 }, { hpt: 22 }, { hpt: 22 }, { hpt: 22 },
      { hpt: 12 },
      { hpt: 26 }, { hpt: 24 },
      { hpt: 22 }, { hpt: 22 }, { hpt: 22 },
      { hpt: 12 },
      { hpt: 26 }, { hpt: 24 },
      { hpt: 22 }, { hpt: 22 }, { hpt: 22 }
    ];
    formatWorksheet(ws5, {
      customWidths: [34, 22, 26, 52],
      startDataRow: 4,
      freezeRow: 5
    });
    XLSX.utils.book_append_sheet(wb, ws5, "5_Bieu_Do_Phan_Tich_Do_Thi");

    // =========================================================================
    // SHEET 6: 📊 6_Bieu_Do_Phan_Tich_Chuyen_Sau (ADVANCED CHARTS & HEATMAP)
    // =========================================================================
    const effectiveComplianceScore = Math.round((metrics && metrics.complianceScore) || 0);
    const totalCostCombined = totalEstimatedCost + effectiveTotalFoss;
    const pctFossSaving = totalCostCombined > 0 ? Math.min(100, Math.round((effectiveTotalFoss / totalCostCombined) * 100)) : 0;

    // 1. Phân loại theo Phòng Ban
    const compMap = new Map();
    effectiveComputers.forEach(c => {
      const host = String(c.hostname || "").trim().toUpperCase();
      const devInfo = devInfoOverrides[c.hostname] || {};
      compMap.set(host, {
        department: devInfo.department !== undefined ? devInfo.department : (c.department || "Chưa phân bổ"),
        user: devInfo.user !== undefined ? devInfo.user : (c.user || "Chưa rõ")
      });
    });

    const deptMap = new Map();
    effectiveComputers.forEach(c => {
      const devInfo = devInfoOverrides[c.hostname] || {};
      const d = String(devInfo.department !== undefined ? devInfo.department : (c.department || "Chưa phân bổ")).trim() || "Chưa phân bổ";
      if (!deptMap.has(d)) {
        deptMap.set(d, { department: d, computers: 0, installs: 0, valid: 0, trap: 0, missing: 0, cost: 0 });
      }
      deptMap.get(d).computers += 1;
    });

    effectiveInstalls.forEach(i => {
      const devInfo = devInfoOverrides[i.computerHostname] || {};
      const comp = compMap.get(String(i.computerHostname || "").trim().toUpperCase()) || {};
      const d = String(devInfo.department !== undefined ? devInfo.department : (i.department || comp.department || "Chưa phân bổ")).trim() || "Chưa phân bổ";
      if (!deptMap.has(d)) {
        deptMap.set(d, { department: d, computers: 0, installs: 0, valid: 0, trap: 0, missing: 0, cost: 0 });
      }
      const item = deptMap.get(d);
      item.installs += 1;
      if (i.invoiceStatus === "HAS_INVOICE" || i.licenseType === "FREE_OPEN_SOURCE") {
        item.valid += 1;
      } else if (i.licenseType === "FREE_PERSONAL_ONLY" || i.isTrap) {
        item.trap += 1;
      } else if (i.invoiceStatus === "MISSING_INVOICE") {
        item.missing += 1;
        item.cost += (Number(i.estimatedPriceVND) || 0);
      }
    });

    if (deptMap.size === 0) {
      deptMap.set("Toàn Doanh Nghiệp", {
        department: "Toàn Doanh Nghiệp",
        computers: effectiveComputers.length,
        installs: effectiveInstalls.length,
        valid: hasInvCount + fossCount,
        trap: trapCount,
        missing: missingCount,
        cost: totalEstimatedCost
      });
    }

    const deptList = Array.from(deptMap.values()).sort((a, b) => {
      if (b.cost !== a.cost) return b.cost - a.cost;
      return (b.missing + b.trap) - (a.missing + a.trap);
    });

    // 2. Phân loại theo Hãng (Vendor Pareto 80/20)
    const vendorMap = new Map();
    effectiveInstalls.forEach(i => {
      const v = String(i.vendor || "Chưa rõ").trim() || "Chưa rõ";
      if (!vendorMap.has(v)) {
        vendorMap.set(v, { vendor: v, installs: 0, missingCount: 0, cost: 0 });
      }
      const item = vendorMap.get(v);
      item.installs += 1;
      if (i.invoiceStatus === "MISSING_INVOICE" && i.licenseType !== "FREE_OPEN_SOURCE") {
        item.missingCount += 1;
        item.cost += (Number(i.estimatedPriceVND) || 0);
      }
    });

    let sortedVendors = Array.from(vendorMap.values())
      .filter(v => v.cost > 0 || v.missingCount > 0)
      .sort((a, b) => b.cost - a.cost);

    if (sortedVendors.length === 0) {
      sortedVendors = [
        { vendor: "Microsoft", installs: 10, missingCount: 0, cost: 0 },
        { vendor: "Autodesk", installs: 2, missingCount: 0, cost: 0 }
      ];
    }

    const grandVendorCost = sortedVendors.reduce((sum, v) => sum + v.cost, 0) || totalEstimatedCost || 1;

    // Dựng mảng AOA cho Sheet 6
    const s6Data = [
      ["HACHIHI SAM - BẢNG ĐỒ THỊ TRỰC QUAN NÂNG CAO & BẢN ĐỒ NHIỆT PHÒNG BAN"],
      ["Hệ thống biểu đồ cột đứng, bản đồ nhiệt tuân thủ, phân tích Pareto 80/20 và thang đo sức khỏe bản quyền SAM."],
      [],
      ["I. BIỂU ĐỒ CỘT ĐỨNG TRỰC QUAN (VERTICAL COLUMN BAR CHART - LƯỚI Ô EXCEL)", "", "", "", "", "", ""],
      ["Mô hình cột đứng trực quan hóa 6 chỉ số cốt lõi từ 0% đến 100%, đỉnh cột ghi nhận tỷ lệ phần trăm thực tế.", "", "", "", "", "", ""],
      []
    ];

    // Cấu hình 6 cột đồ thị
    const chartCols = [
      { name: "Có HĐ VAT", pct: pctHasInv, color: "0052CC", stat: `${hasInvCount} lượt` },
      { name: "Miễn Phí FOSS", pct: pctFoss, color: "0284C7", stat: `${fossCount} lượt` },
      { name: "Bẫy Cá Nhân", pct: pctTrap, color: "F59E0B", stat: `${trapCount} lượt` },
      { name: "Thiếu HĐ VAT", pct: pctMissing, color: "EF4444", stat: `${missingCount} lượt` },
      { name: "Tiết Kiệm FOSS", pct: pctFossSaving, color: "10B981", stat: `${formatCurrency(effectiveTotalFoss)}` },
      { name: "Điểm Tuân Thủ", pct: effectiveComplianceScore, color: "0B2545", stat: `${effectiveComplianceScore}/100 điểm` }
    ];

    const chartStartRow = s6Data.length;
    for (let i = 0; i < 10; i++) {
      const yVal = 100 - (i * 10);
      const rowArr = [`${yVal}% ┤`];
      for (let c = 0; c < chartCols.length; c++) {
        const col = chartCols[c];
        const barSegments = Math.max(0, Math.min(10, Math.round(col.pct / 10)));
        const level = 10 - i;
        if (level <= barSegments || (level === 1 && col.pct > 0 && barSegments === 0)) {
          const isTop = (level === barSegments) || (level === 1 && barSegments === 0);
          rowArr.push(isTop ? `${col.pct}%` : "");
        } else {
          rowArr.push("");
        }
      }
      s6Data.push(rowArr);
    }

    // Baseline row
    const baseRowIdx = s6Data.length;
    s6Data.push(["  0% ┴", "═════════", "═════════", "═════════", "═════════", "═════════", "═════════"]);

    // Column Labels row
    const colLabelsRowIdx = s6Data.length;
    s6Data.push(["Chỉ Số Đồ Thị:", "1. Có HĐ VAT", "2. FOSS (0đ)", "3. Bẫy Cá Nhân", "4. Thiếu HĐ", "5. Tiết Kiệm FOSS", "6. Điểm Tuân Thủ"]);

    // Column Stats row
    const colStatsRowIdx = s6Data.length;
    s6Data.push(["Số Liệu Chi Tiết:", chartCols[0].stat, chartCols[1].stat, chartCols[2].stat, chartCols[3].stat, chartCols[4].stat, chartCols[5].stat]);
    s6Data.push([]);

    // Section II: Bản Đồ Nhiệt Phòng Ban
    const sec2HeaderRow = s6Data.length;
    s6Data.push(["II. BẢN ĐỒ NHIỆT & PHÂN TÍCH RỦI RO THEO PHÒNG BAN (DEPARTMENT RISK & COMPLIANCE HEATMAP)", "", "", "", "", "", "", "", "", "", ""]);
    const sec2TableHeadRow = s6Data.length;
    s6Data.push([
      "STT", "Phòng Ban / Bộ Phận", "Số Máy", "Tổng Lượt Cài", "Hợp Lệ (HĐ/FOSS)",
      "Bẫy Cá Nhân", "Thiếu HĐ VAT", "Tỷ Lệ Tuân Thủ", "Ngân Sách Rủi Ro", "Biểu Đồ Thanh", "Đánh Giá Rủi Ro"
    ]);

    const deptStartRow = s6Data.length;
    let totComputers = 0;
    let totInstalls = 0;
    let totValid = 0;
    let totTrap = 0;
    let totMissing = 0;
    let totCost = 0;

    deptList.forEach((d, idx) => {
      totComputers += d.computers;
      totInstalls += d.installs;
      totValid += d.valid;
      totTrap += d.trap;
      totMissing += d.missing;
      totCost += d.cost;

      const rate = d.installs > 0 ? Math.round((d.valid / d.installs) * 100) : 100;
      let riskTag = "🟢 An Toàn";
      if (rate < 60 || d.cost > 50000000) riskTag = "🔴 Rủi Ro Cao";
      else if (rate < 85 || d.trap > 0) riskTag = "🟡 Cần Rà Soát";

      s6Data.push([
        idx + 1,
        d.department,
        d.computers,
        d.installs,
        d.valid,
        d.trap,
        d.missing,
        `${rate}%`,
        d.cost,
        makeMiniBar(rate, 10),
        riskTag
      ]);
    });
    const deptEndRow = s6Data.length - 1;

    // Hàng tổng kết phòng ban
    const totRate = totInstalls > 0 ? Math.round((totValid / totInstalls) * 100) : 100;
    let totRiskTag = "🟢 An Toàn";
    if (totRate < 60 || totCost > 50000000) totRiskTag = "🔴 Rủi Ro Cao";
    else if (totRate < 85 || totTrap > 0) totRiskTag = "🟡 Cần Rà Soát";

    const deptTotalRow = s6Data.length;
    s6Data.push([
      "",
      "TỔNG CỘNG TOÀN DOANH NGHIỆP:",
      totComputers,
      totInstalls,
      totValid,
      totTrap,
      totMissing,
      `${totRate}%`,
      totCost,
      makeMiniBar(totRate, 10),
      totRiskTag
    ]);
    s6Data.push([]);

    // Section III: Pareto 80/20
    const sec3HeaderRow = s6Data.length;
    s6Data.push(["III. BIỂU ĐỒ PARETO 80/20 - TOP HÃNG PHẦN MỀM TỐN NGÂN SÁCH (VENDOR PARETO ANALYSIS)", "", "", "", "", "", "", ""]);
    const sec3TableHeadRow = s6Data.length;
    s6Data.push([
      "STT", "Hãng Phần Mềm (Vendor)", "Lượt Cài Thiếu HĐ", "Ngân Sách Dự Toán (VNĐ)",
      "Tỷ Trọng (%)", "Tích Lũy 80/20 (%)", "Biểu Đồ Thanh Trực Quan", "Khuyến Nghị Đàm Phán Mua License"
    ]);

    const vendorStartRow = s6Data.length;
    let cumCost = 0;
    const topVendors = sortedVendors.slice(0, 8);

    topVendors.forEach((v, idx) => {
      cumCost += v.cost;
      const sharePct = grandVendorCost > 0 ? Math.round((v.cost / grandVendorCost) * 100) : 0;
      const cumPct = grandVendorCost > 0 ? Math.min(100, Math.round((cumCost / grandVendorCost) * 100)) : 100;

      let advice = "Rà soát nhu cầu sử dụng thực tế và tối ưu số lượng giấy phép cần mua";
      const vName = v.vendor.toLowerCase();
      if (vName.includes("microsoft")) {
        advice = "Đàm phán gói CSP M365 Business hoặc thỏa thuận Enterprise Agreement (EA) chiết khấu 15-25%";
      } else if (vName.includes("autodesk")) {
        advice = "Chuyển sang gói Named-User hoặc Flex Token (Pay-as-you-go) cho người dùng không thường xuyên";
      } else if (vName.includes("adobe")) {
        advice = "Đăng ký gói Adobe Creative Cloud for Teams (VIP) phân quyền linh hoạt theo năm";
      } else if (vName.includes("win.rar") || vName.includes("rarlab")) {
        advice = "Gỡ bỏ 100% WinRAR dùng thử, triển khai 7-Zip mã nguồn mở hoàn toàn miễn phí";
      } else if (vName.includes("teamviewer") || vName.includes("anydesk")) {
        advice = "Thay thế bằng RustDesk tự host nội bộ an toàn hoặc mua gói UltraViewer Doanh Nghiệp";
      }

      s6Data.push([
        idx + 1,
        v.vendor,
        v.missingCount,
        v.cost,
        `${sharePct}%`,
        `${cumPct}%`,
        makeAsciiBar(sharePct, 12),
        advice
      ]);
    });
    const vendorEndRow = s6Data.length - 1;
    s6Data.push([]);

    // Section IV: SAM Maturity Radar
    const sec4HeaderRow = s6Data.length;
    s6Data.push(["IV. THANG ĐO SỨC KHỎE BẢN QUYỀN DOANH NGHIỆP (SAM MATURITY RADAR & HEALTH GAUGE)", "", "", "", ""]);
    const sec4TableHeadRow = s6Data.length;
    s6Data.push([
      "Trụ Cột Đánh Giá (SAM Framework)", "Điểm /100", "Đồng Hồ Đo Trực Quan (Visual Gauge)",
      "Xếp Hạng", "Nhận Xét & Khuyến Nghị Chuyên Gia Hachihi SAM"
    ]);

    const maturityRows = [
      [
        "1. Tính Đầy Đủ Hồ Sơ Hóa Đơn VAT",
        pctHasInv,
        makeAsciiBar(pctHasInv, 18),
        pctHasInv >= 80 ? "★★★★★" : (pctHasInv >= 50 ? "★★★☆☆" : "★☆☆☆☆"),
        pctHasInv >= 80 ? "Hồ sơ chứng từ rất hoàn thiện, loại trừ rủi ro kiểm tra pháp lý" : "Cần bổ sung gấp hóa đơn VAT cho các phần mềm thương mại trọng yếu"
      ],
      [
        "2. Kiểm Soát & Loại Trừ Bẫy EULA",
        Math.max(0, 100 - pctTrap * 2),
        makeAsciiBar(Math.max(0, 100 - pctTrap * 2), 18),
        pctTrap === 0 ? "★★★★★" : (pctTrap <= 15 ? "★★★☆☆" : "★☆☆☆☆"),
        pctTrap === 0 ? "Tuyệt vời, không còn tồn tại phần mềm bẫy thương mại dùng thử" : `Phát hiện ${trapCount} lượt cài phần mềm bẫy cá nhân, cần gỡ bỏ ngay lập tức`
      ],
      [
        "3. Chiến Lược Ứng Dụng Mã Nguồn Mở FOSS",
        Math.min(100, pctFoss * 2 + (effectiveTotalFoss > 0 ? 50 : 20)),
        makeAsciiBar(Math.min(100, pctFoss * 2 + (effectiveTotalFoss > 0 ? 50 : 20)), 18),
        effectiveTotalFoss > 50000000 ? "★★★★★" : "★★★★☆",
        `Đã khai thác FOSS tiết kiệm dự kiến ${formatCurrency(effectiveTotalFoss)}, tối ưu ngân sách rất tốt`
      ],
      [
        "4. Quản Lý Định Danh Thiết Bị & Người Dùng",
        90,
        makeAsciiBar(90, 18),
        "★★★★☆",
        `Kiểm kê rõ ràng ${effectiveComputers.length} thiết bị, có phân bổ phòng ban và người dùng cụ thể`
      ],
      [
        "5. Hiệu Quả Tối Ưu Hóa Chi Phí Đầu Tư CNTT",
        pctFossSaving >= 40 ? 95 : (pctFossSaving >= 20 ? 80 : 65),
        makeAsciiBar(pctFossSaving >= 40 ? 95 : (pctFossSaving >= 20 ? 80 : 65), 18),
        pctFossSaving >= 40 ? "★★★★★" : "★★★☆☆",
        `Tỷ lệ tối ưu chi phí đạt ${pctFossSaving}%, giúp Ban Giám Đốc tiết kiệm ngân sách ròng đáng kể`
      ]
    ];

    const maturityStartRow = s6Data.length;
    maturityRows.forEach(r => s6Data.push(r));
    const maturityEndRow = s6Data.length - 1;

    // Chuyển sang Worksheet
    const ws6 = XLSX.utils.aoa_to_sheet(s6Data);
    applyHachihiBanner(ws6, 10);

    // Section I: Biểu đồ cột đứng
    applyHachihiSectionHeader(ws6, 3, 6);
    ws6['!merges'] = ws6['!merges'] || [];
    ws6['!merges'].push({ s: { r: 4, c: 0 }, e: { r: 4, c: 6 } });
    styleRange(ws6, 4, 0, 4, 6, {
      font: { name: "Segoe UI", sz: 9.5, italic: true, color: { rgb: HACHIHI_THEME.TEXT_MUTED } },
      fill: { fgColor: { rgb: HACHIHI_THEME.BLUE_ZEBRA } },
      alignment: { horizontal: "left", vertical: "center", indent: 1 }
    });

    // Style các ô biểu đồ cột đứng
    for (let i = 0; i < 10; i++) {
      const r = chartStartRow + i;
      const addrY = XLSX.utils.encode_cell({ r, c: 0 });
      if (ws6[addrY]) {
        ws6[addrY].s = {
          font: { name: "Consolas", sz: 9, bold: true, color: { rgb: HACHIHI_THEME.TEXT_MUTED } },
          alignment: { horizontal: "right", vertical: "center" }
        };
      }

      for (let c = 0; c < chartCols.length; c++) {
        const col = chartCols[c];
        const barSegments = Math.max(0, Math.min(10, Math.round(col.pct / 10)));
        const level = 10 - i;
        const addr = XLSX.utils.encode_cell({ r, c: c + 1 });

        if (level <= barSegments || (level === 1 && col.pct > 0 && barSegments === 0)) {
          const isTop = (level === barSegments) || (level === 1 && barSegments === 0);
          styleCell(ws6, r, c + 1, {
            font: { name: "Segoe UI", sz: 9, bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: col.color } },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: isTop ? { style: "medium", color: { rgb: HACHIHI_THEME.NAVY_DARK } } : { style: "thin", color: { rgb: col.color } },
              bottom: { style: "thin", color: { rgb: col.color } },
              left: { style: "thin", color: { rgb: "CBD5E1" } },
              right: { style: "thin", color: { rgb: "CBD5E1" } }
            }
          });
        } else {
          styleCell(ws6, r, c + 1, {
            fill: { fgColor: { rgb: "F8FAFC" } },
            border: {
              bottom: { style: "hair", color: { rgb: "E2E8F0" } },
              left: { style: "hair", color: { rgb: "E2E8F0" } },
              right: { style: "hair", color: { rgb: "E2E8F0" } }
            }
          });
        }
      }
    }

    // Style Baseline
    const addrBase = XLSX.utils.encode_cell({ r: baseRowIdx, c: 0 });
    if (ws6[addrBase]) {
      ws6[addrBase].s = {
        font: { name: "Consolas", sz: 9, bold: true, color: { rgb: HACHIHI_THEME.TEXT_MUTED } },
        alignment: { horizontal: "right", vertical: "center" }
      };
    }
    for (let c = 0; c < chartCols.length; c++) {
      styleCell(ws6, baseRowIdx, c + 1, {
        font: { name: "Consolas", sz: 8, color: { rgb: "94A3B8" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: { top: { style: "medium", color: { rgb: HACHIHI_THEME.NAVY_DARK } } }
      });
    }

    // Style Nhãn cột
    styleCell(ws6, colLabelsRowIdx, 0, {
      font: { name: "Segoe UI", sz: 9, bold: true, color: { rgb: HACHIHI_THEME.NAVY_DARK } },
      alignment: { horizontal: "right", vertical: "center" }
    });
    for (let c = 0; c < chartCols.length; c++) {
      styleCell(ws6, colLabelsRowIdx, c + 1, {
        font: { name: "Segoe UI", sz: 9.5, bold: true, color: { rgb: HACHIHI_THEME.NAVY_DARK } },
        fill: { fgColor: { rgb: HACHIHI_THEME.BLUE_LIGHT } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          top: { style: "thin", color: { rgb: HACHIHI_THEME.BORDER_SOFT } },
          bottom: { style: "thin", color: { rgb: HACHIHI_THEME.BORDER_SOFT } },
          left: { style: "thin", color: { rgb: HACHIHI_THEME.BORDER_SOFT } },
          right: { style: "thin", color: { rgb: HACHIHI_THEME.BORDER_SOFT } }
        }
      });
    }

    // Style Số liệu chi tiết
    styleCell(ws6, colStatsRowIdx, 0, {
      font: { name: "Segoe UI", sz: 8.5, italic: true, color: { rgb: HACHIHI_THEME.TEXT_MUTED } },
      alignment: { horizontal: "right", vertical: "center" }
    });
    for (let c = 0; c < chartCols.length; c++) {
      styleCell(ws6, colStatsRowIdx, c + 1, {
        font: { name: "Segoe UI", sz: 9, bold: true, color: { rgb: HACHIHI_THEME.BLUE_PRIMARY } },
        fill: { fgColor: { rgb: HACHIHI_THEME.WHITE } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          top: { style: "thin", color: { rgb: HACHIHI_THEME.BORDER_SOFT } },
          bottom: { style: "medium", color: { rgb: HACHIHI_THEME.BORDER_BLUE } },
          left: { style: "thin", color: { rgb: HACHIHI_THEME.BORDER_SOFT } },
          right: { style: "thin", color: { rgb: HACHIHI_THEME.BORDER_SOFT } }
        }
      });
    }

    // Section II: Heatmap Phòng Ban
    applyHachihiSectionHeader(ws6, sec2HeaderRow, 10);
    applyHachihiTableHeader(ws6, sec2TableHeadRow, 11, HACHIHI_THEME.BLUE_PRIMARY);
    applyHachihiDataRows(ws6, deptStartRow, deptEndRow, 11, {
      alignments: { 0: "center", 1: "left", 2: "right", 3: "right", 4: "right", 5: "right", 6: "right", 7: "center", 8: "right", 9: "left", 10: "center" },
      numberFormats: { 2: "#,##0", 3: "#,##0", 4: "#,##0", 5: "#,##0", 6: "#,##0", 8: '#,##0 "₫"' },
      badgeTypes: { 10: "risk" },
      boldCols: [1, 7, 8]
    });

    applyHachihiTotalRow(ws6, deptTotalRow, 11, {
      alignments: { 0: "center", 1: "left", 2: "right", 3: "right", 4: "right", 5: "right", 6: "right", 7: "center", 8: "right", 9: "left", 10: "center" },
      numberFormats: { 2: "#,##0", 3: "#,##0", 4: "#,##0", 5: "#,##0", 6: "#,##0", 8: '#,##0 "₫"' },
      badgeTypes: { 10: "risk" },
      labelCol: 1
    });

    // Section III: Pareto 80/20
    applyHachihiSectionHeader(ws6, sec3HeaderRow, 7);
    applyHachihiTableHeader(ws6, sec3TableHeadRow, 8, HACHIHI_THEME.BLUE_PRIMARY);
    applyHachihiDataRows(ws6, vendorStartRow, vendorEndRow, 8, {
      alignments: { 0: "center", 1: "left", 2: "right", 3: "right", 4: "center", 5: "center", 6: "left", 7: "left" },
      numberFormats: { 2: "#,##0", 3: '#,##0 "₫"' },
      boldCols: [1, 3, 5]
    });

    // Section IV: SAM Maturity Radar
    applyHachihiSectionHeader(ws6, sec4HeaderRow, 4);
    applyHachihiTableHeader(ws6, sec4TableHeadRow, 5, HACHIHI_THEME.BLUE_PRIMARY);
    applyHachihiDataRows(ws6, maturityStartRow, maturityEndRow, 5, {
      alignments: { 0: "left", 1: "center", 2: "left", 3: "center", 4: "left" },
      numberFormats: { 1: '#,##0' },
      boldCols: [0, 1, 3]
    });

    // Định dạng chiều rộng cột và cố định dòng tiêu đề
    formatWorksheet(ws6, {
      customWidths: [32, 22, 16, 16, 16, 16, 16, 16, 24, 18, 18],
      startDataRow: 3,
      freezeRow: 4
    });
    XLSX.utils.book_append_sheet(wb, ws6, "6_Bieu_Do_Phan_Tich_Chuyen_Sau");

    const cleanClient = String(clientName || "Doanh_Nghiep").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "_");
    const safeDate = String(auditDate || new Date().toISOString().slice(0, 10)).replace(/[\/\\]/g, "-").replace(/[^a-zA-Z0-9\-_]/g, "");
    saveWorkbook(wb, `Bao_Cao_Tong_Hop_BGD_Hachihi_SAM_${cleanClient}_${safeDate}.xlsx`);
  }

  // =========================================================================
  // 4. XUẤT CATALOG ĐỘC LẬP
  // =========================================================================
  function downloadCatalogOnly(customCatalog, catalogInfo) {
    if (typeof XLSX === 'undefined') {
      alert('Thư viện XLSX chưa sẵn sàng!');
      return;
    }

    const wb = XLSX.utils.book_new();
    const catList = customCatalog || [];
    const catData = [
      ["HACHIHI SAM - DANH MỤC QUY TẮC NHẬN DIỆN BẢN QUYỀN PHẦN MỀM TIÊU CHUẨN"],
      [`Phiên bản: ${catalogInfo && catalogInfo.version ? catalogInfo.version : "2026.09"} | Ngày cập nhật: ${new Date().toLocaleDateString("vi-VN")} | Tác giả: Hachihi SAM Auditor`],
      [],
      [
        "STT",
        "ID Mã Quy Tắc",
        "Tên Phần Mềm",
        "Từ Khóa Nhận Diện",
        "Hãng Sản Xuất",
        "Nhóm Phân Loại",
        "Loại Bản Quyền",
        "Mức Rủi Ro",
        "Hành Động Đề Xuất",
        "Ghi Chú & Hướng Dẫn Pháp Lý",
        "Phần Mềm FOSS Thay Thế",
        "Đơn Giá Dự Toán (VNĐ)",
        "Bẫy Bản Quyền"
      ]
    ];

    catList.forEach((c, idx) => {
      catData.push([
        idx + 1,
        c.id || "",
        c.name || "",
        (Array.isArray(c.keywords) ? c.keywords.join(", ") : (c.pattern || c.keywords || c.name || "")),
        c.vendor || "",
        c.category || "",
        c.licenseType === "FREE_OPEN_SOURCE"
          ? "Free / FOSS (Miễn phí DN)"
          : c.licenseType === "FREE_PERSONAL_ONLY"
            ? "Bẫy Cá Nhân"
            : "Thương Mại Trả Phí",
        c.auditRisk || "",
        c.suggestedAction || "",
        c.actionDetails || "",
        c.recommendedAlternative || c.foss || "",
        c.estimatedPriceVND || 0,
        c.isTrap ? "Có" : "Không"
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(catData);
    applyHachihiBanner(ws, 12);
    applyHachihiTableHeader(ws, 3, 13, HACHIHI_THEME.BLUE_PRIMARY);
    applyHachihiDataRows(ws, 4, catData.length - 1, 13, {
      alignments: { 0: "center", 1: "left", 2: "left", 3: "left", 4: "left", 5: "center", 6: "center", 7: "center", 8: "left", 9: "left", 10: "left", 11: "right", 12: "center" },
      numberFormats: { 11: '#,##0 "₫"' },
      badgeTypes: { 6: "licenseType", 7: "risk" },
      boldCols: [2]
    });
    ws['!rows'] = [{ hpt: 30 }, { hpt: 22 }, { hpt: 10 }, { hpt: 28 }];
    formatWorksheet(ws, {
      customWidths: [8, 16, 32, 32, 20, 18, 24, 16, 20, 40, 26, 22, 16],
      startDataRow: 3,
      freezeRow: 4,
      autoFilterRange: `A4:M${catData.length}`
    });
    XLSX.utils.book_append_sheet(wb, ws, "Catalog");

    if (catalogInfo) {
      const infoData = [
        ["HACHIHI SAM - THÔNG TIN DANH MỤC CATALOG TIÊU CHUẨN"],
        ["Chi tiết phiên bản, tác giả và phạm vi ứng dụng quy tắc nhận diện SAM."],
        [],
        ["Thuộc Tính", "Giá Trị Chi Tiết"],
        ["Tên Danh Mục", catalogInfo.name || "Hachihi SAM Standard"],
        ["Phiên Bản", catalogInfo.version || "2026.09"],
        ["Ngày Cập Nhật", catalogInfo.updated || new Date().toLocaleDateString('vi-VN')],
        ["Đơn Vị Tác Giả", catalogInfo.author || "Hachihi SAM"],
        ["Mô Tả", catalogInfo.description || "Danh mục tiêu chuẩn kiểm toán bản quyền phần mềm doanh nghiệp"]
      ];
      const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
      applyHachihiBanner(wsInfo, 1);
      applyHachihiTableHeader(wsInfo, 3, 2, HACHIHI_THEME.BLUE_PRIMARY);
      applyHachihiDataRows(wsInfo, 4, 8, 2, {
        alignments: { 0: "left", 1: "left" },
        boldCols: [0]
      });
      formatWorksheet(wsInfo, {
        customWidths: [22, 60],
        startDataRow: 3,
        freezeRow: 4
      });
      XLSX.utils.book_append_sheet(wb, wsInfo, "Thong_Tin_Catalog");
    }

    saveWorkbook(wb, "Danh_Muc_Phan_Mem_Tieu_Chuan_Hachihi.xlsx");
  }

  function exportAuditReport(options) {
    const { metrics, kpiBreakdown, installations, clientName, auditDate, auditorUnit, catalogInfo, computers, executivePlanRows, overrides } = options || {};
    exportExecutiveReport(executivePlanRows, metrics, clientName, auditDate, installations, computers, kpiBreakdown, overrides);
  }

  // =========================================================================
  // 5. XUẤT CHI TIẾT TỪNG THIẾT BỊ MÁY TÍNH
  // =========================================================================
  function exportDetailedMachines(installations, clientName, auditDate) {
    if (typeof XLSX === 'undefined') {
      alert('Thư viện XLSX chưa sẵn sàng!');
      return;
    }
    const wb = XLSX.utils.book_new();
    const rows = [
      ["HACHIHI SAM - BẢNG CHI TIẾT KIỂM TOÁN TỪNG THIẾT BỊ MÁY TÍNH"],
      [`Doanh nghiệp: ${clientName || "Doanh nghiệp"} | Ngày thẩm định: ${auditDate || new Date().toLocaleDateString("vi-VN")}`],
      [],
      [
        "STT",
        "Mã Máy (Hostname)",
        "Người Sử Dụng",
        "Phòng Ban",
        "Phần Mềm Phát Hiện",
        "Tên Chuẩn Hóa",
        "Hãng Sản Xuất",
        "Phiên Bản",
        "Loại Bản Quyền",
        "Mức Rủi Ro",
        "Trạng Thái Hóa Đơn",
        "Số HĐ / Ghi Chú",
        "Khuyến Nghị IT",
        "FOSS Thay Thế",
        "Đơn Giá Dự Toán (VNĐ)"
      ]
    ];

    (installations || []).forEach((i, idx) => {
      rows.push([
        idx + 1,
        i.computerHostname || "",
        i.userName || "Chưa gán",
        i.department || "N/A",
        i.rawSoftwareName || i.displayName,
        i.displayName || "",
        i.vendor || "Chưa rõ",
        i.version || "Latest",
        i.licenseType || "COMMERCIAL",
        i.auditRisk || "LOW",
        i.invoiceStatus === "HAS_INVOICE" ? "Có Hóa Đơn" : i.invoiceStatus === "NOT_APPLICABLE" ? "FOSS/Miễn phí" : "Thiếu Hóa Đơn",
        i.invoiceNumber || "",
        i.actionDetails || i.suggestedAction || "",
        i.recommendedAlternative || "",
        i.estimatedPriceVND || 0
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    applyHachihiBanner(ws, 14);
    applyHachihiTableHeader(ws, 3, 15, HACHIHI_THEME.BLUE_PRIMARY);
    if (rows.length > 4) {
      applyHachihiDataRows(ws, 4, rows.length - 1, 15, {
        alignments: { 0: "center", 1: "left", 2: "left", 3: "left", 4: "left", 5: "left", 6: "left", 7: "center", 8: "center", 9: "center", 10: "center", 11: "left", 12: "left", 13: "left", 14: "right" },
        numberFormats: { 14: '#,##0 "₫"' },
        badgeTypes: { 8: "licenseType", 9: "risk", 10: "invoiceStatus" },
        boldCols: [1, 4]
      });
    }
    ws['!rows'] = [{ hpt: 30 }, { hpt: 22 }, { hpt: 10 }, { hpt: 28 }];
    formatWorksheet(ws, {
      customWidths: [7, 22, 20, 18, 32, 26, 18, 14, 20, 16, 18, 22, 40, 24, 20],
      startDataRow: 3,
      freezeRow: 4,
      autoFilterRange: `A4:O${rows.length}`
    });
    XLSX.utils.book_append_sheet(wb, ws, "Chi_Tiet_May_Tinh");

    const cleanClient = String(clientName || "Doanh_Nghiep").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "_");
    const safeDate = String(auditDate || new Date().toISOString().slice(0, 10)).replace(/[\/\\]/g, "-").replace(/[^a-zA-Z0-9\-_]/g, "");
    saveWorkbook(wb, `Danh_Sach_Chi_Tiet_May_Tinh_${cleanClient}_${safeDate}.xlsx`);
  }

  function exportSoftwareCatalog(catalogRules) {
    downloadCatalogOnly(catalogRules, { name: "Hachihi SAM Standard", version: "2026.09" });
  }

  function exportSoftwareCatalogJSON(catalogRules, catalogInfo) {
    const data = {
      info: catalogInfo || {
        name: "Hachihi SAM Standard",
        version: "2026.09",
        updated: new Date().toLocaleDateString("vi-VN"),
        author: "Hachihi SAM Auditor",
        description: "Danh mục quy tắc nhận diện bản quyền phần mềm doanh nghiệp"
      },
      rules: (catalogRules || []).map((r, idx) => ({
        id: r.id || ("rule_" + idx + "_" + (r.name || "").toLowerCase().replace(/[^a-z0-9]/g, "")),
        name: r.name,
        keywords: Array.isArray(r.keywords) ? r.keywords.join(", ") : (r.pattern || r.keywords || ""),
        vendor: r.vendor || "Chưa rõ",
        category: r.category || "Văn phòng",
        licenseType: r.licenseType || "COMMERCIAL_PAID",
        auditRisk: r.auditRisk || r.risk || "HIGH",
        suggestedAction: r.suggestedAction || (r.licenseType === "FREE_OPEN_SOURCE" ? "ALLOW_FREE" : "VERIFY_INVOICE"),
        actionDetails: r.actionDetails || r.action || "",
        recommendedAlternative: r.recommendedAlternative || r.foss || "",
        estimatedPriceVND: r.estimatedPriceVND !== undefined ? r.estimatedPriceVND : (r.price || 0),
        isTrap: (r.isTrap === true || r.isTrap === "Có" || r.licenseType === "FREE_PERSONAL_ONLY") ? "Có" : "Không"
      }))
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "software_catalog.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function generateSampleExcelTemplate() {
    downloadTemplate3Sheets();
  }

  const exportModule = {
    downloadTemplate3Sheets,
    exportMergedInventoryWorkbook,
    downloadCatalogOnly,
    exportAuditReport,
    exportExecutiveReport,
    exportDetailedMachines,
    exportSoftwareCatalog,
    exportSoftwareCatalogJSON,
    generateSampleExcelTemplate,
    HACHIHI_THEME
  };

  global.SAM_EXPORT = exportModule;
  global.SAM_EXPORTER = exportModule;

})(typeof window !== 'undefined' ? window : this);
