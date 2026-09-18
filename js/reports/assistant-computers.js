// js/reports/assistant-computers.js - Tab "Máy tính" thân thiện, trực quan
(function (global) {
  'use strict';

  function AssistantComputersView(props) {
    const {
      computers = [],
      installations = [],
      onUpdateInvoiceStatus,
    } = props;

    const [searchTerm, setSearchTerm] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('ALL'); // ALL, NEED_CHECK, CLEAN
    const [departmentFilter, setDepartmentFilter] = React.useState('ALL');
    const [expandedHost, setExpandedHost] = React.useState(null);

    // Danh sách phòng ban
    const departments = React.useMemo(() => {
      const set = new Set();
      (computers || []).forEach((c) => {
        if (c.department && c.department.trim()) {
          set.add(c.department.trim());
        }
      });
      return Array.from(set).sort();
    }, [computers]);

    // Phân tích trạng thái từng máy tính
    const enrichedComputers = React.useMemo(() => {
      return (computers || []).map((c) => {
        const hostUpper = (c.hostname || '').toUpperCase();
        const compInstalls = (installations || []).filter(
          (i) => (i.computerHostname || '').toUpperCase() === hostUpper
        );

        const needCheckInstalls = compInstalls.filter((i) => {
          const isFoss = i.licenseType === 'FREE_OPEN_SOURCE' || i.invoiceStatus === 'NOT_APPLICABLE';
          if (isFoss) return false;
          if (i.invoiceStatus === 'MISSING_INVOICE') return true;
          if (i.licenseType === 'FREE_PERSONAL_ONLY' || i.isTrap) return true;
          return false;
        });

        const hasIssues = needCheckInstalls.length > 0;

        return {
          ...c,
          installations: compInstalls,
          needCheckInstalls,
          hasIssues,
          totalSoftware: compInstalls.length,
          statusBadge: hasIssues
            ? {
                label: `⚠️ ${needCheckInstalls.length} cần kiểm tra`,
                className: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
              }
            : {
                label: '✅ Bình thường',
                className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
              },
        };
      });
    }, [computers, installations]);

    // Lọc theo tìm kiếm và bộ lọc
    const filteredComputers = React.useMemo(() => {
      return enrichedComputers.filter((c) => {
        if (statusFilter === 'NEED_CHECK' && !c.hasIssues) return false;
        if (statusFilter === 'CLEAN' && c.hasIssues) return false;
        if (departmentFilter !== 'ALL' && (c.department || 'N/A') !== departmentFilter) return false;

        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          const matchHost = (c.hostname || '').toLowerCase().includes(q);
          const matchUser = (c.user || '').toLowerCase().includes(q);
          const matchDept = (c.department || '').toLowerCase().includes(q);
          if (!matchHost && !matchUser && !matchDept) return false;
        }
        return true;
      });
    }, [enrichedComputers, statusFilter, departmentFilter, searchTerm]);

    return React.createElement(
      "div",
      { className: "space-y-6 animate-fadeIn" },

      // Banner Header
      React.createElement(
        "div",
        { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4" },
        React.createElement(
          "div",
          null,
          React.createElement(
            "h2",
            { className: "text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2.5" },
            React.createElement("span", { className: "text-2xl" }, "🖥️"),
            "Danh Sách Máy Tính & Người Sử Dụng"
          ),
          React.createElement(
            "p",
            { className: "text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1" },
            "Bấm vào từng dòng máy tính để xem cấu hình phần cứng (Serial, Model, CPU) và danh sách phần mềm cài đặt."
          )
        ),
        React.createElement(
          "div",
          { className: "flex items-center gap-2 text-xs font-bold" },
          React.createElement(
            "span",
            { className: "px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700" },
            `${computers.length} máy tính đang quản lý`
          )
        )
      ),

      // Toolbar Filters
      React.createElement(
        "div",
        { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3" },
        // Status filter tabs
        React.createElement(
          "div",
          { className: "flex items-center gap-2 overflow-x-auto w-full sm:w-auto" },
          [
            { id: 'ALL', label: 'Tất cả máy' },
            { id: 'NEED_CHECK', label: '⚠️ Máy có phần mềm cần kiểm tra' },
            { id: 'CLEAN', label: '✅ Máy bình thường' },
          ].map((btn) =>
            React.createElement(
              "button",
              {
                key: btn.id,
                onClick: () => setStatusFilter(btn.id),
                className: `px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap border ${
                  statusFilter === btn.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`,
              },
              btn.label
            )
          )
        ),

        // Search and department filter
        React.createElement(
          "div",
          { className: "flex items-center gap-2 w-full sm:w-auto" },
          departments.length > 0 &&
            React.createElement(
              "select",
              {
                value: departmentFilter,
                onChange: (e) => setDepartmentFilter(e.target.value),
                className: "px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:outline-none",
              },
              React.createElement("option", { value: "ALL" }, "Tất cả phòng ban"),
              departments.map((d) =>
                React.createElement("option", { key: d, value: d }, d)
              )
            ),
          React.createElement(
            "div",
            { className: "relative flex-1 sm:w-64" },
            React.createElement("input", {
              type: "text",
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              placeholder: "Tìm tên máy, nhân viên...",
              className: "w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500",
            }),
            React.createElement("span", { className: "absolute left-2.5 top-2 text-slate-400 text-xs" }, "🔍")
          )
        )
      ),

      // Main Table (Máy tính | Người sử dụng | Phòng ban | Phần mềm | Tình trạng)
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
                React.createElement("th", { className: "px-5 py-3.5" }, "Máy tính"),
                React.createElement("th", { className: "px-5 py-3.5" }, "Người sử dụng"),
                React.createElement("th", { className: "px-5 py-3.5" }, "Phòng ban"),
                React.createElement("th", { className: "px-5 py-3.5 text-center" }, "Phần mềm"),
                React.createElement("th", { className: "px-5 py-3.5" }, "Tình trạng"),
                React.createElement("th", { className: "px-5 py-3.5 text-center" }, "Chi tiết")
              )
            ),
            React.createElement(
              "tbody",
              { className: "divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200" },
              renderComputerRows(filteredComputers, expandedHost, setExpandedHost, onUpdateInvoiceStatus)
            )
          )
        ),
        filteredComputers.length === 0 &&
          React.createElement(
            "div",
            { className: "p-8 text-center text-xs text-slate-500 dark:text-slate-400 font-medium" },
            "Không tìm thấy máy tính nào theo tiêu chí tìm kiếm."
          )
      )
    );
  }

  // Render rows with expansion of hardware specs & software list
  function renderComputerRows(computers, expandedHost, setExpandedHost, onUpdateInvoice) {
    const rows = [];

    computers.forEach((c) => {
      const isExpanded = expandedHost === c.hostname;

      rows.push(
        React.createElement(
          "tr",
          {
            key: c.hostname,
            onClick: () => setExpandedHost(isExpanded ? null : c.hostname),
            className: `cursor-pointer transition-colors ${
              isExpanded
                ? 'bg-blue-50/50 dark:bg-blue-950/20'
                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`,
          },
          React.createElement(
            "td",
            { className: "px-5 py-3.5 font-bold font-mono text-slate-900 dark:text-white" },
            React.createElement("div", { className: "text-sm text-blue-700 dark:text-blue-400" }, c.hostname),
            c.ip && React.createElement("div", { className: "text-[11px] text-slate-500 font-normal mt-0.5" }, `IP: ${c.ip}`)
          ),
          React.createElement(
            "td",
            { className: "px-5 py-3.5 font-semibold text-slate-900 dark:text-slate-100" },
            c.user || "Chưa xác định"
          ),
          React.createElement(
            "td",
            { className: "px-5 py-3.5 text-slate-600 dark:text-slate-300" },
            c.department || "N/A"
          ),
          React.createElement(
            "td",
            { className: "px-5 py-3.5 text-center" },
            React.createElement(
              "span",
              { className: "px-2.5 py-1 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs" },
              `${c.totalSoftware} PM`
            )
          ),
          React.createElement(
            "td",
            { className: "px-5 py-3.5" },
            React.createElement(
              "span",
              { className: `inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${c.statusBadge.className}` },
              c.statusBadge.label
            )
          ),
          React.createElement(
            "td",
            { className: "px-5 py-3.5 text-center" },
            React.createElement(
              "button",
              {
                onClick: (e) => {
                  e.stopPropagation();
                  setExpandedHost(isExpanded ? null : c.hostname);
                },
                className: "text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer",
              },
              isExpanded ? "Đóng ▲" : "Xem chi tiết ▼"
            )
          )
        )
      );

      // Expanded drawer: Serial, Model, CPU, RAM, Windows, and software list
      if (isExpanded) {
        rows.push(
          React.createElement(
            "tr",
            { key: `${c.hostname}_expanded`, className: "bg-slate-50 dark:bg-slate-950" },
            React.createElement(
              "td",
              { colSpan: 6, className: "p-4 sm:p-6" },
              React.createElement(
                "div",
                { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4" },

                // 1. Hardware Specifications
                React.createElement(
                  "div",
                  { className: "pb-3 border-b border-slate-100 dark:border-slate-800 space-y-2" },
                  React.createElement(
                    "h4",
                    { className: "text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2" },
                    React.createElement("span", null, "⚙️"),
                    "Thông Tin Thiết Bị & Cấu Hình Máy Tính"
                  ),
                  React.createElement(
                    "div",
                    { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1" },
                    React.createElement(
                      "div",
                      { className: "p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700" },
                      React.createElement("div", { className: "text-[11px] text-slate-500" }, "Số Serial / Service Tag"),
                      React.createElement("div", { className: "font-mono font-bold text-slate-900 dark:text-white text-xs truncate mt-0.5" }, c.serialNumber || c.serial || "N/A")
                    ),
                    React.createElement(
                      "div",
                      { className: "p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700" },
                      React.createElement("div", { className: "text-[11px] text-slate-500" }, "Model thiết bị"),
                      React.createElement("div", { className: "font-bold text-slate-900 dark:text-white text-xs truncate mt-0.5" }, c.model || "N/A")
                    ),
                    React.createElement(
                      "div",
                      { className: "p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700" },
                      React.createElement("div", { className: "text-[11px] text-slate-500" }, "Hệ điều hành (OS)"),
                      React.createElement("div", { className: "font-bold text-slate-900 dark:text-white text-xs truncate mt-0.5" }, c.os || "Windows")
                    ),
                    React.createElement(
                      "div",
                      { className: "p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700" },
                      React.createElement("div", { className: "text-[11px] text-slate-500" }, "Bộ vi xử lý (CPU)"),
                      React.createElement("div", { className: "font-bold text-slate-900 dark:text-white text-xs truncate mt-0.5" }, c.cpu || "N/A")
                    ),
                    React.createElement(
                      "div",
                      { className: "p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700" },
                      React.createElement("div", { className: "text-[11px] text-slate-500" }, "Bộ nhớ RAM"),
                      React.createElement("div", { className: "font-bold text-slate-900 dark:text-white text-xs truncate mt-0.5" }, c.ram ? `${c.ram} GB` : "N/A")
                    )
                  )
                ),

                // 2. Installed Software List on this Machine
                React.createElement(
                  "div",
                  { className: "space-y-2.5" },
                  React.createElement(
                    "div",
                    { className: "flex items-center justify-between" },
                    React.createElement(
                      "h4",
                      { className: "text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2" },
                      React.createElement("span", null, "📦"),
                      `Danh Sách Phần Mềm Cài Trên Máy Này (${c.installations.length} phần mềm)`
                    ),
                    React.createElement(
                      "span",
                      { className: "text-[11px] text-slate-500" },
                      "Nhấp vào trạng thái hóa đơn để cập nhật trực tiếp"
                    )
                  ),
                  React.createElement(
                    "div",
                    { className: "overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800" },
                    React.createElement(
                      "table",
                      { className: "min-w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800" },
                      React.createElement(
                        "thead",
                        { className: "bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-700 dark:text-slate-300" },
                        React.createElement(
                          "tr",
                          null,
                          React.createElement("th", { className: "px-4 py-2.5" }, "Tên phần mềm"),
                          React.createElement("th", { className: "px-4 py-2.5" }, "Hãng"),
                          React.createElement("th", { className: "px-4 py-2.5" }, "Phiên bản"),
                          React.createElement("th", { className: "px-4 py-2.5" }, "Loại giấy phép"),
                          React.createElement("th", { className: "px-4 py-2.5" }, "Trạng thái hóa đơn")
                        )
                      ),
                      React.createElement(
                        "tbody",
                        { className: "divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900" },
                        c.installations.map((inst, i) => {
                          const isFoss = inst.licenseType === 'FREE_OPEN_SOURCE' || inst.invoiceStatus === 'NOT_APPLICABLE';
                          const isTrap = inst.licenseType === 'FREE_PERSONAL_ONLY' || inst.isTrap;

                          return React.createElement(
                            "tr",
                            { key: i, className: "hover:bg-slate-50 dark:hover:bg-slate-800/50" },
                            React.createElement(
                              "td",
                              { className: "px-4 py-2.5 font-bold text-slate-900 dark:text-white" },
                              inst.displayName || inst.rawName
                            ),
                            React.createElement(
                              "td",
                              { className: "px-4 py-2.5 text-slate-500" },
                              inst.vendor || "N/A"
                            ),
                            React.createElement(
                              "td",
                              { className: "px-4 py-2.5 font-mono text-slate-600 dark:text-slate-400" },
                              inst.version || "N/A"
                            ),
                            React.createElement(
                              "td",
                              { className: "px-4 py-2.5" },
                              isFoss
                                ? React.createElement("span", { className: "text-emerald-700 dark:text-emerald-300 font-semibold" }, "🟢 Miễn phí")
                                : isTrap
                                ? React.createElement("span", { className: "text-amber-700 dark:text-amber-300 font-semibold" }, "🟡 Bản cá nhân")
                                : React.createElement("span", { className: "text-slate-700 dark:text-slate-300 font-semibold" }, "Thương mại")
                            ),
                            React.createElement(
                              "td",
                              { className: "px-4 py-2.5" },
                              React.createElement(
                                "select",
                                {
                                  value: inst.invoiceStatus || 'MISSING_INVOICE',
                                  onChange: (e) => {
                                    if (onUpdateInvoice) {
                                      onUpdateInvoice(inst.id, e.target.value);
                                    }
                                  },
                                  className: "text-[11px] font-bold p-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200",
                                },
                                React.createElement("option", { value: "MISSING_INVOICE" }, "⚠️ Chưa có HĐ"),
                                React.createElement("option", { value: "HAS_INVOICE" }, "✅ Đã có HĐ"),
                                React.createElement("option", { value: "NOT_APPLICABLE" }, "🟢 FOSS / Miễn phí")
                              )
                            )
                          );
                        })
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

  global.SAM_ASSISTANT_COMPUTERS = {
    AssistantComputersView,
  };
})(typeof window !== 'undefined' ? window : this);
