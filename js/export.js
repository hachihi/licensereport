// js/export.js - Specialized Excel Exporter (Reports, Templates, Catalog)
(function (global) {
  'use strict';

  // Helper: Visual progress bar graph for Excel cells
  function makeAsciiBar(pct, totalLength = 18) {
    const p = Math.max(0, Math.min(100, Math.round(pct || 0)));
    const filled = Math.min(totalLength, Math.max(0, Math.round((p / 100) * totalLength)));
    const empty = totalLength - filled;
    return '█'.repeat(filled) + '░'.repeat(empty) + `  ${p}%`;
  }

  // Helper: Auto-fit column widths and format numeric cells
  function formatWorksheet(ws, { minColWidth = 14, maxColWidth = 55, startDataRow = 0 } = {}) {
    if (!ws || !ws['!ref']) return;
    const range = XLSX.utils.decode_range(ws['!ref']);
    const colWidths = [];

    for (let C = range.s.c; C <= range.e.c; ++C) {
      let maxLen = minColWidth;
      for (let R = range.s.r; R <= range.e.r; ++R) {
        // Skip banner title merged rows if startDataRow > 0
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
              headerText.includes('Giá')
            ) {
              cell.z = '#,##0 "₫"';
            } else if (headerText.includes('Tỷ Lệ') || headerText.includes('%')) {
              // percentage
            } else if (cell.v > 999 && !headerText.includes('Năm') && !headerText.includes('Version')) {
              cell.z = '#,##0';
            }
          }
        }
      }
      colWidths[C] = { wch: Math.min(Math.max(maxLen + 4, minColWidth), maxColWidth) };
    }
    ws['!cols'] = colWidths;
  }

  function downloadTemplate3Sheets(customCatalog) {
    if (typeof XLSX === 'undefined') {
      alert('Thư viện XLSX chưa sẵn sàng!');
      return;
    }

    const wb = XLSX.utils.book_new();

    // Sheet 1: Máy tính
    const ws1Data = [
      ["HACHIHI SAM - DANH SÁCH MÁY TÍNH KIỂM KÊ (MẪU CHUẨN DOANH NGHIỆP)"],
      ["Hướng dẫn: Điền thông tin máy tính trong công ty. Cột Hostname là mã định danh chính. Có thể xóa các dòng mẫu bên dưới và dán dữ liệu thực tế."],
      [],
      ["STT", "Tên Máy Tính (Hostname)", "Người Sử Dụng", "Phòng Ban", "Số Serial / Service Tag", "Hệ Điều Hành", "Cấu Hình / Model Phần Cứng", "Ghi Chú"],
      [1, "KT-DESKTOP-01", "Nguyễn Thị Hoa", "Kế Toán", "serial001", "Windows 11 Pro 64-bit", "Dell OptiPlex 7090 - Core i5, 16GB", "Máy kế toán trưởng"],
      [2, "KD-LAPTOP-02", "Trần Văn Nam", "Kinh Doanh", "serial002", "Windows 10 Pro 64-bit", "Lenovo ThinkPad T14 - Core i7, 16GB", "Laptop kinh doanh thường đi thị trường"],
      [3, "ENG-WORKSTATION-01", "Lê Minh Tuấn", "Kỹ Thuật", "serial003", "Windows 11 Pro", "Dell Precision 3660 - Core i9, RTX 4080", "Máy thiết kế bản vẽ kỹ thuật"],
      [4, "HR-PC-01", "Phạm Thu Trang", "Hành Chính Nhân Sự", "serial004", "Windows 11 Home", "HP ProDesk 400 G7 - Core i3, 8GB", "Cần nâng cấp lên Windows Pro"],
      [5, "MKT-LAPTOP-01", "Hoàng Anh Dũng", "Marketing", "serial005", "macOS Sonoma 14.5", "MacBook Pro M2 - 16GB, 512GB SSD", "Thiết kế media và video"],
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);
    ws1['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
    ];
    ws1['!rows'] = [{ hpt: 26 }, { hpt: 18 }, { hpt: 10 }, { hpt: 22 }];
    formatWorksheet(ws1, { minColWidth: 15, startDataRow: 3 });
    XLSX.utils.book_append_sheet(wb, ws1, "1_Danh_Sach_May_Tinh");

    // Sheet 2: Phần mềm
    const ws2Data = [
      ["HACHIHI SAM - DANH SÁCH PHẦN MỀM CÀI ĐẶT & ĐỐI SOÁT HÓA ĐƠN (MẪU CHUẨN)"],
      ["Hướng dẫn: Nhập chi tiết phần mềm cài trên từng máy (Hostname) và đối soát hóa đơn VAT GTGT bản quyền. Tình trạng ghi: Có / Chưa / FOSS."],
      [],
      ["STT", "Tên Máy Tính (Hostname)", "Tên Phần Mềm Cài Đặt", "Hãng Sản Xuất", "Phiên Bản", "Tình Trạng Hóa Đơn (Có / Chưa / FOSS)", "Số Hóa Đơn VAT / Hợp Đồng", "Ghi Chú Kiểm Toán"],
      [1, "KT-DESKTOP-01", "Microsoft Office Home & Business 2021", "Microsoft", "16.0", "Có", "HĐ GTGT #0023412", "Đã có HĐ VAT đầy đủ hợp lệ"],
      [2, "KT-DESKTOP-01", "7-Zip", "Igor Pavlov", "23.01", "FOSS", "Miễn phí FOSS 100%", "Mã nguồn mở miễn phí cho doanh nghiệp"],
      [3, "KT-DESKTOP-01", "WinRAR 6.24", "win.rar GmbH", "6.24", "Chưa", "Chưa có hóa đơn", "Bẫy dùng thử 40 ngày, cần thay bằng 7-Zip"],
      [4, "KD-LAPTOP-02", "TeamViewer 15", "TeamViewer", "15.48", "Chưa", "Chưa có hóa đơn", "Bẫy Free cá nhân, vi phạm điều khoản công ty"],
      [5, "ENG-WORKSTATION-01", "AutoCAD 2024", "Autodesk", "24.3", "Chưa", "Chưa có hóa đơn", "Rủi ro kiểm tra bản quyền cao, cần mua bổ sung"],
      [6, "ENG-WORKSTATION-01", "Phần mềm nội bộ công ty", "Nội bộ", "1.0", "FOSS", "Nội bộ tự phát triển", "An toàn, miễn phí"],
      [7, "HR-PC-01", "Unikey 4.3 RC5", "Phạm Kim Long", "4.3", "FOSS", "Miễn phí 100%", "Bộ gõ tiếng Việt chuẩn FOSS"],
      [8, "MKT-LAPTOP-01", "Adobe Photoshop 2024", "Adobe Systems", "25.2", "Có", "HĐ Adobe VIP #891230", "Đã mua thuê bao hàng năm bản quyền"],
    ];

    const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
    ws2['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
    ];
    ws2['!rows'] = [{ hpt: 26 }, { hpt: 18 }, { hpt: 10 }, { hpt: 22 }];
    formatWorksheet(ws2, { minColWidth: 15, startDataRow: 3 });
    XLSX.utils.book_append_sheet(wb, ws2, "2_Danh_Sach_Phan_Mem");

    // Sheet 3: Danh mục tiêu chuẩn (Catalog)
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
    ws3['!rows'] = [{ hpt: 26 }, { hpt: 18 }, { hpt: 10 }, { hpt: 22 }];
    formatWorksheet(ws3, { minColWidth: 15, startDataRow: 3 });
    XLSX.utils.book_append_sheet(wb, ws3, "3_Danh_Muc_Catalog");

    XLSX.writeFile(wb, "Mau_Kiem_Toan_Ban_Quyen_Hachihi_SAM_Chuan.xlsx");
  }

  function exportExecutiveReport(executivePlanRows, metrics, clientName, auditDate, installations, computers, kpiBreakdown) {
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

    const wb = XLSX.utils.book_new();

    // ==========================================
    // SHEET 1: 📊 DASHBOARD & BIỂU ĐỒ TỔNG QUAN
    // ==========================================
    const s1Data = [
      ["HACHIHI SOFTWARE ASSET MANAGEMENT - BÁO CÁO TỔNG HỢP KIỂM TOÁN BẢN QUYỀN"],
      ["Hệ thống đánh giá tuân thủ bản quyền, đối soát hóa đơn VAT và tối ưu hóa chi phí FOSS chạy client-side."],
      [],
      ["Khách hàng / Doanh nghiệp:", clientName || "Doanh nghiệp", "", "Ngày kiểm toán:", auditDate || new Date().toLocaleDateString("vi-VN")],
      ["Đơn vị thực hiện thẩm định:", "Hachihi SAM Auditor (hachihi.vn)", "", "Bộ quy chuẩn SAM:", "Hachihi SAM Standard v2026.09"],
      [],
      ["I. CHỈ SỐ KPI CHÍNH & ĐIỂM TUÂN THỦ (EXECUTIVE DASHBOARD)"],
      ["Chỉ Số Đánh Giá", "Giá Trị", "Đơn Vị", "Đánh Giá Trạng Thái", "Biểu Đồ Thanh Trực Quan"],
      ["Điểm Tuân Thủ Bản Quyền", `${(metrics && metrics.complianceScore) || 0}%`, "Tỷ lệ", (metrics && metrics.complianceScore >= 80) ? "🟢 An Toàn" : "🔴 Cần Xử Lý", makeAsciiBar((metrics && metrics.complianceScore) || 0, 20)],
      ["Tổng Số Thiết Bị Máy Tính", (metrics && metrics.totalComputers) || effectiveComputers.length, "Máy tính", "Đã kiểm kê 100%", ""],
      ["Tổng Lượt Phần Mềm Cài Đặt", (metrics && metrics.totalInstalls) || effectiveInstalls.length, "Lượt cài", "Toàn bộ hệ thống", ""],
      ["🔴 Vi Phạm / Thiếu Hóa Đơn VAT", effectiveKpi.violation, "Lượt", "Rủi ro bị xử phạt pháp lý", makeAsciiBar(pctMissing, 18)],
      ["🟠 Bẫy Bản Quyền Cá Nhân (Free Personal)", effectiveKpi.verify, "Lượt", "Vi phạm điều khoản DN", makeAsciiBar(pctTrap, 18)],
      ["🟢 Hợp Lệ (Đã có HĐ hoặc FOSS)", effectiveKpi.valid, "Lượt", "Tuân thủ pháp luật", makeAsciiBar(pctHasInv + pctFoss, 18)],
      [],
      ["II. BIỂU ĐỒ CƠ CẤU PHÂN BỔ BẢN QUYỀN (VISUAL PROGRESS CHART)"],
      ["Phân Nhóm Bản Quyền", "Số Lượng (Lượt)", "Tỷ Lệ (%)", "Biểu Đồ Thanh Tiến Trình Trực Quan (Bar Chart)", "Khuyến Nghị Quản Trị"],
      ["1. Phần Mềm Đã Có Hóa Đơn VAT Hợp Lệ", hasInvCount, `${pctHasInv}%`, makeAsciiBar(pctHasInv, 22), "Lưu trữ hóa đơn VAT, hợp đồng định kỳ"],
      ["2. Phần Mềm Miễn Phí Mã Nguồn Mở (FOSS)", fossCount, `${pctFoss}%`, makeAsciiBar(pctFoss, 22), "Khuyến khích mở rộng cho toàn công ty"],
      ["3. Bẫy Bản Quyền Cá Nhân (WinRAR, TeamViewer...)", trapCount, `${pctTrap}%`, makeAsciiBar(pctTrap, 22), "Gỡ bỏ ngay và thay thế bằng FOSS tương đương"],
      ["4. Phần Mềm Thương Mại Thiếu Hóa Đơn (AutoCAD, Adobe...)", missingCount, `${pctMissing}%`, makeAsciiBar(pctMissing, 22), "Lên ngân sách mua bổ sung hoặc chuyển đổi FOSS"],
      [],
      ["III. DỰ TOÁN TÀI CHÍNH & TỐI ƯU CHI PHÍ 0 ĐỒNG (FINANCIAL SUMMARY)"],
      ["Khoản Mục Tài Chính", "Số Tiền (VNĐ)", "Phân Loại", "Ý Nghĩa Quản Trị Doanh Nghiệp"],
      ["1. Chi phí mua bổ sung bắt buộc", (metrics && metrics.totalEstimatedCost) || 0, "Ngân sách chi phí", "Kinh phí hợp thức hóa các phần mềm thiếu HĐ"],
      ["2. Chi phí tiết kiệm từ FOSS (0 đồng)", (metrics && metrics.totalFossSavings) || 0, "Tiết kiệm ròng", "Số tiền tiết kiệm được khi dùng 7-Zip, LibreOffice, GIMP..."],
      ["3. Ngân sách đầu tư ròng (Net Investment)", effectiveKpi.netInvestment || 0, "Ngân sách ròng", "Khoản chênh lệch sau khi tối ưu hóa"],
      [],
      ["IV. DANH MỤC PHẦN MỀM THIẾU HÓA ĐƠN CẦN XỬ LÝ (TOP BUDGET ALLOCATION)"],
      ["STT", "Tên Phần Mềm", "Số Máy Dùng", "Số Có HĐ", "Số Thiếu HĐ", "Mức Rủi Ro", "Phương Án Khuyến Nghị", "Đơn Giá Dự Kiến (VNĐ)", "Tổng Chi Phí (VNĐ)", "Tỷ Trọng Chi Phí"]
    ];

    const totalBudget = (metrics && metrics.totalEstimatedCost) || 1;
    (executivePlanRows || []).forEach((r, idx) => {
      const pctCost = totalBudget > 0 ? Math.round((r.totalEstimated / totalBudget) * 100) : 0;
      s1Data.push([
        idx + 1,
        r.name,
        r.installedCount,
        r.hasInvoiceCount,
        r.missingInvoiceCount,
        r.riskLabel,
        r.recommendation,
        r.unitPrice,
        r.totalEstimated,
        r.totalEstimated > 0 ? makeAsciiBar(pctCost, 12) : "0%"
      ]);
    });

    const ws1 = XLSX.utils.aoa_to_sheet(s1Data);
    ws1['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
      { s: { r: 6, c: 0 }, e: { r: 6, c: 4 } },
      { s: { r: 15, c: 0 }, e: { r: 15, c: 4 } },
      { s: { r: 22, c: 0 }, e: { r: 22, c: 3 } },
      { s: { r: 27, c: 0 }, e: { r: 27, c: 9 } },
    ];
    ws1['!rows'] = [
      { hpt: 26 }, { hpt: 18 }, { hpt: 10 },
      { hpt: 20 }, { hpt: 20 }, { hpt: 10 },
      { hpt: 22 }, { hpt: 22 }
    ];
    formatWorksheet(ws1, { minColWidth: 16, startDataRow: 7 });
    XLSX.utils.book_append_sheet(wb, ws1, "1_Dashboard_Bieu_Do");

    // ==========================================
    // SHEET 2: 💻 CHI TIẾT TỪNG MÁY TÍNH
    // ==========================================
    const s2Data = [
      ["HACHIHI SAM - DANH SÁCH CHI TIẾT KIỂM TOÁN TỪNG MÁY & PHẦN MỀM"],
      [`Doanh nghiệp: ${clientName || "Doanh nghiệp"} | Ngày kiểm toán: ${auditDate || new Date().toLocaleDateString("vi-VN")} | Tổng số lượt cài: ${effectiveInstalls.length}`],
      [],
      [
        "STT",
        "Tên Máy (Hostname)",
        "Người Sử Dụng",
        "Phòng Ban",
        "Tên Phần Mềm Phát Hiện",
        "Tên Chuẩn Hóa",
        "Hãng Sản Xuất",
        "Phiên Bản",
        "Loại Bản Quyền",
        "Mức Rủi Ro",
        "Tình Trạng Hóa Đơn",
        "Số HĐ / Ghi Chú",
        "Đơn Giá Dự Kiến (VNĐ)",
        "Khuyến Nghị IT & Giải Pháp FOSS"
      ]
    ];

    effectiveInstalls.forEach((i, idx) => {
      s2Data.push([
        idx + 1,
        i.computerHostname || "",
        i.userName || "Chưa gán",
        i.department || "N/A",
        i.rawSoftwareName || i.displayName,
        i.displayName || "",
        i.vendor || "Chưa rõ",
        i.version || "Latest",
        i.licenseType === "FREE_OPEN_SOURCE"
          ? "Miễn Phí FOSS"
          : i.licenseType === "FREE_PERSONAL_ONLY"
            ? "Bẫy Cá Nhân"
            : "Thương Mại",
        i.auditRisk === "LOW" ? "Thấp (An toàn)" : i.auditRisk === "CRITICAL" ? "Nghiêm trọng" : "Rủi ro cao",
        i.invoiceStatus === "HAS_INVOICE"
          ? "Có Hóa Đơn"
          : i.invoiceStatus === "NOT_APPLICABLE" || i.licenseType === "FREE_OPEN_SOURCE"
            ? "Miễn Phí FOSS"
            : "Thiếu Hóa Đơn",
        i.invoiceNumber || "",
        i.invoiceStatus === "MISSING_INVOICE" && i.licenseType !== "FREE_OPEN_SOURCE" ? (i.estimatedPriceVND || 0) : 0,
        i.actionDetails || i.recommendedAlternative || i.suggestedAction || ""
      ]);
    });

    const ws2 = XLSX.utils.aoa_to_sheet(s2Data);
    ws2['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 13 } },
    ];
    ws2['!rows'] = [{ hpt: 26 }, { hpt: 18 }, { hpt: 10 }, { hpt: 22 }];
    formatWorksheet(ws2, { minColWidth: 15, startDataRow: 3 });
    XLSX.utils.book_append_sheet(wb, ws2, "2_Chi_Tiet_Tung_May");

    // ==========================================
    // SHEET 3: 💡 KẾ HOẠCH FOSS TIẾT KIỆM CHI PHÍ
    // ==========================================
    const s3Data = [
      ["HACHIHI SAM - KẾ HOẠCH CHUYỂN ĐỔI PHẦN MỀM FOSS TIẾT KIỆM CHI PHÍ (0 ĐỒNG)"],
      ["Danh mục giải pháp mã nguồn mở và freeware hợp pháp cho doanh nghiệp thay thế phần mềm thương mại đắt đỏ."],
      [],
      ["STT", "Phần Mềm Thương Mại / Bẫy Hiện Tại", "Hãng Sản Xuất", "Giải Pháp FOSS Thay Thế Miễn Phí", "Mức Tiết Kiệm (VNĐ/máy)", "Mức Độ Rủi Ro Tránh Được", "Lợi Ích Pháp Lý & Vận Hành"],
      [1, "WinRAR (Quá hạn 40 ngày)", "win.rar GmbH", "7-Zip / PeaZip", 800000, "Xóa bỏ 100% bẫy bản quyền cá nhân", "Chuẩn mở, nén giải nén nhanh hơn, hoàn toàn miễn phí cho DN"],
      [2, "TeamViewer / AnyDesk cá nhân", "TeamViewer Germany", "RustDesk / UltraViewer", 12000000, "Tránh kiện tụng từ TeamViewer AG", "Hỗ trợ từ xa nội bộ an toàn, không bị khóa phiên 5 phút"],
      [3, "AutoCAD (Xem bản vẽ)", "Autodesk", "Autodesk DWG TrueView / LibreCAD", 45000000, "Loại bỏ rủi ro kiểm tra BSA nghiêm trọng", "Xem và in bản vẽ chính xác 100%, không mất phí mua AutoCAD full"],
      [4, "Adobe Acrobat Pro", "Adobe Systems", "PDF24 Creator / Foxit Reader", 5500000, "Tránh chi phí bản quyền định kỳ", "Đầy đủ tính năng merge, split, ký số PDF miễn phí"],
      [5, "Adobe Photoshop / Illustrator", "Adobe Systems", "GIMP / Inkscape / Photopea", 18000000, "Giảm ngân sách thuê bao hàng năm", "Phù hợp nhu cầu chỉnh sửa ảnh cơ bản của các phòng ban chung"],
      [6, "Microsoft Office (Bộ phận cơ bản)", "Microsoft", "Google Workspace / LibreOffice / WPS", 3500000, "Tối ưu hóa số lượng license mua mới", "Cộng tác trực tuyến mượt mà, lưu trữ đám mây an toàn"],
      [7, "CCleaner Free (Dùng trong DN)", "Gen Digital", "BleachBit / Disk Cleanup Windows", 600000, "Tránh vi phạm EULA của Piriform", "Dọn rác hệ thống sạch sẽ, mã nguồn mở 100%"],
    ];

    const ws3 = XLSX.utils.aoa_to_sheet(s3Data);
    ws3['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
    ];
    ws3['!rows'] = [{ hpt: 26 }, { hpt: 18 }, { hpt: 10 }, { hpt: 22 }];
    formatWorksheet(ws3, { minColWidth: 16, startDataRow: 3 });
    XLSX.utils.book_append_sheet(wb, ws3, "3_Ke_Hoach_FOSS_Tiet_Kiem");

    const cleanClient = String(clientName || "Doanh_Nghiep").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "_");
    XLSX.writeFile(wb, `Bao_Cao_Tong_Hop_BGD_Hachihi_SAM_${cleanClient}_${auditDate || new Date().toISOString().slice(0, 10)}.xlsx`);
  }

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
    formatWorksheet(ws, { minColWidth: 14, startDataRow: 0 });
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
      formatWorksheet(wsInfo, { minColWidth: 18, startDataRow: 0 });
      XLSX.utils.book_append_sheet(wb, wsInfo, "Thong_Tin_Catalog");
    }

    XLSX.writeFile(wb, "Danh_Muc_Phan_Mem_Tieu_Chuan_Hachihi.xlsx");
  }

  function exportAuditReport(options) {
    const { metrics, kpiBreakdown, installations, clientName, auditDate, auditorUnit, catalogInfo, computers, executivePlanRows } = options || {};
    exportExecutiveReport(executivePlanRows, metrics, clientName, auditDate, installations, computers, kpiBreakdown);
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
    formatWorksheet(ws, { minColWidth: 15, startDataRow: 0 });
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
