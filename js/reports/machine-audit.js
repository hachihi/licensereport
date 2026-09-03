// js/reports/machine-audit.js - Tab 3: Machine Audit Component
(function (global) {
  'use strict';

  function MachineAuditReport(props) {
    const { computers, installations, updateInvoiceStatus } = props;

    return React.createElement(
      "div",
      { className: "space-y-4" },
      React.createElement(
        "div",
        { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" },
        (computers || []).map((comp, idx) => {
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
              className: `bg-white dark:bg-slate-900 rounded-xl border p-4 shadow-sm space-y-3 transition-colors duration-200 ${
                hasRisk
                  ? "border-amber-200 dark:border-amber-900/60"
                  : "border-slate-200 dark:border-slate-800"
              }`,
            },
            React.createElement(
              "div",
              { className: "flex justify-between items-start" },
              React.createElement(
                "div",
                null,
                React.createElement(
                  "h4",
                  { className: "font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5" },
                  comp.hostname,
                  hasRisk
                    ? React.createElement("span", {
                        className: "w-2 h-2 rounded-full bg-rose-500",
                      })
                    : React.createElement("span", {
                        className: "w-2 h-2 rounded-full bg-emerald-500",
                      })
                ),
                React.createElement(
                  "p",
                  { className: "text-xs text-slate-600 dark:text-slate-400 font-medium" },
                  comp.user || "Chưa gán",
                  " • ",
                  React.createElement(
                    "span",
                    { className: "text-slate-500 dark:text-slate-500" },
                    comp.department || "N/A"
                  )
                )
              ),
              React.createElement(
                "span",
                {
                  className: `text-[10px] px-2 py-0.5 rounded font-bold ${
                    missingCount > 0
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  }`,
                },
                missingCount > 0 ? `Thiếu ${missingCount} HĐ` : "Đầy đủ HĐ"
              )
            ),
            React.createElement(
              "div",
              { className: "text-[11px] bg-slate-50 dark:bg-slate-800/60 p-2 rounded text-slate-600 dark:text-slate-300 space-y-0.5 border border-slate-100 dark:border-slate-800" },
              React.createElement(
                "p",
                null,
                React.createElement("span", { className: "font-semibold" }, "HĐH:"),
                " ",
                comp.os || "Windows"
              ),
              React.createElement(
                "p",
                null,
                React.createElement("span", { className: "font-semibold" }, "Cấu hình:"),
                " ",
                comp.model || "N/A"
              ),
              comp.serial && comp.serial !== "N/A" &&
                React.createElement(
                  "p",
                  null,
                  React.createElement("span", { className: "font-semibold" }, "Serial:"),
                  " ",
                  comp.serial
                )
            ),
            React.createElement(
              "div",
              { className: "space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-2" },
              React.createElement(
                "p",
                { className: "text-[11px] font-semibold text-slate-500 dark:text-slate-400" },
                "Phần mềm đã cài (",
                compInstalls.length,
                "):"
              ),
              React.createElement(
                "div",
                { className: "space-y-1 max-h-48 overflow-y-auto pr-1" },
                compInstalls.map((inst, iIdx) =>
                  React.createElement(
                    "div",
                    {
                      key: iIdx,
                      className:
                        "flex justify-between items-center text-xs p-1.5 rounded bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition",
                    },
                    React.createElement(
                      "span",
                      {
                        className: "text-slate-800 dark:text-slate-200 font-medium truncate max-w-[170px]",
                        title: inst.displayName,
                      },
                      inst.displayName
                    ),
                    React.createElement(
                      "select",
                      {
                        value: inst.invoiceStatus,
                        onChange: (e) => updateInvoiceStatus(inst.id, e.target.value),
                        className: `text-[10px] font-semibold rounded px-1.5 py-0.5 border focus:outline-none cursor-pointer ${
                          inst.invoiceStatus === "HAS_INVOICE"
                            ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                            : inst.invoiceStatus === "MISSING_INVOICE"
                            ? "bg-rose-50 dark:bg-rose-950 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                        }`,
                      },
                      React.createElement("option", { value: "HAS_INVOICE" }, "Có HĐ"),
                      React.createElement("option", { value: "MISSING_INVOICE" }, "Thiếu HĐ"),
                      React.createElement("option", { value: "NOT_APPLICABLE" }, "FOSS (Free)")
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
