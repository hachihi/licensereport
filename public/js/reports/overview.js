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

      // Tab Section Banner
      React.createElement(
        "div",
        { className: "sam-section-card p-4 sm:p-5 flex items-center justify-between flex-wrap gap-4" },
        React.createElement(
          "div",
          { className: "flex items-center gap-3" },
          React.createElement("span", { className: "text-2xl" }, "📊"),
          React.createElement(
            "div",
            null,
            React.createElement(
              "h2",
              { className: "text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-wide" },
              "Báo Cáo Tổng Quan Tuân Thủ Bản Quyền & Dự Toán Chi Phí"
            ),
            React.createElement(
              "p",
              { className: "text-xs text-slate-500 dark:text-slate-400" },
              "Tổng hợp chỉ số tuân thủ, bẫy bản quyền cá nhân và phương án tối ưu ngân sách bằng giải pháp nguồn mở FOSS"
            )
          )
        ),
        React.createElement(
          "div",
          { className: "flex items-center gap-2" },
          React.createElement(
            "button",
            {
              onClick: () => setShowPrintReportModal(true),
              className: "px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs",
            },
            "🖨️ In Báo Cáo BGĐ"
          ),
          React.createElement(
            "button",
            {
              onClick: () => setActiveTab("FOSS_PLAN"),
              className: "px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg text-xs font-bold transition cursor-pointer border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5",
            },
            "💡 Kế Hoạch Tiết Kiệm 0đ ↗"
          )
        )
      ),

      // Top 4 Metric KPI Cards (Clean Borders & Colored Accents)
      React.createElement(
        "div",
        { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" },

        // Card 1: Điểm tuân thủ
        React.createElement(
          "div",
          { className: "sam-kpi-card accent-blue" },
          React.createElement(
            "div",
            { className: "flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400" },
            React.createElement("span", null, "Điểm Tuân Thủ"),
            React.createElement("span", { className: "text-sm" }, "🛡️")
          ),
          React.createElement(
            "div",
            { className: "mt-2.5 flex items-baseline justify-between" },
            React.createElement(
              "span",
              { className: "text-3xl font-black text-slate-900 dark:text-slate-100" },
              metrics.complianceScore,
              "%"
            ),
            React.createElement(
              "span",
              {
                className: `text-xs px-2.5 py-0.5 rounded-full font-black ${
                  metrics.complianceScore >= 80
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                    : metrics.complianceScore >= 50
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-700"
                }`,
              },
              metrics.complianceScore >= 80 ? "✓ An Toàn" : "⚠️ Cần Xử Lý"
            )
          ),
          React.createElement(
            "p",
            { className: "text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 font-medium" },
            metrics.totalComputers,
            " máy tính • ",
            metrics.totalInstalls,
            " lượt cài đặt"
          )
        ),

        // Card 2: Rủi ro cao
        React.createElement(
          "div",
          { className: "sam-kpi-card accent-rose" },
          React.createElement(
            "div",
            { className: "flex items-center justify-between text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400" },
            React.createElement("span", null, "Rủi Ro Cao / Nghiêm Trọng"),
            React.createElement("span", { className: "text-sm" }, "🚨")
          ),
          React.createElement(
            "div",
            { className: "mt-2.5 flex items-baseline justify-between" },
            React.createElement(
              "span",
              { className: "text-3xl font-black text-rose-600 dark:text-rose-400" },
              metrics.highRisk + metrics.criticalRisk
            ),
            React.createElement(
              "span",
              { className: "text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800" },
              "Mục tiêu BSA"
            )
          ),
          React.createElement(
            "p",
            { className: "text-xs text-rose-600/90 dark:text-rose-400/90 mt-3 pt-2.5 border-t border-rose-100 dark:border-rose-950 font-medium truncate", title: "AutoCAD, Adobe, MS Office crack, Win Home..." },
            "AutoCAD, Adobe, MS Office, Win Home..."
          )
        ),

        // Card 3: Bẫy bản quyền cá nhân
        React.createElement(
          "div",
          { className: "sam-kpi-card accent-amber" },
          React.createElement(
            "div",
            { className: "flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400" },
            React.createElement("span", null, "Bẫy Bản Quyền Cá Nhân"),
            React.createElement("span", { className: "text-sm" }, "⚠️")
          ),
          React.createElement(
            "div",
            { className: "mt-2.5 flex items-baseline justify-between" },
            React.createElement(
              "span",
              { className: "text-3xl font-black text-amber-600 dark:text-amber-400" },
              metrics.trapCount
            ),
            React.createElement(
              "span",
              { className: "text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800" },
              "Phạm vi cá nhân"
            )
          ),
          React.createElement(
            "p",
            { className: "text-xs text-amber-600/90 dark:text-amber-400/90 mt-3 pt-2.5 border-t border-amber-100 dark:border-amber-950 font-medium truncate", title: "WinRAR quá hạn, CCleaner Free, TeamViewer cá nhân..." },
            "WinRAR quá hạn, CCleaner, TeamViewer..."
          )
        ),

        // Card 4: Tiết kiệm FOSS
        React.createElement(
          "div",
          { className: "sam-kpi-card accent-emerald" },
          React.createElement(
            "div",
            { className: "flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400" },
            React.createElement("span", null, "Tiết Kiệm Khi Đổi FOSS"),
            React.createElement("span", { className: "text-sm" }, "💡")
          ),
          React.createElement(
            "div",
            { className: "mt-2.5 flex items-baseline justify-between" },
            React.createElement(
              "span",
              { className: "text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono" },
              formatVND(metrics.totalFossSavings)
            ),
            React.createElement(
              "span",
              { className: "text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" },
              metrics.replaceFoss,
              " vị trí"
            )
          ),
          React.createElement(
            "p",
            { className: "text-xs text-emerald-600/90 dark:text-emerald-400/90 mt-3 pt-2.5 border-t border-emerald-100 dark:border-emerald-950 font-medium truncate", title: "Đổi sang 7-Zip, RustDesk, OnlyOffice, PDFgear" },
            "Đổi sang 7-Zip, RustDesk, OnlyOffice..."
          )
        )
      ),

      // 2 Visual Analysis Blocks (Section Cards with Ribbons)
      React.createElement(
        "div",
        { className: "grid grid-cols-1 lg:grid-cols-12 gap-5" },

        // Left Column: Breakdown Bar & Stats
        React.createElement(
          "div",
          { className: "lg:col-span-5 sam-section-card flex flex-col justify-between" },
          // Card Ribbon
          React.createElement(
            "div",
            { className: "sam-section-ribbon" },
            React.createElement(
              "div",
              { className: "flex items-center gap-2" },
              React.createElement("span", { className: "w-2.5 h-2.5 rounded-full bg-blue-600" }),
              React.createElement(
                "h3",
                { className: "text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight" },
                "Cơ Cấu Trạng Thái Bản Quyền"
              )
            ),
            React.createElement(
              "span",
              { className: "text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded" },
              installations.length,
              " lượt cài"
            )
          ),

          // Card Body
          React.createElement(
            "div",
            { className: "p-5 space-y-4" },
            React.createElement(
              "p",
              { className: "text-xs text-slate-500 dark:text-slate-400" },
              "Tỷ lệ phân bổ phần mềm Hợp lệ vs Miễn phí FOSS vs Rủi ro"
            ),
            React.createElement(
              "div",
              { className: "space-y-4" },
              React.createElement(
                "div",
                {
                  className:
                    "w-full h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden border border-slate-300 dark:border-slate-700 shadow-inner",
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
                      "p-2.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between",
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
                      "p-2.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-between",
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
                      "p-2.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-center justify-between",
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
                      "p-2.5 rounded-lg bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center justify-between",
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

          // Card Footer
          React.createElement(
            "div",
            {
              className:
                "p-4 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between",
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
                className: "text-blue-600 dark:text-blue-400 hover:underline font-bold text-xs cursor-pointer",
              },
              "In Báo Cáo BGĐ ↗"
            )
          )
        ),

        // Right Column: Budget Allocation by Major Software
        React.createElement(
          "div",
          { className: "lg:col-span-7 sam-section-card flex flex-col justify-between" },
          // Card Ribbon
          React.createElement(
            "div",
            { className: "sam-section-ribbon" },
            React.createElement(
              "div",
              { className: "flex items-center gap-2" },
              React.createElement("span", { className: "w-2.5 h-2.5 rounded-full bg-rose-500" }),
              React.createElement(
                "h3",
                { className: "text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight" },
                "Phân Bổ Ngân Sách Theo Phần Mềm Thiếu HĐ"
              )
            ),
            React.createElement(
              "span",
              { className: "text-xs font-mono font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 rounded border border-rose-200 dark:border-rose-900" },
              formatVND(totalBudgetRequired)
            )
          ),

          // Card Body
          React.createElement(
            "div",
            { className: "p-5 space-y-3" },
            React.createElement(
              "p",
              { className: "text-xs text-slate-500 dark:text-slate-400 mb-3" },
              "Các phần mềm thương mại trọng điểm phát hiện chưa có hóa đơn VAT hợp lệ"
            ),
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
                            "text-[10px] px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-semibold border border-rose-200 dark:border-rose-900",
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
                    "p-6 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center text-xs text-emerald-800 dark:text-emerald-300 font-medium",
                },
                "✓ 100% phần mềm đã có Hóa đơn VAT hợp lệ hoặc thuộc diện Miễn phí FOSS. Không phát sinh kinh phí mua mới!"
              )
          ),

          // Card Footer
          React.createElement(
            "div",
            {
              className:
                "p-4 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between",
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
                className: "text-emerald-700 dark:text-emerald-400 hover:underline font-bold text-xs cursor-pointer",
              },
              "Xem Kế Hoạch FOSS ↗"
            )
          )
        )
      ),

      // 2 Financial Highlights Cards (Distinct Cards)
      React.createElement(
        "div",
        { className: "grid grid-cols-1 md:grid-cols-2 gap-5" },

        // Card A: Budget Requirement
        React.createElement(
          "div",
          { className: "sam-section-card flex flex-col justify-between" },
          React.createElement(
            "div",
            { className: "sam-section-ribbon" },
            React.createElement(
              "div",
              { className: "flex items-center gap-2" },
              React.createElement("span", { className: "w-2.5 h-2.5 rounded-full bg-rose-500" }),
              React.createElement(
                "h3",
                { className: "text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight" },
                "Dự Toán Mua Bổ Sung Hóa Đơn Bản Quyền"
              )
            ),
            React.createElement("span", { className: "text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded" }, "Thiếu HĐ VAT")
          ),
          React.createElement(
            "div",
            { className: "p-5 space-y-4" },
            React.createElement(
              "p",
              { className: "text-xs text-slate-500 dark:text-slate-400" },
              "Chỉ tính chi phí cho các phần mềm thương mại ",
              React.createElement("strong", { className: "text-slate-700 dark:text-slate-200" }, "thực sự thiếu hóa đơn"),
              " (không tính phần mềm Free/FOSS hay phần mềm nội bộ)."
            ),
            React.createElement(
              "div",
              { className: "p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700" },
              React.createElement(
                "div",
                { className: "text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-mono" },
                formatVND(metrics.totalEstimatedCost)
              ),
              React.createElement(
                "p",
                { className: "text-xs text-slate-500 dark:text-slate-400 mt-1" },
                "Bao gồm AutoCAD, Adobe CC, MS Office, Windows Pro..."
              )
            )
          )
        ),

        // Card B: FOSS Savings Recommendation
        React.createElement(
          "div",
          { className: "sam-section-card flex flex-col justify-between" },
          React.createElement(
            "div",
            { className: "sam-section-ribbon" },
            React.createElement(
              "div",
              { className: "flex items-center gap-2" },
              React.createElement("span", { className: "w-2.5 h-2.5 rounded-full bg-emerald-500" }),
              React.createElement(
                "h3",
                { className: "text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight" },
                "Phương Án Tối Ưu Chi Phí 0 Đồng (Khuyến Nghị IT)"
              )
            ),
            React.createElement("span", { className: "text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded" }, "Tiết Kiệm 0₫")
          ),
          React.createElement(
            "div",
            { className: "p-5 space-y-4" },
            React.createElement(
              "p",
              { className: "text-xs text-slate-500 dark:text-slate-400" },
              "Gỡ bỏ ứng dụng thương mại không bắt buộc và thay bằng mã nguồn mở miễn phí cho DN."
            ),
            React.createElement(
              "div",
              { className: "p-4 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800" },
              React.createElement(
                "div",
                { className: "text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300 font-mono" },
                formatVND(metrics.totalFossSavings)
              ),
              React.createElement(
                "p",
                { className: "text-xs text-emerald-600 dark:text-emerald-400 mt-1" },
                "Giúp công ty triệt tiêu rủi ro thanh tra mà không phát sinh thêm kinh phí."
              )
            )
          )
        )
      ),

      // SAM Logic Explainer Section Card
      React.createElement(
        "div",
        {
          className:
            "sam-section-card bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60 p-5 space-y-3",
        },
        React.createElement(
          "h4",
          { className: "font-bold text-sm text-blue-950 dark:text-blue-100 flex items-center gap-2" },
          "ℹ️ Nguyên Lý Tính Toán & Khuyến Nghị Bản Quyền (SAM Logic Engine)"
        ),
        React.createElement(
          "div",
          { className: "grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-blue-900/90 dark:text-blue-200/90" },
          React.createElement(
            "div",
            { className: "bg-white/70 dark:bg-slate-900/60 p-3 rounded-lg border border-blue-100 dark:border-blue-900" },
            React.createElement("strong", { className: "text-blue-950 dark:text-blue-100 block mb-1" }, "1. Phần mềm Free / FOSS"),
            "Hệ thống tự động xếp vào diện An Toàn (0 rủi ro, 0₫), tình trạng 'Không cần HĐ'."
          ),
          React.createElement(
            "div",
            { className: "bg-white/70 dark:bg-slate-900/60 p-3 rounded-lg border border-blue-100 dark:border-blue-900" },
            React.createElement("strong", { className: "text-blue-950 dark:text-blue-100 block mb-1" }, "2. Phần mềm nội bộ / Chưa có"),
            "Mặc định An Toàn (0 rủi ro, 0₫), tuyệt đối KHÔNG tự ý phạt tiền doanh nghiệp."
          ),
          React.createElement(
            "div",
            { className: "bg-white/70 dark:bg-slate-900/60 p-3 rounded-lg border border-blue-100 dark:border-blue-900" },
            React.createElement("strong", { className: "text-blue-950 dark:text-blue-100 block mb-1" }, "3. Tùy biến linh hoạt"),
            "Có thể dùng Sheet 3 trong file kiểm kê hoặc Tab 5 để thêm/sửa quy tắc và đơn giá."
          )
        )
      )
    );
  }

  global.SAM_REPORTS = global.SAM_REPORTS || {};
  global.SAM_REPORTS.OverviewReport = OverviewReport;

})(typeof window !== 'undefined' ? window : this);
