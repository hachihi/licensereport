// js/reports/assistant-software.js - Tab "Phần mềm" trực quan, dễ hiểu
(function (global) {
  'use strict';

  function AssistantSoftwareView(props) {
    const {
      softwareGroups = [],
      installations = [],
      onUpdateInvoiceStatus,
      formatVND,
    } = props;

    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedStatus, setSelectedStatus] = React.useState('ALL');
    const [expandedGroupKey, setExpandedGroupKey] = React.useState(null);

    // Tính toán trạng thái cho từng nhóm phần mềm
    const enrichedGroups = React.useMemo(() => {
      return (softwareGroups || []).map((g) => {
        const isFoss = g.licenseType === 'FREE_OPEN_SOURCE' || g.suggestedAction === 'ALLOW_FREE';
        const isPersonalOrTrap = g.licenseType === 'FREE_PERSONAL_ONLY' || g.isTrap;
        const hasMissing = g.missingInvoiceCount > 0 && !isFoss;
        const isFullyCompliant = (g.hasInvoiceCount > 0 && g.missingInvoiceCount === 0) || isFoss;

        let statusCode = 'CLEAN'; // CLEAN, NEED_CHECK, VERIFY, FREE
        let statusLabel = '✅ Bình thường';
        let statusClass = 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
        let recommendation = 'Không cần xử lý';

        if (hasMissing) {
          statusCode = 'NEED_CHECK';
          statusLabel = '⚠️ Cần kiểm tra';
          statusClass = 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
          recommendation = 'Đối chiếu hóa đơn, hợp đồng';
        } else if (isPersonalOrTrap) {
          statusCode = 'VERIFY';
          statusLabel = '🟡 Cần xác minh';
          statusClass = 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
          recommendation = 'Xác minh điều khoản cá nhân vs DN';
        } else if (isFoss) {
          statusCode = 'FREE';
          statusLabel = '🟢 Miễn phí';
          statusClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
          recommendation = 'Có thể sử dụng tự do (0đ)';
        }

        if (g.recommendedAlternative || g.foss) {
          recommendation += ` (Có thể thay bằng ${g.recommendedAlternative || g.foss})`;
        }

        return {
          ...g,
          statusCode,
          statusLabel,
          statusClass,
          recommendation,
        };
      });
    }, [softwareGroups]);

    // Lọc theo tìm kiếm và bộ lọc trạng thái
    const filteredGroups = React.useMemo(() => {
      return enrichedGroups.filter((g) => {
        if (selectedStatus !== 'ALL' && g.statusCode !== selectedStatus) {
          return false;
        }
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          const matchName = (g.displayName || g.rawName || '').toLowerCase().includes(q);
          const matchVendor = (g.vendor || '').toLowerCase().includes(q);
          if (!matchName && !matchVendor) return false;
        }
        return true;
      });
    }, [enrichedGroups, selectedStatus, searchTerm]);

    // Tìm danh sách máy cài cho nhóm đang mở rộng
    const getMachinesForGroup = (groupKey) => {
      const matchInstalls = (installations || []).filter((i) => {
        const key = `${i.displayName || i.rawName}_${i.vendor || ''}`;
        return key === groupKey || i.displayName === groupKey || i.rawName === groupKey;
      });
      return matchInstalls;
    };

    return React.createElement(
      "div",
      { className: "space-y-6 animate-fadeIn" },

      // Header Banner
      React.createElement(
        "div",
        { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4" },
        React.createElement(
          "div",
          null,
          React.createElement(
            "h2",
            { className: "text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2.5" },
            React.createElement("span", { className: "text-2xl" }, "📦"),
            "Danh Sách Phần Mềm Trong Doanh Nghiệp"
          ),
          React.createElement(
            "p",
            { className: "text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1" },
            "Xem nhanh tình trạng bản quyền của từng phần mềm và phương án xử lý đề xuất."
          )
        ),
        React.createElement(
          "div",
          { className: "flex items-center gap-2 text-xs font-bold" },
          React.createElement(
            "span",
            { className: "px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700" },
            `${enrichedGroups.length} loại phần mềm`
          )
        )
      ),

      // Toolbar & Filters
      React.createElement(
        "div",
        { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3" },
        // Status Filter Buttons
        React.createElement(
          "div",
          { className: "flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0" },
          [
            { id: 'ALL', label: 'Tất cả' },
            { id: 'NEED_CHECK', label: '⚠️ Cần kiểm tra' },
            { id: 'VERIFY', label: '🟡 Cần xác minh' },
            { id: 'FREE', label: '🟢 Miễn phí' },
            { id: 'CLEAN', label: '✅ Bình thường' },
          ].map((btn) =>
            React.createElement(
              "button",
              {
                key: btn.id,
                onClick: () => setSelectedStatus(btn.id),
                className: `px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap border ${
                  selectedStatus === btn.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`,
              },
              btn.label
            )
          )
        ),

        // Search Input
        React.createElement(
          "div",
          { className: "relative w-full sm:w-72" },
          React.createElement("input", {
            type: "text",
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            placeholder: "Tìm tên phần mềm, hãng...",
            className: "w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500",
          }),
          React.createElement("span", { className: "absolute left-2.5 top-2 text-slate-400 text-xs" }, "🔍")
        )
      ),

      // Main Table (Rất trực quan: Phần mềm | Số máy | Tình trạng | Đề xuất)
      React.createElement(
        "div",
        { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden" },
        React.createElement(
          "div",
          { className: "overflow-x-auto" },
          React.createElement(
            "table",
            { className: "min-w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800" },
            React.createElement(
              "thead",
              { className: "bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-700 dark:text-slate-300" },
              React.createElement(
                "tr",
                null,
                React.createElement("th", { className: "px-5 py-3.5" }, "Phần mềm"),
                React.createElement("th", { className: "px-5 py-3.5 text-center" }, "Số máy"),
                React.createElement("th", { className: "px-5 py-3.5" }, "Tình trạng"),
                React.createElement("th", { className: "px-5 py-3.5" }, "Đề xuất xử lý"),
                React.createElement("th", { className: "px-5 py-3.5 text-center" }, "Chi tiết")
              )
            ),
            React.createElement(
              "tbody",
              { className: "divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200" },
              filteredListItems(filteredGroups, expandedGroupKey, setExpandedGroupKey, getMachinesForGroup, onUpdateInvoiceStatus)
            )
          )
        ),
        filteredGroups.length === 0 &&
          React.createElement(
            "div",
            { className: "p-8 text-center text-xs text-slate-500 dark:text-slate-400 font-medium" },
            "Không tìm thấy phần mềm phù hợp với tiêu chí lọc."
          )
      )
    );
  }

  // Render rows + expandable machine list
  function filteredListItems(groups, expandedKey, setExpandedKey, getMachines, onUpdateInvoice) {
    const rows = [];

    groups.forEach((g, idx) => {
      const groupKey = `${g.displayName || g.rawName}_${g.vendor || ''}`;
      const isExpanded = expandedKey === groupKey;

      rows.push(
        React.createElement(
          "tr",
          {
            key: groupKey,
            onClick: () => setExpandedKey(isExpanded ? null : groupKey),
            className: `cursor-pointer transition-colors ${
              isExpanded
                ? 'bg-blue-50/50 dark:bg-blue-950/20'
                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`,
          },
          React.createElement(
            "td",
            { className: "px-5 py-3.5 font-bold text-slate-900 dark:text-white" },
            React.createElement("div", { className: "text-sm" }, g.displayName || g.rawName),
            React.createElement("div", { className: "text-[11px] text-slate-500 font-normal mt-0.5" }, g.vendor || "Không rõ nhà phát hành")
          ),
          React.createElement(
            "td",
            { className: "px-5 py-3.5 text-center" },
            React.createElement(
              "span",
              { className: "px-2.5 py-1 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs" },
              `${g.installedCount} máy`
            )
          ),
          React.createElement(
            "td",
            { className: "px-5 py-3.5" },
            React.createElement(
              "span",
              { className: `inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${g.statusClass}` },
              g.statusLabel
            )
          ),
          React.createElement(
            "td",
            { className: "px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300 font-medium" },
            g.recommendation
          ),
          React.createElement(
            "td",
            { className: "px-5 py-3.5 text-center" },
            React.createElement(
              "button",
              {
                onClick: (e) => {
                  e.stopPropagation();
                  setExpandedKey(isExpanded ? null : groupKey);
                },
                className: "text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer",
              },
              isExpanded ? "Đóng ▲" : "Xem máy ▼"
            )
          )
        )
      );

      // Expanded machine drawer
      if (isExpanded) {
        const machines = getMachines(groupKey);
        rows.push(
          React.createElement(
            "tr",
            { key: `${groupKey}_expanded`, className: "bg-slate-50 dark:bg-slate-950" },
            React.createElement(
              "td",
              { colSpan: 5, className: "p-4 sm:p-5" },
              React.createElement(
                "div",
                { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-3" },
                React.createElement(
                  "div",
                  { className: "flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100 dark:border-slate-800" },
                  React.createElement(
                    "h4",
                    { className: "text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5" },
                    React.createElement("span", null, "🖥️"),
                    `Các máy tính đang cài đặt \"${g.displayName || g.rawName}\" (${machines.length} máy):`
                  ),
                  React.createElement(
                    "span",
                    { className: "text-[11px] text-slate-500" },
                    "Nhấp chọn để cập nhật trạng thái hóa đơn từng máy"
                  )
                ),
                React.createElement(
                  "div",
                  { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5" },
                  machines.map((inst, i) =>
                    React.createElement(
                      "div",
                      {
                        key: i,
                        className: "p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-between gap-2 text-xs",
                      },
                      React.createElement(
                        "div",
                        { className: "min-w-0 flex-1" },
                        React.createElement("div", { className: "font-mono font-bold text-blue-700 dark:text-blue-400 truncate" }, inst.computerHostname || "DESKTOP"),
                        React.createElement("div", { className: "text-[11px] text-slate-500 truncate" }, inst.version ? `v${inst.version}` : 'Không rõ phiên bản')
                      ),
                      React.createElement(
                        "select",
                        {
                          value: inst.invoiceStatus || 'MISSING_INVOICE',
                          onChange: (e) => {
                            if (onUpdateInvoice) {
                              onUpdateInvoice(inst.id, e.target.value);
                            }
                          },
                          className: "text-[11px] font-bold p-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200",
                        },
                        React.createElement("option", { value: "MISSING_INVOICE" }, "Chưa có HĐ"),
                        React.createElement("option", { value: "HAS_INVOICE" }, "Đã có HĐ"),
                        React.createElement("option", { value: "NOT_APPLICABLE" }, "FOSS / Miễn phí")
                      )
                    )
                  )
                )
              )
            )
          )
        );
      }
    });

    return rows;
  }

  global.SAM_ASSISTANT_SOFTWARE = {
    AssistantSoftwareView,
  };
})(typeof window !== 'undefined' ? window : this);
