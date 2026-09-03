// js/export.js - Specialized Excel Exporter (Reports, Templates, Catalog)
(function (global) {
  'use strict';

  function downloadTemplate3Sheets(customCatalog) {
    if (typeof XLSX === 'undefined') {
      alert('Thư viện XLSX chưa sẵn sàng!');
      return;
    }

    const wb = XLSX.utils.book_new();

    const ws1 = XLSX.utils.json_to_sheet([
      {
        "Tên Máy Tính (Hostname)": "KT-DESKTOP-01",
        "Người Sử Dụng": "Nguyễn Thị Hoa",
        "Phòng Ban": "Kế Toán",
        "Số Serial": "serial001",
        "Hệ Điều Hành": "Windows 11 Pro 64-bit",
        "Cấu Hình / Model": "Dell OptiPlex 7090 - Core i5, 16GB",
      },
      {
        "Tên Máy Tính (Hostname)": "KD-LAPTOP-02",
        "Người Sử Dụng": "Trần Văn Nam",
        "Phòng Ban": "Kinh Doanh",
        "Số Serial": "serial002",
        "Hệ Điều Hành": "Windows 10 Pro 64-bit",
        "Cấu Hình / Model": "Lenovo ThinkPad T14 - Core i7, 16GB",
      },
      {
        "Tên Máy Tính (Hostname)": "ENG-WORKSTATION-01",
        "Người Sử Dụng": "Lê Minh Tuấn",
        "Phòng Ban": "Kỹ Thuật",
        "Số Serial": "serial003",
        "Hệ Điều Hành": "Windows 11 Pro",
        "Cấu Hình / Model": "Dell Precision 3660 - Core i9, RTX",
      },
      {
        "Tên Máy Tính (Hostname)": "HR-PC-01",
        "Người Sử Dụng": "Phạm Thu Trang",
        "Phòng Ban": "Hành Chính Nhân Sự",
        "Số Serial": "serial004",
        "Hệ Điều Hành": "Windows 11 Home",
        "Cấu Hình / Model": "HP ProDesk 400 G7 - Core i3, 8GB",
      },
    ]);
    XLSX.utils.book_append_sheet(wb, ws1, "Danh Sách Máy Tính");

    const ws2 = XLSX.utils.json_to_sheet([
      {
        "Tên Máy Tính (Hostname)": "KT-DESKTOP-01",
        "Tên Phần Mềm": "Microsoft Office Home & Business 2021",
        "Hãng SX": "Microsoft",
        "Phiên Bản": "16.0",
        "Tình Trạng Hóa Đơn (Có/Chưa)": "Có",
        "Số Hóa Đơn / Ghi Chú": "HĐ GTGT #0023412",
      },
      {
        "Tên Máy Tính (Hostname)": "KT-DESKTOP-01",
        "Tên Phần Mềm": "7-Zip",
        "Hãng SX": "Igor Pavlov",
        "Phiên Bản": "23.01",
        "Tình Trạng Hóa Đơn (Có/Chưa)": "FOSS",
        "Số Hóa Đơn / Ghi Chú": "Miễn phí FOSS 100%",
      },
      {
        "Tên Máy Tính (Hostname)": "KT-DESKTOP-01",
        "Tên Phần Mềm": "WinRAR 6.24",
        "Hãng SX": "win.rar GmbH",
        "Phiên Bản": "6.24",
        "Tình Trạng Hóa Đơn (Có/Chưa)": "Chưa",
        "Số Hóa Đơn / Ghi Chú": "Cần thay bằng 7-Zip",
      },
      {
        "Tên Máy Tính (Hostname)": "KD-LAPTOP-02",
        "Tên Phần Mềm": "TeamViewer 15",
        "Hãng SX": "TeamViewer",
        "Phiên Bản": "15.48",
        "Tình Trạng Hóa Đơn (Có/Chưa)": "Chưa",
        "Số Hóa Đơn / Ghi Chú": "Bẫy Free cá nhân",
      },
      {
        "Tên Máy Tính (Hostname)": "ENG-WORKSTATION-01",
        "Tên Phần Mềm": "AutoCAD 2024",
        "Hãng SX": "Autodesk",
        "Phiên Bản": "24.3",
        "Tình Trạng Hóa Đơn (Có/Chưa)": "Chưa",
        "Số Hóa Đơn / Ghi Chú": "Cần mua bản quyền",
      },
      {
        "Tên Máy Tính (Hostname)": "ENG-WORKSTATION-01",
        "Tên Phần Mềm": "Phần mềm nội bộ công ty",
        "Hãng SX": "Nội bộ",
        "Phiên Bản": "1.0",
        "Tình Trạng Hóa Đơn (Có/Chưa)": "FOSS",
        "Số Hóa Đơn / Ghi Chú": "Tool viết riêng nội bộ",
      },
    ]);
    XLSX.utils.book_append_sheet(wb, ws2, "Danh Sách Phần Mềm");

    const catList = customCatalog || [];
    const catRows = catList.map((c) => ({
      "Tên Phần Mềm": c.name,
      "Từ Khóa Nhận Diện": (c.keywords || [c.name]).join(", "),
      "Hãng Sản Xuất": c.vendor,
      "Nhóm Phân Loại": c.category,
      "Loại Bản Quyền (Free Doanh Nghiệp / Thương Mại Trả Phí / Bẫy Cá Nhân)":
        c.licenseType === "FREE_OPEN_SOURCE"
          ? "Free / FOSS (Miễn Phí 100% Cho DN)"
          : c.licenseType === "FREE_PERSONAL_ONLY"
            ? "Bẫy Bản Quyền Cá Nhân"
            : "Thương Mại Trả Phí",
      "Mức Rủi Ro (An Toàn / Rủi Ro Cao / Nghiêm Trọng)":
        c.auditRisk === "LOW"
          ? "An Toàn (0 Rủi ro / Thấp)"
          : c.auditRisk === "CRITICAL"
            ? "Nghiêm Trọng (Phạt nặng)"
            : "Rủi Ro Cao",
      "Đơn Giá Dự Toán (VNĐ)": c.licenseType === "FREE_OPEN_SOURCE" ? 0 : c.estimatedPriceVND,
      "Phần Mềm FOSS Thay Thế (0đ)": c.recommendedAlternative || "Chuẩn FOSS",
      "Ghi Chú & Hướng Dẫn Pháp Lý": c.actionDetails,
    }));

    const ws3 = XLSX.utils.json_to_sheet(catRows);
    XLSX.utils.book_append_sheet(wb, ws3, "Danh Mục Tiêu Chuẩn (Catalog)");

    XLSX.writeFile(wb, "Mau_Kiem_Toan_Ban_Quyen_3Sheet_Chuan.xlsx");
  }

  function downloadCatalogOnly(customCatalog, catalogInfo) {
    if (typeof XLSX === 'undefined') {
      alert('Thư viện XLSX chưa sẵn sàng!');
      return;
    }

    const wb = XLSX.utils.book_new();
    const catList = customCatalog || [];
    const catRows = catList.map((c) => ({
      "ID": c.id || "",
      "Tên Phần Mềm": c.name,
      "Từ Khóa Nhận Diện": (c.keywords || [c.name]).join(", "),
      "Hãng Sản Xuất": c.vendor,
      "Nhóm Phân Loại": c.category,
      "Loại Bản Quyền":
        c.licenseType === "FREE_OPEN_SOURCE"
          ? "Free / FOSS"
          : c.licenseType === "FREE_PERSONAL_ONLY"
            ? "Bẫy Cá Nhân"
            : "Thương Mại Trả Phí",
      "Mức Rủi Ro": c.auditRisk,
      "Hành Động Đề Xuất": c.suggestedAction || "",
      "Ghi Chú & Hướng Dẫn Pháp Lý": c.actionDetails,
      "Phần Mềm FOSS Thay Thế": c.recommendedAlternative,
      "Đơn Giá Dự Toán (VNĐ)": c.estimatedPriceVND,
      "Bẫy Bản Quyền": c.isTrap ? "Có" : "Không"
    }));

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(catRows), "Catalog");

    if (catalogInfo) {
      const infoRows = [
        { "Field": "Catalog Name", "Value": catalogInfo.name || "Hachihi SAM Standard" },
        { "Field": "Version", "Value": catalogInfo.version || "2026.09" },
        { "Field": "Updated", "Value": catalogInfo.updated || new Date().toLocaleDateString('vi-VN') },
        { "Field": "Author", "Value": catalogInfo.author || "Hachihi" },
        { "Field": "Description", "Value": catalogInfo.description || "Danh mục tiêu chuẩn kiểm toán bản quyền" }
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(infoRows), "Catalog_Info");
    }

    XLSX.writeFile(wb, "Danh_Muc_Phan_Mem_Tieu_Chuan.xlsx");
  }

  function exportAuditReport({ metrics, kpiBreakdown, installations, clientName, auditDate, auditorUnit, catalogInfo }) {
    if (typeof XLSX === 'undefined') {
      alert('Thư viện XLSX chưa sẵn sàng!');
      return;
    }

    const utils = global.SAM_UTILS || {};
    const wb = XLSX.utils.book_new();

    const summaryData = [
      ["HACHIHI SOFTWARE ASSET MANAGEMENT"],
      ["BÁO CÁO TỔNG QUAN KIỂM TOÁN BẢN QUYỀN PHẦN MỀM (SAM REPORT)"],
      ["Khách hàng:", clientName || "Doanh nghiệp"],
      ["Ngày xuất:", auditDate || new Date().toLocaleDateString("vi-VN")],
      ["Đơn vị kiểm toán:", auditorUnit || "Hachihi.vn"],
      ["Bộ tiêu chuẩn:", `${(catalogInfo && catalogInfo.name) || 'Hachihi SAM Standard'} v${(catalogInfo && catalogInfo.version) || '2026.09'}`],
      [],
      ["1. CHỈ SỐ KPI CHÍNH (DASHBOARD)"],
      ["Tỷ lệ tuân thủ bản quyền:", `${metrics.complianceScore}%`],
      ["Tổng số máy tính:", metrics.totalComputers],
      ["Tổng lượt cài đặt:", metrics.totalInstalls],
      ["🔴 Vi phạm / Thiếu hụt hóa đơn:", kpiBreakdown.violation],
      ["🟠 Cần xác minh (Bẫy bản quyền cá nhân):", kpiBreakdown.verify],
      ["🟢 Hợp lệ (Đã có HĐ hoặc FOSS):", kpiBreakdown.valid],
      [],
      ["2. DỰ TOÁN NGÂN SÁCH & TỐI ƯU CHI PHÍ (FINANCIAL IMPACT)"],
      ["Chi phí mua bổ sung bắt buộc (VNĐ/năm):", metrics.totalEstimatedCost],
      ["Chi phí tiết kiệm từ chuyển sang Mã nguồn mở (VNĐ/năm):", -metrics.totalFossSavings],
      ["Ngân sách đầu tư tối ưu ròng - Net Investment (VNĐ/năm):", kpiBreakdown.netInvestment],
      [],
      ["3. LỘ TRÌNH THỰC THI (ACTION PLAN)"],
      [
        "Giai đoạn 1 (07 ngày):",
        "Xử lý ngay rủi ro pháp lý - Gỡ bỏ phần mềm crack/vi phạm nghiêm trọng",
      ],
      [
        "Giai đoạn 2 (30 ngày):",
        "Mua bổ sung bản quyền còn thiếu & ban hành chính sách sử dụng phần mềm",
      ],
      ["Giai đoạn 3 (90 ngày):", "Chuẩn hóa quy trình quản lý tài sản phần mềm (SAM) định kỳ"],
    ];

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), "Tổng Quan BGĐ");

    const detailData = (installations || []).map((i) => ({
      "Mã Thiết Bị (Hostname)": i.computerHostname,
      "Người Sử Dụng": i.userName,
      "Phòng Ban": i.department,
      "Tên Phần Mềm": i.displayName,
      "Phiên Bản": i.version,
      "Hãng SX": i.vendor,
      "Loại License":
        i.licenseType === "FREE_OPEN_SOURCE"
          ? "Open Source"
          : i.licenseType === "FREE_PERSONAL_ONLY"
            ? "OEM/Cá Nhân (Bẫy)"
            : i.licenseType === "COMMERCIAL_PAID" && i.invoiceStatus === "HAS_INVOICE"
              ? "Commercial"
              : "Subscription/Commercial",
      "Mức Độ Rủi Ro": `${utils.getRiskEmoji ? utils.getRiskEmoji(i.auditRisk) : ''} ${i.auditRisk === "LOW" ? "Low" : i.auditRisk === "MEDIUM" ? "Medium" : i.auditRisk === "HIGH" ? "High" : "Critical"}`,
      "Hành Động Đề Xuất": utils.getActionLabelVN ? utils.getActionLabelVN(i.suggestedAction) : i.suggestedAction,
      "Tình Trạng Hóa Đơn":
        i.invoiceStatus === "HAS_INVOICE"
          ? "Đã Có HĐ"
          : i.invoiceStatus === "NOT_APPLICABLE" || i.licenseType === "FREE_OPEN_SOURCE"
            ? "Miễn Phí FOSS"
            : "Thiếu Hóa Đơn",
      "Số Hóa Đơn/Ghi Chú": i.invoiceNumber,
      "Giải Pháp FOSS Thay Thế": i.recommendedAlternative,
      "Chi Phí Dự Kiến (VNĐ)":
        i.invoiceStatus === "MISSING_INVOICE" && i.licenseType !== "FREE_OPEN_SOURCE"
          ? i.estimatedPriceVND
          : 0,
    }));

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailData), "Chi Tiết Kiểm Kê IT");

    const cleanClient = String(clientName || "Doanh_Nghiep").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "_");
    XLSX.writeFile(wb, `Ket_Qua_Kiem_Toan_Ban_Quyen_${cleanClient}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  function exportExecutiveReport(executivePlanRows, metrics, clientName, auditDate) {
    if (typeof XLSX === 'undefined') {
      alert('Thư viện XLSX chưa sẵn sàng!');
      return;
    }
    const wb = XLSX.utils.book_new();
    const rows = (executivePlanRows || []).map((r) => ({
      "STT": r.stt,
      "Tên Phần Mềm": r.name,
      "Số Lượng Máy Dùng": r.installedCount,
      "Số Có Hóa Đơn": r.hasInvoiceCount,
      "Số Vi Phạm/Thiếu": r.missingInvoiceCount,
      "Mức Độ Rủi Ro": r.riskLabel,
      "Phương Án Khuyến Nghị": r.recommendation,
      "Đơn Giá Dự Kiến (VNĐ)": r.unitPrice,
      "Tổng Chi Phí Dự Kiến (VNĐ)": r.totalEstimated,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Tong_Hop_BGD");

    if (metrics) {
      const summaryRows = [
        { "Chỉ Số": "Tỷ Lệ Tuân Thủ", "Giá Trị": `${metrics.complianceScore}%` },
        { "Chỉ Số": "Tổng Số Máy Tính", "Giá Trị": metrics.totalComputers },
        { "Chỉ Số": "Tổng Lượt Cài Đặt", "Giá Trị": metrics.totalInstalls },
        { "Chỉ Số": "Rủi Ro Cao / Nghiêm Trọng", "Giá Trị": metrics.highRisk + metrics.criticalRisk },
        { "Chỉ Số": "Bẫy Bản Quyền Cá Nhân", "Giá Trị": metrics.trapCount },
        { "Chỉ Số": "Dự Toán Mua Bổ Sung", "Giá Trị": metrics.totalEstimatedCost },
        { "Chỉ Số": "Tiết Kiệm Từ FOSS", "Giá Trị": metrics.totalFossSavings }
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), "Chi_So_KPI");
    }

    const cleanClient = String(clientName || "Doanh_Nghiep").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "_");
    XLSX.writeFile(wb, `Bao_Cao_Tong_Hop_BGD_${cleanClient}_${auditDate || new Date().toISOString().slice(0, 10)}.xlsx`);
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
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Chi_Tiet_May_Tinh");

    const cleanClient = String(clientName || "Doanh_Nghiep").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "_");
    XLSX.writeFile(wb, `Danh_Sach_Chi_Tiet_May_Tinh_${cleanClient}_${auditDate || new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  function exportSoftwareCatalog(catalogRules) {
    downloadCatalogOnly(catalogRules, { name: "Hachihi SAM Standard", version: "2026.09" });
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
    generateSampleExcelTemplate
  };

  global.SAM_EXPORT = exportModule;
  global.SAM_EXPORTER = exportModule;

})(typeof window !== 'undefined' ? window : this);
