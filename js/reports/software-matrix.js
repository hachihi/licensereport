// js/reports/software-matrix.js - Tab 2: Software Matrix Component
(function (global) {
  'use strict';

  function SoftwareMatrixReport(props) {
    const {
      softwareGroups,
      searchTerm,
      setSearchTerm,
      filterRisk,
      setFilterRisk,
      formatVND
    } = props;

    const filteredList = (softwareGroups || []).filter((g) => {
      if (filterRisk !== "ALL" && g.auditRisk !== filterRisk) return false;
      if (
        searchTerm &&
        !g.displayName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !g.vendor.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      return true;
    });

    return React.createElement(
      "div",
      { className: "space-y-4" },
      // Search and Filter Bar
      React.createElement(
        "div",
        { className: "flex flex-col sm:flex-row justify-between items-center gap-3" },
        React.createElement("input", {
          type: "text",
          placeholder: "Tìm kiếm phần mềm, hãng...",
          value: searchTerm,
          onChange: (e) => setSearchTerm(e.target.value),
          className:
            "w-full sm:w-80 px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
        }),
        React.createElement(
          "div",
          { className: "flex items-center gap-2 w-full sm:w-auto" },
          React.createElement(
            "select",
            {
              value: filterRisk,
              onChange: (e) => setFilterRisk(e.target.value),
              className:
                "text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer w-full sm:w-auto",
            },
            React.createElement("option", { value: "ALL" }, "Tất cả mức rủi ro"),
            React.createElement("option", { value: "CRITICAL" }, "Rủi ro Nghiêm trọng"),
            React.createElement("option", { value: "HIGH" }, "Rủi ro Cao"),
            React.createElement("option", { value: "LOW" }, "Rủi ro Thấp / Free FOSS")
          )
        )
      ),

      // Software Matrix Table
      React.createElement(
        "div",
        { className: "bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-200" },
        React.createElement(
          "div",
          { className: "overflow-x-auto" },
          React.createElement(
            "table",
            { className: "w-full text-left text-xs sam-table" },
            React.createElement(
              "thead",
              {
                className:
                  "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700",
              },
              React.createElement(
                "tr",
                null,
                React.createElement("th", { className: "p-3" }, "Tên Phần Mềm & Hãng"),
                React.createElement("th", { className: "p-3" }, "Phân Loại Bản Quyền"),
                React.createElement("th", { className: "p-3 text-center" }, "Số Lượng Máy"),
                React.createElement("th", { className: "p-3" }, "Tình Trạng Hóa Đơn"),
                React.createElement("th", { className: "p-3" }, "Khuyến Nghị & Đề Xuất FOSS"),
                React.createElement("th", { className: "p-3 text-right" }, "Đơn Giá Dự Toán")
              )
            ),
            React.createElement(
              "tbody",
              { className: "divide-y divide-slate-100 dark:divide-slate-800" },
              filteredList.map((g, idx) =>
                React.createElement(
                  "tr",
                  { key: idx, className: "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition" },
                  React.createElement(
                    "td",
                    { className: "p-3" },
                    React.createElement(
                      "div",
                      { className: "font-bold text-slate-900 dark:text-slate-100" },
                      g.displayName
                    ),
                    React.createElement(
                      "div",
                      { className: "text-slate-500 dark:text-slate-400 text-[11px]" },
                      g.vendor
                    )
                  ),
                  React.createElement(
                    "td",
                    { className: "p-3" },
                    React.createElement(
                      "span",
                      {
                        className: `inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          g.licenseType === "FREE_OPEN_SOURCE"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : g.licenseType === "FREE_PERSONAL_ONLY"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                        }`,
                      },
                      g.licenseType === "FREE_OPEN_SOURCE"
                        ? "FOSS Miễn Phí"
                        : g.licenseType === "FREE_PERSONAL_ONLY"
                        ? "Bẫy Cá Nhân"
                        : "Thương Mại Trả Phí"
                    )
                  ),
                  React.createElement(
                    "td",
                    { className: "p-3 font-semibold text-slate-800 dark:text-slate-200 text-center" },
                    g.installedCount,
                    " máy"
                  ),
                  React.createElement(
                    "td",
                    { className: "p-3" },
                    React.createElement(
                      "div",
                      { className: "space-y-1" },
                      g.hasInvoiceCount > 0 &&
                        React.createElement(
                          "span",
                          {
                            className:
                              "inline-block mr-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-medium",
                          },
                          "Có HĐ: ",
                          g.hasInvoiceCount
                        ),
                      g.missingInvoiceCount > 0 &&
                        React.createElement(
                          "span",
                          {
                            className:
                              "inline-block mr-1 text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-medium",
                          },
                          "Thiếu HĐ: ",
                          g.missingInvoiceCount
                        ),
                      (g.fossCount > 0 || g.licenseType === "FREE_OPEN_SOURCE") &&
                        React.createElement(
                          "span",
                          {
                            className:
                              "inline-block text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-medium",
                          },
                          "FOSS (Không cần HĐ)"
                        )
                    )
                  ),
                  React.createElement(
                    "td",
                    { className: "p-3 max-w-xs" },
                    React.createElement(
                      "p",
                      { className: "text-slate-700 dark:text-slate-300" },
                      g.actionDetails
                    ),
                    React.createElement(
                      "p",
                      { className: "text-blue-600 dark:text-blue-400 font-medium mt-0.5" },
                      "➡️ ",
                      g.recommendedAlternative
                    )
                  ),
                  React.createElement(
                    "td",
                    { className: "p-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap text-right font-mono" },
                    formatVND(g.estimatedPriceVND)
                  )
                )
              ),
              filteredList.length === 0 &&
                React.createElement(
                  "tr",
                  null,
                  React.createElement(
                    "td",
                    { colSpan: 6, className: "p-8 text-center text-slate-500 dark:text-slate-400" },
                    "Không tìm thấy phần mềm phù hợp với từ khóa hoặc bộ lọc."
                  )
                )
            )
          )
        )
      )
    );
  }

  global.SAM_REPORTS = global.SAM_REPORTS || {};
  global.SAM_REPORTS.SoftwareMatrixReport = SoftwareMatrixReport;

})(typeof window !== 'undefined' ? window : this);
