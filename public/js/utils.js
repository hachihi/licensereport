// js/utils.js - Shared Utility and Formatting Functions
(function (global) {
  'use strict';

  function removeAccents(str) {
    return String(str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  function getVal(row, candidates) {
    if (!row) return '';
    const keys = Object.keys(row);
    for (const cand of candidates) {
      const cleanCand = removeAccents(cand);
      const foundKey = keys.find(
        (k) => removeAccents(k) === cleanCand || removeAccents(k).includes(cleanCand)
      );
      if (
        foundKey &&
        row[foundKey] !== undefined &&
        row[foundKey] !== null &&
        String(row[foundKey]).trim() !== ''
      ) {
        return String(row[foundKey]).trim();
      }
    }
    return '';
  }

  function formatVND(num) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(num || 0);
  }

  function getRiskEmoji(risk) {
    return risk === 'CRITICAL'
      ? '🔴'
      : risk === 'HIGH'
      ? '🟠'
      : risk === 'MEDIUM'
      ? '🟡'
      : '🟢';
  }

  function getActionLabelVN(action) {
    switch (action) {
      case 'UNINSTALL_IMMEDIATELY':
        return 'Gỡ bỏ';
      case 'REPLACE_WITH_FOSS':
        return 'Thay thế (FOSS)';
      case 'VERIFY_INVOICE':
        return 'Mua thêm / Xác minh hóa đơn';
      case 'PURCHASE_LICENSE':
        return 'Mua thêm';
      case 'ALLOW_FREE':
        return 'Giữ nguyên (Hợp lệ)';
      default:
        return 'Kiểm tra lại';
    }
  }

  function classifySoftware(inst) {
    const rawLower = (inst.rawSoftwareName || '').toLowerCase();
    if (
      rawLower.includes('crack') ||
      rawLower.includes('kms') ||
      rawLower.includes('patch') ||
      rawLower.includes('keygen')
    ) {
      return 'Tool Crack';
    }
    if (
      rawLower.includes('driver booster') ||
      rawLower.includes('uninstaller') ||
      (rawLower.includes('cleaner') && !rawLower.includes('business'))
    ) {
      return 'Phần mềm rác';
    }
    if (
      rawLower.includes('wps') ||
      rawLower.includes('canva') ||
      rawLower.includes('freemium')
    ) {
      return 'Freemium';
    }
    if (
      inst.licenseType === 'FREE_OPEN_SOURCE' ||
      rawLower.includes('7-zip') ||
      rawLower.includes('vlc') ||
      rawLower.includes('chrome') ||
      rawLower.includes('notepad++')
    ) {
      return 'Miễn phí (Freeware)';
    }
    if (inst.licenseType === 'FREE_PERSONAL_ONLY') {
      return 'Bản quyền cá nhân';
    }
    return 'Thương mại';
  }

  function getInvoiceText(inst) {
    if (inst.licenseType === 'FREE_OPEN_SOURCE' || inst.invoiceStatus === 'NOT_APPLICABLE') {
      return 'Không cần hóa đơn';
    }
    if (inst.invoiceStatus === 'HAS_INVOICE') {
      return 'Đã có Hóa đơn VAT';
    }
    return 'Chưa có hóa đơn';
  }

  function getActionRequired(inst) {
    const rawLower = (inst.rawSoftwareName || '').toLowerCase();
    const isFree = inst.licenseType === 'FREE_OPEN_SOURCE';
    if (inst.invoiceStatus === 'HAS_INVOICE' || isFree) {
      return 'Hợp lệ - Giữ nguyên';
    }
    if (
      rawLower.includes('crack') ||
      rawLower.includes('kms') ||
      rawLower.includes('patch') ||
      rawLower.includes('keygen')
    ) {
      return 'GỠ BỎ GẤP & Quét Virus';
    }
    if (rawLower.includes('driver booster') || rawLower.includes('uninstaller')) {
      return 'Gỡ bỏ khỏi máy';
    }
    if (rawLower.includes('winrar')) {
      return 'Gỡ bỏ -> Thay bằng 7-Zip';
    }
    if (rawLower.includes('autocad')) {
      const isDesignDept =
        (inst.department || '').toLowerCase().includes('thiết kế') ||
        (inst.department || '').toLowerCase().includes('kỹ thuật');
      return isDesignDept
        ? 'Mua bản quyền AutoCAD'
        : 'Gỡ bỏ -> Thay bằng DWG TrueView (Xem bản vẽ)';
    }
    if (
      rawLower.includes('photoshop') ||
      rawLower.includes('illustrator') ||
      rawLower.includes('corel')
    ) {
      return 'Mua bản quyền Adobe CC (Triển khai gấp)';
    }
    if (rawLower.includes('office') || rawLower.includes('m365')) {
      const isKeyDept =
        (inst.department || '').toLowerCase().includes('kế toán') ||
        (inst.department || '').toLowerCase().includes('giám đốc') ||
        (inst.department || '').toLowerCase().includes('kinh doanh');
      return isKeyDept
        ? 'Mua bổ sung bản quyền Office 365'
        : 'Gỡ bỏ -> Chuyển sang dùng Google Sheets / Docs';
    }
    if (rawLower.includes('wps') || rawLower.includes('canva')) {
      return 'Kiểm tra điều khoản doanh nghiệp / Giữ nguyên';
    }
    if (rawLower.includes('teamviewer') || rawLower.includes('anydesk')) {
      return 'Gỡ bỏ -> Thay bằng RustDesk / UltraViewer';
    }
    if (inst.suggestedAction === 'REPLACE_WITH_FOSS') {
      return `Gỡ bỏ -> Thay bằng ${inst.recommendedAlternative || 'FOSS'}`;
    }
    if (inst.suggestedAction === 'UNINSTALL_IMMEDIATELY') {
      return 'Gỡ bỏ khỏi máy';
    }
    return 'Mua bổ sung bản quyền hợp lệ';
  }

  // Universal MultiSelectFilter Component for All Views & Reports
  function MultiSelectFilter({ label, options = [], selected = [], onChange, placeholder }) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const wrapRef = React.useRef(null);

    React.useEffect(() => {
      function handleOutsideClick(e) {
        if (wrapRef.current && !wrapRef.current.contains(e.target)) {
          setOpen(false);
        }
      }
      document.addEventListener("mousedown", handleOutsideClick);
      return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    // Normalize options (support array of strings or { value, label })
    const items = React.useMemo(() => {
      return (options || []).map((opt) => {
        if (opt && typeof opt === "object" && opt.value !== undefined) {
          return { value: opt.value, label: opt.label || String(opt.value) };
        }
        return { value: opt, label: String(opt) };
      });
    }, [options]);

    const filteredItems = React.useMemo(() => {
      if (!search.trim()) return items;
      const q = search.toLowerCase();
      return items.filter((it) => it.label.toLowerCase().includes(q) || String(it.value).toLowerCase().includes(q));
    }, [items, search]);

    const toggleOption = (val) => {
      if (selected.includes(val)) {
        onChange(selected.filter((s) => s !== val));
      } else {
        onChange([...selected, val]);
      }
    };

    const handleSelectAll = () => {
      onChange(items.map((it) => it.value));
    };

    const handleClearAll = () => {
      onChange([]);
    };

    const allSelected = items.length > 0 && selected.length === items.length;
    let summaryText = "";
    if (allSelected) {
      summaryText = `Tất cả (${items.length})`;
    } else if (selected.length === 0) {
      summaryText = "Chưa chọn mục nào";
    } else if (selected.length === 1) {
      const matched = items.find((it) => it.value === selected[0]);
      summaryText = matched ? matched.label : String(selected[0]);
      if (summaryText.length > 24) {
        summaryText = summaryText.slice(0, 22) + "...";
      }
    } else {
      summaryText = `${selected.length}/${items.length} đã chọn`;
    }

    return React.createElement(
      "div",
      { className: "relative inline-block text-left", ref: wrapRef },
      React.createElement(
        "button",
        {
          type: "button",
          onClick: () => {
            setOpen((o) => !o);
            setSearch("");
          },
          className:
            "flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs whitespace-nowrap",
        },
        React.createElement("span", { className: "font-semibold text-slate-600 dark:text-slate-300" }, label + ":"),
        React.createElement("span", { className: "font-medium text-slate-900 dark:text-slate-100 max-w-[210px] truncate", title: summaryText }, summaryText),
        React.createElement("span", { className: "text-slate-400 text-[8px]" }, "▼")
      ),
      open &&
        React.createElement(
          "div",
          {
            className:
              "absolute z-50 mt-1 right-0 sm:right-auto sm:left-0 min-w-[260px] max-w-[340px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xl p-2.5 text-xs animate-fadeIn",
          },
          // Search box if more than 4 items
          items.length > 4 &&
            React.createElement("div", { className: "mb-2" },
              React.createElement("input", {
                type: "text",
                placeholder: "Tìm kiếm...",
                value: search,
                onChange: (e) => setSearch(e.target.value),
                className:
                  "w-full px-2.5 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100",
              })
            ),
          React.createElement(
            "div",
            {
              className:
                "flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-200 dark:border-slate-800 text-[11px]",
            },
            React.createElement(
              "button",
              {
                type: "button",
                onClick: handleSelectAll,
                className: "text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer",
              },
              "Chọn tất cả (" + items.length + ")"
            ),
            React.createElement(
              "button",
              {
                type: "button",
                onClick: handleClearAll,
                className: "text-slate-500 dark:text-slate-400 hover:underline font-semibold cursor-pointer",
              },
              "Bỏ chọn hết"
            )
          ),
          React.createElement(
            "div",
            { className: "max-h-60 overflow-y-auto space-y-0.5 pr-1" },
            filteredItems.length === 0
              ? React.createElement("div", { className: "py-3 text-center text-slate-400 text-xs" }, "Không tìm thấy kết quả")
              : filteredItems.map((it) =>
                  React.createElement(
                    "label",
                    {
                      key: String(it.value),
                      className:
                        "flex items-center gap-2 px-2 py-1 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer select-none text-slate-800 dark:text-slate-200 transition",
                    },
                    React.createElement("input", {
                      type: "checkbox",
                      checked: selected.includes(it.value),
                      onChange: () => toggleOption(it.value),
                      className: "accent-blue-600 cursor-pointer rounded shrink-0",
                    }),
                    React.createElement(
                      "span",
                      { className: "truncate text-xs text-slate-800 dark:text-slate-200", title: it.label },
                      it.label
                    )
                  )
                )
          )
        )
    );
  }

  global.SAM_UTILS = {
    removeAccents,
    getVal,
    formatVND,
    getRiskEmoji,
    getActionLabelVN,
    classifySoftware,
    getInvoiceText,
    getActionRequired,
    MultiSelectFilter
  };

  global.SAM_COMPONENTS = global.SAM_COMPONENTS || {};
  global.SAM_COMPONENTS.MultiSelectFilter = MultiSelectFilter;

})(typeof window !== 'undefined' ? window : this);
