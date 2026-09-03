import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

const catalogRules = [
  {
    id: "7zip",
    name: "7-Zip",
    keywords: "7-zip, 7zip, 7z, igor pavlov",
    vendor: "Igor Pavlov",
    category: "Tiện ích & Nén",
    licenseType: "FREE_OPEN_SOURCE",
    auditRisk: "LOW",
    suggestedAction: "ALLOW_FREE",
    actionDetails: "Mã nguồn mở GNU LGPL, hoàn toàn miễn phí và an toàn cho doanh nghiệp.",
    recommendedAlternative: "Đang dùng chuẩn tối ưu FOSS",
    estimatedPriceVND: 0,
    isTrap: "Không"
  },
  {
    id: "winrar",
    name: "WinRAR",
    keywords: "winrar, rarlab, win.rar",
    vendor: "win.rar GmbH",
    category: "Tiện ích & Nén",
    licenseType: "FREE_PERSONAL_ONLY",
    auditRisk: "HIGH",
    suggestedAction: "REPLACE_WITH_FOSS",
    actionDetails: "Dùng thử 40 ngày có phí ($29/seat). Cấm dùng bản Free trong công ty. Dễ bị phát hiện khi thanh tra.",
    recommendedAlternative: "7-Zip (FOSS miễn phí 100% doanh nghiệp)",
    estimatedPriceVND: 750000,
    isTrap: "Có"
  },
  {
    id: "ccleaner",
    name: "CCleaner",
    keywords: "ccleaner, piriform",
    vendor: "Piriform / Gen Digital",
    category: "Tiện ích & Nén",
    licenseType: "FREE_PERSONAL_ONLY",
    auditRisk: "HIGH",
    suggestedAction: "UNINSTALL_IMMEDIATELY",
    actionDetails: "Bản Free chỉ dành cho gia đình/cá nhân. Doanh nghiệp bắt buộc mua CCleaner Business hoặc dùng Disk Cleanup / Storage Sense.",
    recommendedAlternative: "Windows Storage Sense / BleachBit (FOSS)",
    estimatedPriceVND: 650000,
    isTrap: "Có"
  },
  {
    id: "idm",
    name: "Internet Download Manager (IDM)",
    keywords: "idm, internet download manager, tonec",
    vendor: "Tonec Inc.",
    category: "Tiện ích & Nén",
    licenseType: "COMMERCIAL_PAID",
    auditRisk: "HIGH",
    suggestedAction: "UNINSTALL_IMMEDIATELY",
    actionDetails: "Thường bị cài patch/crack lậu ($24/máy). Nguy cơ virus và vi phạm bản quyền thương mại.",
    recommendedAlternative: "Free Download Manager (FDM) / JDownloader",
    estimatedPriceVND: 600000,
    isTrap: "Không"
  },
  {
    id: "ultraiso",
    name: "UltraISO",
    keywords: "ultraiso, ezb systems",
    vendor: "EZB Systems",
    category: "Tiện ích & Nén",
    licenseType: "COMMERCIAL_PAID",
    auditRisk: "HIGH",
    suggestedAction: "REPLACE_WITH_FOSS",
    actionDetails: "Phần mềm thương mại trả phí $29. Windows 10/11 đã tích hợp sẵn Mount ISO.",
    recommendedAlternative: "Windows Native Mount / Rufus / ImgBurn",
    estimatedPriceVND: 720000,
    isTrap: "Không"
  },
  {
    id: "rufus",
    name: "Rufus",
    keywords: "rufus",
    vendor: "Pete Batard / FOSS",
    category: "Tiện ích & Nén",
    licenseType: "FREE_OPEN_SOURCE",
    auditRisk: "LOW",
    suggestedAction: "ALLOW_FREE",
    actionDetails: "Mã nguồn mở GPLv3, miễn phí 100% tạo USB boot.",
    recommendedAlternative: "Chuẩn FOSS",
    estimatedPriceVND: 0,
    isTrap: "Không"
  },
  {
    id: "notepadpp",
    name: "Notepad++",
    keywords: "notepad++, notepad plus plus",
    vendor: "Don Ho",
    category: "Tiện ích & Nén",
    licenseType: "FREE_OPEN_SOURCE",
    auditRisk: "LOW",
    suggestedAction: "ALLOW_FREE",
    actionDetails: "Mã nguồn mở GPL, hoàn toàn miễn phí cho doanh nghiệp.",
    recommendedAlternative: "Chuẩn FOSS",
    estimatedPriceVND: 0,
    isTrap: "Không"
  },
  {
    id: "msoffice_pro",
    name: "Microsoft Office (Pro / Home & Business)",
    keywords: "microsoft office, office professional, office home, office 2021, office 2019, office 2016, office 2013, ms office",
    vendor: "Microsoft Corporation",
    category: "Văn phòng",
    licenseType: "COMMERCIAL_PAID",
    auditRisk: "CRITICAL",
    suggestedAction: "VERIFY_INVOICE",
    actionDetails: "Mục tiêu kiểm tra số 1 của Microsoft & BSA. Bắt buộc có Hóa đơn VAT hoặc gói M365 Business.",
    recommendedAlternative: "Microsoft 365 Business / OnlyOffice / LibreOffice",
    estimatedPriceVND: 5800000,
    isTrap: "Không"
  },
  {
    id: "m365_apps",
    name: "Microsoft 365 Business",
    keywords: "m365, microsoft 365, office 365",
    vendor: "Microsoft Corporation",
    category: "Văn phòng",
    licenseType: "COMMERCIAL_PAID",
    auditRisk: "HIGH",
    suggestedAction: "VERIFY_INVOICE",
    actionDetails: "Cần kiểm tra hóa đơn gia hạn hàng năm từ CSP ủy quyền (FPT, CMC, Viettel...).",
    recommendedAlternative: "Duy trì bản quyền CSP",
    estimatedPriceVND: 3200000,
    isTrap: "Không"
  },
  {
    id: "libreoffice",
    name: "LibreOffice",
    keywords: "libreoffice, the document foundation",
    vendor: "The Document Foundation",
    category: "Văn phòng",
    licenseType: "FREE_OPEN_SOURCE",
    auditRisk: "LOW",
    suggestedAction: "ALLOW_FREE",
    actionDetails: "Bộ văn phòng mã nguồn mở mạnh mẽ (MPL 2.0), miễn phí 100% cho DN.",
    recommendedAlternative: "Chuẩn FOSS văn phòng",
    estimatedPriceVND: 0,
    isTrap: "Không"
  },
  {
    id: "onlyoffice",
    name: "ONLYOFFICE Desktop",
    keywords: "onlyoffice, ascensio",
    vendor: "Ascensio System SIA",
    category: "Văn phòng",
    licenseType: "FREE_OPEN_SOURCE",
    auditRisk: "LOW",
    suggestedAction: "ALLOW_FREE",
    actionDetails: "Tương thích cực cao với DOCX/XLSX của MS Office. Miễn phí bản Desktop cho công ty.",
    recommendedAlternative: "Chuẩn FOSS tương thích Office",
    estimatedPriceVND: 0,
    isTrap: "Không"
  },
  {
    id: "wps_office",
    name: "WPS Office",
    keywords: "wps office, kingsoft",
    vendor: "Kingsoft",
    category: "Văn phòng",
    licenseType: "FREE_PERSONAL_ONLY",
    auditRisk: "MEDIUM",
    suggestedAction: "VERIFY_INVOICE",
    actionDetails: "Bản Free có quảng cáo và điều khoản hạn chế DN. Khuyến nghị mua WPS Business hoặc đổi sang OnlyOffice.",
    recommendedAlternative: "WPS Office Business / OnlyOffice",
    estimatedPriceVND: 950000,
    isTrap: "Có"
  },
  {
    id: "adobe_reader",
    name: "Adobe Acrobat Reader (Free)",
    keywords: "acrobat reader, adobe reader, adobe acrobat dc (free)",
    vendor: "Adobe Inc.",
    category: "Xử lý PDF",
    licenseType: "FREE_OPEN_SOURCE",
    auditRisk: "LOW",
    suggestedAction: "ALLOW_FREE",
    actionDetails: "Bản Reader chỉ đọc, được Adobe cấp phép sử dụng miễn phí trong doanh nghiệp.",
    recommendedAlternative: "Đang dùng chuẩn Free Reader",
    estimatedPriceVND: 0,
    isTrap: "Không"
  },
  {
    id: "pdfgear",
    name: "PDFgear",
    keywords: "pdfgear",
    vendor: "PDFgear Lab",
    category: "Xử lý PDF",
    licenseType: "FREE_OPEN_SOURCE",
    auditRisk: "LOW",
    suggestedAction: "ALLOW_FREE",
    actionDetails: "Đầy đủ tính năng Edit, Merge, Convert PDF hoàn toàn miễn phí cho doanh nghiệp.",
    recommendedAlternative: "Giải pháp thay thế Acrobat Pro tối ưu",
    estimatedPriceVND: 0,
    isTrap: "Không"
  },
  {
    id: "sumatrapdf",
    name: "Sumatra PDF",
    keywords: "sumatra, sumatrapdf",
    vendor: "Krzysztof Kowalczyk",
    category: "Xử lý PDF",
    licenseType: "FREE_OPEN_SOURCE",
    auditRisk: "LOW",
    suggestedAction: "ALLOW_FREE",
    actionDetails: "Mã nguồn mở GPLv3, siêu nhẹ, miễn phí 100% cho DN.",
    recommendedAlternative: "Chuẩn FOSS",
    estimatedPriceVND: 0,
    isTrap: "Không"
  },
  {
    id: "foxit_pdf_editor",
    name: "Foxit PDF Editor (Pro)",
    keywords: "foxit pdf editor, foxit phantom, foxit pro",
    vendor: "Foxit Software",
    category: "Xử lý PDF",
    licenseType: "COMMERCIAL_PAID",
    auditRisk: "HIGH",
    suggestedAction: "VERIFY_INVOICE",
    actionDetails: "Thương mại có phí ($159). Bắt buộc có hóa đơn nếu dùng tính năng chỉnh sửa PDF.",
    recommendedAlternative: "PDFgear (Free 100%) / Foxit Reader (Free)",
    estimatedPriceVND: 3900000,
    isTrap: "Không"
  },
  {
    id: "adobe_acrobat_pro",
    name: "Adobe Acrobat Pro DC",
    keywords: "acrobat pro, adobe acrobat pro, acrobat standard",
    vendor: "Adobe Inc.",
    category: "Xử lý PDF",
    licenseType: "COMMERCIAL_PAID",
    auditRisk: "CRITICAL",
    suggestedAction: "VERIFY_INVOICE",
    actionDetails: "Phần mềm đắt tiền ($240/năm). Bắt buộc có hóa đơn gói Adobe VIP / CCE.",
    recommendedAlternative: "Foxit PDF Editor / PDFgear / Adobe Reader Free",
    estimatedPriceVND: 6200000,
    isTrap: "Không"
  },
  {
    id: "rustdesk",
    name: "RustDesk",
    keywords: "rustdesk",
    vendor: "Purslane Ltd / Open Source",
    category: "Remote Desktop",
    licenseType: "FREE_OPEN_SOURCE",
    auditRisk: "LOW",
    suggestedAction: "ALLOW_FREE",
    actionDetails: "Mã nguồn mở AGPLv3, bảo mật cao, miễn phí 100% cho doanh nghiệp.",
    recommendedAlternative: "Giải pháp FOSS Remote Desktop chuẩn",
    estimatedPriceVND: 0,
    isTrap: "Không"
  },
  {
    id: "teamviewer",
    name: "TeamViewer",
    keywords: "teamviewer",
    vendor: "TeamViewer Germany",
    category: "Remote Desktop",
    licenseType: "FREE_PERSONAL_ONLY",
    auditRisk: "HIGH",
    suggestedAction: "REPLACE_WITH_FOSS",
    actionDetails: "Bẫy Free cá nhân (Non-commercial use). DN dùng sẽ bị block time-out và có thể bị hãng gửi thư pháp lý.",
    recommendedAlternative: "RustDesk (FOSS tự host) / UltraViewer / AnyDesk Pro",
    estimatedPriceVND: 12000000,
    isTrap: "Có"
  },
  {
    id: "anydesk",
    name: "AnyDesk",
    keywords: "anydesk",
    vendor: "AnyDesk Software",
    category: "Remote Desktop",
    licenseType: "FREE_PERSONAL_ONLY",
    auditRisk: "HIGH",
    suggestedAction: "REPLACE_WITH_FOSS",
    actionDetails: "Bản Free giới hạn thời gian và chỉ cho cá nhân. Cần mua AnyDesk Solo/Standard hoặc thay bằng RustDesk.",
    recommendedAlternative: "RustDesk / UltraViewer / Windows Quick Assist",
    estimatedPriceVND: 4800000,
    isTrap: "Có"
  },
  {
    id: "ultraviewer",
    name: "UltraViewer",
    keywords: "ultraviewer, ducfabulous",
    vendor: "DucFabulous Ltd.",
    category: "Remote Desktop",
    licenseType: "COMMERCIAL_PAID",
    auditRisk: "LOW",
    suggestedAction: "VERIFY_INVOICE",
    actionDetails: "Phần mềm Việt Nam giá rẻ (~468k/năm). Bắt buộc mua gói Doanh nghiệp.",
    recommendedAlternative: "UltraViewer Business / RustDesk",
    estimatedPriceVND: 468000,
    isTrap: "Không"
  },
  {
    id: "autocad",
    name: "Autodesk AutoCAD",
    keywords: "autocad, autodesk, inventor, revit, civil 3d",
    vendor: "Autodesk Inc.",
    category: "Thiết kế CAD/CAM",
    licenseType: "COMMERCIAL_PAID",
    auditRisk: "CRITICAL",
    suggestedAction: "VERIFY_INVOICE",
    actionDetails: "Autodesk truy quét gắt gao qua BSA. Bắt buộc có Named-user subscription.",
    recommendedAlternative: "ZWCAD / BricsCAD / FreeCAD (FOSS)",
    estimatedPriceVND: 48000000,
    isTrap: "Không"
  },
  {
    id: "photoshop",
    name: "Adobe Photoshop",
    keywords: "photoshop, adobe photoshop",
    vendor: "Adobe Inc.",
    category: "Đồ họa & Thiết kế",
    licenseType: "COMMERCIAL_PAID",
    auditRisk: "CRITICAL",
    suggestedAction: "VERIFY_INVOICE",
    actionDetails: "Thuê bao Adobe Creative Cloud. Phải có HĐ VAT nếu dùng trong DN.",
    recommendedAlternative: "GIMP (FOSS) / Photopea (Web Free) / Affinity Photo",
    estimatedPriceVND: 7200000,
    isTrap: "Không"
  },
  {
    id: "illustrator",
    name: "Adobe Illustrator",
    keywords: "illustrator, adobe illustrator",
    vendor: "Adobe Inc.",
    category: "Đồ họa & Thiết kế",
    licenseType: "COMMERCIAL_PAID",
    auditRisk: "CRITICAL",
    suggestedAction: "VERIFY_INVOICE",
    actionDetails: "Bắt buộc có hóa đơn bản quyền Adobe CC.",
    recommendedAlternative: "Inkscape (FOSS) / Affinity Designer",
    estimatedPriceVND: 7200000,
    isTrap: "Không"
  },
  {
    id: "coreldraw",
    name: "CorelDRAW Graphics Suite",
    keywords: "coreldraw, corel, alludo",
    vendor: "Alludo / Corel",
    category: "Đồ họa & Thiết kế",
    licenseType: "COMMERCIAL_PAID",
    auditRisk: "CRITICAL",
    suggestedAction: "VERIFY_INVOICE",
    actionDetails: "Bắt buộc có hợp đồng bản quyền hoặc HĐ VAT.",
    recommendedAlternative: "Inkscape (FOSS) / Affinity Designer",
    estimatedPriceVND: 14500000,
    isTrap: "Không"
  },
  {
    id: "sketchup",
    name: "SketchUp Pro",
    keywords: "sketchup, trimble",
    vendor: "Trimble Inc.",
    category: "Thiết kế CAD/CAM",
    licenseType: "COMMERCIAL_PAID",
    auditRisk: "HIGH",
    suggestedAction: "VERIFY_INVOICE",
    actionDetails: "Cần có subscription Trimble hợp lệ.",
    recommendedAlternative: "Blender (FOSS 100%) / FreeCAD",
    estimatedPriceVND: 8900000,
    isTrap: "Không"
  },
  {
    id: "blender",
    name: "Blender 3D",
    keywords: "blender, blender foundation",
    vendor: "Blender Foundation",
    category: "Đồ họa & Thiết kế",
    licenseType: "FREE_OPEN_SOURCE",
    auditRisk: "LOW",
    suggestedAction: "ALLOW_FREE",
    actionDetails: "FOSS 100% chuyên nghiệp chuẩn Hollywood, hoàn toàn miễn phí cho doanh nghiệp.",
    recommendedAlternative: "Chuẩn 3D FOSS",
    estimatedPriceVND: 0,
    isTrap: "Không"
  },
  {
    id: "gimp",
    name: "GIMP",
    keywords: "gimp",
    vendor: "The GIMP Team",
    category: "Đồ họa & Thiết kế",
    licenseType: "FREE_OPEN_SOURCE",
    auditRisk: "LOW",
    suggestedAction: "ALLOW_FREE",
    actionDetails: "Xử lý ảnh FOSS miễn phí thay thế Photoshop.",
    recommendedAlternative: "Chuẩn 2D FOSS",
    estimatedPriceVND: 0,
    isTrap: "Không"
  },
  {
    id: "inkscape",
    name: "Inkscape",
    keywords: "inkscape",
    vendor: "Inkscape Community",
    category: "Đồ họa & Thiết kế",
    licenseType: "FREE_OPEN_SOURCE",
    auditRisk: "LOW",
    suggestedAction: "ALLOW_FREE",
    actionDetails: "Vector graphics FOSS miễn phí thay thế Illustrator/CorelDRAW.",
    recommendedAlternative: "Chuẩn Vector FOSS",
    estimatedPriceVND: 0,
    isTrap: "Không"
  },
  {
    id: "unikey",
    name: "UniKey",
    keywords: "unikey",
    vendor: "Phạm Kim Long",
    category: "Gõ tiếng Việt",
    licenseType: "FREE_OPEN_SOURCE",
    auditRisk: "LOW",
    suggestedAction: "ALLOW_FREE",
    actionDetails: "Bộ gõ tiếng Việt quốc dân, hoàn toàn miễn phí và an toàn.",
    recommendedAlternative: "UniKey / EVKey",
    estimatedPriceVND: 0,
    isTrap: "Không"
  },
  {
    id: "evkey",
    name: "EVKey",
    keywords: "evkey",
    vendor: "Lâm Quang Minh",
    category: "Gõ tiếng Việt",
    licenseType: "FREE_OPEN_SOURCE",
    auditRisk: "LOW",
    suggestedAction: "ALLOW_FREE",
    actionDetails: "Bộ gõ tiếng Việt hiện đại, miễn phí.",
    recommendedAlternative: "Chuẩn Freeware",
    estimatedPriceVND: 0,
    isTrap: "Không"
  },
  {
    id: "chrome",
    name: "Google Chrome",
    keywords: "chrome, google chrome",
    vendor: "Google LLC",
    category: "Trình duyệt web",
    licenseType: "FREE_OPEN_SOURCE",
    auditRisk: "LOW",
    suggestedAction: "ALLOW_FREE",
    actionDetails: "Trình duyệt web miễn phí.",
    recommendedAlternative: "Chuẩn Freeware",
    estimatedPriceVND: 0,
    isTrap: "Không"
  },
  {
    id: "vlc",
    name: "VLC media player",
    keywords: "vlc, videolan",
    vendor: "VideoLAN Organization",
    category: "Đa phương tiện",
    licenseType: "FREE_OPEN_SOURCE",
    auditRisk: "LOW",
    suggestedAction: "ALLOW_FREE",
    actionDetails: "Mã nguồn mở GPLv2, miễn phí 100% cho DN.",
    recommendedAlternative: "Chuẩn FOSS",
    estimatedPriceVND: 0,
    isTrap: "Không"
  },
  {
    id: "zalo",
    name: "Zalo PC",
    keywords: "zalo, vng",
    vendor: "VNG Corporation",
    category: "Giao tiếp & Chat",
    licenseType: "FREE_OPEN_SOURCE",
    auditRisk: "LOW",
    suggestedAction: "ALLOW_FREE",
    actionDetails: "Ứng dụng chat phổ biến tại VN, bản cơ bản miễn phí.",
    recommendedAlternative: "Chuẩn Freeware",
    estimatedPriceVND: 0,
    isTrap: "Không"
  },
  {
    id: "internal_pm",
    name: "Phần mềm nội bộ công ty",
    keywords: "nội bộ, internal, custom tool, tool nội bộ, phan mem 001",
    vendor: "Nội bộ công ty",
    category: "Ứng dụng nội bộ",
    licenseType: "FREE_OPEN_SOURCE",
    auditRisk: "LOW",
    suggestedAction: "ALLOW_FREE",
    actionDetails: "Phần mềm viết riêng nội bộ hoặc công cụ freeware, an toàn 100%, 0đ.",
    recommendedAlternative: "Phần mềm nội bộ",
    estimatedPriceVND: 0,
    isTrap: "Không"
  }
];

const catalogRows = catalogRules.map(item => ({
  "ID": item.id,
  "Tên Phần Mềm": item.name,
  "Từ Khóa Nhận Diện": item.keywords,
  "Hãng Sản Xuất": item.vendor,
  "Nhóm Phân Loại": item.category,
  "Loại Bản Quyền": item.licenseType === "FREE_OPEN_SOURCE" 
    ? "Free / FOSS (Miễn Phí Cho DN)" 
    : (item.licenseType === "FREE_PERSONAL_ONLY" ? "Bẫy Cá Nhân (Cấm DN)" : "Thương Mại Trả Phí"),
  "Mức Rủi Ro": item.auditRisk === "LOW" ? "An Toàn" : (item.auditRisk === "CRITICAL" ? "Cực Kỳ Nghiêm Trọng" : "Cao"),
  "Hành Động Đề Xuất": item.suggestedAction,
  "Ghi Chú & Hướng Dẫn Pháp Lý": item.actionDetails,
  "Phần Mềm FOSS Thay Thế": item.recommendedAlternative,
  "Đơn Giá Dự Toán (VNĐ)": item.estimatedPriceVND,
  "Bẫy Bản Quyền": item.isTrap
}));

const catalogInfoRows = [
  { "Field": "Catalog Name", "Value": "Hachihi SAM Standard" },
  { "Field": "Version", "Value": "2026.09" },
  { "Field": "Updated", "Value": "03/09/2026" },
  { "Field": "Author", "Value": "Hachihi" },
  { "Field": "Description", "Value": "Danh mục tiêu chuẩn kiểm toán và tối ưu hóa bản quyền phần mềm doanh nghiệp" }
];

const catalogWb = XLSX.utils.book_new();
const catWs = XLSX.utils.json_to_sheet(catalogRows);
const catInfoWs = XLSX.utils.json_to_sheet(catalogInfoRows);
XLSX.utils.book_append_sheet(catalogWb, catWs, "Catalog");
XLSX.utils.book_append_sheet(catalogWb, catInfoWs, "Catalog_Info");

// Sample Data Workbook
const sampleComputers = [
  {
    "Tên Máy Tính (Hostname)": "KT-DESKTOP-01",
    "Người Sử Dụng": "Nguyễn Thị Hoa",
    "Phòng Ban": "Kế Toán",
    "Số Serial": "DL7090-KT01",
    "Hệ Điều Hành": "Windows 11 Pro 64-bit",
    "Cấu Hình / Model": "Dell OptiPlex 7090 - Core i5, 16GB"
  },
  {
    "Tên Máy Tính (Hostname)": "KD-LAPTOP-02",
    "Người Sử Dụng": "Trần Văn Nam",
    "Phòng Ban": "Kinh Doanh",
    "Số Serial": "LNV-T14-KD02",
    "Hệ Điều Hành": "Windows 10 Pro 64-bit",
    "Cấu Hình / Model": "Lenovo ThinkPad T14 - Core i7, 16GB"
  },
  {
    "Tên Máy Tính (Hostname)": "ENG-WORKSTATION-01",
    "Người Sử Dụng": "Lê Minh Tuấn",
    "Phòng Ban": "Kỹ Thuật",
    "Số Serial": "DL3660-ENG01",
    "Hệ Điều Hành": "Windows 11 Pro",
    "Cấu Hình / Model": "Dell Precision 3660 - Core i9, RTX"
  },
  {
    "Tên Máy Tính (Hostname)": "HR-PC-01",
    "Người Sử Dụng": "Phạm Thu Trang",
    "Phòng Ban": "Hành Chính Nhân Sự",
    "Số Serial": "HP400G7-HR01",
    "Hệ Điều Hành": "Windows 11 Home",
    "Cấu Hình / Model": "HP ProDesk 400 G7 - Core i3, 8GB"
  }
];

const sampleInstalls = [
  {
    "Tên Máy Tính (Hostname)": "KT-DESKTOP-01",
    "Tên Phần Mềm": "Microsoft Office Home & Business 2021",
    "Hãng SX": "Microsoft Corporation",
    "Phiên Bản": "16.0",
    "Tình Trạng Hóa Đơn (Có/Chưa)": "Có",
    "Số Hóa Đơn / Ghi Chú": "HĐ GTGT #0023412"
  },
  {
    "Tên Máy Tính (Hostname)": "KT-DESKTOP-01",
    "Tên Phần Mềm": "7-Zip",
    "Hãng SX": "Igor Pavlov",
    "Phiên Bản": "23.01",
    "Tình Trạng Hóa Đơn (Có/Chưa)": "FOSS",
    "Số Hóa Đơn / Ghi Chú": "FOSS (Không cần HĐ)"
  },
  {
    "Tên Máy Tính (Hostname)": "KT-DESKTOP-01",
    "Tên Phần Mềm": "WinRAR",
    "Hãng SX": "win.rar GmbH",
    "Phiên Bản": "6.24",
    "Tình Trạng Hóa Đơn (Có/Chưa)": "Chưa",
    "Số Hóa Đơn / Ghi Chú": "Cần gỡ bỏ thay bằng 7-Zip"
  },
  {
    "Tên Máy Tính (Hostname)": "KD-LAPTOP-02",
    "Tên Phần Mềm": "TeamViewer",
    "Hãng SX": "TeamViewer Germany",
    "Phiên Bản": "15.48",
    "Tình Trạng Hóa Đơn (Có/Chưa)": "Chưa",
    "Số Hóa Đơn / Ghi Chú": "Bẫy Free cá nhân"
  },
  {
    "Tên Máy Tính (Hostname)": "ENG-WORKSTATION-01",
    "Tên Phần Mềm": "AutoCAD 2024",
    "Hãng SX": "Autodesk Inc.",
    "Phiên Bản": "24.3",
    "Tình Trạng Hóa Đơn (Có/Chưa)": "Chưa",
    "Số Hóa Đơn / Ghi Chú": "Chưa có bản quyền VAT"
  },
  {
    "Tên Máy Tính (Hostname)": "ENG-WORKSTATION-01",
    "Tên Phần Mềm": "Phần mềm nội bộ công ty",
    "Hãng SX": "Nội bộ",
    "Phiên Bản": "1.0",
    "Tình Trạng Hóa Đơn (Có/Chưa)": "FOSS",
    "Số Hóa Đơn / Ghi Chú": "Tool viết riêng nội bộ"
  }
];

const sampleWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(sampleWb, XLSX.utils.json_to_sheet(sampleComputers), "Danh Sách Máy Tính");
XLSX.utils.book_append_sheet(sampleWb, XLSX.utils.json_to_sheet(sampleInstalls), "Danh Sách Phần Mềm");
XLSX.utils.book_append_sheet(sampleWb, catWs, "Danh Mục Tiêu Chuẩn (Catalog)");

// Save to data/ and public/data/
const dirs = ['./data', './public/data'];
dirs.forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

['./data/software_catalog.xlsx', './public/data/software_catalog.xlsx'].forEach(p => {
  XLSX.writeFile(catalogWb, p);
});

['./data/sample_data.xlsx', './public/data/sample_data.xlsx', './data/sample_inventory.xlsx', './public/data/sample_inventory.xlsx'].forEach(p => {
  XLSX.writeFile(sampleWb, p);
});

// Also write software_catalog.json
const catalogJson = JSON.stringify({
  info: {
    name: "Hachihi SAM Standard Software Catalog",
    version: "2026.09",
    date: "2026-09-03"
  },
  rules: catalogRules
}, null, 2);

['./data/software_catalog.json', './public/data/software_catalog.json'].forEach(p => {
  fs.writeFileSync(p, catalogJson, 'utf-8');
});

console.log('Successfully generated software_catalog.xlsx, software_catalog.json, sample_data.xlsx, and sample_inventory.xlsx');
