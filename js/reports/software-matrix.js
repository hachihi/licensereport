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

    const MultiSelectFilter =
      (global.SAM_COMPONENTS && global.SAM_COMPONENTS.MultiSelectFilter) ||
      (global.SAM_UTILS && global.SAM_UTILS.MultiSelectFilter);

    const riskOptions = [
      { value: "CRITICAL", label: "🔴 Rủi ro Nghiêm trọng" },
      { value: "HIGH", label: "🟠 Rủi ro Cao" },
      { value: "LOW", label: "🟢 Rủi ro Thấp / FOSS" },
    ];

    const selectedRisks = Array.isArray(filterRisk)
      ? filterRisk
      : filterRisk === "ALL" || !filterRisk
        ? ["CRITICAL", "HIGH", "LOW"]
        : [filterRisk];

    const filteredList = (softwareGroups || []).filter((g) => {
      if (selectedRisks.length > 0 && selectedRisks.length < 3 && !selectedRisks.includes(g.auditRisk)) {
        return false;
      }
      if (
        searchTerm &&
        !g.displayName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !g.vendor.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      return true;
    });

    // Metrics breakdown for KPI summary cards
    const totalGroups = (softwareGroups || []).length;
    const criticalCount = (softwareGroups || []).filter(g => g.auditRisk === "CRITICAL" || g.missingInvoiceCount > 0).length;
    const trapCount = (softwareGroups || []).filter(g => g.licenseType === "FREE_PERSONAL_ONLY" || g.auditRisk === "HIGH").length;
    const fossCount = (softwareGroups || []).filter(g => g.licenseType === "FREE_OPEN_SOURCE" || (g.hasInvoiceCount > 0 && g.missingInvoiceCount === 0)).length;

    return React.createElement(
      "div",
      { className: "space-y-6" },

      // 1. Top Section Banner Card
      React.createElement(
        "div",
        { className: "sam-section-card p-4 sm:p-5 flex items-center justify-between flex-wrap gap-4" },
        React.createElement(
          "div",
          { className: "flex items-center gap-3" },
          React.createElement("span", { className: "text-2xl" }, "📑"),
          React.createElement(
            "div",
            null,
            React.createElement(
              "h2",
              { className: "text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-wide" },
              "Ma Trận Phân Bổ & Đánh Giá Rủi Ro Bản Quyền Phần Mềm"
            ),
            React.createElement(
              "p",
              { className: "text-xs text-slate-500 dark:text-slate-400" },
              "Phân loại bản quyền, tổng hợp số máy cài đặt, đối soát chứng từ hóa đơn VAT và giải pháp chuyển đổi FOSS"
            )
          )
        ),
        React.createElement(
          "div",
          { className: "flex items-center gap-2 text-xs" },
          React.createElement(
            "span",
            { className: "px-3 py-1 rounded-full bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-900" },
            `${totalGroups} nhóm ứng dụng`
          ),
          React.createElement(
            "span",
            { className: "px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-900" },
            `${fossCount} nhóm an toàn`
          )
        )
      ),

      // 2. Metric KPI Cards Row
      React.createElement(
        "div",
        { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" },

        React.createElement(
          "div",
          { className: "sam-kpi-card accent-blue" },
          React.createElement(
            "div",
            { className: "flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400" },
            React.createElement("span", null, "Tổng Số Nhóm"),
            React.createElement("span", { className: "text-sm" }, "📦")
          ),
          React.createElement(
            "div",
            { className: "mt-2 flex items-baseline justify-between" },
            React.createElement("span", { className: "text-2xl font-black text-slate-900 dark:text-white" }, totalGroups),
            React.createElement("span", { className: "text-xs text-slate-500" }, "danh mục")
          )
        ),

        React.createElement(
          "div",
          { className: "sam-kpi-card accent-rose" },
          React.createElement(
            "div",
            { className: "flex items-center justify-between text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400" },
            React.createElement("span", null, "Rủi Ro / Thiếu HĐ"),
            React.createElement("span", { className: "text-sm" }, "🔴")
          ),
          React.createElement(
            "div",
            { className: "mt-2 flex items-baseline justify-between" },
            React.createElement("span", { className: "text-2xl font-black text-rose-600 dark:text-rose-400" }, criticalCount),
            React.createElement("span", { className: "text-xs text-rose-600 font-semibold" }, "cần khắc phục")
          )
        ),

        React.createElement(
          "div",
          { className: "sam-kpi-card accent-amber" },
          React.createElement(
            "div",
            { className: "flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400" },
            React.createElement("span", null, "Bẫy Bản Quyền Cá Nhân"),
            React.createElement("span", { className: "text-sm" }, "🟠")
          ),
          React.createElement(
            "div",
            { className: "mt-2 flex items-baseline justify-between" },
            React.createElement("span", { className: "text-2xl font-black text-amber-600 dark:text-amber-400" }, trapCount),
            React.createElement("span", { className: "text-xs text-amber-600 font-semibold" }, "nên gỡ bỏ")
          )
        ),

        React.createElement(
          "div",
          { className: "sam-kpi-card accent-emerald" },
          React.createElement(
            "div",
            { className: "flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400" },
            React.createElement("span", null, "Hợp Lệ / FOSS Miễn Phí"),
            React.createElement("span", { className: "text-sm" }, "🟢")
          ),
          React.createElement(
            "div",
            { className: "mt-2 flex items-baseline justify-between" },
            React.createElement("span", { className: "text-2xl font-black text-emerald-600 dark:text-emerald-400" }, fossCount),
            React.createElement("span", { className: "text-xs text-emerald-600 font-semibold" }, "100% hợp pháp")
          )
        )
      ),

      // 3. Main Table Section Card
      React.createElement(
        "div",
        { className: "sam-section-card" },

        // Section Ribbon Header
        React.createElement(
          "div",
          { className: "sam-section-ribbon flex-wrap gap-3" },
          React.createElement(
            "div",
            { className: "flex items-center gap-2" },
            React.createElement("span", { className: "text-base" }, "📋"),
            React.createElement(
              "h3",
              { className: "text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider" },
              "Bảng Ma Trận & Thống Kê Điểm Cài Đặt Chi Tiết"
            )
          ),
          React.createElement(
            "div",
            { className: "text-xs text-slate-500 dark:text-slate-400 font-medium" },
            "Hiển thị ",
            React.createElement("strong", { className: "text-blue-600 dark:text-blue-400" }, filteredList.length),
            " / ",
            totalGroups,
            " nhóm phần mềm"
          )
        ),

        // Filter Toolbar Area
        React.createElement(
          "div",
          { className: "sam-toolbar-area flex flex-col sm:flex-row justify-between items-center gap-3" },
          React.createElement(
            "div",
            { className: "relative w-full sm:w-80" },
            React.createElement("input", {
              type: "text",
              placeholder: "🔍 Tìm kiếm theo tên phần mềm, hãng...",
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              className:
                "w-full pl-3 pr-8 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs",
            }),
            searchTerm &&
              React.createElement(
                "button",
                {
                  onClick: () => setSearchTerm(""),
                  className: "absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-xs",
                  title: "Xóa tìm kiếm"
                },
                "✕"
              )
          ),
          React.createElement(
            "div",
            { className: "flex items-center gap-2 w-full sm:w-auto" },
            MultiSelectFilter
              ? React.createElement(MultiSelectFilter, {
                  label: "Mức độ rủi ro",
                  options: riskOptions,
                  selected: selectedRisks,
                  onChange: setFilterRisk,
                })
              : React.createElement(
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

        // Table Container
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
                  "bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700",
              },
              React.createElement(
                "tr",
                null,
                React.createElement("th", { className: "p-3.5" }, "Tên Phần Mềm & Hãng"),
                React.createElement("th", { className: "p-3.5" }, "Phân Loại Bản Quyền"),
                React.createElement("th", { className: "p-3.5 text-center" }, "Số Lượng Máy"),
                React.createElement("th", { className: "p-3.5" }, "Tình Trạng Hóa Đơn"),
                React.createElement("th", { className: "p-3.5" }, "Khuyến Nghị & Đề Xuất FOSS"),
                React.createElement("th", { className: "p-3.5 text-right" }, "Đơn Giá Dự Toán")
              )
            ),
            React.createElement(
              "tbody",
              { className: "divide-y divide-slate-100 dark:divide-slate-800/80" },
              filteredList.map((g, idx) =>
                React.createElement(
                  "tr",
                  { key: idx, className: "hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors" },
                  React.createElement(
                    "td",
                    { className: "p-3.5" },
                    React.createElement(
                      "div",
                      { className: "font-bold text-slate-900 dark:text-slate-100 text-[13px]" },
                      g.displayName
                    ),
                    React.createElement(
                      "div",
                      { className: "text-slate-500 dark:text-slate-400 text-[11px] mt-0.5" },
                      g.vendor || "Chưa rõ nhà phát hành"
                    )
                  ),
                  React.createElement(
                    "td",
                    { className: "p-3.5" },
                    React.createElement(
                      "span",
                      {
                        className: `inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          g.licenseType === "FREE_OPEN_SOURCE"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                            : g.licenseType === "FREE_PERSONAL_ONLY"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                            : "bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border border-blue-200 dark:border-blue-900"
                        }`,
                      },
                      g.licenseType === "FREE_OPEN_SOURCE"
                        ? "🟢 FOSS Miễn Phí"
                        : g.licenseType === "FREE_PERSONAL_ONLY"
                        ? "🟠 Bẫy Cá Nhân"
                        : "🔵 Thương Mại Trả Phí"
                    )
                  ),
                  React.createElement(
                    "td",
                    { className: "p-3.5 font-bold text-slate-800 dark:text-slate-200 text-center" },
                    React.createElement(
                      "span",
                      { className: "px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 font-mono" },
                      `${g.installedCount} máy`
                    )
                  ),
                  React.createElement(
                    "td",
                    { className: "p-3.5" },
                    React.createElement(
                      "div",
                      { className: "flex items-center gap-1.5 flex-wrap" },
                      g.hasInvoiceCount > 0 &&
                        React.createElement(
                          "span",
                          {
                            className:
                              "inline-flex items-center text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
                          },
                          `✓ Có HĐ: ${g.hasInvoiceCount}`
                        ),
                      g.missingInvoiceCount > 0 &&
                        React.createElement(
                          "span",
                          {
                            className:
                              "inline-flex items-center text-[10px] px-2 py-0.5 rounded font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800",
                          },
                          `⚠ Thiếu HĐ: ${g.missingInvoiceCount}`
                        ),
                      (g.fossCount > 0 || g.licenseType === "FREE_OPEN_SOURCE") &&
                        React.createElement(
                          "span",
                          {
                            className:
                              "inline-flex items-center text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
                          },
                          "FOSS (0đ)"
                        )
                    )
                  ),
                  React.createElement(
                    "td",
                    { className: "p-3.5 max-w-sm" },
                    React.createElement(
                      "p",
                      { className: "text-slate-700 dark:text-slate-300 text-xs" },
                      g.actionDetails || "Kiểm tra định kỳ bản quyền"
                    ),
                    g.recommendedAlternative &&
                      React.createElement(
                        "p",
                        { className: "text-emerald-700 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1 text-[11px]" },
                        "💡 Đề xuất FOSS: ",
                        React.createElement("span", { className: "underline" }, g.recommendedAlternative)
                      )
                  ),
                  React.createElement(
                    "td",
                    { className: "p-3.5 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap text-right font-mono" },
                    g.estimatedPriceVND > 0 ? formatVND(g.estimatedPriceVND) : "0 ₫"
                  )
                )
              ),
              filteredList.length === 0 &&
                React.createElement(
                  "tr",
                  null,
                  React.createElement(
                    "td",
                    { colSpan: 6, className: "p-10 text-center text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50" },
                    "🔍 Không tìm thấy phần mềm phù hợp với từ khóa hoặc bộ lọc."
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
