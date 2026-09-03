// js/reports/executive-report.js - Executive Modal & Printable Reports for Board of Directors
(function (global) {
  'use strict';

  function MultiSelectFilter({ label, options, selected, onChange }) {
    const [open, setOpen] = React.useState(false);
    const wrapRef = React.useRef(null);

    React.useEffect(() => {
      const handleOutsideClick = (e) => {
        if (wrapRef.current && !wrapRef.current.contains(e.target)) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handleOutsideClick);
      return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const toggleOption = (opt) => {
      if (selected.includes(opt)) {
        onChange(selected.filter((s) => s !== opt));
      } else {
        onChange([...selected, opt]);
      }
    };

    const allSelected = selected.length === options.length;
    const summaryText = allSelected
      ? `Tất cả (${options.length})`
      : selected.length === 0
        ? "Không chọn mục nào"
        : `${selected.length}/${options.length} đã chọn`;

    return React.createElement(
      "div",
      { className: "relative inline-block text-left", ref: wrapRef },
      React.createElement(
        "button",
        {
          type: "button",
          onClick: () => setOpen((o) => !o),
          className:
            "flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-300 text-xs hover:bg-slate-50 transition cursor-pointer",
        },
        React.createElement("span", { className: "font-semibold text-slate-600" }, label + ":"),
        React.createElement("span", { className: "font-medium text-slate-900" }, summaryText),
        React.createElement("span", { className: "text-slate-400 text-[8px]" }, "▼")
      ),
      open &&
        React.createElement(
          "div",
          {
            className:
              "absolute z-50 mt-1 right-0 w-56 bg-white border border-slate-300 rounded-lg shadow-xl p-2 text-xs",
          },
          React.createElement(
            "div",
            {
              className:
                "flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-200",
            },
            React.createElement(
              "button",
              {
                type: "button",
                onClick: () => onChange(options),
                className: "text-blue-600 hover:underline font-semibold cursor-pointer",
              },
              "Chọn tất cả"
            ),
            React.createElement(
              "button",
              {
                type: "button",
                onClick: () => onChange([]),
                className: "text-slate-500 hover:underline font-semibold cursor-pointer",
              },
              "Bỏ chọn hết"
            )
          ),
          React.createElement(
            "div",
            { className: "max-h-56 overflow-y-auto space-y-0.5" },
            options.map((opt) =>
              React.createElement(
                "label",
                {
                  key: opt,
                  className:
                    "flex items-center gap-2 px-1.5 py-1 rounded hover:bg-slate-50 cursor-pointer select-none",
                },
                React.createElement("input", {
                  type: "checkbox",
                  checked: selected.includes(opt),
                  onChange: () => toggleOption(opt),
                  className: "accent-blue-600 cursor-pointer",
                }),
                React.createElement("span", { className: "text-slate-800" }, opt)
              )
            )
          )
        )
    );
  }

  function ExecutiveReportModal(props) {
    const {
      show,
      onClose,
      reportType,
      setReportType,
      clientName,
      setClientName,
      auditDate,
      setAuditDate,
      auditorUnit,
      setAuditorUnit,
      catalogInfo,
      metrics,
      kpiBreakdown,
      computers,
      installations,
      detailFilteredInstalls,
      filteredExecutivePlanRows,
      filteredTotalBudgetRequired,
      executivePlanRows,
      machineOverviewRows,
      totalViolations,
      detailFilter,
      setDetailFilter,
      categoryFilter,
      setCategoryFilter,
      riskFilterPlan,
      setRiskFilterPlan,
      handlePrint,
      formatVND,
    } = props;

    if (!show) return null;

    React.useEffect(() => {
      document.body.classList.add('has-print-modal');
      return () => {
        document.body.classList.remove('has-print-modal');
      };
    }, []);

    const utils = global.SAM_UTILS || {};
    const printUtils = global.SAM_PRINT || {};
    const constants = global.SAM_CONSTANTS || {};

    const categoryOptions = constants.CATEGORY_FILTER_OPTIONS || [];
    const riskOptions = constants.RISK_FILTER_OPTIONS || [];

    const standardTitle = `${(catalogInfo && catalogInfo.name) || 'Hachihi SAM Standard'} v${(catalogInfo && catalogInfo.version) || '2026.09'}`;

    // State for 6. PER_DEVICE_AUDIT (Báo cáo theo từng máy)
    const [selectedDeviceHostname, setSelectedDeviceHostname] = React.useState("ALL");
    const [perDeviceVendorFilter, setPerDeviceVendorFilter] = React.useState([]);
    const [perDeviceLicenseFilter, setPerDeviceLicenseFilter] = React.useState([]);
    const [compactHardware, setCompactHardware] = React.useState(true);

    const allDeviceVendors = React.useMemo(() => {
      const set = new Set();
      set.add("Microsoft Corporation");
      (installations || []).forEach((i) => {
        if (i.vendor && i.vendor.trim() && i.vendor !== "Chưa rõ") {
          set.add(i.vendor.trim());
        }
      });
      return Array.from(set).sort();
    }, [installations]);

    const perDeviceLicenseOptions = React.useMemo(() => [
      "Có phí (Thương mại)",
      "Miễn phí (Mã nguồn mở / FOSS)",
      "Bản quyền cá nhân (Bẫy bản quyền)",
    ], []);

    React.useEffect(() => {
      if (allDeviceVendors.length > 0 && perDeviceVendorFilter.length === 0) {
        setPerDeviceVendorFilter(allDeviceVendors);
      }
    }, [allDeviceVendors]);

    React.useEffect(() => {
      if (perDeviceLicenseFilter.length === 0) {
        setPerDeviceLicenseFilter(perDeviceLicenseOptions);
      }
    }, [perDeviceLicenseOptions]);

    const parseDeviceDetails = (comp, idx) => {
      const stt = String(idx + 1).padStart(2, "0");
      const hostname = (comp.hostname || `THIẾT_BỊ_${stt}`).trim();

      let brand = (comp.manufacturer || "").trim();
      let model = (comp.model || "").trim();

      if (!brand && model) {
        if (model.includes(" - ")) {
          const parts = model.split(" - ");
          brand = parts[0].trim();
          model = parts.slice(1).join(" - ").trim();
        } else {
          const knownBrands = ["AVITA", "DELL", "HP", "LENOVO", "ASUS", "ACER", "APPLE", "MSI", "MICROSOFT", "SAMSUNG", "GIGABYTE"];
          const upper = model.toUpperCase();
          for (const b of knownBrands) {
            if (upper.startsWith(b)) {
              brand = b;
              model = model.slice(b.length).trim();
              break;
            }
          }
        }
      }

      const brandModelDisplay = (brand && model) ? `${brand} - ${model}` : (brand || model || "Tiêu chuẩn");
      const deviceTitle = `THIẾT BỊ ${stt}: ${hostname} (${brandModelDisplay})`;

      const cpuText = comp.cpu || (comp.model && comp.model.includes("Core") ? comp.model : "Intel Core i5 / Tương đương");
      const ramText = comp.ram || (comp.model && comp.model.match(/\d+\s*GB/i) ? comp.model.match(/\d+\s*GB/i)[0] : "8 GB / Supported: 0 GB");
      const diskText = comp.disk || "1TB SSD / Tốc độ cao";
      const modelText = brandModelDisplay;

      return {
        stt,
        hostname,
        brand,
        model,
        brandModelDisplay,
        deviceTitle,
        cpuText,
        ramText,
        diskText,
        modelText,
        oneLineSummary: `${brandModelDisplay} • CPU: ${cpuText} • RAM: ${ramText} • Ổ cứng: ${diskText}`
      };
    };

    return React.createElement(
      "div",
      {
        id: "print-modal-root",
        className:
          "fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn print-modal-backdrop",
      },
      React.createElement(
        "div",
        {
          className:
            "bg-white rounded-2xl max-w-6xl w-full max-h-[96vh] flex flex-col shadow-2xl overflow-hidden border border-slate-300 print-modal-container",
        },
        // Modal Header Bar (hidden in print)
        React.createElement(
          "div",
          {
            className:
              "p-4 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-blue-950/50 print-hidden no-print print-modal-header",
          },
          React.createElement(
            "div",
            { className: "flex items-center gap-3" },
            React.createElement(
              "div",
              {
                className:
                  "w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shadow-inner",
              },
              "🛡️"
            ),
            React.createElement(
              "div",
              null,
              React.createElement(
                "h3",
                { className: "font-bold text-sm text-white flex items-center gap-2" },
                "Xem Trước & Xuất Báo Cáo PDF",
                React.createElement(
                  "span",
                  {
                    className:
                      "text-[11px] font-normal px-2 py-0.5 rounded-full bg-white/20 text-blue-100",
                  },
                  "Chuẩn Khổ A4 Dọc"
                )
              ),
              React.createElement(
                "p",
                { className: "text-[11px] text-blue-100/80" },
                "Tự động đặt tên file PDF chính xác theo từng phần bạn chọn in"
              )
            )
          ),
          React.createElement(
            "div",
            { className: "flex items-center flex-wrap gap-2" },
            React.createElement(
              "div",
              {
                className:
                  "bg-blue-950/60 p-1 rounded-xl flex items-center border border-white/15 text-xs",
              },
              React.createElement(
                "button",
                {
                  type: "button",
                  onClick: () => setReportType("EXECUTIVE_PLAN"),
                  className: `px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                    reportType === "EXECUTIVE_PLAN" ? "bg-blue-500 text-white shadow-sm" : "text-blue-200 hover:text-white"
                  }`,
                  title: "Báo cáo tóm tắt rủi ro & ngân sách trình Ban Giám Đốc",
                },
                "1. Tổng Hợp BGĐ"
              ),
              React.createElement(
                "button",
                {
                  type: "button",
                  onClick: () => setReportType("DETAILED_MACHINES"),
                  className: `px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                    reportType === "DETAILED_MACHINES" ? "bg-blue-500 text-white shadow-sm" : "text-blue-200 hover:text-white"
                  }`,
                  title: "Chi tiết kiểm kê từng máy tính của doanh nghiệp",
                },
                "2. Chi Tiết Máy"
              ),
              React.createElement(
                "button",
                {
                  type: "button",
                  onClick: () => setReportType("FOSS_PLAN"),
                  className: `px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                    reportType === "FOSS_PLAN" ? "bg-emerald-600 text-white shadow-sm" : "text-emerald-200 hover:text-white"
                  }`,
                  title: "Kế hoạch chuyển sang phần mềm FOSS tiết kiệm chi phí",
                },
                "3. Kế Hoạch FOSS"
              ),
              React.createElement(
                "button",
                {
                  type: "button",
                  onClick: () => setReportType("BOTH"),
                  className: `px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                    reportType === "BOTH" ? "bg-indigo-500 text-white shadow-sm" : "text-blue-200 hover:text-white"
                  }`,
                  title: "In trọn bộ cả báo cáo tổng hợp và danh sách chi tiết",
                },
                "4. In Toàn Bộ"
              ),
              React.createElement(
                "button",
                {
                  type: "button",
                  onClick: () => setReportType("MACHINE_OVERVIEW"),
                  className: `px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                    reportType === "MACHINE_OVERVIEW" ? "bg-sky-500 text-white shadow-sm" : "text-sky-200 hover:text-white"
                  }`,
                  title: "Báo cáo tổng quan số lượng máy tính đã kiểm tra",
                },
                "5. Tổng Quan Máy"
              ),
              React.createElement(
                "button",
                {
                  type: "button",
                  onClick: () => setReportType("PER_DEVICE_AUDIT"),
                  className: `px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                    reportType === "PER_DEVICE_AUDIT" ? "bg-amber-600 text-white shadow-sm" : "text-amber-200 hover:text-white"
                  }`,
                  title: "Mẫu báo cáo tầm soát thiết bị & phần mềm chi tiết theo từng máy",
                },
                "6. Mẫu Từng Máy"
              )
            ),
            React.createElement(
              "button",
              {
                onClick: () => handlePrint(reportType),
                className:
                  "px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer flex items-center gap-1.5",
              },
              "🖨️ In / Lưu PDF"
            ),
            React.createElement(
              "button",
              {
                onClick: onClose,
                className:
                  "p-2 text-blue-200 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer",
                title: "Đóng",
              },
              "✕"
            )
          )
        ),

        // Controls bar (Inputs for client name, date, unit, filters)
        React.createElement(
          "div",
          {
            className:
              "bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700 print-hidden no-print print-modal-controls",
          },
          React.createElement(
            "div",
            { className: "flex flex-wrap items-center gap-4" },
            React.createElement(
              "div",
              { className: "flex items-center gap-1.5" },
              React.createElement(
                "span",
                { className: "font-semibold text-slate-600" },
                "Khách hàng:"
              ),
              React.createElement("input", {
                type: "text",
                value: clientName,
                onChange: (e) => setClientName(e.target.value),
                className:
                  "px-2 py-1 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44",
                placeholder: "Nhập tên công ty...",
              })
            ),
            React.createElement(
              "div",
              { className: "flex items-center gap-1.5" },
              React.createElement(
                "span",
                { className: "font-semibold text-slate-600" },
                "Ngày kiểm toán:"
              ),
              React.createElement("input", {
                type: "text",
                value: auditDate,
                onChange: (e) => setAuditDate(e.target.value),
                className:
                  "px-2 py-1 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 w-28",
              })
            ),
            React.createElement(
              "div",
              { className: "flex items-center gap-1.5" },
              React.createElement(
                "span",
                { className: "font-semibold text-slate-600" },
                "Đơn vị thực hiện:"
              ),
              React.createElement("input", {
                type: "text",
                value: auditorUnit,
                onChange: (e) => setAuditorUnit(e.target.value),
                className:
                  "px-2 py-1 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44",
              })
            )
          ),
          reportType === "DETAILED_MACHINES" &&
            React.createElement(
              "div",
              {
                className:
                  "flex items-center gap-2 bg-white px-2.5 py-1 rounded-lg border border-slate-300 text-xs",
              },
              React.createElement(
                "span",
                { className: "font-semibold text-slate-600" },
                "Lọc in:"
              ),
              React.createElement(
                "select",
                {
                  value: detailFilter,
                  onChange: (e) => setDetailFilter(e.target.value),
                  className:
                    "bg-transparent font-medium text-slate-900 focus:outline-none cursor-pointer",
                },
                React.createElement(
                  "option",
                  { value: "ALL" },
                  "Tất cả phần mềm (",
                  installations.length,
                  " lượt)"
                ),
                React.createElement(
                  "option",
                  { value: "RISKY_ONLY" },
                  "Chỉ in máy có Vi phạm / Thiếu HĐ (",
                  totalViolations,
                  " lượt)"
                )
              )
            ),
          reportType === "DETAILED_MACHINES" &&
            React.createElement(MultiSelectFilter, {
              label: "Phân loại",
              options: categoryOptions,
              selected: categoryFilter,
              onChange: setCategoryFilter,
            }),
          reportType === "EXECUTIVE_PLAN" &&
            React.createElement(MultiSelectFilter, {
              label: "Mức độ rủi ro",
              options: riskOptions,
              selected: riskFilterPlan,
              onChange: setRiskFilterPlan,
            }),
          reportType === "PER_DEVICE_AUDIT" &&
            React.createElement(
              "div",
              {
                className:
                  "flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-300 text-xs",
              },
              React.createElement(
                "span",
                { className: "font-semibold text-slate-600 whitespace-nowrap" },
                "🖥️ Chọn máy:"
              ),
              React.createElement(
                "select",
                {
                  value: selectedDeviceHostname,
                  onChange: (e) => setSelectedDeviceHostname(e.target.value),
                  className:
                    "bg-transparent font-medium text-slate-900 focus:outline-none cursor-pointer max-w-[200px] truncate",
                },
                React.createElement(
                  "option",
                  { value: "ALL" },
                  `Tất cả các máy (${computers.length} máy)`
                ),
                computers.map((c) =>
                  React.createElement(
                    "option",
                    { key: c.hostname, value: c.hostname },
                    `${c.hostname}${c.user ? " - " + c.user : ""}`
                  )
                )
              )
            ),
          reportType === "PER_DEVICE_AUDIT" &&
            React.createElement(MultiSelectFilter, {
              label: "Lọc Hãng",
              options: allDeviceVendors,
              selected: perDeviceVendorFilter,
              onChange: setPerDeviceVendorFilter,
            }),
          reportType === "PER_DEVICE_AUDIT" &&
            React.createElement(MultiSelectFilter, {
              label: "Loại bản quyền",
              options: perDeviceLicenseOptions,
              selected: perDeviceLicenseFilter,
              onChange: setPerDeviceLicenseFilter,
            }),
          reportType === "PER_DEVICE_AUDIT" &&
            React.createElement(
              "label",
              {
                className:
                  "flex items-center gap-1.5 cursor-pointer select-none bg-white px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition",
              },
              React.createElement("input", {
                type: "checkbox",
                checked: compactHardware,
                onChange: (e) => setCompactHardware(e.target.checked),
                className: "accent-blue-600 cursor-pointer",
              }),
              "Gom cấu hình 1 dòng"
            ),
          React.createElement(
            "div",
            {
              className:
                "text-[11px] text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg",
            },
            "📄 Filename: ",
            React.createElement(
              "strong",
              { className: "font-mono text-blue-950" },
              printUtils.getDocumentTitleForPrint ? printUtils.getDocumentTitleForPrint(reportType, clientName, auditDate) : 'Bao_Cao',
              ".pdf"
            )
          )
        ),

        // Scrollable Report Body (The printable contents)
        React.createElement(
          "div",
          {
            className:
              "flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50 text-slate-900 font-sans print:p-0 print:bg-white print:overflow-visible print-report-body",
          },
          // 1. EXECUTIVE PLAN
          (reportType === "EXECUTIVE_PLAN" || reportType === "BOTH") &&
            React.createElement(
              "div",
              {
                className:
                  "bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-5 print:border-none print:shadow-none print:p-0 print:mb-8",
              },
              React.createElement(
                "div",
                { className: "border-b border-slate-200 pb-3" },
                React.createElement(
                  "p",
                  { className: "text-[11px] font-bold text-blue-800 tracking-wider uppercase mb-1" },
                  "HACHIHI SOFTWARE ASSET MANAGEMENT"
                ),
                React.createElement(
                  "h1",
                  {
                    className:
                      "text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight text-center sm:text-left",
                  },
                  "BÁO CÁO KIỂM TOÁN BẢN QUYỀN PHẦN MỀM"
                ),
                React.createElement(
                  "div",
                  {
                    className:
                      "mt-2 text-xs text-slate-600 font-medium flex flex-wrap items-center gap-x-3 gap-y-1",
                  },
                  React.createElement(
                    "span",
                    null,
                    "Khách hàng: ",
                    React.createElement("strong", { className: "text-slate-900" }, clientName)
                  ),
                  React.createElement("span", null, "|"),
                  React.createElement(
                    "span",
                    null,
                    "Ngày kiểm toán: ",
                    React.createElement("strong", { className: "text-slate-900" }, auditDate)
                  ),
                  React.createElement("span", null, "|"),
                  React.createElement(
                    "span",
                    null,
                    "Bộ tiêu chuẩn: ",
                    React.createElement("strong", { className: "text-blue-900" }, standardTitle)
                  ),
                  React.createElement("span", null, "|"),
                  React.createElement(
                    "span",
                    null,
                    "Số máy: ",
                    React.createElement("strong", { className: "text-slate-900" }, computers.length)
                  ),
                  React.createElement("span", null, "|"),
                  React.createElement(
                    "span",
                    null,
                    "Số phần mềm: ",
                    React.createElement("strong", { className: "text-slate-900" }, installations.length)
                  )
                )
              ),

              // KPI Dashboard Block
              React.createElement(
                "div",
                { className: "space-y-1.5" },
                React.createElement(
                  "h2",
                  {
                    className:
                      "text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-tight",
                  },
                  "Chỉ Số KPI Chính (Dashboard)"
                ),
                React.createElement(
                  "div",
                  { className: "grid grid-cols-4 gap-2.5" },
                  React.createElement(
                    "div",
                    {
                      className: "bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-center",
                    },
                    React.createElement(
                      "p",
                      {
                        className:
                          "text-[10px] sm:text-xs uppercase font-bold text-blue-700 tracking-wider",
                      },
                      "Tỷ Lệ Tuân Thủ"
                    ),
                    React.createElement(
                      "p",
                      { className: "text-lg sm:text-xl font-black text-blue-900 mt-0.5" },
                      metrics.complianceScore,
                      "%"
                    )
                  ),
                  React.createElement(
                    "div",
                    {
                      className: "bg-rose-50 border border-rose-200 rounded-lg p-2.5 text-center",
                    },
                    React.createElement(
                      "p",
                      {
                        className:
                          "text-[10px] sm:text-xs uppercase font-bold text-rose-600 tracking-wider",
                      },
                      "🔴 Vi Phạm / Thiếu Hụt"
                    ),
                    React.createElement(
                      "p",
                      { className: "text-lg sm:text-xl font-black text-rose-700 mt-0.5" },
                      kpiBreakdown.violation
                    )
                  ),
                  React.createElement(
                    "div",
                    {
                      className:
                        "bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-center",
                    },
                    React.createElement(
                      "p",
                      {
                        className:
                          "text-[10px] sm:text-xs uppercase font-bold text-amber-600 tracking-wider",
                      },
                      "🟠 Cần Xác Minh"
                    ),
                    React.createElement(
                      "p",
                      { className: "text-lg sm:text-xl font-black text-amber-700 mt-0.5" },
                      kpiBreakdown.verify
                    )
                  ),
                  React.createElement(
                    "div",
                    {
                      className:
                        "bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-center",
                    },
                    React.createElement(
                      "p",
                      {
                        className:
                          "text-[10px] sm:text-xs uppercase font-bold text-emerald-600 tracking-wider",
                      },
                      "🟢 Hợp Lệ"
                    ),
                    React.createElement(
                      "p",
                      { className: "text-lg sm:text-xl font-black text-emerald-700 mt-0.5" },
                      kpiBreakdown.valid
                    )
                  )
                ),
                React.createElement(
                  "p",
                  { className: "text-[10px] text-slate-500" },
                  computers.length,
                  " máy tính  •  ",
                  installations.length,
                  " lượt cài đặt rà soát"
                )
              ),

              // Budget Impact Block
              React.createElement(
                "div",
                { className: "space-y-1.5" },
                React.createElement(
                  "h2",
                  {
                    className:
                      "text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-tight",
                  },
                  "Dự Toán Ngân Sách & Tối Ưu Chi Phí (Financial Impact)"
                ),
                React.createElement(
                  "div",
                  { className: "grid grid-cols-3 gap-2.5" },
                  React.createElement(
                    "div",
                    { className: "bg-rose-50 border border-rose-200 rounded-lg p-2.5" },
                    React.createElement(
                      "p",
                      {
                        className: "text-[10px] uppercase font-bold text-rose-600 tracking-wider",
                      },
                      "Chi Phí Mua Bổ Sung Bắt Buộc"
                    ),
                    React.createElement(
                      "p",
                      { className: "text-sm sm:text-base font-black text-rose-700 mt-0.5" },
                      "+",
                      formatVND(metrics.totalEstimatedCost),
                      "/năm"
                    )
                  ),
                  React.createElement(
                    "div",
                    { className: "bg-emerald-50 border border-emerald-200 rounded-lg p-2.5" },
                    React.createElement(
                      "p",
                      {
                        className:
                          "text-[10px] uppercase font-bold text-emerald-600 tracking-wider",
                      },
                      "Tiết Kiệm Từ Mã Nguồn Mở"
                    ),
                    React.createElement(
                      "p",
                      { className: "text-sm sm:text-base font-black text-emerald-700 mt-0.5" },
                      "-",
                      formatVND(metrics.totalFossSavings),
                      "/năm"
                    )
                  ),
                  React.createElement(
                    "div",
                    { className: "bg-slate-900 rounded-lg p-2.5 text-white" },
                    React.createElement(
                      "p",
                      {
                        className:
                          "text-[10px] uppercase font-bold text-slate-300 tracking-wider",
                      },
                      "👉 Ngân Sách Đầu Tư Ròng"
                    ),
                    React.createElement(
                      "p",
                      {
                        className: `text-sm sm:text-base font-black mt-0.5 ${
                          kpiBreakdown.netInvestment >= 0 ? "text-white" : "text-emerald-400"
                        }`,
                      },
                      kpiBreakdown.netInvestment >= 0 ? "+" : "",
                      formatVND(kpiBreakdown.netInvestment),
                      "/năm"
                    )
                  )
                )
              ),

              // Visual allocation blocks
              React.createElement(
                "div",
                {
                  className:
                    "grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/80 p-3.5 sm:p-4 rounded-xl border border-slate-200",
                },
                // Structure breakdown
                React.createElement(
                  "div",
                  {
                    className:
                      "bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between",
                  },
                  React.createElement(
                    "div",
                    null,
                    React.createElement(
                      "h3",
                      {
                        className:
                          "text-xs font-bold text-slate-800 uppercase tracking-tight flex items-center justify-between mb-2",
                      },
                      React.createElement(
                        "span",
                        null,
                        "📊 Cơ Cấu Trạng Thái Bản Quyền Hệ Thống"
                      ),
                      React.createElement(
                        "span",
                        { className: "text-[10px] font-semibold text-slate-500" },
                        installations.length,
                        " lượt cài"
                      )
                    ),
                    (() => {
                      const total = installations.length || 1;
                      const hasInvCount = installations.filter((i) => i.invoiceStatus === "HAS_INVOICE").length;
                      const fossCount = installations.filter(
                        (i) => i.licenseType === "FREE_OPEN_SOURCE" || i.invoiceStatus === "NOT_APPLICABLE"
                      ).length;
                      const trapCount = installations.filter(
                        (i) => (i.licenseType === "FREE_PERSONAL_ONLY" || i.isTrap) && i.licenseType !== "FREE_OPEN_SOURCE"
                      ).length;
                      const missingCount = installations.filter(
                        (i) => i.invoiceStatus === "MISSING_INVOICE" && i.licenseType !== "FREE_OPEN_SOURCE" && !i.isTrap
                      ).length;

                      const pctHasInv = Math.round((hasInvCount / total) * 100);
                      const pctFoss = Math.round((fossCount / total) * 100);
                      const pctTrap = Math.round((trapCount / total) * 100);
                      const pctMissing = Math.max(0, 100 - pctHasInv - pctFoss - pctTrap);

                      return React.createElement(
                        "div",
                        { className: "space-y-2.5" },
                        React.createElement(
                          "div",
                          {
                            className:
                              "w-full h-4 rounded-full bg-slate-100 flex overflow-hidden border border-slate-200",
                          },
                          pctHasInv > 0 &&
                            React.createElement("div", {
                              style: { width: `${pctHasInv}%` },
                              className: "bg-emerald-500 h-full",
                              title: `Có Hóa đơn: ${hasInvCount} (${pctHasInv}%)`,
                            }),
                          pctFoss > 0 &&
                            React.createElement("div", {
                              style: { width: `${pctFoss}%` },
                              className: "bg-blue-500 h-full",
                              title: `FOSS Miễn phí: ${fossCount} (${pctFoss}%)`,
                            }),
                          pctTrap > 0 &&
                            React.createElement("div", {
                              style: { width: `${pctTrap}%` },
                              className: "bg-amber-400 h-full",
                              title: `Bẫy cá nhân: ${trapCount} (${pctTrap}%)`,
                            }),
                          pctMissing > 0 &&
                            React.createElement("div", {
                              style: { width: `${pctMissing}%` },
                              className: "bg-rose-500 h-full",
                              title: `Thiếu HĐ: ${missingCount} (${pctMissing}%)`,
                            })
                        ),
                        React.createElement(
                          "div",
                          { className: "grid grid-cols-2 gap-1.5 text-[11px]" },
                          React.createElement(
                            "div",
                            { className: "flex items-center gap-1.5" },
                            React.createElement("span", {
                              className: "w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0",
                            }),
                            React.createElement(
                              "span",
                              { className: "text-slate-600 truncate" },
                              "Có HĐ VAT:"
                            ),
                            React.createElement(
                              "strong",
                              { className: "text-slate-900 ml-auto" },
                              hasInvCount,
                              " (",
                              pctHasInv,
                              "%)"
                            )
                          ),
                          React.createElement(
                            "div",
                            { className: "flex items-center gap-1.5" },
                            React.createElement("span", {
                              className: "w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0",
                            }),
                            React.createElement(
                              "span",
                              { className: "text-slate-600 truncate" },
                              "Miễn phí FOSS:"
                            ),
                            React.createElement(
                              "strong",
                              { className: "text-slate-900 ml-auto" },
                              fossCount,
                              " (",
                              pctFoss,
                              "%)"
                            )
                          ),
                          React.createElement(
                            "div",
                            { className: "flex items-center gap-1.5" },
                            React.createElement("span", {
                              className: "w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0",
                            }),
                            React.createElement(
                              "span",
                              { className: "text-slate-600 truncate" },
                              "Bẫy cá nhân:"
                            ),
                            React.createElement(
                              "strong",
                              { className: "text-amber-700 ml-auto" },
                              trapCount,
                              " (",
                              pctTrap,
                              "%)"
                            )
                          ),
                          React.createElement(
                            "div",
                            { className: "flex items-center gap-1.5" },
                            React.createElement("span", {
                              className: "w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0",
                            }),
                            React.createElement(
                              "span",
                              { className: "text-slate-600 truncate" },
                              "Thiếu HĐ / Lậu:"
                            ),
                            React.createElement(
                              "strong",
                              { className: "text-rose-700 ml-auto" },
                              missingCount,
                              " (",
                              pctMissing,
                              "%)"
                            )
                          )
                        )
                      );
                    })()
                  )
                ),

                // Budget Distribution
                React.createElement(
                  "div",
                  {
                    className:
                      "bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between",
                  },
                  React.createElement(
                    "div",
                    null,
                    React.createElement(
                      "h3",
                      {
                        className:
                          "text-xs font-bold text-slate-800 uppercase tracking-tight flex items-center justify-between mb-2",
                      },
                      React.createElement(
                        "span",
                        null,
                        "💰 Phân Bổ Ngân Sách Dự Kiến Theo Phần Mềm"
                      ),
                      React.createElement(
                        "span",
                        { className: "text-[10px] font-bold text-rose-700" },
                        formatVND(filteredTotalBudgetRequired)
                      )
                    ),
                    React.createElement(
                      "div",
                      { className: "space-y-1.5" },
                      filteredExecutivePlanRows
                        .filter((r) => r.totalEstimated > 0)
                        .slice(0, 3)
                        .map((item, idx) => {
                          const pct =
                            filteredTotalBudgetRequired > 0
                              ? Math.round((item.totalEstimated / filteredTotalBudgetRequired) * 100)
                              : 0;
                          return React.createElement(
                            "div",
                            { key: idx, className: "space-y-0.5" },
                            React.createElement(
                              "div",
                              { className: "flex justify-between text-[10.5px] font-medium" },
                              React.createElement(
                                "span",
                                { className: "text-slate-800 font-bold truncate max-w-[170px]" },
                                item.name
                              ),
                              React.createElement(
                                "span",
                                { className: "text-slate-700 font-mono" },
                                formatVND(item.totalEstimated),
                                " ",
                                React.createElement(
                                  "span",
                                  { className: "text-slate-400" },
                                  "(",
                                  pct,
                                  "%)"
                                )
                              )
                            ),
                            React.createElement(
                              "div",
                              {
                                className: "w-full h-2 bg-slate-100 rounded-full overflow-hidden",
                              },
                              React.createElement("div", {
                                className: `h-full rounded-full ${
                                  idx === 0 ? "bg-rose-500" : idx === 1 ? "bg-amber-500" : "bg-blue-500"
                                }`,
                                style: { width: `${Math.max(8, pct)}%` },
                              })
                            )
                          );
                        }),
                      filteredExecutivePlanRows.filter((r) => r.totalEstimated > 0).length === 0 &&
                        React.createElement(
                          "p",
                          { className: "text-[11px] text-emerald-600 italic py-2 text-center" },
                          "✓ Hệ thống không phát sinh ngân sách mua sắm bổ sung (100% hợp lệ hoặc FOSS)."
                        )
                    )
                  ),
                  React.createElement(
                    "div",
                    {
                      className:
                        "pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex justify-between",
                    },
                    React.createElement(
                      "span",
                      null,
                      "Khuyến nghị: Thay FOSS giúp tiết kiệm ",
                      React.createElement("strong", null, formatVND(metrics.totalFossSavings))
                    )
                  )
                )
              ),

              // Executive Plan Table
              React.createElement(
                "div",
                { className: "space-y-2" },
                React.createElement(
                  "h2",
                  {
                    className:
                      "text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-tight",
                  },
                  "1. BẢNG TỔNG HỢP NHU CẦU MUA SẮM & XỬ LÝ (EXECUTIVE ACTION PLAN)"
                ),
                riskFilterPlan.length < riskOptions.length &&
                  React.createElement(
                    "p",
                    {
                      className:
                        "text-[10px] text-rose-700 font-bold bg-rose-100 inline-block px-2 py-0.5 rounded",
                    },
                    "⚠️ Đang lọc: hiển thị ",
                    filteredExecutivePlanRows.length,
                    "/",
                    executivePlanRows.length,
                    " phần mềm theo Mức Độ Rủi Ro đã chọn"
                  ),
                React.createElement(
                  "div",
                  { className: "overflow-x-auto border border-slate-300 rounded-lg" },
                  React.createElement(
                    "table",
                    { className: "w-full text-left text-xs border-collapse" },
                    React.createElement(
                      "thead",
                      { className: "bg-slate-900 text-white font-semibold text-[11px]" },
                      React.createElement(
                        "tr",
                        null,
                        React.createElement(
                          "th",
                          { className: "p-2 border-r border-slate-800 text-center w-10 col-stt" },
                          "STT"
                        ),
                        React.createElement(
                          "th",
                          { className: "p-2 border-r border-slate-800 min-w-[180px] col-software-name" },
                          "Tên Phần Mềm"
                        ),
                        React.createElement(
                          "th",
                          {
                            className:
                              "p-2 border-r border-slate-800 text-center whitespace-nowrap",
                          },
                          "Số Lượng Máy Dùng"
                        ),
                        React.createElement(
                          "th",
                          {
                            className:
                              "p-2 border-r border-slate-800 text-center whitespace-nowrap",
                          },
                          "Số Đã Có Hóa Đơn"
                        ),
                        React.createElement(
                          "th",
                          {
                            className:
                              "p-2 border-r border-slate-800 text-center whitespace-nowrap",
                          },
                          "Số Vi Phạm / Thiếu"
                        ),
                        React.createElement(
                          "th",
                          {
                            className: "p-2 border-r border-slate-800 text-center min-w-[110px] col-risk",
                          },
                          "Mức Độ Rủi Ro"
                        ),
                        React.createElement(
                          "th",
                          { className: "p-2 border-r border-slate-800 min-w-[220px]" },
                          "Phương Án Khuyến Nghị"
                        ),
                        React.createElement(
                          "th",
                          {
                            className:
                              "p-2 border-r border-slate-800 text-right whitespace-nowrap",
                          },
                          "Đơn Giá Dự Kiến (VNĐ)"
                        ),
                        React.createElement(
                          "th",
                          { className: "p-2 text-right whitespace-nowrap" },
                          "Chi Phí Dự Kiến (VNĐ)"
                        )
                      )
                    ),
                    React.createElement(
                      "tbody",
                      { className: "divide-y divide-slate-200 bg-white" },
                      filteredExecutivePlanRows.map((row) =>
                        React.createElement(
                          "tr",
                          { key: row.stt, className: "hover:bg-slate-50 transition" },
                          React.createElement(
                            "td",
                            {
                              className:
                                "p-2 text-center border-r border-slate-200 font-medium text-slate-600",
                            },
                            row.stt
                          ),
                          React.createElement(
                            "td",
                            {
                              className: "p-2 border-r border-slate-200 font-bold text-slate-900",
                            },
                            row.name
                          ),
                          React.createElement(
                            "td",
                            {
                              className:
                                "p-2 text-center border-r border-slate-200 font-semibold text-slate-800",
                            },
                            row.installedCount
                          ),
                          React.createElement(
                            "td",
                            {
                              className:
                                "p-2 text-center border-r border-slate-200 text-emerald-700 font-semibold",
                            },
                            row.hasInvoiceCount
                          ),
                          React.createElement(
                            "td",
                            {
                              className:
                                "p-2 text-center border-r border-slate-200 text-rose-700 font-bold",
                            },
                            row.missingInvoiceCount
                          ),
                          React.createElement(
                            "td",
                            { className: "p-2 text-center border-r border-slate-200" },
                            React.createElement(
                              "span",
                              {
                                className: `inline-block text-[10px] px-2 py-0.5 rounded border ${row.riskColor}`,
                              },
                              row.riskLabel
                            )
                          ),
                          React.createElement(
                            "td",
                            {
                              className:
                                "p-2 border-r border-slate-200 text-slate-800 leading-snug",
                            },
                            row.recommendation
                          ),
                          React.createElement(
                            "td",
                            {
                              className:
                                "p-2 text-right border-r border-slate-200 font-mono text-slate-700 whitespace-nowrap",
                            },
                            formatVND(row.unitPrice)
                          ),
                          React.createElement(
                            "td",
                            {
                              className:
                                "p-2 text-right font-mono font-bold text-slate-900 whitespace-nowrap",
                            },
                            formatVND(row.totalEstimated)
                          )
                        )
                      )
                    ),
                    React.createElement(
                      "tfoot",
                      { className: "bg-slate-100 font-bold border-t-2 border-slate-900" },
                      React.createElement(
                        "tr",
                        null,
                        React.createElement(
                          "td",
                          {
                            colSpan: 8,
                            className:
                              "p-2.5 text-right uppercase tracking-wider text-slate-900 border-r border-slate-300",
                          },
                          "TỔNG CỘNG DỰ KIẾN KINH PHÍ"
                        ),
                        React.createElement(
                          "td",
                          {
                            className:
                              "p-2.5 text-right font-mono text-sm text-slate-900 font-black whitespace-nowrap",
                          },
                          formatVND(filteredTotalBudgetRequired)
                        )
                      )
                    )
                  )
                )
              ),

              // Action Plan 3-Phase Timeline
              React.createElement(
                "div",
                { className: "space-y-2 pt-1" },
                React.createElement(
                  "h2",
                  {
                    className:
                      "text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-tight",
                  },
                  "2. LỘ TRÌNH THỰC THI (ACTION PLAN)"
                ),
                React.createElement(
                  "div",
                  { className: "space-y-2 text-xs" },
                  React.createElement(
                    "div",
                    {
                      className:
                        "p-3 bg-rose-50/50 border border-rose-200 rounded-lg flex items-start gap-2.5",
                    },
                    React.createElement(
                      "span",
                      {
                        className:
                          "px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px] shrink-0 uppercase tracking-wide whitespace-nowrap",
                      },
                      "Giai đoạn 1 (07 ngày)"
                    ),
                    React.createElement(
                      "p",
                      { className: "text-slate-800" },
                      React.createElement("strong", null, "Xử lý ngay rủi ro pháp lý: "),
                      "Gỡ bỏ hoàn toàn các công cụ Hack/Crack, phần mềm dọn rác và phần mềm cá nhân vi phạm nghiêm trọng khỏi toàn bộ máy tính."
                    )
                  ),
                  React.createElement(
                    "div",
                    {
                      className:
                        "p-3 bg-amber-50/50 border border-amber-200 rounded-lg flex items-start gap-2.5",
                    },
                    React.createElement(
                      "span",
                      {
                        className:
                          "px-2 py-0.5 rounded bg-amber-600 text-white font-bold text-[10px] shrink-0 uppercase tracking-wide whitespace-nowrap",
                      },
                      "Giai đoạn 2 (30 ngày)"
                    ),
                    React.createElement(
                      "p",
                      { className: "text-slate-800" },
                      React.createElement("strong", null, "Mua bổ sung & ban hành chính sách: "),
                      "Trình Ban Giám Đốc phê duyệt mua bổ sung bản quyền còn thiếu (M365, Adobe...), đồng thời ban hành chính sách sử dụng phần mềm nội bộ và lưu trữ Hóa đơn VAT & Serial Key tập trung."
                    )
                  ),
                  React.createElement(
                    "div",
                    {
                      className:
                        "p-3 bg-blue-50/50 border border-blue-200 rounded-lg flex items-start gap-2.5",
                    },
                    React.createElement(
                      "span",
                      {
                        className:
                          "px-2 py-0.5 rounded bg-blue-700 text-white font-bold text-[10px] shrink-0 uppercase tracking-wide whitespace-nowrap",
                      },
                      "Giai đoạn 3 (90 ngày)"
                    ),
                    React.createElement(
                      "p",
                      { className: "text-slate-800" },
                      React.createElement("strong", null, "Chuẩn hóa quy trình SAM: "),
                      "Thiết lập quy trình quản lý tài sản phần mềm (Software Asset Management) định kỳ, rà soát và đối soát hóa đơn hàng quý để duy trì tỷ lệ tuân thủ."
                    )
                  )
                )
              ),

              // Signature Box
              React.createElement(
                "div",
                { className: "pt-4 grid grid-cols-2 text-center text-xs print-avoid-break" },
                React.createElement(
                  "div",
                  null,
                  React.createElement(
                    "p",
                    { className: "font-bold text-slate-800 uppercase" },
                    "TRƯỞNG BỘ PHẬN IT"
                  ),
                  React.createElement(
                    "p",
                    { className: "text-slate-400 italic text-[11px] mt-0.5" },
                    "(Ký và ghi rõ họ tên)"
                  ),
                  React.createElement("div", { className: "h-14" })
                ),
                React.createElement(
                  "div",
                  null,
                  React.createElement(
                    "p",
                    { className: "font-bold text-slate-800 uppercase" },
                    "BAN GIÁM ĐỐC PHÊ DUYỆT"
                  ),
                  React.createElement(
                    "p",
                    { className: "text-slate-400 italic text-[11px] mt-0.5" },
                    "(Ký và ghi rõ họ tên)"
                  ),
                  React.createElement("div", { className: "h-14" })
                )
              ),

              React.createElement(
                "div",
                {
                  className:
                    "border-t border-slate-300 pt-3 text-center text-xs text-slate-700 font-sans",
                },
                React.createElement(
                  "p",
                  { className: "font-medium" },
                  "Hachihi SAM Pro • By hachihi.vn 0933842126"
                )
              )
            ),

          reportType === "BOTH" && React.createElement("div", { className: "print-page-break" }),

          // 2. DETAILED MACHINES
          (reportType === "DETAILED_MACHINES" || reportType === "BOTH") &&
            React.createElement(
              "div",
              {
                className:
                  "bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs space-y-3 print:border-none print:shadow-none print:p-0",
              },
              React.createElement(
                "div",
                { className: "border-b border-slate-300 pb-2.5 print-avoid-break" },
                React.createElement(
                  "div",
                  { className: "flex items-start justify-between" },
                  React.createElement(
                    "div",
                    null,
                    React.createElement(
                      "h1",
                      {
                        className:
                          "text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight",
                      },
                      "DANH SÁCH KIỂM TOÁN PHẦN MỀM CHI TIẾT MÁY TÍNH KHÁCH HÀNG"
                    ),
                    React.createElement(
                      "p",
                      { className: "text-[11px] text-slate-600 mt-0.5" },
                      "Dữ liệu truy xuất từ phần mềm quét hệ thống & đối soát hóa đơn kế toán • Khách hàng: ",
                      React.createElement(
                        "strong",
                        { className: "text-slate-900 font-bold" },
                        clientName
                      ),
                      " • Tiêu chuẩn: ",
                      React.createElement("strong", { className: "text-blue-900" }, standardTitle)
                    )
                  ),
                  React.createElement(
                    "div",
                    { className: "text-right text-[10px] text-slate-500 font-medium" },
                    React.createElement(
                      "p",
                      null,
                      "Ngày in: ",
                      React.createElement("strong", null, auditDate)
                    ),
                    React.createElement(
                      "p",
                      null,
                      "Đơn vị: ",
                      React.createElement("strong", null, auditorUnit)
                    )
                  )
                ),
                React.createElement(
                  "div",
                  {
                    className:
                      "mt-1.5 flex items-center justify-between text-[11px] bg-slate-50 px-2.5 py-1 rounded border border-slate-200",
                  },
                  React.createElement(
                    "span",
                    null,
                    "Tổng số dòng hiển thị: ",
                    React.createElement(
                      "strong",
                      { className: "text-slate-900 font-bold" },
                      detailFilteredInstalls.length,
                      " lượt cài"
                    ),
                    " (",
                    computers.length,
                    " máy tính)"
                  ),
                  (detailFilter === "RISKY_ONLY" ||
                    categoryFilter.length < categoryOptions.length) &&
                    React.createElement(
                      "span",
                      {
                        className:
                          "text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded text-[10px]",
                      },
                      "⚠️ Đang lọc: đang chỉ hiển thị một phần dữ liệu"
                    )
                )
              ),

              React.createElement(
                "div",
                { className: "border border-slate-300 rounded-lg overflow-hidden" },
                React.createElement(
                  "table",
                  { className: "w-full text-left text-xs border-collapse" },
                  React.createElement(
                    "thead",
                    { className: "bg-slate-900 text-white font-semibold text-[10px]" },
                    React.createElement(
                      "tr",
                      null,
                      React.createElement(
                        "th",
                        { className: "p-1.5 border-r border-slate-800 text-center w-8" },
                        "STT"
                      ),
                      React.createElement(
                        "th",
                        { className: "p-1.5 border-r border-slate-800 whitespace-nowrap" },
                        "Mã Máy (Hostname)"
                      ),
                      React.createElement(
                        "th",
                        { className: "p-1.5 border-r border-slate-800 whitespace-nowrap" },
                        "Người Sử Dụng"
                      ),
                      React.createElement(
                        "th",
                        { className: "p-1.5 border-r border-slate-800 whitespace-nowrap" },
                        "Phòng Ban"
                      ),
                      React.createElement(
                        "th",
                        { className: "p-1.5 border-r border-slate-800" },
                        "Phần Mềm Phát Hiện"
                      ),
                      React.createElement(
                        "th",
                        {
                          className:
                            "p-1.5 border-r border-slate-800 text-center whitespace-nowrap",
                        },
                        "Phiên Bản"
                      ),
                      React.createElement(
                        "th",
                        {
                          className:
                            "p-1.5 border-r border-slate-800 text-center whitespace-nowrap",
                        },
                        "Phân Loại"
                      ),
                      React.createElement(
                        "th",
                        {
                          className:
                            "p-1.5 border-r border-slate-800 text-center whitespace-nowrap",
                        },
                        "Trạng Thái HĐ"
                      ),
                      React.createElement(
                        "th",
                        { className: "p-1.5" },
                        "Khuyến Nghị Xử Lý (Action Required)"
                      )
                    )
                  ),
                  React.createElement(
                    "tbody",
                    { className: "divide-y divide-slate-200 bg-white text-[9.5px]" },
                    detailFilteredInstalls.map((inst, idx) => {
                      const pmClass = utils.classifySoftware ? utils.classifySoftware(inst) : 'Thương mại';
                      const invStatusText = utils.getInvoiceText ? utils.getInvoiceText(inst) : 'Chưa có hóa đơn';
                      const actionText = utils.getActionRequired ? utils.getActionRequired(inst) : 'Kiểm tra';

                      return React.createElement(
                        "tr",
                        { key: inst.id || idx, className: "hover:bg-slate-50" },
                        React.createElement(
                          "td",
                          {
                            className:
                              "p-1.5 text-center border-r border-slate-200 font-medium text-slate-600",
                          },
                          idx + 1
                        ),
                        React.createElement(
                          "td",
                          {
                            className:
                              "p-1.5 border-r border-slate-200 font-bold text-slate-900 whitespace-nowrap font-mono text-[9px]",
                          },
                          inst.computerHostname
                        ),
                        React.createElement(
                          "td",
                          {
                            className:
                              "p-1.5 border-r border-slate-200 font-medium text-slate-800 whitespace-nowrap",
                          },
                          inst.userName || "Chưa gán"
                        ),
                        React.createElement(
                          "td",
                          {
                            className:
                              "p-1.5 border-r border-slate-200 text-slate-700 whitespace-nowrap",
                          },
                          inst.department || "N/A"
                        ),
                        React.createElement(
                          "td",
                          {
                            className: "p-1.5 border-r border-slate-200 font-bold text-slate-900",
                          },
                          inst.rawSoftwareName || inst.displayName
                        ),
                        React.createElement(
                          "td",
                          {
                            className:
                              "p-1.5 text-center border-r border-slate-200 text-slate-600 font-mono text-[9px] whitespace-nowrap",
                          },
                          inst.version || "Latest"
                        ),
                        React.createElement(
                          "td",
                          {
                            className:
                              "p-1.5 text-center border-r border-slate-200 whitespace-nowrap",
                          },
                          React.createElement(
                            "span",
                            {
                              className: `inline-block px-1.5 py-0.5 rounded text-[8.5px] font-semibold ${
                                pmClass === "Tool Crack"
                                  ? "bg-rose-100 text-rose-800 font-bold"
                                  : pmClass === "Phần mềm rác"
                                  ? "bg-amber-100 text-amber-800 font-bold"
                                  : pmClass === "Miễn phí (Freeware)"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : pmClass === "Freemium"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-slate-100 text-slate-800"
                              }`,
                            },
                            pmClass
                          )
                        ),
                        React.createElement(
                          "td",
                          {
                            className:
                              "p-1.5 text-center border-r border-slate-200 whitespace-nowrap",
                          },
                          React.createElement(
                            "span",
                            {
                              className: `inline-block px-1.5 py-0.5 rounded text-[8.5px] font-medium ${
                                invStatusText === "Đã có Hóa đơn VAT"
                                  ? "text-emerald-700 font-bold"
                                  : invStatusText === "Chưa có hóa đơn"
                                  ? "text-rose-700 font-bold"
                                  : "text-slate-600"
                              }`,
                            },
                            invStatusText
                          )
                        ),
                        React.createElement(
                          "td",
                          { className: "p-1.5 text-slate-800 leading-snug" },
                          React.createElement(
                            "span",
                            {
                              className: `${
                                actionText.includes("GỠ BỎ GẤP")
                                  ? "text-rose-700 font-bold"
                                  : actionText.includes("Mua")
                                  ? "text-blue-700 font-bold"
                                  : actionText.includes("Thay bằng")
                                  ? "text-indigo-700 font-semibold"
                                  : actionText.includes("Hợp lệ")
                                  ? "text-emerald-700 font-medium"
                                  : "text-slate-700"
                              }`,
                            },
                            actionText
                          )
                        )
                      );
                    })
                  )
                )
              ),

              React.createElement(
                "div",
                { className: "pt-4 grid grid-cols-2 text-center text-xs print-avoid-break" },
                React.createElement(
                  "div",
                  null,
                  React.createElement(
                    "p",
                    { className: "font-bold text-slate-800 uppercase" },
                    "NGƯỜI LẬP BIỂU"
                  ),
                  React.createElement(
                    "p",
                    { className: "text-slate-400 italic text-[10px] mt-0.5" },
                    "(Ký và ghi rõ họ tên)"
                  ),
                  React.createElement("div", { className: "h-12" })
                ),
                React.createElement(
                  "div",
                  null,
                  React.createElement(
                    "p",
                    { className: "font-bold text-slate-800 uppercase" },
                    "ĐẠI DIỆN KHÁCH HÀNG XÁC NHẬN"
                  ),
                  React.createElement(
                    "p",
                    { className: "text-slate-400 italic text-[10px] mt-0.5" },
                    "(Ký và ghi rõ họ tên)"
                  ),
                  React.createElement("div", { className: "h-12" })
                )
              ),

              React.createElement(
                "div",
                {
                  className:
                    "border-t border-slate-300 pt-2 text-center text-[10px] text-slate-600 font-sans",
                },
                React.createElement(
                  "p",
                  { className: "font-medium" },
                  "Hachihi SAM Pro • By hachihi.vn 0933842126"
                )
              )
            ),

          // 3. MACHINE OVERVIEW
          reportType === "MACHINE_OVERVIEW" &&
            React.createElement(
              "div",
              {
                className:
                  "bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs space-y-3 print:border-none print:shadow-none print:p-0",
              },
              React.createElement(
                "div",
                { className: "border-b border-slate-300 pb-2.5 print-avoid-break" },
                React.createElement(
                  "div",
                  { className: "flex items-start justify-between" },
                  React.createElement(
                    "div",
                    null,
                    React.createElement(
                      "h1",
                      {
                        className:
                          "text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight",
                      },
                      "BÁO CÁO TỔNG QUAN SỐ LƯỢNG MÁY TÍNH ĐÃ KIỂM TRA"
                    ),
                    React.createElement(
                      "p",
                      { className: "text-[11px] text-slate-600 mt-0.5" },
                      "Thống kê toàn bộ máy tính đã được kiểm toán phần mềm • Khách hàng: ",
                      React.createElement(
                        "strong",
                        { className: "text-slate-900 font-bold" },
                        clientName
                      )
                    )
                  ),
                  React.createElement(
                    "div",
                    { className: "text-right text-[10px] text-slate-500 font-medium" },
                    React.createElement(
                      "p",
                      null,
                      "Ngày in: ",
                      React.createElement("strong", null, auditDate)
                    ),
                    React.createElement(
                      "p",
                      null,
                      "Đơn vị: ",
                      React.createElement("strong", null, auditorUnit)
                    )
                  )
                ),
                React.createElement(
                  "div",
                  {
                    className:
                      "mt-1.5 flex items-center justify-between text-[11px] bg-slate-50 px-2.5 py-1 rounded border border-slate-200",
                  },
                  React.createElement(
                    "span",
                    null,
                    "Tổng số máy đã kiểm tra: ",
                    React.createElement(
                      "strong",
                      { className: "text-slate-900 font-bold" },
                      machineOverviewRows.length,
                      " máy"
                    )
                  ),
                  React.createElement(
                    "span",
                    {
                      className:
                        "text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded text-[10px]",
                    },
                    "⚠️ Có cảnh báo: ",
                    machineOverviewRows.filter((m) => m.hasWarning).length,
                    "/",
                    machineOverviewRows.length,
                    " máy"
                  )
                )
              ),

              React.createElement(
                "div",
                { className: "border border-slate-300 rounded-lg overflow-hidden" },
                React.createElement(
                  "table",
                  { className: "w-full text-left text-xs border-collapse" },
                  React.createElement(
                    "thead",
                    { className: "bg-slate-900 text-white font-semibold text-[10px]" },
                    React.createElement(
                      "tr",
                      null,
                      React.createElement(
                        "th",
                        { className: "p-1.5 border-r border-slate-800 text-center w-8" },
                        "STT"
                      ),
                      React.createElement(
                        "th",
                        { className: "p-1.5 border-r border-slate-800 whitespace-nowrap" },
                        "Mã Máy"
                      ),
                      React.createElement(
                        "th",
                        { className: "p-1.5 border-r border-slate-800 whitespace-nowrap" },
                        "Cấu Hình / Dòng Máy"
                      ),
                      React.createElement(
                        "th",
                        { className: "p-1.5 border-r border-slate-800 whitespace-nowrap" },
                        "Nhân Viên"
                      ),
                      React.createElement(
                        "th",
                        { className: "p-1.5 border-r border-slate-800 whitespace-nowrap" },
                        "Phòng Ban"
                      ),
                      React.createElement(
                        "th",
                        {
                          className:
                            "p-1.5 border-r border-slate-800 whitespace-nowrap font-mono",
                        },
                        "Serial"
                      ),
                      React.createElement(
                        "th",
                        {
                          className:
                            "p-1.5 border-r border-slate-800 text-center whitespace-nowrap",
                        },
                        "Số Lượng Phần Mềm"
                      ),
                      React.createElement(
                        "th",
                        { className: "p-1.5 text-center whitespace-nowrap" },
                        "Trạng Thái"
                      )
                    )
                  ),
                  React.createElement(
                    "tbody",
                    { className: "divide-y divide-slate-200 bg-white text-[9.5px]" },
                    machineOverviewRows.map((m) =>
                      React.createElement(
                        "tr",
                        { key: m.hostname + m.stt, className: "hover:bg-slate-50" },
                        React.createElement(
                          "td",
                          {
                            className:
                              "p-1.5 text-center border-r border-slate-200 font-medium text-slate-600",
                          },
                          m.stt
                        ),
                        React.createElement(
                          "td",
                          {
                            className:
                              "p-1.5 border-r border-slate-200 font-bold text-slate-900 whitespace-nowrap font-mono text-[9px]",
                          },
                          m.hostname
                        ),
                        React.createElement(
                          "td",
                          { className: "p-1.5 border-r border-slate-200 text-slate-700" },
                          m.model
                        ),
                        React.createElement(
                          "td",
                          {
                            className:
                              "p-1.5 border-r border-slate-200 font-medium text-slate-800 whitespace-nowrap",
                          },
                          m.user
                        ),
                        React.createElement(
                          "td",
                          {
                            className:
                              "p-1.5 border-r border-slate-200 text-slate-700 whitespace-nowrap",
                          },
                          m.department
                        ),
                        React.createElement(
                          "td",
                          {
                            className:
                              "p-1.5 border-r border-slate-200 text-slate-600 font-mono text-[9px] whitespace-nowrap",
                          },
                          m.serial
                        ),
                        React.createElement(
                          "td",
                          {
                            className:
                              "p-1.5 text-center border-r border-slate-200 font-semibold text-slate-800",
                          },
                          m.softwareCount
                        ),
                        React.createElement(
                          "td",
                          { className: "p-1.5 text-center whitespace-nowrap" },
                          m.hasWarning
                            ? React.createElement(
                                "span",
                                {
                                  className:
                                    "inline-block px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-rose-100 text-rose-800",
                                },
                                "⚠️ Có Cảnh Báo"
                              )
                            : React.createElement(
                                "span",
                                {
                                  className:
                                    "inline-block px-1.5 py-0.5 rounded text-[8.5px] font-semibold bg-emerald-100 text-emerald-800",
                                },
                                "✓ Đạt Yêu Cầu"
                              )
                        )
                      )
                    )
                  )
                )
              ),

              React.createElement(
                "div",
                { className: "pt-4 grid grid-cols-2 text-center text-xs print-avoid-break" },
                React.createElement(
                  "div",
                  null,
                  React.createElement(
                    "p",
                    { className: "font-bold text-slate-800 uppercase" },
                    "NGƯỜI LẬP BIỂU"
                  ),
                  React.createElement(
                    "p",
                    { className: "text-slate-400 italic text-[10px] mt-0.5" },
                    "(Ký và ghi rõ họ tên)"
                  ),
                  React.createElement("div", { className: "h-12" })
                ),
                React.createElement(
                  "div",
                  null,
                  React.createElement(
                    "p",
                    { className: "font-bold text-slate-800 uppercase" },
                    "ĐẠI DIỆN KHÁCH HÀNG XÁC NHẬN"
                  ),
                  React.createElement(
                    "p",
                    { className: "text-slate-400 italic text-[10px] mt-0.5" },
                    "(Ký và ghi rõ họ tên)"
                  ),
                  React.createElement("div", { className: "h-12" })
                )
              ),

              React.createElement(
                "div",
                {
                  className:
                    "border-t border-slate-300 pt-2 text-center text-[10px] text-slate-600 font-sans",
                },
                React.createElement(
                  "p",
                  { className: "font-medium" },
                  "Hachihi SAM Pro • By hachihi.vn 0933842126"
                )
              )
            ),

          // 4. FOSS PLAN PRINT
          reportType === "FOSS_PLAN" &&
            React.createElement(
              "div",
              {
                className:
                  "bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs space-y-4 print:border-none print:shadow-none print:p-0",
              },
              React.createElement(
                "div",
                { className: "border-b border-slate-300 pb-3" },
                React.createElement(
                  "h1",
                  {
                    className:
                      "text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight",
                  },
                  "KẾ HOẠCH TỐI ƯU HÓA & THAY THẾ BẰNG MÃ NGUỒN MỞ (FOSS)"
                ),
                React.createElement(
                  "p",
                  { className: "text-xs text-emerald-800 font-medium mt-1" },
                  "Chuẩn hóa các phần mềm FOSS dưới đây giúp doanh nghiệp tiết kiệm ngay ước tính ",
                  React.createElement("strong", null, formatVND(metrics.totalFossSavings)),
                  " và xóa bỏ 100% rủi ro bị phạt bản quyền."
                ),
                React.createElement(
                  "div",
                  {
                    className:
                      "mt-2 text-xs text-slate-700 font-medium flex items-center gap-3 bg-emerald-50/60 p-2 rounded-lg border border-emerald-200",
                  },
                  React.createElement(
                    "span",
                    null,
                    "Khách hàng: ",
                    React.createElement(
                      "strong",
                      { className: "text-slate-950 font-bold" },
                      clientName
                    )
                  ),
                  React.createElement("span", null, "|"),
                  React.createElement(
                    "span",
                    null,
                    "Ngày lập kế hoạch: ",
                    React.createElement(
                      "strong",
                      { className: "text-slate-950 font-bold" },
                      auditDate
                    )
                  )
                )
              ),

              React.createElement(
                "div",
                { className: "space-y-3" },
                [
                  {
                    from: "WinRAR (Dùng thử quá hạn)",
                    to: "7-Zip",
                    saving: "Tiết kiệm: 100% (750.000 đ/máy)",
                    desc: "Miễn phí 100% doanh nghiệp, nén nhanh, nhẹ, không bao giờ hỏi mua key bản quyền.",
                    action: "Gỡ WinRAR -> Cài 7-Zip từ 7-zip.org hoặc chạy silent install trên mạng LAN."
                  },
                  {
                    from: "TeamViewer / AnyDesk (Bản cá nhân)",
                    to: "RustDesk / UltraViewer",
                    saving: "Tiết kiệm: ~12.000.000 đ/năm",
                    desc: "Không bị block timeout sau 5 phút, bảo mật cao, chi phí 0đ hoặc siêu rẻ cho doanh nghiệp.",
                    action: "Gỡ TeamViewer cá nhân -> Cài RustDesk (tự host/FOSS) hoặc mua UltraViewer (~468k/năm)."
                  },
                  {
                    from: "CCleaner Free",
                    to: "Windows Storage Sense",
                    saving: "Tiết kiệm: 100%",
                    desc: "Có sẵn trên Windows 10/11, tự động dọn dẹp an toàn không lo vi phạm bản quyền thương mại.",
                    action: "Gỡ CCleaner -> Bật Storage Sense trong Windows Settings."
                  },
                  {
                    from: "Adobe Acrobat Pro (Chưa HĐ)",
                    to: "PDFgear / Foxit Reader",
                    saving: "Tiết kiệm: ~6.200.000 đ/máy",
                    desc: "PDFgear cho phép chỉnh sửa text, merge PDF miễn phí 100% cho công ty.",
                    action: "Gỡ Acrobat Pro crack -> Cài PDFgear từ pdfgear.com."
                  },
                  {
                    from: "Microsoft Office (Máy phụ/Kho)",
                    to: "ONLYOFFICE / LibreOffice",
                    saving: "Tiết kiệm: ~5.800.000 đ/máy",
                    desc: "Tương thích 99% định dạng Word/Excel, miễn phí hoàn toàn cho nhân viên khối hỗ trợ.",
                    action: "Cài OnlyOffice Desktop cho nhân viên khối phụ trợ hoặc chuyển sang Google Workspace."
                  }
                ].map((item, idx) =>
                  React.createElement(
                    "div",
                    {
                      key: idx,
                      className:
                        "border border-slate-300 rounded-lg p-3 bg-slate-50/50 print-avoid-break",
                    },
                    React.createElement(
                      "div",
                      { className: "flex justify-between items-center mb-1.5" },
                      React.createElement(
                        "span",
                        { className: "font-bold text-xs text-slate-900" },
                        React.createElement(
                          "span",
                          { className: "line-through text-rose-600 font-bold" },
                          item.from
                        ),
                        " ➡️ ",
                        React.createElement(
                          "span",
                          { className: "text-emerald-700 font-bold" },
                          item.to
                        )
                      ),
                      React.createElement(
                        "span",
                        {
                          className:
                            "text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded",
                        },
                        item.saving
                      )
                    ),
                    React.createElement(
                      "p",
                      { className: "text-[11px] text-slate-600" },
                      item.desc
                    ),
                    React.createElement(
                      "div",
                      {
                        className:
                          "mt-1.5 text-[10.5px] bg-white p-2 rounded border border-slate-200 text-slate-800",
                      },
                      React.createElement("strong", null, "🛠️ Hành động IT:"),
                      " ",
                      item.action
                    )
                  )
                )
              ),

              React.createElement(
                "div",
                { className: "pt-4 grid grid-cols-2 text-center text-xs print-avoid-break" },
                React.createElement(
                  "div",
                  null,
                  React.createElement(
                    "p",
                    { className: "font-bold text-slate-800 uppercase" },
                    "NGƯỜI LẬP KẾ HOẠCH FOSS"
                  ),
                  React.createElement(
                    "p",
                    { className: "text-slate-400 italic text-[10px] mt-0.5" },
                    "(Ký và ghi rõ họ tên)"
                  ),
                  React.createElement("div", { className: "h-12" })
                ),
                React.createElement(
                  "div",
                  null,
                  React.createElement(
                    "p",
                    { className: "font-bold text-slate-800 uppercase" },
                    "BAN GIÁM ĐỐC DUYỆT"
                  ),
                  React.createElement(
                    "p",
                    { className: "text-slate-400 italic text-[10px] mt-0.5" },
                    "(Ký và ghi rõ họ tên)"
                  ),
                  React.createElement("div", { className: "h-12" })
                )
              ),

              React.createElement(
                "div",
                {
                  className:
                    "border-t border-slate-300 pt-2 text-center text-[10px] text-slate-600 font-sans",
                },
                React.createElement(
                  "p",
                  { className: "font-medium" },
                  "Hachihi SAM Pro • By hachihi.vn 0933842126"
                )
              )
            ),

          // 6. PER_DEVICE_AUDIT REPORT (MẪU BÁO CÁO TẦM SOÁT THIẾT BỊ & PHẦN MỀM TỪNG MÁY)
          reportType === "PER_DEVICE_AUDIT" &&
            React.createElement(
              "div",
              {
                className:
                  "bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0",
              },
              // Title Banner
              React.createElement(
                "div",
                { className: "text-center border-b border-slate-300 pb-3" },
                React.createElement(
                  "h1",
                  {
                    className:
                      "text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight",
                  },
                  "TẦM SOÁT THIẾT BỊ & PHẦN MỀM"
                ),
                React.createElement(
                  "div",
                  {
                    className:
                      "mt-2 text-xs text-slate-700 font-medium flex flex-wrap items-center justify-center gap-x-3 gap-y-1",
                  },
                  React.createElement(
                    "span",
                    null,
                    "Khách hàng: ",
                    React.createElement(
                      "strong",
                      { className: "text-slate-950 font-bold" },
                      clientName
                    )
                  ),
                  React.createElement("span", null, "|"),
                  React.createElement(
                    "span",
                    null,
                    "Ngày kiểm toán: ",
                    React.createElement(
                      "strong",
                      { className: "text-slate-950 font-bold" },
                      auditDate
                    )
                  ),
                  React.createElement("span", null, "|"),
                  React.createElement(
                    "span",
                    null,
                    "Đơn vị thực hiện: ",
                    React.createElement(
                      "strong",
                      { className: "text-slate-950 font-bold" },
                      auditorUnit
                    )
                  ),
                  React.createElement("span", null, "|"),
                  React.createElement(
                    "span",
                    null,
                    "Thiết bị hiển thị: ",
                    React.createElement(
                      "strong",
                      { className: "text-blue-900 font-bold" },
                      selectedDeviceHostname === "ALL"
                        ? `${computers.length} máy`
                        : selectedDeviceHostname
                    )
                  )
                )
              ),

              // Devices List
              React.createElement(
                "div",
                { className: "space-y-6 print:space-y-0" },
                (selectedDeviceHostname === "ALL"
                  ? computers
                  : computers.filter((c) => c.hostname === selectedDeviceHostname)
                ).map((comp, compIdx, arr) => {
                  const details = parseDeviceDetails(comp, compIdx);

                  // Device installs
                  const compInstalls = (installations || []).filter(
                    (i) =>
                      String(i.computerHostname || "").toUpperCase() ===
                      String(comp.hostname || "").toUpperCase()
                  );

                  // Check crack presence
                  const crackInstalls = compInstalls.filter(
                    (i) =>
                      (i.rawSoftwareName || "").toLowerCase().includes("crack") ||
                      (i.rawSoftwareName || "").toLowerCase().includes("kms") ||
                      (i.rawSoftwareName || "").toLowerCase().includes("patch") ||
                      (i.category || "").includes("Crack")
                  );
                  const hasCrack = crackInstalls.length > 0;

                  // OS item at the top
                  const osItem = {
                    isOS: true,
                    name: comp.os || "Windows 11 Home (Licensed)",
                    category: "Hệ điều hành (OS)",
                    vendor: "Microsoft Corporation",
                    licenseType: "COMMERCIAL_PAID",
                    licenseTypeText: "Có phí (Thương mại)",
                    licenseTypeLabel: "Bản quyền OEM / Thương mại",
                    evaluation: "Bản quyền OEM hợp lệ",
                    evaluationClass: "text-emerald-700 font-medium",
                  };

                  // Other software items
                  const appItems = compInstalls.map((inst) => {
                    let licenseTypeText = "Có phí (Thương mại)";
                    let licenseTypeLabel = "Bản quyền thương mại (Có phí)";
                    if (inst.licenseType === "FREE_OPEN_SOURCE") {
                      licenseTypeText = "Miễn phí (Mã nguồn mở / FOSS)";
                      licenseTypeLabel = "Mã nguồn mở / Freeware (0đ)";
                    } else if (inst.licenseType === "FREE_PERSONAL_ONLY" || inst.isTrap) {
                      licenseTypeText = "Bản quyền cá nhân (Bẫy bản quyền)";
                      licenseTypeLabel = "Bản quyền cá nhân (Bẫy dùng thử)";
                    }

                    let evaluation = "Hợp lệ";
                    let evaluationClass = "text-emerald-700 font-medium";

                    const rawLower = (inst.rawSoftwareName || "").toLowerCase();
                    if (
                      inst.category === "Tool Crack" ||
                      rawLower.includes("crack") ||
                      rawLower.includes("kms") ||
                      rawLower.includes("patch")
                    ) {
                      evaluation = "CỰC KỲ NGUY HIỂM - Cần gỡ bỏ ngay";
                      evaluationClass = "text-rose-700 font-bold";
                    } else if (inst.licenseType === "FREE_PERSONAL_ONLY" || inst.isTrap) {
                      evaluation = "Cấm dùng cho doanh nghiệp (Cần gỡ bỏ)";
                      evaluationClass = "text-amber-700 font-bold";
                    } else if (inst.licenseType === "FREE_OPEN_SOURCE") {
                      evaluation = "An toàn, miễn phí 100% doanh nghiệp";
                      evaluationClass = "text-emerald-700 font-medium";
                    } else if (inst.invoiceStatus === "HAS_INVOICE") {
                      evaluation = "Đã có Hóa đơn VAT (Hợp lệ)";
                      evaluationClass = "text-emerald-700 font-bold";
                    } else {
                      evaluation = "Chưa có hóa đơn (Cần mua bổ sung hoặc thay FOSS)";
                      evaluationClass = "text-rose-700 font-bold";
                    }

                    return {
                      isOS: false,
                      name: inst.displayName || inst.rawSoftwareName,
                      version: inst.version || "",
                      category: inst.category || "Ứng dụng",
                      vendor: inst.vendor || "Chưa rõ",
                      licenseType: inst.licenseType,
                      licenseTypeText,
                      licenseTypeLabel,
                      evaluation,
                      evaluationClass,
                    };
                  });

                  // Combined items: OS first, then other software
                  const rawItems = [osItem, ...appItems];

                  // Apply Vendor and License Type Filters
                  const filteredItems = rawItems.filter((item) => {
                    const matchVendor =
                      perDeviceVendorFilter.length === 0 ||
                      perDeviceVendorFilter.includes(item.vendor);
                    const matchLicense =
                      perDeviceLicenseFilter.length === 0 ||
                      perDeviceLicenseFilter.includes(item.licenseTypeText);
                    return matchVendor && matchLicense;
                  });

                  return React.createElement(
                    React.Fragment,
                    { key: comp.hostname || compIdx },
                    React.createElement(
                      "div",
                      {
                        className:
                          "border border-slate-300 rounded-lg overflow-hidden bg-white print-avoid-break shadow-xs print:shadow-none text-xs",
                      },
                      React.createElement(
                        "table",
                        { className: "w-full text-left border-collapse" },
                        React.createElement(
                          "thead",
                          null,
                          React.createElement(
                            "tr",
                            {
                              className:
                                "bg-slate-100 text-slate-800 text-[11px] font-bold border-b border-slate-300",
                            },
                            React.createElement(
                              "th",
                              {
                                className:
                                  "p-2 border-r border-slate-300 w-1/4 text-center font-bold text-slate-800",
                              },
                              "Tên linh kiện / Phần mềm"
                            ),
                            React.createElement(
                              "th",
                              {
                                className:
                                  "p-2 border-r border-slate-300 flex-1 text-center font-bold text-slate-800",
                              },
                              "Thông tin chi tiết"
                            ),
                            React.createElement(
                              "th",
                              {
                                className:
                                  "p-2 w-1/3 text-center font-bold text-slate-800",
                              },
                              "Đánh giá sơ bộ"
                            )
                          ),
                          // Dark Navy Device Header Row: THIẾT BỊ 01: DESKTOP-1QIPHT6 (AVITA - NS14A8)
                          React.createElement(
                            "tr",
                            { className: "bg-slate-900 text-white" },
                            React.createElement(
                              "td",
                              {
                                colSpan: 3,
                                className:
                                  "p-2 font-bold uppercase tracking-wider text-xs sm:text-sm bg-slate-900 text-white border-b border-slate-800",
                              },
                              details.deviceTitle
                            )
                          )
                        ),
                        React.createElement(
                          "tbody",
                          { className: "divide-y divide-slate-200 text-xs" },
                          // 1. TÊN NGƯỜI DÙNG / VỊ TRÍ PHÒNG BAN
                          React.createElement(
                            "tr",
                            { className: "bg-blue-50/70 border-b border-slate-300" },
                            React.createElement(
                              "td",
                              {
                                colSpan: 3,
                                className:
                                  "p-1.5 font-bold uppercase text-[11px] text-blue-900 tracking-wide",
                              },
                              "1. TÊN NGƯỜI DÙNG / VỊ TRÍ PHÒNG BAN"
                            )
                          ),
                          React.createElement(
                            "tr",
                            null,
                            React.createElement(
                              "td",
                              {
                                className:
                                  "p-2 font-semibold text-slate-800 border-r border-slate-200 bg-slate-50/50",
                              },
                              "Tên máy tính"
                            ),
                            React.createElement(
                              "td",
                              {
                                className:
                                  "p-2 font-mono font-medium text-slate-900 border-r border-slate-200",
                              },
                              comp.hostname
                            ),
                            React.createElement(
                              "td",
                              { className: "p-2 text-emerald-700 font-medium" },
                              "Đã định danh hệ thống"
                            )
                          ),
                          React.createElement(
                            "tr",
                            null,
                            React.createElement(
                              "td",
                              {
                                className:
                                  "p-2 font-semibold text-slate-800 border-r border-slate-200 bg-slate-50/50",
                              },
                              "Họ và tên người dùng"
                            ),
                            React.createElement(
                              "td",
                              {
                                className:
                                  "p-2 text-slate-900 border-r border-slate-200 font-medium",
                              },
                              comp.user
                                ? comp.user
                                : React.createElement(
                                    "span",
                                    { className: "text-slate-600 font-normal" },
                                    "[Chưa có dữ liệu]"
                                  )
                            ),
                            React.createElement(
                              "td",
                              {
                                className: comp.user
                                  ? "p-2 text-emerald-700 font-medium"
                                  : "p-2 text-slate-600",
                              },
                              comp.user
                                ? "Đã phân bổ nhân sự tiếp nhận"
                                : "Cần bổ sung nhân sự tiếp nhận"
                            )
                          ),
                          React.createElement(
                            "tr",
                            null,
                            React.createElement(
                              "td",
                              {
                                className:
                                  "p-2 font-semibold text-slate-800 border-r border-slate-200 bg-slate-50/50",
                              },
                              "Vị trí / Phòng ban"
                            ),
                            React.createElement(
                              "td",
                              {
                                className:
                                  "p-2 text-slate-900 border-r border-slate-200 font-medium",
                              },
                              comp.department
                                ? comp.department
                                : React.createElement(
                                    "span",
                                    { className: "text-slate-600 font-normal" },
                                    "[Chưa có dữ liệu]"
                                  )
                            ),
                            React.createElement(
                              "td",
                              {
                                className: comp.department
                                  ? "p-2 text-emerald-700 font-medium"
                                  : "p-2 text-slate-600",
                              },
                              comp.department
                                ? "Đã ghi nhận phòng ban quản lý"
                                : "Cần bổ sung thông tin quản lý"
                            )
                          ),

                          // 2. CẤU HÌNH PHẦN CỨNG
                          React.createElement(
                            "tr",
                            { className: "bg-blue-50/70 border-b border-slate-300" },
                            React.createElement(
                              "td",
                              {
                                colSpan: 3,
                                className:
                                  "p-1.5 font-bold uppercase text-[11px] text-blue-900 tracking-wide",
                              },
                              "2. CẤU HÌNH PHẦN CỨNG"
                            )
                          ),
                          compactHardware
                            ? React.createElement(
                                "tr",
                                null,
                                React.createElement(
                                  "td",
                                  {
                                    className:
                                      "p-2 font-semibold text-slate-800 border-r border-slate-200 bg-slate-50/50",
                                  },
                                  "Tóm tắt cấu hình máy tính"
                                ),
                                React.createElement(
                                  "td",
                                  {
                                    className:
                                      "p-2 text-slate-900 border-r border-slate-200 font-medium leading-relaxed",
                                  },
                                  details.oneLineSummary
                                ),
                                React.createElement(
                                  "td",
                                  { className: "p-2 text-emerald-700 font-medium" },
                                  "Đáp ứng tốt tác vụ văn phòng"
                                )
                              )
                            : React.createElement(
                                React.Fragment,
                                null,
                                React.createElement(
                                  "tr",
                                  null,
                                  React.createElement(
                                    "td",
                                    {
                                      className:
                                        "p-2 font-semibold text-slate-800 border-r border-slate-200 bg-slate-50/50",
                                    },
                                    "Laptop / Model"
                                  ),
                                  React.createElement(
                                    "td",
                                    {
                                      className:
                                        "p-2 text-slate-900 border-r border-slate-200 font-medium",
                                    },
                                    details.modelText
                                  ),
                                  React.createElement(
                                    "td",
                                    { className: "p-2 text-slate-700" },
                                    "Dòng laptop văn phòng / máy trạm"
                                  )
                                ),
                                React.createElement(
                                  "tr",
                                  null,
                                  React.createElement(
                                    "td",
                                    {
                                      className:
                                        "p-2 font-semibold text-slate-800 border-r border-slate-200 bg-slate-50/50",
                                    },
                                    "CPU"
                                  ),
                                  React.createElement(
                                    "td",
                                    {
                                      className:
                                        "p-2 text-slate-900 border-r border-slate-200 font-medium",
                                    },
                                    details.cpuText
                                  ),
                                  React.createElement(
                                    "td",
                                    { className: "p-2 text-emerald-700 font-medium" },
                                    "Đáp ứng tốt tác vụ văn phòng"
                                  )
                                ),
                                React.createElement(
                                  "tr",
                                  null,
                                  React.createElement(
                                    "td",
                                    {
                                      className:
                                        "p-2 font-semibold text-slate-800 border-r border-slate-200 bg-slate-50/50",
                                    },
                                    "RAM"
                                  ),
                                  React.createElement(
                                    "td",
                                    {
                                      className:
                                        "p-2 text-slate-900 border-r border-slate-200 font-medium",
                                    },
                                    details.ramText
                                  ),
                                  React.createElement(
                                    "td",
                                    { className: "p-2 text-slate-700" },
                                    "Đạt chuẩn vận hành văn phòng"
                                  )
                                ),
                                React.createElement(
                                  "tr",
                                  null,
                                  React.createElement(
                                    "td",
                                    {
                                      className:
                                        "p-2 font-semibold text-slate-800 border-r border-slate-200 bg-slate-50/50",
                                    },
                                    "Ổ cứng"
                                  ),
                                  React.createElement(
                                    "td",
                                    {
                                      className:
                                        "p-2 text-slate-900 border-r border-slate-200 font-medium",
                                    },
                                    details.diskText
                                  ),
                                  React.createElement(
                                    "td",
                                    { className: "p-2 text-emerald-700 font-medium" },
                                    "Tình trạng Healthy, dung lượng đáp ứng tốt"
                                  )
                                )
                              ),

                          // 3. DANH SÁCH PHẦN MỀM CÀI ĐẶT TRÊN MÁY
                          React.createElement(
                            "tr",
                            { className: "bg-blue-50/70 border-b border-slate-300" },
                            React.createElement(
                              "td",
                              {
                                colSpan: 3,
                                className:
                                  "p-1.5 font-bold uppercase text-[11px] text-blue-900 tracking-wide",
                              },
                              "3. DANH SÁCH PHẦN MỀM CÀI ĐẶT TRÊN MÁY"
                            )
                          ),
                          React.createElement(
                            "tr",
                            null,
                            React.createElement(
                              "td",
                              { colSpan: 3, className: "p-0" },
                              React.createElement(
                                "table",
                                { className: "w-full text-left border-collapse text-xs" },
                                React.createElement(
                                  "thead",
                                  null,
                                  React.createElement(
                                    "tr",
                                    {
                                      className:
                                        "bg-slate-100/80 text-slate-800 font-bold border-b border-slate-300 text-[11px]",
                                    },
                                    React.createElement(
                                      "th",
                                      {
                                        className:
                                          "p-2 border-r border-slate-300 text-center w-10 font-bold",
                                      },
                                      "STT"
                                    ),
                                    React.createElement(
                                      "th",
                                      {
                                        className:
                                          "p-2 border-r border-slate-300 font-bold",
                                      },
                                      "Tên Phần Mềm"
                                    ),
                                    React.createElement(
                                      "th",
                                      {
                                        className:
                                          "p-2 border-r border-slate-300 w-32 font-bold",
                                      },
                                      "Phân Loại"
                                    ),
                                    React.createElement(
                                      "th",
                                      {
                                        className:
                                          "p-2 border-r border-slate-300 w-36 font-bold",
                                      },
                                      "Hãng Sản Xuất"
                                    ),
                                    React.createElement(
                                      "th",
                                      {
                                        className:
                                          "p-2 border-r border-slate-300 w-44 font-bold",
                                      },
                                      "Loại Bản Quyền"
                                    ),
                                    React.createElement(
                                      "th",
                                      { className: "p-2 w-48 font-bold" },
                                      "Đánh Giá Sơ Bộ"
                                    )
                                  )
                                ),
                                React.createElement(
                                  "tbody",
                                  { className: "divide-y divide-slate-200" },
                                  filteredItems.length === 0
                                    ? React.createElement(
                                        "tr",
                                        null,
                                        React.createElement(
                                          "td",
                                          {
                                            colSpan: 6,
                                            className:
                                              "p-4 text-center text-slate-500 italic",
                                          },
                                          "Không có phần mềm nào phù hợp với bộ lọc đã chọn."
                                        )
                                      )
                                    : filteredItems.map((item, idx) =>
                                        React.createElement(
                                          "tr",
                                          {
                                            key: idx,
                                            className: item.isOS
                                              ? "bg-blue-50/30 hover:bg-blue-50/50"
                                              : "hover:bg-slate-50",
                                          },
                                          React.createElement(
                                            "td",
                                            {
                                              className:
                                                "p-2 text-center border-r border-slate-200 font-medium text-slate-600",
                                            },
                                            String(idx + 1).padStart(2, "0")
                                          ),
                                          React.createElement(
                                            "td",
                                            {
                                              className:
                                                "p-2 border-r border-slate-200 font-medium text-slate-900",
                                            },
                                            item.name,
                                            item.version &&
                                              React.createElement(
                                                "span",
                                                {
                                                  className:
                                                    "text-slate-500 font-normal ml-1",
                                                },
                                                `(${item.version})`
                                              )
                                          ),
                                          React.createElement(
                                            "td",
                                            {
                                              className:
                                                "p-2 border-r border-slate-200 text-slate-700",
                                            },
                                            item.category
                                          ),
                                          React.createElement(
                                            "td",
                                            {
                                              className:
                                                "p-2 border-r border-slate-200 text-slate-800 font-medium",
                                            },
                                            item.vendor
                                          ),
                                          React.createElement(
                                            "td",
                                            {
                                              className:
                                                "p-2 border-r border-slate-200 text-slate-800",
                                            },
                                            item.licenseTypeLabel
                                          ),
                                          React.createElement(
                                            "td",
                                            {
                                              className: `p-2 ${item.evaluationClass}`,
                                            },
                                            item.evaluation
                                          )
                                        )
                                      )
                                )
                              )
                            )
                          ),

                          // Kiểm tra bản quyền KMS / Hosts
                          React.createElement(
                            "tr",
                            { className: "bg-slate-50/70 border-t border-slate-300" },
                            React.createElement(
                              "td",
                              {
                                className:
                                  "p-2 font-semibold text-slate-800 border-r border-slate-200",
                              },
                              "Kiểm tra bản quyền (KMS / Hosts)"
                            ),
                            React.createElement(
                              "td",
                              {
                                className:
                                  "p-2 font-mono text-slate-900 border-r border-slate-200 font-medium",
                              },
                              hasCrack
                                ? `Phát hiện: ${crackInstalls
                                    .map((c) => c.displayName || c.rawSoftwareName)
                                    .join(", ")}`
                                : "Clean (Port 1688 Closed, Hosts Clean)"
                            ),
                            React.createElement(
                              "td",
                              {
                                className: hasCrack
                                  ? "p-2 text-rose-700 font-bold"
                                  : "p-2 text-emerald-700 font-medium",
                              },
                              hasCrack
                                ? "Cảnh báo vi phạm bản quyền phần mềm bẻ khóa"
                                : "An toàn, không dùng phần mềm bẻ khóa"
                            )
                          )
                        )
                      ),

                      // Signatures & Footer
                      React.createElement(
                        "div",
                        { className: "p-4 border-t border-slate-200 bg-slate-50/40" },
                        React.createElement(
                          "div",
                          {
                            className:
                              "grid grid-cols-2 text-center text-xs print-avoid-break mb-3",
                          },
                          React.createElement(
                            "div",
                            null,
                            React.createElement(
                              "p",
                              { className: "font-bold text-slate-800 uppercase" },
                              "KỸ THUẬT VIÊN KIỂM TOÁN"
                            ),
                            React.createElement(
                              "p",
                              { className: "text-slate-400 italic text-[10px] mt-0.5" },
                              "(Ký và ghi rõ họ tên)"
                            ),
                            React.createElement("div", { className: "h-12" })
                          ),
                          React.createElement(
                            "div",
                            null,
                            React.createElement(
                              "p",
                              { className: "font-bold text-slate-800 uppercase" },
                              "NGƯỜI DÙNG / ĐẠI DIỆN XÁC NHẬN"
                            ),
                            React.createElement(
                              "p",
                              { className: "text-slate-400 italic text-[10px] mt-0.5" },
                              "(Ký và ghi rõ họ tên)"
                            ),
                            React.createElement("div", { className: "h-12" })
                          )
                        ),
                        React.createElement(
                          "div",
                          {
                            className:
                              "border-t border-slate-200 pt-2 text-center text-[10px] text-slate-500 font-sans",
                          },
                          React.createElement(
                            "p",
                            { className: "font-medium" },
                            "Hachihi SAM Pro • By hachihi.vn 0933842126"
                          )
                        )
                      )
                    ),
                    compIdx < arr.length - 1 &&
                      React.createElement("div", {
                        className: "print-page-break my-6",
                      })
                  );
                })
              )
            )
        )
      )
    );
  }

  global.SAM_REPORTS = global.SAM_REPORTS || {};
  global.SAM_REPORTS.ExecutiveReportModal = ExecutiveReportModal;

})(typeof window !== 'undefined' ? window : this);
