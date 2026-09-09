// js/export.js - Specialized Excel Exporter (Reports, Templates, Catalog)
(function (global) {
  'use strict';

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

  // Helper: Format cell numbers, currencies, freeze panes, autofilter, and widths
  function formatWorksheet(ws, options = {}) {
    if (!ws || !ws['!ref']) return;
    const {
      minColWidth = 14,
      maxColWidth = 55,
      startDataRow = 0,
      customWidths = null,
      freezeRow = 0,
      freezeCol = 0,
      autoFilterRange = null
    } = options;

    const range = XLSX.utils.decode_range(ws['!ref']);
    const colWidths = [];

    for (let C = range.s.c; C <= range.e.c; ++C) {
      let maxLen = minColWidth;
      for (let R = range.s.r; R <= range.e.r; ++R) {
        if (startDataRow > 0 && R < startDataRow) continue;
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[cellAddress];
        if (cell && cell.v !== undefined && cell.v !== null) {
          const str = String(cell.v);
          if (str.length > maxLen) {
            maxLen = str.length;
          }
          // Number and currency format
          if (cell.t === 'n') {
            const headerAddress = XLSX.utils.encode_cell({ r: startDataRow > 0 ? startDataRow : 0, c: C });
            const headerCell = ws[headerAddress];
            const headerText = headerCell ? String(headerCell.v || '') : '';
            if (
              headerText.includes('VNĐ') ||
              headerText.includes('Chi Phí') ||
              headerText.includes('Đơn Giá') ||
              headerText.includes('Tiết Kiệm') ||
              headerText.includes('Ngân Sách') ||
              headerText.includes('Giá') ||
              headerText.includes('Số Tiền')
            ) {
              cell.z = '#,##0 "₫"';
            } else if (headerText.includes('Tỷ Lệ') || headerText.includes('Tỷ Trọng') || headerText.includes('%')) {
              cell.z = '0.0%';
            } else if (cell.v > 999 && !headerText.includes('Năm') && !headerText.includes('Version')) {
              cell.z = '#,##0';
            }
          }
        }
      }

      if (customWidths && customWidths[C] !== undefined) {
        colWidths[C] = { wch: customWidths[C] };
      } else {
        colWidths[C] = { wch: Math.min(Math.max(maxLen + 3, minColWidth), maxColWidth) };
      }
    }
    ws['!cols'] = colWidths;

    if (freezeRow > 0) {
      ws['!freeze'] = { xSplit: freezeCol, ySplit: freezeRow };
    }

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
    ws1['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
    ];
    ws1['!rows'] = [{ hpt: 26 }, { hpt: 20 }, { hpt: 10 }, { hpt: 24 }];
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
    ws2['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
    ];
    ws2['!rows'] = [{ hpt: 26 }, { hpt: 20 }, { hpt: 10 }, { hpt: 24 }];
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
        c.licenseType === "FREE_OPEN_SOURCE" ? 0 : (c.estimatedPriceVND || 0),
        c.recommendedAlternative || c.foss || "Chuẩn FOSS",
        c.actionDetails || ""
      ]);
    });

    const ws3 = XLSX.utils.aoa_to_sheet(ws3Data);
    ws3['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
    ];
    ws3['!rows'] = [{ hpt: 26 }, { hpt: 20 }, { hpt: 10 }, { hpt: 24 }];
    formatWorksheet(ws3, {
      customWidths: [8, 32, 32, 20, 18, 26, 18, 22, 26, 42],
      startDataRow: 3,
      freezeRow: 4,
      autoFilterRange: `A4:J${ws3Data.length}`
    });
    XLSX.utils.book_append_sheet(wb, ws3, "3_Danh_Muc_Catalog");

    XLSX.writeFile(wb, "Mau_Kiem_Toan_Ban_Quyen_Hachihi_SAM_Chuan.xlsx");
  }

  // =========================================================================
  // 1B. GỘP NHIỀU TẬP TIN KIỂM KÊ LÀM 1 VÀ XUẤT FILE EXCEL HỢP NHẤT
  // =========================================================================
  /**
   * Exports merged inventory into 1 single Excel file:
   * - Keeps titles & headers
   * - Sheet 1: Merged computers list (1_Danh_Sach_May_Tinh)
   * - Sheet 2: Merged software list (2_Danh_Sach_Phan_Mem) with FIRST 2 COLUMNS = Serial & Model
   * - Sheet 3: Standard catalog rules (3_Danh_Muc_Catalog)
   */
  function exportMergedInventoryWorkbook(computers, installations, catalogRules, clientName, loadedFiles) {
    if (typeof XLSX === 'undefined') {
      alert('Thư viện XLSX chưa sẵn sàng!');
      return;
    }

    const safeClient = clientName || "Hachihi.vn";
    const wb = XLSX.utils.book_new();

    // Map computers for fast lookup of serial & model
    const compMap = new Map();
    (computers || []).forEach((c) => {
      if (c && c.hostname) {
        compMap.set(String(c.hostname).trim().toUpperCase(), c);
      }
    });

    // -------------------------------------------------------------------------
    // SHEET 1: 1_Danh_Sach_May_Tinh (Gộp danh sách máy tính)
    // -------------------------------------------------------------------------
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
    ws1['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } },
    ];
    ws1['!rows'] = [{ hpt: 26 }, { hpt: 20 }, { hpt: 10 }, { hpt: 24 }];
    formatWorksheet(ws1, {
      customWidths: [8, 22, 22, 20, 26, 28, 24, 18, 28, 22, 22, 28],
      startDataRow: 3,
      freezeRow: 4,
      autoFilterRange: `A4:L${ws1Data.length}`
    });
    XLSX.utils.book_append_sheet(wb, ws1, "1_Danh_Sach_May_Tinh");

    // -------------------------------------------------------------------------
    // SHEET 2: 2_Danh_Sach_Phan_Mem (Gộp danh sách phần mềm, 2 cột đầu là SERIAL & MODEL)
    // -------------------------------------------------------------------------
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
        "Tình Trạng Hóa Đơn (Có / Chưa / FOSS)",
        "Số Hóa Đơn VAT / Hợp Đồng",
        "Ghi Chú Kiểm Toán",
        "Tập Tin Nguồn"
      ]
    ];

    (installations || []).forEach((inst, idx) => {
      const hostKey = String(inst.computerHostname || "").trim().toUpperCase();
      const comp = compMap.get(hostKey);

      const serialVal = inst.computerSerial || (comp && comp.serial && comp.serial !== 'N/A' ? comp.serial : "") || "N/A";
      const modelVal = inst.computerModel || (comp && comp.model && comp.model !== 'N/A' ? comp.model : "") || "N/A";
      const userVal = inst.userName || (comp && comp.user) || "";
      const deptVal = inst.department || (comp && comp.department) || "";
      const invoiceVal = inst.invoiceStatus === "HAS_INVOICE"
        ? "Có"
        : (inst.licenseType === "FREE_OPEN_SOURCE" || inst.licenseType === "FOSS")
          ? "FOSS"
          : "Chưa";

      ws2Data.push([
        serialVal,
        modelVal,
        idx + 1,
        inst.computerHostname || "",
        userVal,
        deptVal,
        inst.rawSoftwareName || inst.displayName || "",
        inst.vendor || "",
        inst.version || "",
        invoiceVal,
        inst.invoiceNumber || "",
        inst.actionDetails || inst.recommendedAlternative || "",
        inst.sourceFile || ""
      ]);
    });

    const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
    ws2['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } },
    ];
    ws2['!rows'] = [{ hpt: 26 }, { hpt: 20 }, { hpt: 10 }, { hpt: 24 }];
    formatWorksheet(ws2, {
      customWidths: [24, 28, 8, 22, 20, 18, 36, 20, 14, 22, 25, 36, 28],
      startDataRow: 3,
      freezeRow: 4,
      freezeCol: 2, // Khóa cố định 2 cột đầu (Serial & Model)
      autoFilterRange: `A4:M${ws2Data.length}`
    });
    XLSX.utils.book_append_sheet(wb, ws2, "2_Danh_Sach_Phan_Mem");

    // -------------------------------------------------------------------------
    // SHEET 3: 3_Danh_Muc_Catalog (Từ điển nhận diện để tái nạp tương thích 100%)
    // -------------------------------------------------------------------------
    const catList = catalogRules || (global.SAM_CONSTANTS && global.SAM_CONSTANTS.DEFAULT_SOFTWARE_RULES) || [];
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
      const kw = Array.isArray(c.keywords) ? c.keywords.join(", ") : (c.pattern || c.keywords || "");
      ws3Data.push([
        idx + 1,
        c.name || "",
        kw,
        c.vendor || "",
        c.category || "Ứng dụng chung",
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
        c.licenseType === "FREE_OPEN_SOURCE" ? 0 : (c.estimatedPriceVND || 0),
        c.recommendedAlternative || c.foss || "Chuẩn FOSS",
        c.actionDetails || ""
      ]);
    });

    const ws3 = XLSX.utils.aoa_to_sheet(ws3Data);
    ws3['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
    ];
    ws3['!rows'] = [{ hpt: 26 }, { hpt: 20 }, { hpt: 10 }, { hpt: 24 }];
    formatWorksheet(ws3, {
      customWidths: [8, 32, 32, 20, 18, 26, 18, 22, 26, 42],
      startDataRow: 3,
      freezeRow: 4,
      autoFilterRange: `A4:J${ws3Data.length}`
    });
    XLSX.utils.book_append_sheet(wb, ws3, "3_Danh_Muc_Catalog");

    const safeDate = new Date().toISOString().slice(0, 10);
    const fileName = `Hachihi_SAM_Hop_Nhat_${safeClient.replace(/[^a-zA-Z0-9_-]/g, '_')}_${safeDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  // =========================================================================
  // 2. XUẤT BÁO CÁO TỔNG HỢP KIỂM TOÁN CHUẨN ĐỊNH DẠNG EXCEL CÓ BIỂU ĐỒ TRỰC QUAN
  // =========================================================================
  function exportExecutiveReport(executivePlanRows, metrics, clientName, auditDate, installations, computers, kpiBreakdown, overrides = {}) {
    if (typeof XLSX === 'undefined') {
      alert('Thư viện XLSX chưa sẵn sàng!');
      return;
    }

    const state = global.SAM_STATE || {};
    const effectiveInstalls = installations || state.installations || [];
    const effectiveComputers = computers || state.computers || [];
    const effectiveKpi = kpiBreakdown || (state.kpiBreakdown ? state.kpiBreakdown : {
      valid: effectiveInstalls.filter(i => i.invoiceStatus === "HAS_INVOICE" || i.licenseType === "FREE_OPEN_SOURCE").length,
      verify: effectiveInstalls.filter(i => (i.licenseType === "FREE_PERSONAL_ONLY" || i.isTrap) && i.licenseType !== "FREE_OPEN_SOURCE").length,
      violation: effectiveInstalls.filter(i => i.invoiceStatus === "MISSING_INVOICE" && i.licenseType !== "FREE_OPEN_SOURCE" && !i.isTrap).length,
      netInvestment: (metrics && metrics.totalEstimatedCost ? metrics.totalEstimatedCost : 0) - (metrics && metrics.totalFossSavings ? metrics.totalFossSavings : 0)
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

    const execOverrides = overrides.execPlanOverrides || {};
    const detailOverrides = overrides.detailOverrides || {};
    const devSoftwareOverrides = overrides.deviceSoftwareOverrides || {};
    const devInfoOverrides = overrides.deviceInfoOverrides || {};

    const wb = XLSX.utils.book_new();

    // =========================================================================
    // SHEET 1: 📊 1_Tong_Quan_KPI_Dashboard (DASHBOARD & BIỂU ĐỒ TIẾN TRÌNH)
    // =========================================================================
    const s1Data = [
      ["HACHIHI SOFTWARE ASSET MANAGEMENT - BÁO CÁO TỔNG HỢP KIỂM TOÁN BẢN QUYỀN"],
      ["Hệ thống đánh giá tuân thủ bản quyền, đối soát hóa đơn VAT và tối ưu hóa chi phí FOSS chạy hoàn toàn client-side."],
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
      [1, "1. Chi phí mua bổ sung bắt buộc", (metrics && metrics.totalEstimatedCost) || 0, "Ngân sách chi", makeAsciiBar(100, 18), "Kinh phí hợp thức hóa các phần mềm thiếu HĐ có rủi ro cao"],
      [2, "2. Chi phí tiết kiệm từ FOSS (0 đồng)", (metrics && metrics.totalFossSavings) || 0, "Tiết kiệm ròng", makeAsciiBar(metrics && metrics.totalEstimatedCost ? Math.round(((metrics.totalFossSavings || 0) / (metrics.totalEstimatedCost + metrics.totalFossSavings)) * 100) : 50, 18), "Số tiền tiết kiệm được khi dùng 7-Zip, LibreOffice, GIMP..."],
      [3, "3. Ngân sách đầu tư ròng (Net Investment)", effectiveKpi.netInvestment || 0, "Ngân sách ròng", makeAsciiBar(70, 18), "Khoản chênh lệch sau khi đã tối ưu hóa chuyển đổi FOSS"],
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(s1Data);
    ws1['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
      { s: { r: 3, c: 1 }, e: { r: 3, c: 2 } },
      { s: { r: 3, c: 4 }, e: { r: 3, c: 5 } },
      { s: { r: 4, c: 1 }, e: { r: 4, c: 2 } },
      { s: { r: 4, c: 4 }, e: { r: 4, c: 5 } },
      { s: { r: 6, c: 0 }, e: { r: 6, c: 5 } },
      { s: { r: 15, c: 0 }, e: { r: 15, c: 5 } },
      { s: { r: 22, c: 0 }, e: { r: 22, c: 5 } },
    ];
    ws1['!rows'] = [
      { hpt: 26 }, { hpt: 20 }, { hpt: 10 },
      { hpt: 20 }, { hpt: 20 }, { hpt: 10 },
      { hpt: 24 }, { hpt: 22 },
      { hpt: 20 }, { hpt: 20 }, { hpt: 20 }, { hpt: 20 }, { hpt: 20 }, { hpt: 20 },
      { hpt: 12 },
      { hpt: 24 }, { hpt: 22 },
      { hpt: 20 }, { hpt: 20 }, { hpt: 20 }, { hpt: 20 },
      { hpt: 12 },
      { hpt: 24 }, { hpt: 22 },
      { hpt: 20 }, { hpt: 20 }, { hpt: 20 }
    ];
    formatWorksheet(ws1, {
      customWidths: [8, 36, 18, 14, 28, 45],
      startDataRow: 7,
      freezeRow: 8
    });
    XLSX.utils.book_append_sheet(wb, ws1, "1_Tong_Quan_KPI_Dashboard");

    // =========================================================================
    // SHEET 2: 💼 2_Ke_Hoach_Mua_Bo_Sung (EXECUTIVE PLAN TABLE)
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

    const totalBudget = (metrics && metrics.totalEstimatedCost) || 1;
    const planRows = executivePlanRows || [];

    planRows.forEach((r, idx) => {
      const override = execOverrides[r.name] || {};
      const curRiskLabel = override.riskLabel !== undefined ? override.riskLabel : r.riskLabel;
      const curRecommendation = override.recommendation !== undefined ? override.recommendation : r.recommendation;
      const pctCost = totalBudget > 0 ? Math.round((r.totalEstimated / totalBudget) * 100) : 0;

      s2Data.push([
        idx + 1,
        r.name,
        r.category || "Ứng dụng",
        r.vendor || "Chưa rõ",
        r.installedCount,
        r.hasInvoiceCount,
        r.missingInvoiceCount,
        curRiskLabel,
        r.unitPrice,
        r.totalEstimated,
        `${pctCost}%`,
        makeMiniBar(pctCost, 12),
        curRecommendation
      ]);
    });

    // Add Total row
    const totalRowIndex = s2Data.length + 1;
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
      (metrics && metrics.totalEstimatedCost) || 0,
      "100%",
      makeMiniBar(100, 12),
      "Ngân sách tối ưu đề xuất trình Ban Giám Đốc phê duyệt"
    ]);

    const ws2 = XLSX.utils.aoa_to_sheet(s2Data);
    ws2['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } },
    ];
    ws2['!rows'] = [{ hpt: 26 }, { hpt: 20 }, { hpt: 10 }, { hpt: 24 }];
    formatWorksheet(ws2, {
      customWidths: [7, 32, 16, 18, 14, 14, 14, 18, 20, 22, 14, 20, 45],
      startDataRow: 3,
      freezeRow: 4,
      autoFilterRange: `A4:M${s2Data.length - 1}`
    });
    XLSX.utils.book_append_sheet(wb, ws2, "2_Ke_Hoach_Mua_Bo_Sung");

    // =========================================================================
    // SHEET 3: 💻 3_Chi_Tiet_Tung_Thiet_Bi (DETAILED MACHINES AUDIT)
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
    ws3['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 14 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 14 } },
    ];
    ws3['!rows'] = [{ hpt: 26 }, { hpt: 20 }, { hpt: 10 }, { hpt: 24 }];
    formatWorksheet(ws3, {
      customWidths: [7, 20, 20, 18, 32, 26, 18, 14, 16, 20, 16, 18, 24, 20, 42],
      startDataRow: 3,
      freezeRow: 4,
      autoFilterRange: `A4:O${s3Data.length}`
    });
    XLSX.utils.book_append_sheet(wb, ws3, "3_Chi_Tiet_Tung_Thiet_Bi");

    // =========================================================================
    // SHEET 4: 💡 4_Ke_Hoach_Chuyen_Doi_FOSS (FOSS SAVINGS & COST OPTIMIZATION)
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

    // Summary row
    const totalFossSavingsSum = 12000000 + 96000000 + 270000000 + 55000000 + 72000000 + 42000000 + 8400000;
    s4Data.push([
      "",
      "TỔNG CỘNG TIẾT KIỆM KHI CHUYỂN ĐỔI FOSS:",
      "",
      69,
      "",
      "",
      (metrics && metrics.totalFossSavings) ? metrics.totalFossSavings : totalFossSavingsSum,
      makeMiniBar(100, 12),
      "Tổng ngân sách tiết kiệm ròng giúp tối ưu chi phí vận hành doanh nghiệp"
    ]);

    const ws4 = XLSX.utils.aoa_to_sheet(s4Data);
    ws4['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
    ];
    ws4['!rows'] = [{ hpt: 26 }, { hpt: 20 }, { hpt: 10 }, { hpt: 24 }];
    formatWorksheet(ws4, {
      customWidths: [7, 32, 18, 14, 28, 22, 24, 20, 45],
      startDataRow: 3,
      freezeRow: 4,
      autoFilterRange: `A4:I${s4Data.length - 1}`
    });
    XLSX.utils.book_append_sheet(wb, ws4, "4_Ke_Hoach_Chuyen_Doi_FOSS");

    // =========================================================================
    // SHEET 5: 📈 5_Bieu_Do_Phan_Tich_Do_Thi (VISUAL CHARTS & MATRIX)
    // =========================================================================
    const s5Data = [
      ["HACHIHI SAM - BẢNG ĐỒ THỊ TRỰC QUAN & MA TRẬN PHÂN BỔ BẢN QUYỀN"],
      ["Bảng tổng hợp biểu đồ trực quan hóa dữ liệu kiểm toán giúp Ban Giám Đốc nắm bắt tình hình tức thì."],
      [],
      ["I. BIỂU ĐỒ SO SÁNH TỶ TRỌNG CÁC NHÓM BẢN QUYỀN"],
      ["Nhóm Bản Quyền", "Số Lượng", "Tỷ Lệ %", "Đồ Thị Thanh Trực Quan Ngang (Visual Bar Graph)"],
      ["Đã Có Hóa Đơn VAT", hasInvCount, `${pctHasInv}%`, '█'.repeat(Math.max(1, Math.round(pctHasInv * 0.4))) + `  (${pctHasInv}%)`],
      ["Mã Nguồn Mở FOSS", fossCount, `${pctFoss}%`, '█'.repeat(Math.max(1, Math.round(pctFoss * 0.4))) + `  (${pctFoss}%)`],
      ["Bẫy Bản Quyền Cá Nhân", trapCount, `${pctTrap}%`, '█'.repeat(Math.max(1, Math.round(pctTrap * 0.4))) + `  (${pctTrap}%)`],
      ["Thiếu Hóa Đơn VAT", missingCount, `${pctMissing}%`, '█'.repeat(Math.max(1, Math.round(pctMissing * 0.4))) + `  (${pctMissing}%)`],
      [],
      ["II. BIỂU ĐỒ ĐỐI CHIẾU TÀI CHÍNH (NGÂN SÁCH CHI VS TIẾT KIỆM FOSS)"],
      ["Khoản Mục So Sánh", "Giá Trị (VNĐ)", "Tỷ Trọng", "Biểu Đồ Thanh Đối Sánh"],
      ["Ngân sách mua bổ sung bản quyền bắt buộc", (metrics && metrics.totalEstimatedCost) || 0, "Chi phí", makeAsciiBar(100, 24)],
      ["Ngân sách tiết kiệm được từ giải pháp FOSS", (metrics && metrics.totalFossSavings) || totalFossSavingsSum, "Tiết kiệm", makeAsciiBar(Math.round(((metrics && metrics.totalFossSavings || totalFossSavingsSum) / Math.max(1, (metrics && metrics.totalEstimatedCost || 1))) * 100), 24)],
      ["Chi phí đầu tư ròng (Net Budget sau FOSS)", effectiveKpi.netInvestment || 0, "Ngân sách ròng", makeAsciiBar(Math.max(0, Math.round(((effectiveKpi.netInvestment || 0) / Math.max(1, (metrics && metrics.totalEstimatedCost || 1))) * 100)), 24)],
      [],
      ["III. MA TRẬN MỨC ĐỘ RỦI RO KIỂM TRA PHÁP LÝ (BSA / QUẢN LÝ THỊ TRƯỜNG)"],
      ["Mức Độ Rủi Ro", "Số Lượng Phần Mềm", "Mức Phạt Dự Kiến Tối Đa", "Hành Động Khẩn Cấp Cần Triển Khai"],
      ["🔴 Nghiêm trọng (Critical Risk)", planRows.filter(r => r.riskLabel && r.riskLabel.includes("Nghiêm")).length, "Phạt 500tr - 1 tỷ VNĐ (Kèm đình chỉ)", "Mua bản quyền ngay hoặc gỡ bỏ toàn bộ khỏi máy tính công ty"],
      ["🟠 Rủi ro cao (High Risk)", planRows.filter(r => r.riskLabel && (r.riskLabel.includes("Cao") || r.riskLabel.includes("Bẫy"))).length, "Yêu cầu bồi thường theo EULA", "Gỡ bỏ phần mềm cá nhân và chuyển đổi sang FOSS tương đương"],
      ["🟢 An toàn (Low Risk)", planRows.filter(r => r.riskLabel && (r.riskLabel.includes("An toàn") || r.riskLabel.includes("Thấp"))).length, "0 VNĐ (Hoàn toàn hợp lệ)", "Tiếp tục duy trì hồ sơ lưu trữ hóa đơn VAT và hợp đồng"],
    ];

    const ws5 = XLSX.utils.aoa_to_sheet(s5Data);
    ws5['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } },
      { s: { r: 10, c: 0 }, e: { r: 10, c: 3 } },
      { s: { r: 16, c: 0 }, e: { r: 16, c: 3 } },
    ];
    ws5['!rows'] = [
      { hpt: 26 }, { hpt: 20 }, { hpt: 10 },
      { hpt: 22 }, { hpt: 22 },
      { hpt: 20 }, { hpt: 20 }, { hpt: 20 }, { hpt: 20 },
      { hpt: 12 },
      { hpt: 22 }, { hpt: 22 },
      { hpt: 20 }, { hpt: 20 }, { hpt: 20 },
      { hpt: 12 },
      { hpt: 22 }, { hpt: 22 },
      { hpt: 20 }, { hpt: 20 }, { hpt: 20 }
    ];
    formatWorksheet(ws5, {
      customWidths: [30, 22, 26, 48],
      startDataRow: 4,
      freezeRow: 5
    });
    XLSX.utils.book_append_sheet(wb, ws5, "5_Bieu_Do_Phan_Tich_Do_Thi");

    const cleanClient = String(clientName || "Doanh_Nghiep").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "_");
    XLSX.writeFile(wb, `Bao_Cao_Tong_Hop_BGD_Hachihi_SAM_${cleanClient}_${auditDate || new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  // =========================================================================
  // 3. XUẤT CATALOG ĐỘC LẬP
  // =========================================================================
  function downloadCatalogOnly(customCatalog, catalogInfo) {
    if (typeof XLSX === 'undefined') {
      alert('Thư viện XLSX chưa sẵn sàng!');
      return;
    }

    const wb = XLSX.utils.book_new();
    const catList = customCatalog || [];
    const catRows = catList.map((c, idx) => ({
      "STT": idx + 1,
      "ID": c.id || "",
      "Tên Phần Mềm": c.name,
      "Từ Khóa Nhận Diện": (Array.isArray(c.keywords) ? c.keywords.join(", ") : (c.pattern || c.keywords || c.name || "")),
      "Hãng Sản Xuất": c.vendor,
      "Nhóm Phân Loại": c.category,
      "Loại Bản Quyền":
        c.licenseType === "FREE_OPEN_SOURCE"
          ? "Free / FOSS (Miễn phí DN)"
          : c.licenseType === "FREE_PERSONAL_ONLY"
            ? "Bẫy Cá Nhân"
            : "Thương Mại Trả Phí",
      "Mức Rủi Ro": c.auditRisk,
      "Hành Động Đề Xuất": c.suggestedAction || "",
      "Ghi Chú & Hướng Dẫn Pháp Lý": c.actionDetails,
      "Phần Mềm FOSS Thay Thế": c.recommendedAlternative || c.foss || "",
      "Đơn Giá Dự Toán (VNĐ)": c.estimatedPriceVND || 0,
      "Bẫy Bản Quyền": c.isTrap ? "Có" : "Không"
    }));

    const ws = XLSX.utils.json_to_sheet(catRows);
    formatWorksheet(ws, {
      customWidths: [8, 16, 32, 32, 20, 18, 24, 16, 20, 40, 26, 22, 16],
      startDataRow: 0,
      freezeRow: 1,
      autoFilterRange: `A1:M${catRows.length + 1}`
    });
    XLSX.utils.book_append_sheet(wb, ws, "Catalog");

    if (catalogInfo) {
      const infoRows = [
        { "Thuộc Tính": "Tên Danh Mục", "Giá Trị": catalogInfo.name || "Hachihi SAM Standard" },
        { "Thuộc Tính": "Phiên Bản", "Giá Trị": catalogInfo.version || "2026.09" },
        { "Thuộc Tính": "Ngày Cập Nhật", "Giá Trị": catalogInfo.updated || new Date().toLocaleDateString('vi-VN') },
        { "Thuộc Tính": "Đơn Vị Tác Giả", "Giá Trị": catalogInfo.author || "Hachihi SAM" },
        { "Thuộc Tính": "Mô Tả", "Giá Trị": catalogInfo.description || "Danh mục tiêu chuẩn kiểm toán bản quyền phần mềm doanh nghiệp" }
      ];
      const wsInfo = XLSX.utils.json_to_sheet(infoRows);
      formatWorksheet(wsInfo, {
        customWidths: [22, 50],
        startDataRow: 0,
        freezeRow: 1
      });
      XLSX.utils.book_append_sheet(wb, wsInfo, "Thong_Tin_Catalog");
    }

    XLSX.writeFile(wb, "Danh_Muc_Phan_Mem_Tieu_Chuan_Hachihi.xlsx");
  }

  function exportAuditReport(options) {
    const { metrics, kpiBreakdown, installations, clientName, auditDate, auditorUnit, catalogInfo, computers, executivePlanRows, overrides } = options || {};
    exportExecutiveReport(executivePlanRows, metrics, clientName, auditDate, installations, computers, kpiBreakdown, overrides);
  }

  function exportDetailedMachines(installations, clientName, auditDate) {
    if (typeof XLSX === 'undefined') {
      alert('Thư viện XLSX chưa sẵn sàng!');
      return;
    }
    const wb = XLSX.utils.book_new();
    const rows = (installations || []).map((i, idx) => ({
      "STT": idx + 1,
      "Mã Máy (Hostname)": i.computerHostname,
      "Người Sử Dụng": i.userName || "Chưa gán",
      "Phòng Ban": i.department || "N/A",
      "Phần Mềm Phát Hiện": i.rawSoftwareName || i.displayName,
      "Tên Chuẩn Hóa": i.displayName,
      "Hãng Sản Xuất": i.vendor,
      "Phiên Bản": i.version || "Latest",
      "Loại Bản Quyền": i.licenseType,
      "Mức Rủi Ro": i.auditRisk,
      "Trạng Thái Hóa Đơn": i.invoiceStatus === "HAS_INVOICE" ? "Có Hóa Đơn" : i.invoiceStatus === "NOT_APPLICABLE" ? "FOSS/Miễn phí" : "Thiếu Hóa Đơn",
      "Số HĐ / Ghi Chú": i.invoiceNumber || "",
      "Khuyến Nghị IT": i.actionDetails || i.suggestedAction || "",
      "FOSS Thay Thế": i.recommendedAlternative || "",
      "Đơn Giá Dự Toán (VNĐ)": i.estimatedPriceVND || 0
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    formatWorksheet(ws, {
      customWidths: [7, 20, 20, 18, 30, 26, 18, 14, 20, 16, 18, 22, 40, 24, 20],
      startDataRow: 0,
      freezeRow: 1,
      autoFilterRange: `A1:O${rows.length + 1}`
    });
    XLSX.utils.book_append_sheet(wb, ws, "Chi_Tiet_May_Tinh");

    const cleanClient = String(clientName || "Doanh_Nghiep").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "_");
    XLSX.writeFile(wb, `Danh_Sach_Chi_Tiet_May_Tinh_${cleanClient}_${auditDate || new Date().toISOString().slice(0, 10)}.xlsx`);
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
    generateSampleExcelTemplate
  };

  global.SAM_EXPORT = exportModule;
  global.SAM_EXPORTER = exportModule;

})(typeof window !== 'undefined' ? window : this);
