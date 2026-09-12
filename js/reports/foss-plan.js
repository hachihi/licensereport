// js/reports/foss-plan.js - Tab 4: FOSS Optimization Plan Component
(function (global) {
  'use strict';

  function FossPlanReport(props) {
    const { metrics, formatVND } = props;

    const fossPlans = [
      {
        from: "WinRAR (Dùng thử quá hạn)",
        to: "7-Zip",
        benefit: "Miễn phí 100% doanh nghiệp, nén nhanh, nhẹ, không bao giờ hỏi mua key.",
        action: "Gỡ WinRAR -> Cài 7-Zip từ 7-zip.org",
      },
      {
        from: "TeamViewer / AnyDesk (Bản cá nhân)",
        to: "RustDesk / UltraViewer",
        benefit: "Không bị block timeout sau 5 phút, bảo mật cao, chi phí 0đ hoặc siêu rẻ.",
        action: "Gỡ TeamViewer cá nhân -> Cài RustDesk hoặc mua UltraViewer",
      },
      {
        from: "CCleaner Free",
        to: "Windows Storage Sense",
        benefit: "Có sẵn trên Windows 10/11, tự động dọn dẹp an toàn không lo vi phạm.",
        action: "Gỡ CCleaner -> Bật Storage Sense trong Windows Settings",
      },
      {
        from: "Adobe Acrobat Pro (Chưa HĐ)",
        to: "PDFgear / Foxit Reader",
        benefit: "PDFgear cho phép chỉnh sửa text, merge PDF miễn phí 100% cho công ty.",
        action: "Gỡ Acrobat Pro crack -> Cài PDFgear từ pdfgear.com",
      },
      {
        from: "Microsoft Office (Máy phụ/Kho)",
        to: "ONLYOFFICE / LibreOffice",
        benefit: "Tương thích 99% định dạng Word/Excel, miễn phí hoàn toàn cho nhân viên khối hỗ trợ.",
        action: "Cài OnlyOffice Desktop cho nhân viên khối phụ trợ",
      },
    ];

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
          React.createElement("span", { className: "text-2xl" }, "💡"),
          React.createElement(
            "div",
            null,
            React.createElement(
              "h2",
              { className: "text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-wide" },
              "Chiến Lược Tối Ưu Hóa Ngân Sách Bằng Phần Mềm Nguồn Mở (FOSS)"
            ),
            React.createElement(
              "p",
              { className: "text-xs text-slate-500 dark:text-slate-400" },
              "Lộ trình thay thế phần mềm thương mại thiếu chứng từ và bẫy bản quyền cá nhân sang FOSS hợp pháp 100%"
            )
          )
        ),
        React.createElement(
          "div",
          { className: "flex items-center gap-2 text-xs" },
          React.createElement(
            "span",
            { className: "px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800" },
            `Tiết kiệm: ${formatVND(metrics.totalFossSavings)}`
          ),
          React.createElement(
            "span",
            { className: "px-3 py-1 rounded-full bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-900" },
            `${fossPlans.length} lộ trình chuyển đổi`
          )
        )
      ),

      // 2. Metric KPI Cards Row
      React.createElement(
        "div",
        { className: "grid grid-cols-1 sm:grid-cols-3 gap-4" },

        React.createElement(
          "div",
          { className: "sam-kpi-card accent-emerald" },
          React.createElement(
            "div",
            { className: "flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400" },
            React.createElement("span", null, "Tổng Tiết Kiệm Dự Kiến"),
            React.createElement("span", { className: "text-sm" }, "💰")
          ),
          React.createElement(
            "div",
            { className: "mt-2 flex items-baseline justify-between" },
            React.createElement("span", { className: "text-2xl font-black text-emerald-600 dark:text-emerald-400" }, formatVND(metrics.totalFossSavings)),
            React.createElement("span", { className: "text-xs text-emerald-600 font-semibold" }, "ngân sách mua mới")
          )
        ),

        React.createElement(
          "div",
          { className: "sam-kpi-card accent-blue" },
          React.createElement(
            "div",
            { className: "flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400" },
            React.createElement("span", null, "Lộ Trình Chuẩn Hóa"),
            React.createElement("span", { className: "text-sm" }, "🎯")
          ),
          React.createElement(
            "div",
            { className: "mt-2 flex items-baseline justify-between" },
            React.createElement("span", { className: "text-2xl font-black text-slate-900 dark:text-white" }, fossPlans.length),
            React.createElement("span", { className: "text-xs text-slate-500" }, "ứng dụng trọng điểm")
          )
        ),

        React.createElement(
          "div",
          { className: "sam-kpi-card accent-amber" },
          React.createElement(
            "div",
            { className: "flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400" },
            React.createElement("span", null, "Rủi Ro Pháp Lý Sau FOSS"),
            React.createElement("span", { className: "text-sm" }, "🛡️")
          ),
          React.createElement(
            "div",
            { className: "mt-2 flex items-baseline justify-between" },
            React.createElement("span", { className: "text-2xl font-black text-emerald-600 dark:text-emerald-400" }, "0% Vi Phạm"),
            React.createElement("span", { className: "text-xs text-emerald-600 font-semibold" }, "xóa bỏ nguy cơ phạt")
          )
        )
      ),

      // 3. Strategy Plans Grid
      React.createElement(
        "div",
        { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
        fossPlans.map((plan, idx) =>
          React.createElement(
            "div",
            {
              key: idx,
              className: "sam-section-card flex flex-col justify-between transition-shadow hover:shadow-md",
            },
            // Header Ribbon comparing From -> To
            React.createElement(
              "div",
              { className: "sam-section-ribbon flex-wrap gap-2" },
              React.createElement(
                "span",
                { className: "text-xs font-bold text-rose-600 dark:text-rose-400 line-through bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900" },
                `❌ ${plan.from}`
              ),
              React.createElement(
                "span",
                {
                  className:
                    "text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 flex items-center gap-1",
                },
                "➡️ ",
                plan.to
              )
            ),

            // Card Body
            React.createElement(
              "div",
              { className: "p-4 space-y-3 flex-1 flex flex-col justify-between" },
              React.createElement(
                "div",
                { className: "space-y-1" },
                React.createElement(
                  "p",
                  { className: "text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5" },
                  "✨ Lợi ích vượt trội:"
                ),
                React.createElement(
                  "p",
                  { className: "text-xs text-slate-600 dark:text-slate-300 leading-relaxed" },
                  plan.benefit
                )
              ),
              React.createElement(
                "div",
                {
                  className:
                    "text-xs bg-blue-50/80 dark:bg-blue-950/40 p-3 rounded-lg text-blue-900 dark:text-blue-200 font-medium border border-blue-200 dark:border-blue-900 space-y-1",
                },
                React.createElement(
                  "div",
                  { className: "font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1" },
                  "🛠️ Hành động triển khai của IT:"
                ),
                React.createElement("div", { className: "text-[11px] leading-relaxed" }, plan.action)
              )
            )
          )
        )
      )
    );
  }

  global.SAM_REPORTS = global.SAM_REPORTS || {};
  global.SAM_REPORTS.FossPlanReport = FossPlanReport;

})(typeof window !== 'undefined' ? window : this);
