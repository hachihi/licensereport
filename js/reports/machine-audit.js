// js/reports/machine-audit.js - Tab 3: Machine Audit Component
(function (global) {
  'use strict';

  function MachineAuditReport(props) {
    const { computers, installations, updateInvoiceStatus } = props;

    const MultiSelectFilter =
      (global.SAM_COMPONENTS && global.SAM_COMPONENTS.MultiSelectFilter) ||
      (global.SAM_UTILS && global.SAM_UTILS.MultiSelectFilter);

    const [search, setSearch] = React.useState("");
    const [selectedDepts, setSelectedDepts] = React.useState([]);

    const departmentOptions = React.useMemo(() => {
      const set = new Set();
      (computers || []).forEach((c) => {
        if (c.department && c.department.trim()) {
          set.add(c.department.trim());
        }
      });
      return Array.from(set).sort().map((d) => ({ value: d, label: d }));
    }, [computers]);

    React.useEffect(() => {
      if (departmentOptions.length > 0 && selectedDepts.length === 0) {
        setSelectedDepts(departmentOptions.map((d) => d.value));
      }
    }, [departmentOptions]);

    const [statusFilter, setStatusFilter] = React.useState("ALL"); // ALL, MISSING, CLEAN

    const compStats = React.useMemo(() => {
      let missingCountTotal = 0;
      let cleanCountTotal = 0;
      (computers || []).forEach((c) => {
        const cInstalls = (installations || []).filter(
          (i) => (i.computerHostname || '').toUpperCase() === (c.hostname || '').toUpperCase()
        );
        const hasMissing = cInstalls.some(
          (i) => i.invoiceStatus === "MISSING_INVOICE" && i.licenseType !== "FREE_OPEN_SOURCE"
        );
        if (hasMissing) {
          missingCountTotal++;
        } else {
          cleanCountTotal++;
        }
      });
      return { missingCountTotal, cleanCountTotal };
    }, [computers, installations]);

    const filteredComputers = React.useMemo(() => {
      return (computers || []).filter((c) => {
        const compInstalls = (installations || []).filter(
          (i) => (i.computerHostname || '').toUpperCase() === (c.hostname || '').toUpperCase()
        );
        const hasMissing = compInstalls.some(
          (i) => i.invoiceStatus === "MISSING_INVOICE" && i.licenseType !== "FREE_OPEN_SOURCE"
        );

        if (statusFilter === "MISSING" && !hasMissing) return false;
        if (statusFilter === "CLEAN" && hasMissing) return false;

        if (
          selectedDepts.length > 0 &&
          selectedDepts.length < departmentOptions.length &&
          !selectedDepts.includes(c.department || "N/A")
        ) {
          return false;
        }
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchHost = (c.hostname || "").toLowerCase().includes(q);
          const matchUser = (c.user || "").toLowerCase().includes(q);
          const matchDept = (c.department || "").toLowerCase().includes(q);
          const matchModel = (c.model || "").toLowerCase().includes(q);
          const matchSerial = (c.serial || "").toLowerCase().includes(q);
          if (!matchHost && !matchUser && !matchDept && !matchModel && !matchSerial) {
            return false;
          }
        }
        return true;
      });
    }, [computers, selectedDepts, departmentOptions, search, statusFilter, installations]);

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
          React.createElement("span", { className: "text-2xl" }, "💻"),
          React.createElement(
            "div",
            null,
            React.createElement(
              "h2",
              { className: "text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-wide" },
              "Kiểm Toán Chi Tiết Từng Thiết Bị Máy Tính"
            ),
            React.createElement(
              "p",
              { className: "text-xs text-slate-500 dark:text-slate-400" },
              "Kiểm tra cấu hình phần cứng, số serial/service tag, phần mềm đã cài và tình trạng hóa đơn VAT theo từng máy"
            )
          )
        ),
        React.createElement(
          "div",
          { className: "flex items-center gap-2 text-xs" },
          React.createElement(
            "span",
            { className: "px-3 py-1 rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-bold border border-slate-300 dark:border-slate-700" },
            `${(computers || []).length} máy tính`
          ),
          React.createElement(
            "span",
            { className: "px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800" },
            `✓ ${compStats.cleanCountTotal} máy chuẩn`
          ),
          compStats.missingCountTotal > 0 &&
            React.createElement(
              "span",
              { className: "px-3 py-1 rounded-full bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-900" },
              `⚠ ${compStats.missingCountTotal} máy cần khắc phục`
            )
        )
      ),

      // 2. Control Toolbar Card (Search, Department & Status Filter)
      React.createElement(
        "div",
        { className: "sam-section-card" },
        React.createElement(
          "div",
          { className: "sam-section-ribbon flex-wrap gap-3" },
          React.createElement(
            "div",
            { className: "flex items-center gap-2" },
            React.createElement("span", { className: "text-base" }, "🔍"),
            React.createElement(
              "h3",
              { className: "text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider" },
              "Bộ Lọc & Tra Cứu Thiết Bị"
            )
          ),
          // Status Pills Filter
          React.createElement(
            "div",
            { className: "flex items-center gap-1.5 text-xs flex-wrap" },
            [
              { id: "ALL", label: `Tất cả (${(computers || []).length})` },
              { id: "MISSING", label: `🔴 Thiếu HĐ (${compStats.missingCountTotal})` },
              { id: "CLEAN", label: `🟢 Đạt chuẩn (${compStats.cleanCountTotal})` },
            ].map((st) =>
              React.createElement(
                "button",
                {
                  key: st.id,
                  onClick: () => setStatusFilter(st.id),
                  className: `px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                    statusFilter === st.id
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                  }`,
                },
                st.label
              )
            )
          )
        ),
        React.createElement(
          "div",
          { className: "sam-toolbar-area flex flex-col sm:flex-row justify-between items-center gap-3" },
          React.createElement(
            "div",
            { className: "relative w-full sm:w-80" },
            React.createElement("input", {
              type: "text",
              placeholder: "🔍 Tìm theo mã máy, người dùng, model, serial...",
              value: search,
              onChange: (e) => setSearch(e.target.value),
              className:
                "w-full pl-3 pr-8 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs",
            }),
            search &&
              React.createElement(
                "button",
                {
                  onClick: () => setSearch(""),
                  className: "absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-xs",
                  title: "Xóa tìm kiếm"
                },
                "✕"
              )
          ),
          React.createElement(
            "div",
            { className: "flex items-center gap-2 w-full sm:w-auto" },
            MultiSelectFilter && departmentOptions.length > 0
              ? React.createElement(MultiSelectFilter, {
                  label: "🏢 Phòng ban",
                  options: departmentOptions,
                  selected: selectedDepts,
                  onChange: setSelectedDepts,
                })
              : null
          )
        )
      ),

      // 3. Grid of Machine Cards
      React.createElement(
        "div",
        { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" },
        filteredComputers.length === 0
          ? React.createElement(
              "div",
              { className: "col-span-full sam-section-card p-12 text-center text-slate-500 dark:text-slate-400" },
              "🔍 Không tìm thấy máy tính nào phù hợp với điều kiện tìm kiếm hoặc bộ lọc."
            )
          : filteredComputers.map((comp, idx) => {
          const compInstalls = (installations || []).filter(
            (i) => (i.computerHostname || '').toUpperCase() === (comp.hostname || '').toUpperCase()
          );

          const missingCount = compInstalls.filter(
            (i) =>
              i.invoiceStatus === "MISSING_INVOICE" && i.licenseType !== "FREE_OPEN_SOURCE"
          ).length;

          const hasRisk = compInstalls.some(
            (i) =>
              (i.auditRisk === "CRITICAL" || i.auditRisk === "HIGH" || i.isTrap) &&
              i.licenseType !== "FREE_OPEN_SOURCE"
          );

          return React.createElement(
            "div",
            {
              key: idx,
              className: `sam-section-card flex flex-col justify-between transition-shadow hover:shadow-md ${
                hasRisk
                  ? "border-rose-300 dark:border-rose-900/70"
                  : "border-slate-200 dark:border-slate-800"
              }`,
            },
            // Card Header Ribbon
            React.createElement(
              "div",
              {
                className: `sam-section-ribbon ${
                  hasRisk
                    ? "bg-rose-50/50 dark:bg-rose-950/30 border-b-rose-200 dark:border-b-rose-900/60"
                    : "bg-slate-50 dark:bg-slate-800/60"
                }`,
              },
              React.createElement(
                "div",
                { className: "flex items-center gap-2" },
                React.createElement("span", { className: "text-base" }, "🖥️"),
                React.createElement(
                  "div",
                  null,
                  React.createElement(
                    "h4",
                    { className: "font-black text-slate-900 dark:text-slate-100 text-xs sm:text-sm tracking-tight" },
                    comp.hostname || "Chưa rõ mã"
                  ),
                  React.createElement(
                    "p",
                    { className: "text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1" },
                    "👤 ",
                    comp.user || "Chưa gán",
                    " • ",
                    comp.department || "Chung"
                  )
                )
              ),
              React.createElement(
                "span",
                {
                  className: `text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    missingCount > 0
                      ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-800"
                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800"
                  }`,
                },
                missingCount > 0 ? `⚠ Thiếu ${missingCount} HĐ` : "✓ Đầy đủ HĐ"
              )
            ),

            // Hardware Specs Badges
            React.createElement(
              "div",
              { className: "p-3.5 space-y-3 flex-1 flex flex-col justify-between" },
              React.createElement(
                "div",
                { className: "space-y-2" },
                React.createElement(
                  "div",
                  { className: "flex flex-wrap gap-1.5" },
                  comp.os &&
                    React.createElement(
                      "span",
                      { className: "sam-hw-pill", title: "Hệ điều hành" },
                      "🪟 ",
                      comp.os
                    ),
                  comp.model && comp.model !== "N/A" &&
                    React.createElement(
                      "span",
                      { className: "sam-hw-pill", title: "Model thiết bị" },
                      "🏷️ ",
                      comp.model
                    ),
                  comp.serial && comp.serial !== "N/A" &&
                    React.createElement(
                      "span",
                      { className: "sam-hw-pill font-mono", title: "Số Serial / Service Tag" },
                      "🔢 ",
                      comp.serial
                    ),
                  comp.cpu &&
                    React.createElement(
                      "span",
                      { className: "sam-hw-pill", title: "Vi xử lý (CPU)" },
                      "⚡ ",
                      comp.cpu
                    ),
                  comp.ram &&
                    React.createElement(
                      "span",
                      { className: "sam-hw-pill", title: "Bộ nhớ RAM" },
                      "💾 ",
                      comp.ram
                    ),
                  comp.disk &&
                    React.createElement(
                      "span",
                      { className: "sam-hw-pill", title: "Ổ cứng lưu trữ" },
                      "💽 ",
                      comp.disk
                    )
                )
              ),

              // Software List Area
              React.createElement(
                "div",
                { className: "border-t border-slate-100 dark:border-slate-800 pt-2.5 mt-2" },
                React.createElement(
                  "div",
                  { className: "flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5" },
                  React.createElement("span", null, `Ứng dụng cài đặt (${compInstalls.length}):`),
                  React.createElement(
                    "span",
                    { className: "text-[10px] text-slate-400 font-normal" },
                    "Nhấn để đối soát HĐ"
                  )
                ),
                React.createElement(
                  "div",
                  { className: "space-y-1.5 max-h-44 overflow-y-auto pr-1" },
                  compInstalls.map((inst, iIdx) =>
                    React.createElement(
                      "div",
                      {
                        key: iIdx,
                        className:
                          "flex justify-between items-center text-xs p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800/80 transition",
                      },
                      React.createElement(
                        "div",
                        { className: "truncate max-w-[150px] sm:max-w-[170px]" },
                        React.createElement(
                          "span",
                          {
                            className: "text-slate-900 dark:text-slate-100 font-semibold text-[11px] block truncate",
                            title: inst.displayName,
                          },
                          inst.displayName
                        ),
                        React.createElement(
                          "span",
                          { className: "text-[10px] text-slate-400 block truncate" },
                          inst.vendor || "N/A"
                        )
                      ),
                      React.createElement(
                        "select",
                        {
                          value: inst.invoiceStatus,
                          onChange: (e) => updateInvoiceStatus(inst.id, e.target.value),
                          className: `text-[10px] font-bold rounded-lg px-2 py-1 border focus:outline-none cursor-pointer transition shadow-2xs ${
                            inst.invoiceStatus === "HAS_INVOICE"
                              ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                              : inst.invoiceStatus === "MISSING_INVOICE"
                              ? "bg-rose-50 dark:bg-rose-950 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200"
                              : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                          }`,
                        },
                        React.createElement("option", { value: "HAS_INVOICE" }, "✓ Có HĐ VAT"),
                        React.createElement("option", { value: "MISSING_INVOICE" }, "⚠ Thiếu HĐ"),
                        React.createElement("option", { value: "NOT_APPLICABLE" }, "FOSS (0đ)")
                      )
                    )
                  )
                )
              )
            )
          );
        })
      )
    );
  }

  global.SAM_REPORTS = global.SAM_REPORTS || {};
  global.SAM_REPORTS.MachineAuditReport = MachineAuditReport;

})(typeof window !== 'undefined' ? window : this);
