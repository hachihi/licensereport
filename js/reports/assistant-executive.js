// js/reports/assistant-executive.js - Màn hình Báo Cáo cho Ban Giám Đốc
(function (global) {
  'use strict';

  function AssistantExecutiveView(props) {
    const {
      computers = [],
      installations = [],
      softwareGroups = [],
      metrics = {},
      formatVND,
      onTriggerPrint,
    } = props;

    // Tính toán phân loại vấn đề
    const stats = React.useMemo(() => {
      const missingInvoiceList = [];
      const personalTrapList = [];
      const needBuyList = [];
      const fossReplaceList = [];

      let estimatedBuyBudget = 0;
      let estimatedFossSavings = 0;

      (softwareGroups || []).forEach((g) => {
        const isFoss = g.licenseType === 'FREE_OPEN_SOURCE' || g.suggestedAction === 'ALLOW_FREE';
        const isTrap = g.licenseType === 'FREE_PERSONAL_ONLY' || g.isTrap;
        const hasMissing = g.missingInvoiceCount > 0 && !isFoss;
        const hasAlternative = !isFoss && (g.recommendedAlternative || g.foss);

        if (hasMissing) {
          missingInvoiceList.push(g);
          const cost = (g.estimatedPriceVND || 0) * (g.missingInvoiceCount || 1);
          estimatedBuyBudget += cost;
          needBuyList.push({ ...g, totalCost: cost });
        }
        if (isTrap) {
          personalTrapList.push(g);
        }
        if (hasAlternative) {
          fossReplaceList.push(g);
          const savings = (g.estimatedPriceVND || 0) * (g.installedCount || 1);
          estimatedFossSavings += savings;
        }
      });

      const totalComputers = computers.length;
      const totalInstalls = installations.length;
      const needReviewInstalls = installations.filter(
        (i) => i.invoiceStatus === 'MISSING_INVOICE' && i.licenseType !== 'FREE_OPEN_SOURCE'
      ).length;

      return {
        totalComputers,
        totalInstalls,
        needReviewInstalls,
        missingInvoiceList,
        personalTrapList,
        needBuyList,
        fossReplaceList,
        estimatedBuyBudget,
        estimatedFossSavings,
      };
    }, [computers, installations, softwareGroups]);

    return React.createElement(
      "div",
      { className: "space-y-6 sm:space-y-8 animate-fadeIn" },

      // Header Banner with Print Button
      React.createElement(
        "div",
        { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5" },
        React.createElement(
          "div",
          { className: "space-y-1.5" },
          React.createElement(
            "div",
            { className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold" },
            React.createElement("span", null, "📄"),
            "Dành Cho Lãnh Đạo & Quản Lý Doanh Nghiệp"
          ),
          React.createElement(
            "h2",
            { className: "text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight" },
            "Báo Cáo Tình Hình Bản Quyền Phần Mềm Doanh Nghiệp"
          ),
          React.createElement(
            "p",
            { className: "text-xs sm:text-sm text-slate-600 dark:text-slate-400" },
            "Bản tóm tắt thực trạng sử dụng phần mềm, các rủi ro pháp lý tiềm ẩn và khuyến nghị phương án xử lý."
          )
        ),
        React.createElement(
          "button",
          {
            onClick: () => onTriggerPrint && onTriggerPrint(),
            className: "px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition cursor-pointer shadow-md flex items-center gap-2 shrink-0 self-start md:self-auto",
            title: "In hoặc xuất file PDF báo cáo này",
          },
          React.createElement("span", { className: "text-base" }, "🖨️"),
          "In Báo Cáo Cho Ban Giám Đốc"
        )
      ),

      // 1. TÌNH HÌNH HIỆN TẠI (3 thẻ thống kê sắc nét)
      React.createElement(
        "div",
        { className: "space-y-3" },
        React.createElement(
          "h3",
          { className: "text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2" },
          React.createElement("span", null, "1."),
          "Tình Hình Hiện Tại"
        ),
        React.createElement(
          "div",
          { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },
          React.createElement(
            "div",
            { className: "p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs" },
            React.createElement("div", { className: "text-xs text-slate-500 font-bold uppercase tracking-wider" }, "🖥️ Tổng số máy tính"),
            React.createElement("div", { className: "text-3xl font-black text-slate-900 dark:text-white my-1" }, stats.totalComputers),
            React.createElement("p", { className: "text-xs text-slate-500" }, "Thiết bị kiểm kê trong hệ thống")
          ),
          React.createElement(
            "div",
            { className: "p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs" },
            React.createElement("div", { className: "text-xs text-slate-500 font-bold uppercase tracking-wider" }, "📦 Phần mềm phát hiện"),
            React.createElement("div", { className: "text-3xl font-black text-slate-900 dark:text-white my-1" }, stats.totalInstalls),
            React.createElement("p", { className: "text-xs text-slate-500" }, "Lượt cài đặt trên các máy")
          ),
          React.createElement(
            "div",
            { className: "p-5 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900/60 shadow-xs bg-amber-50/20" },
            React.createElement("div", { className: "text-xs text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider" }, "⚠️ Cần đối chiếu giấy phép"),
            React.createElement("div", { className: "text-3xl font-black text-amber-600 dark:text-amber-400 my-1" }, stats.needReviewInstalls),
            React.createElement("p", { className: "text-xs text-slate-500" }, "Phần mềm chưa xác minh hóa đơn")
          )
        )
      ),

      // 2. NHỮNG VẤN ĐỀ CHÍNH
      React.createElement(
        "div",
        { className: "space-y-4" },
        React.createElement(
          "h3",
          { className: "text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2" },
          React.createElement("span", null, "2."),
          "Những Vấn Đề Trọng Yếu Cần Lưu Ý"
        ),
        React.createElement(
          "div",
          { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },

          // Vấn đề 1: Chưa có thông tin giấy phép
          React.createElement(
            "div",
            { className: "p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2.5" },
            React.createElement(
              "div",
              { className: "flex items-center gap-2" },
              React.createElement("span", { className: "w-2.5 h-2.5 rounded-full bg-rose-500" }),
              React.createElement("h4", { className: "font-bold text-sm text-slate-900 dark:text-white" }, `Phần mềm chưa có thông tin giấy phép (${stats.missingInvoiceList.length})`)
            ),
            React.createElement(
              "p",
              { className: "text-xs text-slate-600 dark:text-slate-400 leading-relaxed" },
              "Các phần mềm thương mại cài trên máy nhân viên nhưng hồ sơ kế toán / hợp đồng chưa ghi nhận bản quyền chính thức."
            ),
            React.createElement(
              "div",
              { className: "text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg" },
              "Danh sách: ",
              stats.missingInvoiceList.slice(0, 5).map((g) => `${g.displayName} (${g.installedCount} máy)`).join(", ") || "Không có"
            )
          ),

          // Vấn đề 2: Cần xác minh loại giấy phép
          React.createElement(
            "div",
            { className: "p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2.5" },
            React.createElement(
              "div",
              { className: "flex items-center gap-2" },
              React.createElement("span", { className: "w-2.5 h-2.5 rounded-full bg-amber-500" }),
              React.createElement("h4", { className: "font-bold text-sm text-slate-900 dark:text-white" }, `Phần mềm bản quyền cá nhân (${stats.personalTrapList.length})`)
            ),
            React.createElement(
              "p",
              { className: "text-xs text-slate-600 dark:text-slate-400 leading-relaxed" },
              "Các phần mềm miễn phí cho mục đích cá nhân (Non-commercial) nhưng cấm dùng trong doanh nghiệp (WinRAR, TeamViewer, AnyDesk...)."
            ),
            React.createElement(
              "div",
              { className: "text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg" },
              "Danh sách: ",
              stats.personalTrapList.slice(0, 5).map((g) => `${g.displayName} (${g.installedCount} máy)`).join(", ") || "Không có"
            )
          ),

          // Vấn đề 3: Ngân sách ước tính nếu mua mới
          React.createElement(
            "div",
            { className: "p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2.5" },
            React.createElement(
              "div",
              { className: "flex items-center gap-2" },
              React.createElement("span", { className: "w-2.5 h-2.5 rounded-full bg-blue-500" }),
              React.createElement("h4", { className: "font-bold text-sm text-slate-900 dark:text-white" }, "Ngân sách dự kiến nếu mua bản quyền thương mại")
            ),
            React.createElement(
              "div",
              { className: "text-2xl font-black text-blue-600 dark:text-blue-400" },
              formatVND ? formatVND(stats.estimatedBuyBudget) : `${stats.estimatedBuyBudget} đ`
            ),
            React.createElement(
              "p",
              { className: "text-xs text-slate-500 leading-relaxed" },
              "Chi phí tối đa nếu doanh nghiệp mua mới 100% giấy phép thương mại cho các phần mềm đang thiếu hóa đơn."
            )
          ),

          // Vấn đề 4: Tiết kiệm nếu chuyển sang FOSS
          React.createElement(
            "div",
            { className: "p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2.5" },
            React.createElement(
              "div",
              { className: "flex items-center gap-2" },
              React.createElement("span", { className: "w-2.5 h-2.5 rounded-full bg-emerald-500" }),
              React.createElement("h4", { className: "font-bold text-sm text-slate-900 dark:text-white" }, "Tiềm năng tiết kiệm bằng giải pháp miễn phí (FOSS)")
            ),
            React.createElement(
              "div",
              { className: "text-2xl font-black text-emerald-600 dark:text-emerald-400" },
              formatVND ? formatVND(stats.estimatedFossSavings) : `${stats.estimatedFossSavings} đ`
            ),
            React.createElement(
              "p",
              { className: "text-xs text-slate-500 leading-relaxed" },
              "Số tiền doanh nghiệp có thể tiết kiệm được nếu áp dụng các giải pháp FOSS hợp pháp tương đương."
            )
          )
        )
      ),

      // 3. ĐỀ XUẤT XỬ LÝ 4 HƯỚNG CHO BAN GIÁM ĐỐC
      React.createElement(
        "div",
        { className: "space-y-4" },
        React.createElement(
          "h3",
          { className: "text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2" },
          React.createElement("span", null, "3."),
          "Khuyến Nghị Phương Án Xử Lý Dành Cho Ban Giám Đốc"
        ),
        React.createElement(
          "div",
          { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" },

          // Hướng 1: Gỡ bỏ
          React.createElement(
            "div",
            { className: "p-4 sm:p-5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 space-y-2" },
            React.createElement("div", { className: "text-2xl" }, "🗑️"),
            React.createElement("h4", { className: "text-sm font-bold text-rose-900 dark:text-rose-200" }, "1. Gỡ Bỏ"),
            React.createElement(
              "p",
              { className: "text-xs text-rose-800/80 dark:text-rose-300 leading-relaxed" },
              "Thu hồi và gỡ bỏ ngay các phần mềm cài tự phát, không phục vụ công việc hoặc phần mềm giải trí cá nhân của nhân viên."
            )
          ),

          // Hướng 2: Xác minh
          React.createElement(
            "div",
            { className: "p-4 sm:p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 space-y-2" },
            React.createElement("div", { className: "text-2xl" }, "🔍"),
            React.createElement("h4", { className: "text-sm font-bold text-amber-900 dark:text-amber-200" }, "2. Xác Minh"),
            React.createElement(
              "p",
              { className: "text-xs text-amber-800/80 dark:text-amber-300 leading-relaxed" },
              "Yêu cầu Phòng Kế toán / Thu mua tập hợp hóa đơn VAT và hợp đồng cũ để đối chiếu, chuyển trạng thái hợp lệ trên hệ thống."
            )
          ),

          // Hướng 3: Mua bản quyền
          React.createElement(
            "div",
            { className: "p-4 sm:p-5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 space-y-2" },
            React.createElement("div", { className: "text-2xl" }, "💳"),
            React.createElement("h4", { className: "text-sm font-bold text-blue-900 dark:text-blue-200" }, "3. Mua Bản Quyền"),
            React.createElement(
              "p",
              { className: "text-xs text-blue-800/80 dark:text-blue-300 leading-relaxed" },
              "Lập kế hoạch mua bản quyền chính thức cho các vị trí trọng yếu không thể thay thế (kế toán, thiết kế, quản lý dữ liệu)."
            )
          ),

          // Hướng 4: Thay thế miễn phí
          React.createElement(
            "div",
            { className: "p-4 sm:p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 space-y-2" },
            React.createElement("div", { className: "text-2xl" }, "💡"),
            React.createElement("h4", { className: "text-sm font-bold text-emerald-900 dark:text-emerald-200" }, "4. Thay Thế (FOSS)"),
            React.createElement(
              "p",
              { className: "text-xs text-emerald-800/80 dark:text-emerald-300 leading-relaxed" },
              "Triển khai đồng loạt các phần mềm mã nguồn mở tương đương (LibreOffice, 7-Zip, PDFgear, VLC) để tiết kiệm 100% chi phí."
            )
          )
        )
      )
    );
  }

  global.SAM_ASSISTANT_EXECUTIVE = {
    AssistantExecutiveView,
  };
})(typeof window !== 'undefined' ? window : this);
