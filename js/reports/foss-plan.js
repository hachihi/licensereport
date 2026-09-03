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
      React.createElement(
        "div",
        {
          className: "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-5 rounded-xl text-emerald-900 dark:text-emerald-200",
        },
        React.createElement(
          "h3",
          { className: "font-bold text-base text-emerald-950 dark:text-emerald-100" },
          "Kế Hoạch Tối Ưu Hóa & Thay Thế Bằng Mã Nguồn Mở (FOSS)"
        ),
        React.createElement(
          "p",
          { className: "text-xs text-emerald-800 dark:text-emerald-300 mt-1" },
          "Chuẩn hóa các phần mềm FOSS dưới đây giúp doanh nghiệp tiết kiệm ngay ước tính ",
          React.createElement("strong", { className: "font-bold underline" }, formatVND(metrics.totalFossSavings)),
          " và xóa bỏ 100% rủi ro bị phạt bản quyền."
        )
      ),
      React.createElement(
        "div",
        { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
        fossPlans.map((plan, idx) =>
          React.createElement(
            "div",
            {
              key: idx,
              className: "bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 transition-colors duration-200",
            },
            React.createElement(
              "div",
              { className: "flex justify-between items-center" },
              React.createElement(
                "span",
                { className: "text-xs font-bold text-rose-600 dark:text-rose-400 line-through" },
                plan.from
              ),
              React.createElement(
                "span",
                {
                  className:
                    "text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded",
                },
                "➡️ ",
                plan.to
              )
            ),
            React.createElement("p", { className: "text-xs text-slate-700 dark:text-slate-300" }, plan.benefit),
            React.createElement(
              "div",
              {
                className:
                  "text-[11px] bg-slate-50 dark:bg-slate-800/60 p-2 rounded text-blue-700 dark:text-blue-300 font-medium border border-slate-100 dark:border-slate-800",
              },
              "🛠️ ",
              React.createElement("strong", null, "Hành động IT:"),
              " ",
              plan.action
            )
          )
        )
      )
    );
  }

  global.SAM_REPORTS = global.SAM_REPORTS || {};
  global.SAM_REPORTS.FossPlanReport = FossPlanReport;

})(typeof window !== 'undefined' ? window : this);
