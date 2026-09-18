// js/reports/assistant-actions.js - Tab "⚠️ Cần xử lý" (Action Station trung tâm)
(function (global) {
  'use strict';

  function AssistantActionsView(props) {
    const {
      softwareGroups = [],
      installations = [],
      initialFilter = 'ALL',
      onUpdateInvoiceStatus,
      formatVND,
      setActiveTab,
    } = props;

    const [activeFilter, setActiveFilter] = React.useState(initialFilter || 'ALL');

    React.useEffect(() => {
      if (initialFilter) {
        setActiveFilter(initialFilter);
      }
    }, [initialFilter]);

    // Phân loại nhóm hành động
    const categorized = React.useMemo(() => {
      const missingInvoice = [];
      const personalTrap = [];
      const needPurchase = [];
      const freeSoftware = [];
      const replaceableFoss = [];

      (softwareGroups || []).forEach((g) => {
        const isFoss = g.licenseType === 'FREE_OPEN_SOURCE' || g.suggestedAction === 'ALLOW_FREE';
        const isTrap = g.licenseType === 'FREE_PERSONAL_ONLY' || g.isTrap;
        const hasMissing = g.missingInvoiceCount > 0 && !isFoss;
        const hasAlternative = !isFoss && (g.recommendedAlternative || g.foss);

        if (hasMissing) {
          missingInvoice.push(g);
        }
        if (isTrap) {
          personalTrap.push(g);
        }
        if (hasMissing && (g.estimatedPriceVND > 0 || g.price > 0)) {
          needPurchase.push(g);
        }
        if (isFoss) {
          freeSoftware.push(g);
        }
        if (hasAlternative) {
          replaceableFoss.push(g);
        }
      });

      return {
        missingInvoice,
        personalTrap,
        needPurchase,
        freeSoftware,
        replaceableFoss,
      };
    }, [softwareGroups]);

    // Danh sách hiển thị theo bộ lọc
    const displayedItems = React.useMemo(() => {
      switch (activeFilter) {
        case 'MISSING_INVOICE':
          return categorized.missingInvoice;
        case 'PERSONAL_TRAP':
          return categorized.personalTrap;
        case 'NEED_PURCHASE':
          return categorized.needPurchase;
        case 'FREE_SOFTWARE':
          return categorized.freeSoftware;
        case 'REPLACEABLE_FOSS':
          return categorized.replaceableFoss;
        case 'ALL':
        default: {
          // Gộp các phần mềm cần hành động (không bao gồm clean/free)
          const set = new Set();
          const list = [];
          [...categorized.missingInvoice, ...categorized.personalTrap, ...categorized.replaceableFoss].forEach((item) => {
            const key = item.displayName || item.rawName;
            if (!set.has(key)) {
              set.add(key);
              list.push(item);
            }
          });
          return list;
        }
      }
    }, [activeFilter, categorized]);

    // Đánh dấu toàn bộ máy cài phần mềm này là đã có hóa đơn
    const handleMarkAllVerified = (group) => {
      const matchInstalls = (installations || []).filter((i) => {
        return (
          (i.displayName === group.displayName || i.rawName === group.rawName) &&
          i.invoiceStatus === 'MISSING_INVOICE'
        );
      });

      if (onUpdateInvoiceStatus) {
        matchInstalls.forEach((i) => {
          onUpdateInvoiceStatus(i.id, 'HAS_INVOICE');
        });
      }
    };

    return React.createElement(
      "div",
      { className: "space-y-6 animate-fadeIn" },

      // Header
      React.createElement(
        "div",
        { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4" },
        React.createElement(
          "div",
          null,
          React.createElement(
            "h2",
            { className: "text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2.5" },
            React.createElement("span", { className: "text-rose-600" }, "⚠️"),
            "Những Việc Doanh Nghiệp Cần Xử Lý"
          ),
          React.createElement(
            "p",
            { className: "text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1" },
            "Chọn từng nhóm vấn đề để thực hiện 4 phương án xử lý: Gỡ bỏ, Xác minh hóa đơn, Mua thêm bản quyền, hoặc Thay thế miễn phí."
          )
        ),
        React.createElement(
          "button",
          {
            onClick: () => setActiveTab && setActiveTab('EXECUTIVE_REPORT'),
            className: "px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5 self-start md:self-auto",
          },
          React.createElement("span", null, "📄"),
          "Xem báo cáo Ban Giám Đốc"
        )
      ),

      // 4 Hạng mục bộ lọc lớn (Tabs)
      React.createElement(
        "div",
        { className: "grid grid-cols-2 md:grid-cols-4 gap-3" },
        [
          {
            id: 'MISSING_INVOICE',
            icon: '🔴',
            title: 'Kiểm tra giấy phép',
            count: categorized.missingInvoice.length,
            desc: 'Chưa có hóa đơn / chứng từ',
            activeBorder: 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200',
          },
          {
            id: 'PERSONAL_TRAP',
            icon: '🟡',
            title: 'Xác minh bản quyền',
            count: categorized.personalTrap.length,
            desc: 'Bản cá nhân / bẫy doanh nghiệp',
            activeBorder: 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200',
          },
          {
            id: 'NEED_PURCHASE',
            icon: '💰',
            title: 'Cần mua bản quyền',
            count: categorized.needPurchase.length,
            desc: 'Phần mềm thương mại bắt buộc',
            activeBorder: 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-200',
          },
          {
            id: 'REPLACEABLE_FOSS',
            icon: '💡',
            title: 'Có thể thay thế FOSS',
            count: categorized.replaceableFoss.length,
            desc: 'Tiết kiệm 0đ mua mới',
            activeBorder: 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200',
          },
        ].map((tab) => {
          const isSelected = activeFilter === tab.id;
          return React.createElement(
            "div",
            {
              key: tab.id,
              onClick: () => setActiveFilter(tab.id),
              className: `p-3.5 sm:p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? tab.activeBorder
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`,
            },
            React.createElement(
              "div",
              { className: "flex items-center justify-between" },
              React.createElement("span", { className: "text-lg" }, tab.icon),
              React.createElement(
                "span",
                { className: "text-xl sm:text-2xl font-black text-slate-900 dark:text-white" },
                tab.count
              )
            ),
            React.createElement(
              "div",
              { className: "mt-2" },
              React.createElement("div", { className: "text-xs font-black" }, tab.title),
              React.createElement("div", { className: "text-[11px] text-slate-500 truncate" }, tab.desc)
            )
          );
        })
      ),

      // Action List
      React.createElement(
        "div",
        { className: "space-y-4" },
        React.createElement(
          "div",
          { className: "flex items-center justify-between px-1" },
          React.createElement(
            "h3",
            { className: "text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5" },
            "Chi tiết các phần mềm trong nhóm:",
            React.createElement("span", { className: "text-blue-600 dark:text-blue-400" }, `(${displayedItems.length} phần mềm)`)
          ),
          activeFilter !== 'ALL' &&
            React.createElement(
              "button",
              {
                onClick: () => setActiveFilter('ALL'),
                className: "text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer",
              },
              "Xem tất cả vấn đề"
            )
        ),

        // Items cards
        React.createElement(
          "div",
          { className: "grid grid-cols-1 gap-3.5" },
          displayedItems.map((item, idx) => {
            const hasMissing = item.missingInvoiceCount > 0 && item.licenseType !== 'FREE_OPEN_SOURCE';
            const isTrap = item.licenseType === 'FREE_PERSONAL_ONLY' || item.isTrap;
            const hasFoss = item.recommendedAlternative || item.foss;

            return React.createElement(
              "div",
              {
                key: idx,
                className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition",
              },
              // Left content
              React.createElement(
                "div",
                { className: "space-y-1.5 flex-1" },
                React.createElement(
                  "div",
                  { className: "flex items-center gap-2.5 flex-wrap" },
                  React.createElement(
                    "h4",
                    { className: "text-sm sm:text-base font-bold text-slate-900 dark:text-white" },
                    item.displayName || item.rawName
                  ),
                  React.createElement(
                    "span",
                    { className: "text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300" },
                    `${item.installedCount} máy cài đặt`
                  ),
                  hasMissing &&
                    React.createElement(
                      "span",
                      { className: "text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300" },
                      `Thiếu hóa đơn: ${item.missingInvoiceCount} máy`
                    ),
                  isTrap &&
                    React.createElement(
                      "span",
                      { className: "text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
                      "Bẫy bản quyền cá nhân"
                    )
                ),
                React.createElement(
                  "p",
                  { className: "text-xs text-slate-600 dark:text-slate-400" },
                  React.createElement("strong", { className: "text-slate-700 dark:text-slate-300" }, "Hãng: "),
                  item.vendor || "N/A",
                  " • ",
                  React.createElement("strong", { className: "text-slate-700 dark:text-slate-300" }, "Loại giấy phép: "),
                  item.licenseType || "Thương mại",
                  item.estimatedPriceVND > 0 &&
                    ` • Đơn giá ước tính: ${formatVND ? formatVND(item.estimatedPriceVND) : item.estimatedPriceVND}`
                ),

                // Recommendation text box
                React.createElement(
                  "div",
                  { className: "p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 space-y-1" },
                  React.createElement(
                    "div",
                    { className: "font-semibold flex items-center gap-1 text-blue-700 dark:text-blue-400" },
                    React.createElement("span", null, "👉"),
                    "Đề xuất hành động cho doanh nghiệp:"
                  ),
                  React.createElement(
                    "div",
                    { className: "text-slate-600 dark:text-slate-300 leading-relaxed text-[11px] sm:text-xs" },
                    hasMissing
                      ? "Kiểm tra với Kế toán / IT xem đã có hóa đơn VAT hoặc hợp đồng bản quyền chưa. Nếu không cần thiết, nên gỡ bỏ khỏi các máy không sử dụng."
                      : isTrap
                      ? "Phần mềm này cấm sử dụng trong doanh nghiệp nếu dùng bản miễn phí (chỉ cho phép cá nhân). Đề xuất gỡ bỏ hoặc chuyển sang giải pháp miễn phí hợp pháp."
                      : "Theo dõi định kỳ tình trạng sử dụng."
                  ),
                  hasFoss &&
                    React.createElement(
                      "div",
                      { className: "text-emerald-700 dark:text-emerald-400 font-medium text-[11px] pt-0.5" },
                      `💡 Phương án thay thế miễn phí (0đ): ${item.recommendedAlternative || item.foss}`
                    )
                )
              ),

              // Right quick action buttons
              React.createElement(
                "div",
                { className: "flex sm:flex-col items-center gap-2 shrink-0 justify-end" },
                hasMissing &&
                  React.createElement(
                    "button",
                    {
                      onClick: () => handleMarkAllVerified(item),
                      className: "w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 shadow-2xs",
                      title: "Đánh dấu tất cả các máy cài phần mềm này là đã có hóa đơn",
                    },
                    React.createElement("span", null, "✅"),
                    "Xác nhận đã có HĐ"
                  ),
                React.createElement(
                  "button",
                  {
                    onClick: () => setActiveTab && setActiveTab('SOFTWARE'),
                    className: "w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1",
                  },
                  React.createElement("span", null, "🖥️"),
                  "Xem danh sách máy"
                )
              )
            );
          }),
          displayedItems.length === 0 &&
            React.createElement(
              "div",
              { className: "p-12 text-center text-xs text-slate-500 dark:text-slate-400 font-medium bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800" },
              "Không có phần mềm nào trong nhóm hành động này."
            )
        )
      )
    );
  }

  global.SAM_ASSISTANT_ACTIONS = {
    AssistantActionsView,
  };
})(typeof window !== 'undefined' ? window : this);
