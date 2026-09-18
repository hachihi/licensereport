// js/reports/assistant-home.js - Màn hình Tổng Quan Đơn Giản & Tinh Gọn
(function (global) {
  'use strict';

  function AssistantHomeView(props) {
    const {
      computers = [],
      installations = [],
      softwareGroups = [],
      loadedFiles = [],
      onUploadFiles,
      onAppendFiles,
      setActiveTab,
      setActionFilter,
      fileInputRef,
      appendFileInputRef,
    } = props;

    const totalComputers = computers.length;
    const totalInstalls = installations.length;

    // Phân loại nhóm phần mềm
    const classified = React.useMemo(() => {
      let missingInvoiceCount = 0;
      const missingExamples = [];
      let personalTrapCount = 0;
      const personalExamples = [];
      let fossCount = 0;
      let replaceableCount = 0;
      const replaceableExamples = [];

      (softwareGroups || []).forEach((g) => {
        const isFoss = g.licenseType === 'FREE_OPEN_SOURCE' || g.suggestedAction === 'ALLOW_FREE';
        const isTrap = g.licenseType === 'FREE_PERSONAL_ONLY' || g.isTrap;
        const hasMissing = g.missingInvoiceCount > 0 && !isFoss;
        const hasAlternative = !isFoss && (g.recommendedAlternative || g.foss);

        if (hasMissing) {
          missingInvoiceCount += 1;
          if (missingExamples.length < 3) missingExamples.push(g.displayName || g.rawName);
        }
        if (isTrap) {
          personalTrapCount += 1;
          if (personalExamples.length < 3) personalExamples.push(g.displayName || g.rawName);
        }
        if (isFoss) {
          fossCount += 1;
        }
        if (hasAlternative) {
          replaceableCount += 1;
          if (replaceableExamples.length < 3) {
            replaceableExamples.push(`${g.displayName || g.rawName} → ${g.recommendedAlternative || g.foss}`);
          }
        }
      });

      const compliantInstalls = installations.filter((i) => {
        return (
          i.licenseType === 'FREE_OPEN_SOURCE' ||
          i.invoiceStatus === 'HAS_INVOICE' ||
          i.invoiceStatus === 'NOT_APPLICABLE' ||
          (!i.isTrap && i.auditRisk === 'LOW' && i.invoiceStatus !== 'MISSING_INVOICE')
        );
      }).length;

      const needReviewInstalls = Math.max(0, totalInstalls - compliantInstalls);

      return {
        missingInvoiceCount,
        missingExamples,
        personalTrapCount,
        personalExamples,
        fossCount,
        replaceableCount,
        replaceableExamples,
        compliantInstalls,
        needReviewInstalls,
      };
    }, [softwareGroups, installations, totalInstalls]);

    const handleGoToAction = (filterType) => {
      if (setActionFilter) {
        setActionFilter(filterType);
      }
      setActiveTab('ACTION_ITEMS');
    };

    // Khi chưa có dữ liệu
    if (totalComputers === 0) {
      return React.createElement(
        "div",
        { className: "max-w-xl mx-auto py-12 text-center space-y-5 animate-fadeIn" },
        React.createElement(
          "div",
          { className: "w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center text-3xl shadow-2xs" },
          "📂"
        ),
        React.createElement(
          "div",
          { className: "space-y-1.5" },
          React.createElement(
            "h2",
            { className: "text-xl font-black text-slate-900 dark:text-white" },
            "Kiểm Tra Bản Quyền Phần Mềm"
          ),
          React.createElement(
            "p",
            { className: "text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed" },
            "Tải lên file danh sách máy tính và phần mềm (.xlsx, .csv). Hệ thống sẽ tự động đối soát và chỉ ra các rủi ro bản quyền."
          )
        ),
        React.createElement(
          "div",
          { className: "pt-2 flex justify-center" },
          React.createElement(
            "label",
            { className: "px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md cursor-pointer transition flex items-center gap-2" },
            "📥 Chọn file kiểm kê để bắt đầu",
            React.createElement("input", {
              type: "file",
              ref: fileInputRef,
              multiple: true,
              onChange: (e) => {
                if (e.target.files && e.target.files.length > 0 && onUploadFiles) {
                  onUploadFiles(e.target.files, false);
                }
                e.target.value = "";
              },
              accept: ".xlsx, .xls, .csv",
              className: "hidden",
            })
          )
        )
      );
    }

    return React.createElement(
      "div",
      { className: "max-w-5xl mx-auto space-y-6 animate-fadeIn" },

      // 1. THANH TRẠNG THÁI & NẠP FILE GỌN GÀNG
      React.createElement(
        "div",
        { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4" },
        React.createElement(
          "div",
          { className: "flex items-center gap-3" },
          React.createElement(
            "div",
            { className: "w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl shrink-0" },
            "📊"
          ),
          React.createElement(
            "div",
            null,
            React.createElement(
              "h2",
              { className: "text-sm sm:text-base font-bold text-slate-900 dark:text-white" },
              "Tổng Quan Tình Trạng Bản Quyền"
            ),
            React.createElement(
              "p",
              { className: "text-xs text-slate-500 dark:text-slate-400 mt-0.5" },
              `Đã kiểm tra ${totalComputers} máy tính • ${totalInstalls} lượt cài đặt phần mềm`
            )
          )
        ),
        React.createElement(
          "div",
          { className: "flex items-center gap-2 shrink-0" },
          React.createElement(
            "label",
            {
              className: "py-2 px-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs",
              title: "Tải file kiểm kê mới",
            },
            React.createElement("span", null, "📂"),
            "Tải file mới",
            React.createElement("input", {
              type: "file",
              ref: fileInputRef,
              multiple: true,
              onChange: (e) => {
                if (e.target.files && e.target.files.length > 0 && onUploadFiles) {
                  onUploadFiles(e.target.files, false);
                }
                e.target.value = "";
              },
              accept: ".xlsx, .xls, .csv",
              className: "hidden",
            })
          ),
          React.createElement(
            "label",
            {
              className: "py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5",
              title: "Thêm file từ máy khác",
            },
            React.createElement("span", null, "➕"),
            "Thêm file",
            React.createElement("input", {
              type: "file",
              ref: appendFileInputRef,
              multiple: true,
              onChange: (e) => {
                if (e.target.files && e.target.files.length > 0 && onAppendFiles) {
                  onAppendFiles(e.target.files, true);
                }
                e.target.value = "";
              },
              accept: ".xlsx, .xls, .csv",
              className: "hidden",
            })
          )
        )
      ),

      // 2. BA THẺ TÌNH TRẠNG CHÍNH (Súc tích, trực quan, không rườm rà)
      React.createElement(
        "div",
        { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },

        // Thẻ 1: Máy tính
        React.createElement(
          "div",
          {
            onClick: () => setActiveTab('COMPUTERS'),
            className: "p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer transition group",
          },
          React.createElement(
            "div",
            { className: "flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider" },
            React.createElement("span", null, "🖥️ Máy tính"),
            React.createElement("span", { className: "text-blue-600 group-hover:translate-x-0.5 transition-transform" }, "Xem chi tiết →")
          ),
          React.createElement("div", { className: "text-3xl sm:text-4xl font-black text-slate-900 dark:text-white my-1 tracking-tight" }, totalComputers),
          React.createElement("p", { className: "text-xs text-slate-500" }, `${totalInstalls} lượt phần mềm cài đặt`)
        ),

        // Thẻ 2: An tâm
        React.createElement(
          "div",
          {
            onClick: () => setActiveTab('SOFTWARE'),
            className: "p-5 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 cursor-pointer transition group bg-emerald-50/20",
          },
          React.createElement(
            "div",
            { className: "flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider" },
            React.createElement("span", null, "✅ An tâm (0đ & Đủ phép)"),
            React.createElement("span", { className: "text-emerald-600 group-hover:translate-x-0.5 transition-transform" }, "Xem danh sách →")
          ),
          React.createElement("div", { className: "text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 my-1 tracking-tight" }, classified.compliantInstalls),
          React.createElement("p", { className: "text-xs text-slate-500" }, "Phần mềm miễn phí hoặc đã có giấy phép")
        ),

        // Thẻ 3: Cần kiểm tra & xử lý
        React.createElement(
          "div",
          {
            onClick: () => setActiveTab('ACTION_ITEMS'),
            className: "p-5 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900/60 shadow-xs hover:border-amber-300 dark:hover:border-amber-700 cursor-pointer transition group bg-amber-50/20",
          },
          React.createElement(
            "div",
            { className: "flex items-center justify-between text-xs text-amber-700 dark:text-amber-300 font-bold uppercase tracking-wider" },
            React.createElement("span", null, "⚠️ Cần kiểm tra"),
            React.createElement("span", { className: "text-amber-600 font-bold group-hover:translate-x-0.5 transition-transform" }, "Xử lý ngay →")
          ),
          React.createElement("div", { className: "text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400 my-1 tracking-tight" }, classified.needReviewInstalls),
          React.createElement("p", { className: "text-xs text-slate-500" }, "Phần mềm cần đối chiếu chứng từ / gỡ bỏ")
        )
      ),

      // 3. HỘP TRỌNG TÂM: NHỮNG ĐIỂM CẦN LƯU Ý & HÀNH ĐỘNG (Gọn gàng trong 1 hộp)
      React.createElement(
        "div",
        { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4" },
        React.createElement(
          "div",
          { className: "flex items-center justify-between" },
          React.createElement(
            "h3",
            { className: "text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2" },
            React.createElement("span", null, "📌"),
            "Các Vấn Đề Cần Xử Lý"
          ),
          React.createElement(
            "button",
            {
              onClick: () => setActiveTab('ACTION_ITEMS'),
              className: "text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer",
            },
            "Xem tất cả việc cần làm →"
          )
        ),

        // Danh sách 3 dòng ngắn gọn, click là điều hướng ngay
        React.createElement(
          "div",
          { className: "divide-y divide-slate-100 dark:divide-slate-800" },

          // Mục 1: Chưa có hóa đơn VAT
          React.createElement(
            "div",
            {
              onClick: () => handleGoToAction('MISSING_INVOICE'),
              className: "py-3.5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 rounded-xl transition",
            },
            React.createElement(
              "div",
              { className: "flex items-start gap-3" },
              React.createElement("span", { className: "w-2.5 h-2.5 rounded-full bg-rose-500 mt-1.5 shrink-0" }),
              React.createElement(
                "div",
                null,
                React.createElement(
                  "div",
                  { className: "text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap" },
                  `Phần mềm chưa có hóa đơn VAT / Hợp đồng (${classified.missingInvoiceCount} phần mềm)`,
                  React.createElement("span", { className: "text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300" }, "Cần đối chiếu")
                ),
                React.createElement(
                  "p",
                  { className: "text-xs text-slate-500 dark:text-slate-400 mt-0.5" },
                  classified.missingExamples.length > 0
                    ? `Ví dụ: ${classified.missingExamples.join(", ")}...`
                    : "Không có phần mềm nào thiếu hóa đơn"
                )
              )
            ),
            React.createElement(
              "span",
              { className: "text-xs font-bold text-rose-600 dark:text-rose-400 shrink-0 hidden sm:inline" },
              "Xem việc cần làm →"
            )
          ),

          // Mục 2: Phần mềm bản quyền cá nhân
          React.createElement(
            "div",
            {
              onClick: () => handleGoToAction('PERSONAL_TRAP'),
              className: "py-3.5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 rounded-xl transition",
            },
            React.createElement(
              "div",
              { className: "flex items-start gap-3" },
              React.createElement("span", { className: "w-2.5 h-2.5 rounded-full bg-amber-500 mt-1.5 shrink-0" }),
              React.createElement(
                "div",
                null,
                React.createElement(
                  "div",
                  { className: "text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap" },
                  `Phần mềm miễn phí cho cá nhân nhưng cấm trong DN (${classified.personalTrapCount} phần mềm)`,
                  React.createElement("span", { className: "text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" }, "Nguy cơ phạt")
                ),
                React.createElement(
                  "p",
                  { className: "text-xs text-slate-500 dark:text-slate-400 mt-0.5" },
                  classified.personalExamples.length > 0
                    ? `Ví dụ: ${classified.personalExamples.join(", ")}... Cần gỡ bỏ hoặc mua bản quyền thương mại.`
                    : "Không phát hiện phần mềm bản quyền cá nhân"
                )
              )
            ),
            React.createElement(
              "span",
              { className: "text-xs font-bold text-amber-600 dark:text-amber-400 shrink-0 hidden sm:inline" },
              "Xem việc cần làm →"
            )
          ),

          // Mục 3: Giải pháp miễn phí thay thế (FOSS)
          React.createElement(
            "div",
            {
              onClick: () => handleGoToAction('REPLACEABLE_FOSS'),
              className: "py-3.5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 rounded-xl transition",
            },
            React.createElement(
              "div",
              { className: "flex items-start gap-3" },
              React.createElement("span", { className: "w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" }),
              React.createElement(
                "div",
                null,
                React.createElement(
                  "div",
                  { className: "text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap" },
                  `Có thể thay thế bằng phần mềm miễn phí (FOSS 0đ) (${classified.replaceableCount} phần mềm)`,
                  React.createElement("span", { className: "text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300" }, "Tiết kiệm chi phí")
                ),
                React.createElement(
                  "p",
                  { className: "text-xs text-slate-500 dark:text-slate-400 mt-0.5" },
                  classified.replaceableExamples.length > 0
                    ? `Giải pháp: ${classified.replaceableExamples.join(", ")}...`
                    : "Đã tối ưu hóa phương án FOSS"
                )
              )
            ),
            React.createElement(
              "span",
              { className: "text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0 hidden sm:inline" },
              "Xem giải pháp 0đ →"
            )
          )
        )
      ),

      // 4. LỐI TẮT BÁO CÁO CHO LÃNH ĐẠO (Đơn giản, 1 click)
      React.createElement(
        "div",
        { className: "p-4 sm:p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4" },
        React.createElement(
          "div",
          { className: "space-y-1" },
          React.createElement("h4", { className: "text-sm font-bold text-blue-900 dark:text-blue-200" }, "📄 Báo Cáo Tóm Tắt Cho Ban Giám Đốc"),
          React.createElement("p", { className: "text-xs text-blue-700 dark:text-blue-400" }, "Bản in tổng hợp tình hình bản quyền, ước tính ngân sách mua mới và kế hoạch tiết kiệm chi phí.")
        ),
        React.createElement(
          "button",
          {
            onClick: () => setActiveTab('EXECUTIVE_REPORT'),
            className: "px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer whitespace-nowrap self-start sm:self-auto",
          },
          "Mở Báo Cáo Ban Giám Đốc →"
        )
      )
    );
  }

  global.SAM_ASSISTANT_HOME = {
    AssistantHomeView,
  };
})(typeof window !== 'undefined' ? window : this);
