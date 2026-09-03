// js/reports/overview.js - Tab 1: Overview Dashboard Report Component
(function (global) {
  'use strict';

  function OverviewReport(props) {
    const {
      metrics,
      kpiBreakdown,
      installations,
      executivePlanRows,
      totalBudgetRequired,
      setActiveTab,
      setShowPrintReportModal,
      formatVND
    } = props;

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

    const total = installations.length || 1;
    const pctHasInv = Math.round((hasInvCount / total) * 100);
    const pctFoss = Math.round((fossCount / total) * 100);
    const pctTrap = Math.round((trapCount / total) * 100);
    const pctMissing = Math.max(0, 100 - pctHasInv - pctFoss - pctTrap);

    return React.createElement(
      "div",
      { className: "space-y-6" },
      // Top 4 Metric Cards
      React.createElement(
        "div",
        { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" },
        React.createElement(
          "div",
          { className: "bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200" },
          React.createElement(
            "p",
            { className: "text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" },
            "Điểm Tuân Thủ Bản Quyền"
          ),
          React.createElement(
            "div",
            { className: "mt-2 flex items-baseline justify-between" },
            React.createElement(
              "span",
              { className: "text-3xl font-black text-slate-900 dark:text-slate-100" },
              metrics.complianceScore,
              "%"
            ),
            React.createElement(
              "span",
              {
                className: `text-xs px-2 py-0.5 rounded font-bold ${
                  metrics.complianceScore >= 80
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : metrics.complianceScore >= 50
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                }`,
              },
              metrics.complianceScore >= 80 ? "An Toàn" : "Cần Xử Lý"
            )
          ),
          React.createElement(
            "p",
            { className: "text-xs text-slate-500 dark:text-slate-400 mt-3" },
            metrics.totalComputers,
            " máy tính • ",
            metrics.totalInstalls,
            " lượt cài"
          )
        ),
        React.createElement(
          "div",
          {
            className: "bg-white dark:bg-slate-900 p-5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20 shadow-sm transition-colors duration-200",
          },
          React.createElement(
            "p",
            { className: "text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400" },
            "Rủi Ro Cao / Nghiêm Trọng"
          ),
          React.createElement(
            "div",
            { className: "mt-2 flex items-baseline justify-between" },
            React.createElement(
              "span",
              { className: "text-3xl font-black text-rose-600 dark:text-rose-400" },
              metrics.highRisk + metrics.criticalRisk
            ),
            React.createElement(
              "span",
              { className: "text-xs font-medium text-rose-700 dark:text-rose-300" },
              "Mục tiêu kiểm tra BSA"
            )
          ),
          React.createElement(
            "p",
            { className: "text-xs text-rose-600/80 dark:text-rose-400/80 mt-3" },
            "AutoCAD, Adobe, MS Office crack, Win Home..."
          )
        ),
        React.createElement(
          "div",
          {
            className:
              "bg-white dark:bg-slate-900 p-5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/20 shadow-sm transition-colors duration-200",
          },
          React.createElement(
            "p",
            { className: "text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400" },
            "Bẫy Bản Quyền Cá Nhân"
          ),
          React.createElement(
            "div",
            { className: "mt-2 flex items-baseline justify-between" },
            React.createElement(
              "span",
              { className: "text-3xl font-black text-amber-600 dark:text-amber-400" },
              metrics.trapCount
            ),
            React.createElement(
              "span",
              { className: "text-xs font-medium text-amber-700 dark:text-amber-300" },
              "Vi phạm điều khoản DN"
            )
          ),
          React.createElement(
            "p",
            { className: "text-xs text-amber-600/80 dark:text-amber-400/80 mt-3" },
            "WinRAR quá hạn, CCleaner Free, TeamViewer cá nhân..."
          )
        ),
        React.createElement(
          "div",
          {
            className:
              "bg-white dark:bg-slate-900 p-5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-sm transition-colors duration-200",
          },
          React.createElement(
            "p",
            { className: "text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400" },
            "Tiết Kiệm Khi Đổi Sang FOSS"
          ),
          React.createElement(
            "div",
            { className: "mt-2 flex items-baseline justify-between" },
            React.createElement(
              "span",
              { className: "text-2xl font-black text-emerald-600 dark:text-emerald-400" },
              formatVND(metrics.totalFossSavings)
            ),
            React.createElement(
              "span",
              { className: "text-xs font-medium text-emerald-700 dark:text-emerald-300" },
              metrics.replaceFoss,
              " vị trí"
            )
          ),
          React.createElement(
            "p",
            { className: "text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-3" },
            "Đổi sang 7-Zip, RustDesk, OnlyOffice, PDFgear"
          )
        )
      ),

      // 2 Visual Analysis Blocks
      React.createElement(
        "div",
        { className: "grid grid-cols-1 lg:grid-cols-12 gap-5" },
        // Left Column: Breakdown Bar & Stats
        React.createElement(
          "div",
          {
            className:
              "lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors duration-200",
          },
          React.createElement(
            "div",
            null,
            React.createElement(
              "div",
              { className: "flex items-center justify-between mb-1" },
              React.createElement(
                "h3",
                {
                  className:
                    "text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2",
                },
                React.createElement("span", {
                  className: "w-2.5 h-2.5 rounded-full bg-blue-600",
                }),
                React.createElement("span", null, "Cơ Cấu Trạng Thái Bản Quyền")
              ),
              React.createElement(
                "span",
                { className: "text-xs font-semibold text-slate-500 dark:text-slate-400" },
                installations.length,
                " lượt cài"
              )
            ),
            React.createElement(
              "p",
              { className: "text-xs text-slate-500 dark:text-slate-400 mb-4" },
              "Tỷ lệ phân bổ phần mềm Hợp lệ vs Miễn phí FOSS vs Rủi ro"
            ),
            React.createElement(
              "div",
              { className: "space-y-4" },
              React.createElement(
                "div",
                {
                  className:
                    "w-full h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner",
                },
                pctHasInv > 0 &&
                  React.createElement("div", {
                    style: { width: `${pctHasInv}%` },
                    className: "bg-emerald-500 h-full transition-all duration-500",
                    title: `Có Hóa đơn: ${hasInvCount} (${pctHasInv}%)`,
                  }),
                pctFoss > 0 &&
                  React.createElement("div", {
                    style: { width: `${pctFoss}%` },
                    className: "bg-blue-500 h-full transition-all duration-500",
                    title: `Miễn phí FOSS: ${fossCount} (${pctFoss}%)`,
                  }),
                pctTrap > 0 &&
                  React.createElement("div", {
                    style: { width: `${pctTrap}%` },
                    className: "bg-amber-400 h-full transition-all duration-500",
                    title: `Bẫy cá nhân: ${trapCount} (${pctTrap}%)`,
                  }),
                pctMissing > 0 &&
                  React.createElement("div", {
                    style: { width: `${pctMissing}%` },
                    className: "bg-rose-500 h-full transition-all duration-500",
                    title: `Thiếu HĐ: ${missingCount} (${pctMissing}%)`,
                  })
              ),
              React.createElement(
                "div",
                { className: "grid grid-cols-2 gap-2 text-xs" },
                React.createElement(
                  "div",
                  {
                    className:
                      "p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 flex items-center justify-between",
                  },
                  React.createElement(
                    "div",
                    { className: "flex items-center gap-2" },
                    React.createElement("span", {
                      className: "w-3 h-3 rounded-full bg-emerald-500 shrink-0",
                    }),
                    React.createElement(
                      "span",
                      { className: "text-emerald-900 dark:text-emerald-200 font-medium truncate" },
                      "Có HĐ VAT"
                    )
                  ),
                  React.createElement(
                    "span",
                    { className: "font-bold text-emerald-950 dark:text-emerald-100" },
                    hasInvCount,
                    " ",
                    React.createElement(
                      "span",
                      { className: "text-[10px] text-emerald-700 dark:text-emerald-300" },
                      "(",
                      pctHasInv,
                      "%)"
                    )
                  )
                ),
                React.createElement(
                  "div",
                  {
                    className:
                      "p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 flex items-center justify-between",
                  },
                  React.createElement(
                    "div",
                    { className: "flex items-center gap-2" },
                    React.createElement("span", {
                      className: "w-3 h-3 rounded-full bg-blue-500 shrink-0",
                    }),
                    React.createElement(
                      "span",
                      { className: "text-blue-900 dark:text-blue-200 font-medium truncate" },
                      "Free FOSS"
                    )
                  ),
                  React.createElement(
                    "span",
                    { className: "font-bold text-blue-950 dark:text-blue-100" },
                    fossCount,
                    " ",
                    React.createElement(
                      "span",
                      { className: "text-[10px] text-blue-700 dark:text-blue-300" },
                      "(",
                      pctFoss,
                      "%)"
                    )
                  )
                ),
                React.createElement(
                  "div",
                  {
                    className:
                      "p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900 flex items-center justify-between",
                  },
                  React.createElement(
                    "div",
                    { className: "flex items-center gap-2" },
                    React.createElement("span", {
                      className: "w-3 h-3 rounded-full bg-amber-400 shrink-0",
                    }),
                    React.createElement(
                      "span",
                      { className: "text-amber-900 dark:text-amber-200 font-medium truncate" },
                      "Bẫy cá nhân"
                    )
                  ),
                  React.createElement(
                    "span",
                    { className: "font-bold text-amber-950 dark:text-amber-100" },
                    trapCount,
                    " ",
                    React.createElement(
                      "span",
                      { className: "text-[10px] text-amber-700 dark:text-amber-300" },
                      "(",
                      pctTrap,
                      "%)"
                    )
                  )
                ),
                React.createElement(
                  "div",
                  {
                    className:
                      "p-2.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900 flex items-center justify-between",
                  },
                  React.createElement(
                    "div",
                    { className: "flex items-center gap-2" },
                    React.createElement("span", {
                      className: "w-3 h-3 rounded-full bg-rose-500 shrink-0",
                    }),
                    React.createElement(
                      "span",
                      { className: "text-rose-900 dark:text-rose-200 font-medium truncate" },
                      "Thiếu HĐ"
                    )
                  ),
                  React.createElement(
                    "span",
                    { className: "font-bold text-rose-950 dark:text-rose-100" },
                    missingCount,
                    " ",
                    React.createElement(
                      "span",
                      { className: "text-[10px] text-rose-700 dark:text-rose-300" },
                      "(",
                      pctMissing,
                      "%)"
                    )
                  )
                )
              )
            )
          ),
          React.createElement(
            "div",
            {
              className:
                "mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between",
            },
            React.createElement(
              "span",
              null,
              "Điểm tuân thủ hiện tại: ",
              React.createElement(
                "strong",
                { className: "text-slate-800 dark:text-slate-100" },
                metrics.complianceScore,
                "%"
              )
            ),
            React.createElement(
              "button",
              {
                onClick: () => setShowPrintReportModal(true),
                className: "text-blue-600 dark:text-blue-400 hover:underline font-semibold text-xs cursor-pointer",
              },
              "In Báo Cáo BGĐ ↗"
            )
          )
        ),

        // Right Column: Budget Allocation by Major Software
        React.createElement(
          "div",
          {
            className:
              "lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors duration-200",
          },
          React.createElement(
            "div",
            null,
            React.createElement(
              "div",
              { className: "flex items-center justify-between mb-1" },
              React.createElement(
                "h3",
                {
                  className:
                    "text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2",
                },
                React.createElement("span", {
                  className: "w-2.5 h-2.5 rounded-full bg-rose-500",
                }),
                React.createElement("span", null, "Phân Bổ Ngân Sách Dự Kiến Theo Phần Mềm")
              ),
              React.createElement(
                "span",
                { className: "text-xs font-bold text-rose-700 dark:text-rose-400" },
                formatVND(totalBudgetRequired)
              )
            ),
            React.createElement(
              "p",
              { className: "text-xs text-slate-500 dark:text-slate-400 mb-4" },
              "Các phần mềm thương mại trọng điểm phát hiện chưa có hóa đơn"
            ),
            React.createElement(
              "div",
              { className: "space-y-3" },
              executivePlanRows
                .filter((r) => r.totalEstimated > 0)
                .slice(0, 4)
                .map((item, idx) => {
                  const pct =
                    totalBudgetRequired > 0
                      ? Math.round((item.totalEstimated / totalBudgetRequired) * 100)
                      : 0;
                  return React.createElement(
                    "div",
                    { key: idx, className: "space-y-1" },
                    React.createElement(
                      "div",
                      { className: "flex justify-between text-xs font-medium" },
                      React.createElement(
                        "div",
                        { className: "flex items-center gap-2" },
                        React.createElement(
                          "span",
                          { className: "font-bold text-slate-800 dark:text-slate-200" },
                          item.name
                        ),
                        React.createElement(
                          "span",
                          {
                            className:
                              "text-[10px] px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-semibold",
                          },
                          "Thiếu ",
                          item.missingInvoiceCount,
                          " máy"
                        )
                      ),
                      React.createElement(
                        "span",
                        { className: "text-slate-900 dark:text-slate-100 font-mono font-bold" },
                        formatVND(item.totalEstimated),
                        " ",
                        React.createElement(
                          "span",
                          { className: "text-slate-400 dark:text-slate-500 font-normal" },
                          "(",
                          pct,
                          "%)"
                        )
                      )
                    ),
                    React.createElement(
                      "div",
                      {
                        className:
                          "w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700",
                      },
                      React.createElement("div", {
                        className: `h-full rounded-full transition-all duration-500 ${
                          idx === 0 ? "bg-rose-500" : idx === 1 ? "bg-amber-500" : idx === 2 ? "bg-blue-600" : "bg-indigo-500"
                        }`,
                        style: { width: `${Math.max(6, pct)}%` },
                      })
                    )
                  );
                }),
              executivePlanRows.filter((r) => r.totalEstimated > 0).length === 0 &&
                React.createElement(
                  "div",
                  {
                    className:
                      "p-6 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800 text-center text-xs text-emerald-800 dark:text-emerald-300 font-medium",
                  },
                  "✓ 100% phần mềm đã có Hóa đơn VAT hợp lệ hoặc thuộc diện Miễn phí FOSS. Không phát sinh kinh phí mua mới!"
                )
            )
          ),
          React.createElement(
            "div",
            {
              className:
                "mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between",
            },
            React.createElement(
              "span",
              { className: "text-emerald-700 dark:text-emerald-400 font-medium" },
              "💡 Thay FOSS giúp giảm chi phí: ",
              React.createElement("strong", null, formatVND(metrics.totalFossSavings))
            ),
            React.createElement(
              "button",
              {
                onClick: () => setActiveTab("FOSS_PLAN"),
                className: "text-emerald-700 dark:text-emerald-400 hover:underline font-semibold text-xs cursor-pointer",
              },
              "Xem Kế Hoạch FOSS ↗"
            )
          )
        )
      ),

      // 2 Financial Highlights
      React.createElement(
        "div",
        {
          className:
            "bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 transition-colors duration-200",
        },
        React.createElement(
          "div",
          null,
          React.createElement(
            "h3",
            { className: "text-base font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2" },
            React.createElement("span", { className: "w-2.5 h-2.5 rounded-full bg-rose-500" }),
            "Dự Toán Mua Bổ Sung Hóa Đơn Bản Quyền"
          ),
          React.createElement(
            "p",
            { className: "text-xs text-slate-500 dark:text-slate-400 mb-4" },
            "Chỉ tính chi phí cho các phần mềm thương mại ",
            React.createElement("strong", { className: "dark:text-slate-200" }, "thực sự thiếu hóa đơn"),
            " (không tính phần mềm Free/FOSS hay nội bộ)."
          ),
          React.createElement(
            "div",
            { className: "p-4 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700" },
            React.createElement(
              "div",
              { className: "text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono" },
              formatVND(metrics.totalEstimatedCost)
            ),
            React.createElement(
              "p",
              { className: "text-xs text-slate-500 dark:text-slate-400 mt-1" },
              "Bao gồm AutoCAD, Adobe CC, MS Office, Windows Pro..."
            )
          )
        ),
        React.createElement(
          "div",
          null,
          React.createElement(
            "h3",
            { className: "text-base font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2" },
            React.createElement("span", {
              className: "w-2.5 h-2.5 rounded-full bg-emerald-500",
            }),
            "Phương Án Tối Ưu Chi Phí 0 Đồng (Khuyến Nghị IT)"
          ),
          React.createElement(
            "p",
            { className: "text-xs text-slate-500 dark:text-slate-400 mb-4" },
            "Gỡ bỏ ứng dụng không cần thiết và thay bằng mã nguồn mở miễn phí cho DN."
          ),
          React.createElement(
            "div",
            { className: "p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800" },
            React.createElement(
              "div",
              { className: "text-2xl font-bold text-emerald-700 dark:text-emerald-300 font-mono" },
              formatVND(metrics.totalFossSavings)
            ),
            React.createElement(
              "p",
              { className: "text-xs text-emerald-600 dark:text-emerald-400 mt-1" },
              "Giúp công ty giảm 100% rủi ro pháp lý mà không tốn thêm ngân sách."
            )
          )
        )
      ),

      // Explanation Box
      React.createElement(
        "div",
        {
          className:
            "bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl p-5 text-xs text-blue-900 dark:text-blue-200 space-y-2",
        },
        React.createElement(
          "h4",
          { className: "font-bold text-sm text-blue-950 dark:text-blue-100 flex items-center gap-2" },
          "ℹ️ Nguyên Lý Tính Toán & Khuyến Nghị Bản Quyền (SAM Logic Engine)"
        ),
        React.createElement(
          "p",
          null,
          "1. ",
          React.createElement("strong", null, "Nếu là phần mềm Free / FOSS:"),
          " Hệ thống tự động đặt Mức rủi ro = ",
          React.createElement("strong", null, "An toàn (0 rủi ro)"),
          ", Tình trạng hóa đơn = ",
          React.createElement("strong", null, "FOSS (Không cần HĐ)"),
          ", Đơn giá dự toán = ",
          React.createElement("strong", null, "0 ₫"),
          "."
        ),
        React.createElement(
          "p",
          null,
          "2. ",
          React.createElement(
            "strong",
            null,
            "Nếu là phần mềm nội bộ / chưa có trong từ điển:"
          ),
          " Hệ thống xếp vào mục ",
          React.createElement("strong", null, "An toàn (0 rủi ro, 0đ)"),
          " chứ KHÔNG tự ý phạt tiền."
        ),
        React.createElement(
          "p",
          null,
          "3. ",
          React.createElement("strong", null, "Tùy biến danh mục riêng:"),
          " Bạn có thể nạp file Excel riêng hoặc dùng ",
          React.createElement("strong", null, "Sheet 3 (Danh mục Tiêu chuẩn)"),
          " trong file Excel hoặc tab ",
          React.createElement("strong", null, "5. Quy Định & Danh Mục"),
          " để thêm/sửa quy tắc theo ý doanh nghiệp."
        )
      )
    );
  }

  global.SAM_REPORTS = global.SAM_REPORTS || {};
  global.SAM_REPORTS.OverviewReport = OverviewReport;

})(typeof window !== 'undefined' ? window : this);
