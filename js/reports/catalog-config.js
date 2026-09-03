// js/reports/catalog-config.js - Tab 5: Catalog and Rules Configuration Component
(function (global) {
  'use strict';

  function CatalogConfigReport(props) {
    const {
      catalogRules,
      catalogSource,
      catalogInfo,
      onAddRule,
      onDeleteRule,
      onResetCatalog,
      onUploadCatalogFile,
      onExportCatalog,
      onDownloadTemplate,
      formatVND,
    } = props;

    const [searchTerm, setSearchTerm] = React.useState("");
    const [showAddModal, setShowAddModal] = React.useState(false);
    const [newRule, setNewRule] = React.useState({
      pattern: "",
      name: "",
      vendor: "",
      licenseType: "COMMERCIAL_PAID",
      risk: "HIGH",
      price: 0,
      foss: "",
      action: "",
    });

    const fileInputRef = React.useRef(null);

    const filteredRules = (catalogRules || []).filter((r) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        (r.pattern && r.pattern.toLowerCase().includes(q)) ||
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.vendor && r.vendor.toLowerCase().includes(q)) ||
        (r.foss && r.foss.toLowerCase().includes(q))
      );
    });

    const handleSaveNewRule = (e) => {
      e.preventDefault();
      if (!newRule.pattern || !newRule.name) {
        alert("Vui lòng nhập từ khóa nhận diện và tên phần mềm!");
        return;
      }
      onAddRule({
        ...newRule,
        price: Number(newRule.price) || 0,
      });
      setNewRule({
        pattern: "",
        name: "",
        vendor: "",
        licenseType: "COMMERCIAL_PAID",
        risk: "HIGH",
        price: 0,
        foss: "",
        action: "",
      });
      setShowAddModal(false);
    };

    const handleFileInput = (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        onUploadCatalogFile(file);
      }
      e.target.value = "";
    };

    return React.createElement(
      "div",
      { className: "space-y-4" },
      // Top Control Bar
      React.createElement(
        "div",
        {
          className:
            "bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors duration-200",
        },
        React.createElement(
          "div",
          null,
          React.createElement(
            "h3",
            {
              className:
                "text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2",
            },
            "⚙️ Quản Lý Danh Mục Nhận Diện & Định Giá Bản Quyền",
            React.createElement(
              "span",
              {
                className: `text-[10px] px-2 py-0.5 rounded font-bold ${
                  catalogSource === "CUSTOM_FILE" || catalogSource === "SHEET3_EXCEL"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                }`,
              },
              catalogSource === "CUSTOM_FILE"
                ? "Danh mục tải lên riêng"
                : catalogSource === "SHEET3_EXCEL"
                ? "Lấy từ Sheet 3 file kiểm kê"
                : "Danh mục chuẩn hệ thống"
            )
          ),
          React.createElement(
            "p",
            { className: "text-xs text-slate-500 dark:text-slate-400 mt-0.5" },
            catalogInfo && catalogInfo.name ? `${catalogInfo.name} (${catalogInfo.version || 'v2026.09'})` : "Hachihi SAM Standard v2026.09",
            " • Tổng cộng: ",
            catalogRules.length,
            " quy tắc nhận diện"
          )
        ),
        React.createElement(
          "div",
          { className: "flex flex-wrap items-center gap-2" },
          React.createElement(
            "button",
            {
              onClick: () => setShowAddModal(true),
              className:
                "px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1",
            },
            "+ Thêm Quy Tắc"
          ),
          React.createElement(
            "button",
            {
              onClick: () => fileInputRef.current && fileInputRef.current.click(),
              className:
                "px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 border border-slate-300 dark:border-slate-700",
              title: "Nạp file Excel danh mục riêng của bạn",
            },
            "📂 Nạp Danh Mục Riêng"
          ),
          React.createElement("input", {
            type: "file",
            ref: fileInputRef,
            onChange: handleFileInput,
            accept: ".xlsx, .xls",
            className: "hidden",
          }),
          React.createElement(
            "button",
            {
              onClick: onExportCatalog,
              className:
                "px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 border border-slate-300 dark:border-slate-700",
              title: "Xuất danh mục quy tắc hiện tại ra file Excel",
            },
            "📥 Xuất Danh Mục"
          ),
          React.createElement(
            "button",
            {
              onClick: onResetCatalog,
              className:
                "px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs font-semibold transition cursor-pointer border border-rose-200 dark:border-rose-900",
              title: "Khôi phục lại danh mục chuẩn ban đầu",
            },
            "🔄 Khôi Phục Chuẩn"
          )
        )
      ),

      // Search bar
      React.createElement(
        "div",
        { className: "flex items-center justify-between gap-3" },
        React.createElement("input", {
          type: "text",
          placeholder: "Tìm kiếm quy tắc theo tên, từ khóa nhận diện, hãng hoặc FOSS...",
          value: searchTerm,
          onChange: (e) => setSearchTerm(e.target.value),
          className:
            "w-full sm:w-96 px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
        }),
        React.createElement(
          "span",
          { className: "text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap" },
          "Hiển thị: ",
          filteredRules.length,
          "/",
          catalogRules.length,
          " quy tắc"
        )
      ),

      // Catalog Table
      React.createElement(
        "div",
        {
          className:
            "bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-200",
        },
        React.createElement(
          "div",
          { className: "overflow-x-auto max-h-[600px] overflow-y-auto" },
          React.createElement(
            "table",
            { className: "w-full text-left text-xs sam-table" },
            React.createElement(
              "thead",
              {
                className:
                  "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700",
              },
              React.createElement(
                "tr",
                null,
                React.createElement("th", { className: "p-3 w-10 text-center" }, "STT"),
                React.createElement("th", { className: "p-3 min-w-[140px]" }, "Từ Khóa Quét (Pattern)"),
                React.createElement("th", { className: "p-3 min-w-[180px]" }, "Tên Chuẩn Hóa"),
                React.createElement("th", { className: "p-3" }, "Hãng"),
                React.createElement("th", { className: "p-3 text-center" }, "Loại License"),
                React.createElement("th", { className: "p-3 text-center" }, "Rủi Ro"),
                React.createElement("th", { className: "p-3 text-right" }, "Đơn Giá (VNĐ)"),
                React.createElement("th", { className: "p-3 min-w-[140px]" }, "Đề Xuất FOSS"),
                React.createElement("th", { className: "p-3 text-center w-14" }, "Xóa")
              )
            ),
            React.createElement(
              "tbody",
              { className: "divide-y divide-slate-100 dark:divide-slate-800" },
              filteredRules.map((rule, idx) =>
                React.createElement(
                  "tr",
                  { key: idx, className: "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition" },
                  React.createElement(
                    "td",
                    { className: "p-3 text-center text-slate-500 dark:text-slate-400 font-medium" },
                    idx + 1
                  ),
                  React.createElement(
                    "td",
                    { className: "p-3 font-mono text-[11px] text-blue-600 dark:text-blue-400 font-semibold" },
                    rule.pattern
                  ),
                  React.createElement(
                    "td",
                    { className: "p-3 font-bold text-slate-900 dark:text-slate-100" },
                    rule.name
                  ),
                  React.createElement(
                    "td",
                    { className: "p-3 text-slate-600 dark:text-slate-300" },
                    rule.vendor || "N/A"
                  ),
                  React.createElement(
                    "td",
                    { className: "p-3 text-center" },
                    React.createElement(
                      "span",
                      {
                        className: `inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          rule.licenseType === "FREE_OPEN_SOURCE"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : rule.licenseType === "FREE_PERSONAL_ONLY"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                        }`,
                      },
                      rule.licenseType === "FREE_OPEN_SOURCE"
                        ? "FOSS"
                        : rule.licenseType === "FREE_PERSONAL_ONLY"
                        ? "Bẫy cá nhân"
                        : "Thương mại"
                    )
                  ),
                  React.createElement(
                    "td",
                    { className: "p-3 text-center" },
                    React.createElement(
                      "span",
                      {
                        className: `inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          rule.risk === "CRITICAL"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            : rule.risk === "HIGH"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        }`,
                      },
                      rule.risk
                    )
                  ),
                  React.createElement(
                    "td",
                    { className: "p-3 text-right font-mono font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap" },
                    formatVND(rule.price)
                  ),
                  React.createElement(
                    "td",
                    { className: "p-3 text-emerald-600 dark:text-emerald-400 font-medium" },
                    rule.foss || "—"
                  ),
                  React.createElement(
                    "td",
                    { className: "p-3 text-center" },
                    React.createElement(
                      "button",
                      {
                        onClick: () => onDeleteRule(idx),
                        className:
                          "text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer text-xs font-bold",
                        title: "Xóa quy tắc này",
                      },
                      "✕"
                    )
                  )
                )
              ),
              filteredRules.length === 0 &&
                React.createElement(
                  "tr",
                  null,
                  React.createElement(
                    "td",
                    { colSpan: 9, className: "p-8 text-center text-slate-500 dark:text-slate-400" },
                    "Không tìm thấy quy tắc nào."
                  )
                )
            )
          )
        )
      ),

      // Modal Add Rule
      showAddModal &&
        React.createElement(
          "div",
          {
            className:
              "fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn",
          },
          React.createElement(
            "div",
            {
              className:
                "bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4",
            },
            React.createElement(
              "div",
              { className: "flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3" },
              React.createElement(
                "h3",
                { className: "font-bold text-base text-slate-900 dark:text-slate-100" },
                "Thêm Quy Tắc Nhận Diện Mới"
              ),
              React.createElement(
                "button",
                {
                  onClick: () => setShowAddModal(false),
                  className: "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg cursor-pointer",
                },
                "✕"
              )
            ),
            React.createElement(
              "form",
              { onSubmit: handleSaveNewRule, className: "space-y-3 text-xs" },
              React.createElement(
                "div",
                null,
                React.createElement("label", { className: "font-semibold text-slate-700 dark:text-slate-300 block mb-1" }, "Từ khóa nhận diện (Pattern)*"),
                React.createElement("input", {
                  type: "text",
                  required: true,
                  placeholder: "Ví dụ: autocad, winrar, photoshop...",
                  value: newRule.pattern,
                  onChange: (e) => setNewRule({ ...newRule, pattern: e.target.value }),
                  className:
                    "w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                })
              ),
              React.createElement(
                "div",
                null,
                React.createElement("label", { className: "font-semibold text-slate-700 dark:text-slate-300 block mb-1" }, "Tên chuẩn hóa hiển thị*"),
                React.createElement("input", {
                  type: "text",
                  required: true,
                  placeholder: "Ví dụ: Autodesk AutoCAD 2024",
                  value: newRule.name,
                  onChange: (e) => setNewRule({ ...newRule, name: e.target.value }),
                  className:
                    "w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                })
              ),
              React.createElement(
                "div",
                { className: "grid grid-cols-2 gap-3" },
                React.createElement(
                  "div",
                  null,
                  React.createElement("label", { className: "font-semibold text-slate-700 dark:text-slate-300 block mb-1" }, "Hãng sản xuất"),
                  React.createElement("input", {
                    type: "text",
                    placeholder: "Autodesk, Adobe, Microsoft...",
                    value: newRule.vendor,
                    onChange: (e) => setNewRule({ ...newRule, vendor: e.target.value }),
                    className:
                      "w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                  })
                ),
                React.createElement(
                  "div",
                  null,
                  React.createElement("label", { className: "font-semibold text-slate-700 dark:text-slate-300 block mb-1" }, "Đơn giá dự toán (VNĐ)"),
                  React.createElement("input", {
                    type: "number",
                    value: newRule.price,
                    onChange: (e) => setNewRule({ ...newRule, price: e.target.value }),
                    className:
                      "w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                  })
                )
              ),
              React.createElement(
                "div",
                { className: "grid grid-cols-2 gap-3" },
                React.createElement(
                  "div",
                  null,
                  React.createElement("label", { className: "font-semibold text-slate-700 dark:text-slate-300 block mb-1" }, "Loại bản quyền"),
                  React.createElement(
                    "select",
                    {
                      value: newRule.licenseType,
                      onChange: (e) => setNewRule({ ...newRule, licenseType: e.target.value }),
                      className:
                        "w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                    },
                    React.createElement("option", { value: "COMMERCIAL_PAID" }, "Thương mại có phí"),
                    React.createElement("option", { value: "FREE_OPEN_SOURCE" }, "Mã nguồn mở (FOSS)"),
                    React.createElement("option", { value: "FREE_PERSONAL_ONLY" }, "Bẫy cá nhân (Free Personal)")
                  )
                ),
                React.createElement(
                  "div",
                  null,
                  React.createElement("label", { className: "font-semibold text-slate-700 dark:text-slate-300 block mb-1" }, "Mức rủi ro"),
                  React.createElement(
                    "select",
                    {
                      value: newRule.risk,
                      onChange: (e) => setNewRule({ ...newRule, risk: e.target.value }),
                      className:
                        "w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                    },
                    React.createElement("option", { value: "CRITICAL" }, "Nghiêm trọng (Crack/Lậu)"),
                    React.createElement("option", { value: "HIGH" }, "Rủi ro Cao"),
                    React.createElement("option", { value: "MEDIUM" }, "Rủi ro Trung bình"),
                    React.createElement("option", { value: "LOW" }, "Thấp / An toàn")
                  )
                )
              ),
              React.createElement(
                "div",
                null,
                React.createElement("label", { className: "font-semibold text-slate-700 dark:text-slate-300 block mb-1" }, "Đề xuất FOSS thay thế"),
                React.createElement("input", {
                  type: "text",
                  placeholder: "Ví dụ: 7-Zip, RustDesk, OnlyOffice...",
                  value: newRule.foss,
                  onChange: (e) => setNewRule({ ...newRule, foss: e.target.value }),
                  className:
                    "w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                })
              ),
              React.createElement(
                "div",
                { className: "flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800" },
                React.createElement(
                  "button",
                  {
                    type: "button",
                    onClick: () => setShowAddModal(false),
                    className: "px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium cursor-pointer",
                  },
                  "Hủy"
                ),
                React.createElement(
                  "button",
                  {
                    type: "submit",
                    className: "px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-xs cursor-pointer",
                  },
                  "Lưu Quy Tắc"
                )
              )
            )
          )
        )
    );
  }

  global.SAM_REPORTS = global.SAM_REPORTS || {};
  global.SAM_REPORTS.CatalogConfigReport = CatalogConfigReport;

})(typeof window !== 'undefined' ? window : this);
