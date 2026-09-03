// js/constants.js - System Constants and Fallback Data
(function (global) {
  'use strict';

  // Minimal Fallback Catalog for offline / failed load situations
  const FALLBACK_CATALOG = [
    {
      id: "7zip",
      name: "7-Zip",
      keywords: ["7-zip", "7zip", "7z", "igor pavlov"],
      vendor: "Igor Pavlov",
      category: "Tiện ích & Nén",
      licenseType: "FREE_OPEN_SOURCE",
      auditRisk: "LOW",
      suggestedAction: "ALLOW_FREE",
      actionDetails: "Mã nguồn mở GNU LGPL, hoàn toàn miễn phí và an toàn cho doanh nghiệp.",
      recommendedAlternative: "Đang dùng chuẩn tối ưu FOSS",
      estimatedPriceVND: 0,
      isTrap: false
    },
    {
      id: "winrar",
      name: "WinRAR",
      keywords: ["winrar", "rarlab", "win.rar"],
      vendor: "win.rar GmbH",
      category: "Tiện ích & Nén",
      licenseType: "FREE_PERSONAL_ONLY",
      auditRisk: "HIGH",
      suggestedAction: "REPLACE_WITH_FOSS",
      actionDetails: "Dùng thử 40 ngày có phí ($29/seat). Cấm dùng bản Free trong công ty.",
      recommendedAlternative: "7-Zip (FOSS miễn phí 100% doanh nghiệp)",
      estimatedPriceVND: 750000,
      isTrap: true
    },
    {
      id: "msoffice_pro",
      name: "Microsoft Office (Pro / Home & Business)",
      keywords: ["microsoft office", "office professional", "office home", "office 2021", "office 2019", "office 2016", "ms office"],
      vendor: "Microsoft Corporation",
      category: "Văn phòng",
      licenseType: "COMMERCIAL_PAID",
      auditRisk: "CRITICAL",
      suggestedAction: "VERIFY_INVOICE",
      actionDetails: "Mục tiêu kiểm tra số 1 của Microsoft & BSA. Bắt buộc có Hóa đơn VAT.",
      recommendedAlternative: "Microsoft 365 Business / OnlyOffice / LibreOffice",
      estimatedPriceVND: 5800000,
      isTrap: false
    },
    {
      id: "chrome",
      name: "Google Chrome",
      keywords: ["chrome", "google chrome"],
      vendor: "Google LLC",
      category: "Trình duyệt web",
      licenseType: "FREE_OPEN_SOURCE",
      auditRisk: "LOW",
      suggestedAction: "ALLOW_FREE",
      actionDetails: "Trình duyệt web miễn phí.",
      recommendedAlternative: "Chuẩn Freeware",
      estimatedPriceVND: 0,
      isTrap: false
    },
    {
      id: "autocad",
      name: "Autodesk AutoCAD",
      keywords: ["autocad", "autodesk"],
      vendor: "Autodesk Inc.",
      category: "Thiết kế CAD/CAM",
      licenseType: "COMMERCIAL_PAID",
      auditRisk: "CRITICAL",
      suggestedAction: "VERIFY_INVOICE",
      actionDetails: "Autodesk truy quét gắt gao qua BSA. Bắt buộc có Named-user subscription.",
      recommendedAlternative: "ZWCAD / BricsCAD / FreeCAD (FOSS)",
      estimatedPriceVND: 48000000,
      isTrap: false
    },
    {
      id: "internal_pm",
      name: "Phần mềm nội bộ công ty",
      keywords: ["nội bộ", "internal", "custom tool", "tool nội bộ", "phan mem 001"],
      vendor: "Nội bộ công ty",
      category: "Ứng dụng nội bộ",
      licenseType: "FREE_OPEN_SOURCE",
      auditRisk: "LOW",
      suggestedAction: "ALLOW_FREE",
      actionDetails: "Phần mềm viết riêng nội bộ hoặc công cụ freeware, an toàn 100%, 0đ.",
      recommendedAlternative: "Phần mềm nội bộ",
      estimatedPriceVND: 0,
      isTrap: false
    }
  ];

  const SAMPLE_COMPUTERS_FALLBACK = [
    {
      hostname: "KT-DESKTOP-01",
      user: "Nguyễn Thị Hoa",
      department: "Kế Toán",
      os: "Windows 11 Pro 64-bit",
      model: "Dell OptiPlex 7090 - Core i5, 16GB",
      serial: "DL7090-KT01"
    },
    {
      hostname: "KD-LAPTOP-02",
      user: "Trần Văn Nam",
      department: "Kinh Doanh",
      os: "Windows 10 Pro 64-bit",
      model: "Lenovo ThinkPad T14 - Core i7, 16GB",
      serial: "LNV-T14-KD02"
    },
    {
      hostname: "ENG-WORKSTATION-01",
      user: "Lê Minh Tuấn",
      department: "Kỹ Thuật",
      os: "Windows 11 Pro",
      model: "Dell Precision 3660 - Core i9, RTX",
      serial: "DL3660-ENG01"
    },
    {
      hostname: "HR-PC-01",
      user: "Phạm Thu Trang",
      department: "Hành Chính Nhân Sự",
      os: "Windows 11 Home",
      model: "HP ProDesk 400 G7 - Core i3, 8GB",
      serial: "HP400G7-HR01"
    }
  ];

  const SAMPLE_INSTALLS_FALLBACK = [
    {
      id: "1",
      computerHostname: "KT-DESKTOP-01",
      userName: "Nguyễn Thị Hoa",
      department: "Kế Toán",
      rawSoftwareName: "Microsoft Office Home & Business 2021",
      displayName: "Microsoft Office (Pro / Home & Business)",
      version: "16.0",
      vendor: "Microsoft Corporation",
      category: "Văn phòng",
      licenseType: "COMMERCIAL_PAID",
      auditRisk: "CRITICAL",
      suggestedAction: "VERIFY_INVOICE",
      actionDetails: "Mục tiêu kiểm tra số 1 của Microsoft & BSA. Bắt buộc có Hóa đơn VAT hoặc gói M365 Business.",
      recommendedAlternative: "Microsoft 365 Business / OnlyOffice / LibreOffice",
      estimatedPriceVND: 5800000,
      invoiceStatus: "HAS_INVOICE",
      invoiceNumber: "HĐ GTGT #0023412",
      isTrap: false
    },
    {
      id: "2",
      computerHostname: "KT-DESKTOP-01",
      userName: "Nguyễn Thị Hoa",
      department: "Kế Toán",
      rawSoftwareName: "7-Zip",
      displayName: "7-Zip",
      version: "23.01",
      vendor: "Igor Pavlov",
      category: "Tiện ích & Nén",
      licenseType: "FREE_OPEN_SOURCE",
      auditRisk: "LOW",
      suggestedAction: "ALLOW_FREE",
      actionDetails: "Mã nguồn mở GNU LGPL, hoàn toàn miễn phí cho doanh nghiệp.",
      recommendedAlternative: "Đang dùng chuẩn tối ưu FOSS",
      estimatedPriceVND: 0,
      invoiceStatus: "NOT_APPLICABLE",
      invoiceNumber: "FOSS (Không cần HĐ)",
      isTrap: false
    },
    {
      id: "3",
      computerHostname: "KT-DESKTOP-01",
      userName: "Nguyễn Thị Hoa",
      department: "Kế Toán",
      rawSoftwareName: "WinRAR",
      displayName: "WinRAR",
      version: "6.24",
      vendor: "win.rar GmbH",
      category: "Tiện ích & Nén",
      licenseType: "FREE_PERSONAL_ONLY",
      auditRisk: "HIGH",
      suggestedAction: "REPLACE_WITH_FOSS",
      actionDetails: "Dùng thử 40 ngày có phí. Cấm dùng bản Free trong công ty.",
      recommendedAlternative: "7-Zip (FOSS miễn phí 100% doanh nghiệp)",
      estimatedPriceVND: 750000,
      invoiceStatus: "MISSING_INVOICE",
      invoiceNumber: "",
      isTrap: true
    },
    {
      id: "4",
      computerHostname: "KD-LAPTOP-02",
      userName: "Trần Văn Nam",
      department: "Kinh Doanh",
      rawSoftwareName: "TeamViewer",
      displayName: "TeamViewer",
      version: "15.48",
      vendor: "TeamViewer Germany",
      category: "Remote Desktop",
      licenseType: "FREE_PERSONAL_ONLY",
      auditRisk: "HIGH",
      suggestedAction: "REPLACE_WITH_FOSS",
      actionDetails: "Bẫy Free cá nhân (Non-commercial use). DN dùng sẽ bị block time-out.",
      recommendedAlternative: "RustDesk (FOSS tự host) / UltraViewer / AnyDesk Pro",
      estimatedPriceVND: 12000000,
      invoiceStatus: "MISSING_INVOICE",
      invoiceNumber: "",
      isTrap: true
    },
    {
      id: "5",
      computerHostname: "ENG-WORKSTATION-01",
      userName: "Lê Minh Tuấn",
      department: "Kỹ Thuật",
      rawSoftwareName: "AutoCAD 2024",
      displayName: "Autodesk AutoCAD",
      version: "24.3",
      vendor: "Autodesk Inc.",
      category: "Thiết kế CAD/CAM",
      licenseType: "COMMERCIAL_PAID",
      auditRisk: "CRITICAL",
      suggestedAction: "VERIFY_INVOICE",
      actionDetails: "Autodesk truy quét gắt gao qua BSA. Bắt buộc có Named-user subscription.",
      recommendedAlternative: "ZWCAD / BricsCAD / FreeCAD (FOSS)",
      estimatedPriceVND: 48000000,
      invoiceStatus: "MISSING_INVOICE",
      invoiceNumber: "",
      isTrap: false
    },
    {
      id: "6",
      computerHostname: "ENG-WORKSTATION-01",
      userName: "Lê Minh Tuấn",
      department: "Kỹ Thuật",
      rawSoftwareName: "Phần mềm nội bộ công ty",
      displayName: "Phần mềm nội bộ công ty",
      version: "1.0",
      vendor: "Nội bộ",
      category: "Ứng dụng nội bộ",
      licenseType: "FREE_OPEN_SOURCE",
      auditRisk: "LOW",
      suggestedAction: "ALLOW_FREE",
      actionDetails: "Tool viết riêng nội bộ (An toàn 100%, 0đ)",
      recommendedAlternative: "Nội bộ",
      estimatedPriceVND: 0,
      invoiceStatus: "NOT_APPLICABLE",
      invoiceNumber: "Phần mềm nội bộ",
      isTrap: false
    }
  ];

  const CATEGORY_FILTER_OPTIONS = [
    "Thương mại",
    "Miễn phí (Freeware)",
    "Bản quyền cá nhân",
    "Freemium",
    "Phần mềm rác",
    "Tool Crack"
  ];

  const RISK_FILTER_OPTIONS = [
    "An Toàn",
    "Trung Bình",
    "Cao",
    "Rất Cao",
    "Cực Kỳ Nghiêm Trọng",
    "Thấp"
  ];

  const CATALOG_INFO_DEFAULT = {
    name: "Hachihi SAM Standard",
    version: "2026.09",
    updated: "03/09/2026",
    author: "Hachihi",
    description: "Danh mục tiêu chuẩn bản quyền"
  };

  global.SAM_CONSTANTS = {
    FALLBACK_CATALOG,
    DEFAULT_SOFTWARE_RULES: FALLBACK_CATALOG,
    SAMPLE_COMPUTERS_FALLBACK,
    DEFAULT_SAMPLE_COMPUTERS: SAMPLE_COMPUTERS_FALLBACK,
    SAMPLE_INSTALLS_FALLBACK,
    DEFAULT_SAMPLE_INSTALLATIONS: SAMPLE_INSTALLS_FALLBACK,
    CATEGORY_FILTER_OPTIONS,
    RISK_FILTER_OPTIONS,
    CATALOG_INFO_DEFAULT
  };

})(typeof window !== 'undefined' ? window : this);
