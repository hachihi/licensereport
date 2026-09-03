// js/reports/catalog-config.js - Tab 5: Catalog and Rules Configuration Component
(function (global) {
  'use strict';

  function CatalogConfigReport(props) {
    const {
      catalogRules,
      catalogSource,
      catalogInfo,
      onAddRule,
      onUpdateRule,
      onAssignFree,
      onDeleteRule,
      onResetCatalog,
      onUploadCatalogFile,
      onExportCatalog,
      onExportCatalogJSON,
      onDownloadTemplate,
      formatVND,
    } = props;

    const [searchTerm, setSearchTerm] = React.useState("");
    const [showAddModal, setShowAddModal] = React.useState(false);
    const [editingRuleIndex, setEditingRuleIndex] = React.useState(null);
    const [editingRuleData, setEditingRuleData] = React.useState(null);

    const [newRule, setNewRule] = React.useState({
      name: "",
      pattern: "",
      vendor: "",
      category: "Văn phòng",
      licenseType: "COMMERCIAL_PAID",
      risk: "HIGH",
      price: 0,
      foss: "",
      action: "",
      isTrap: false,
    });

    const fileInputRef = React.useRef(null);

    // Helpers to normalize rule properties
    const getRuleKeywords = (rule) => {
      if (Array.isArray(rule.keywords) && rule.keywords.length > 0) {
        return rule.keywords.join(", ");
      }
      return rule.pattern || (Array.isArray(rule.keywords) ? "" : rule.keywords) || "";
    };

    const getRulePrice = (rule) => {
      if (rule.estimatedPriceVND !== undefined) return Number(rule.estimatedPriceVND) || 0;
      return Number(rule.price) || 0;
    };

    const getRuleRisk = (rule) => {
      return rule.auditRisk || rule.risk || "HIGH";
    };

    const getRuleFoss = (rule) => {
      return rule.recommendedAlternative || rule.foss || "";
    };

    const getRuleAction = (rule) => {
      return rule.actionDetails || rule.action || "";
    };

    const filteredRules = (catalogRules || []).map((rule, originalIndex) => ({
      ...rule,
      originalIndex,
    })).filter((r) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      const kw = getRuleKeywords(r).toLowerCase();
      const name = (r.name || "").toLowerCase();
      const vendor = (r.vendor || "").toLowerCase();
      const foss = getRuleFoss(r).toLowerCase();
      return kw.includes(q) || name.includes(q) || vendor.includes(q) || foss.includes(q);
    });

    // Handle Open Edit Modal
    const handleStartEdit = (rule) => {
      setEditingRuleIndex(rule.originalIndex);
      setEditingRuleData({
        name: rule.name || "",
        pattern: getRuleKeywords(rule),
        vendor: rule.vendor || "",
        category: rule.category || "Văn phòng",
        licenseType: rule.licenseType || "COMMERCIAL_PAID",
        risk: getRuleRisk(rule),
        price: getRulePrice(rule),
        foss: getRuleFoss(rule),
        action: getRuleAction(rule),
        isTrap: Boolean(rule.isTrap || rule.licenseType === "FREE_PERSONAL_ONLY"),
      });
    };

    // Handle Save Edit
    const handleSaveEdit = (e) => {
      e.preventDefault();
      if (!editingRuleData.name || !editingRuleData.pattern) {
        alert("Vui lòng nhập tên phần mềm và từ khóa nhận diện!");
        return;
      }
      if (onUpdateRule && editingRuleIndex !== null) {
        const kwList = editingRuleData.pattern
          .split(/[,;\n]+/)
          .map((k) => k.trim().toLowerCase())
          .filter(Boolean);

        const priceVal = editingRuleData.licenseType === "FREE_OPEN_SOURCE" ? 0 : (Number(editingRuleData.price) || 0);

        onUpdateRule(editingRuleIndex, {
          name: editingRuleData.name.trim(),
          pattern: editingRuleData.pattern.trim(),
          keywords: kwList,
          vendor: editingRuleData.vendor.trim() || "Chưa rõ",
          category: editingRuleData.category || "Văn phòng",
          licenseType: editingRuleData.licenseType,
          auditRisk: editingRuleData.licenseType === "FREE_OPEN_SOURCE" ? "LOW" : editingRuleData.risk,
          risk: editingRuleData.licenseType === "FREE_OPEN_SOURCE" ? "LOW" : editingRuleData.risk,
          price: priceVal,
          estimatedPriceVND: priceVal,
          recommendedAlternative: editingRuleData.foss.trim(),
          foss: editingRuleData.foss.trim(),
          actionDetails: editingRuleData.action.trim(),
          action: editingRuleData.action.trim(),
          isTrap: editingRuleData.isTrap || editingRuleData.licenseType === "FREE_PERSONAL_ONLY",
          suggestedAction: editingRuleData.licenseType === "FREE_OPEN_SOURCE" ? "ALLOW_FREE" : (editingRuleData.licenseType === "FREE_PERSONAL_ONLY" ? "REPLACE_WITH_FOSS" : "VERIFY_INVOICE"),
        });
      }
      setEditingRuleIndex(null);
      setEditingRuleData(null);
    };

    // Handle Save New Rule
    const handleSaveNewRule = (e) => {
      e.preventDefault();
      if (!newRule.name || !newRule.pattern) {
        alert("Vui lòng nhập tên phần mềm và từ khóa nhận diện!");
        return;
      }
      const kwList = newRule.pattern
        .split(/[,;\n]+/)
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean);

      const priceVal = newRule.licenseType === "FREE_OPEN_SOURCE" ? 0 : (Number(newRule.price) || 0);

      onAddRule({
        name: newRule.name.trim(),
        pattern: newRule.pattern.trim(),
        keywords: kwList,
        vendor: newRule.vendor.trim() || "Chưa rõ",
        category: newRule.category || "Văn phòng",
        licenseType: newRule.licenseType,
        auditRisk: newRule.licenseType === "FREE_OPEN_SOURCE" ? "LOW" : newRule.risk,
        risk: newRule.licenseType === "FREE_OPEN_SOURCE" ? "LOW" : newRule.risk,
        price: priceVal,
        estimatedPriceVND: priceVal,
        recommendedAlternative: newRule.foss.trim(),
        foss: newRule.foss.trim(),
        actionDetails: newRule.action.trim(),
        action: newRule.action.trim(),
        isTrap: newRule.isTrap || newRule.licenseType === "FREE_PERSONAL_ONLY",
        suggestedAction: newRule.licenseType === "FREE_OPEN_SOURCE" ? "ALLOW_FREE" : (newRule.licenseType === "FREE_PERSONAL_ONLY" ? "REPLACE_WITH_FOSS" : "VERIFY_INVOICE"),
      });

      setNewRule({
        name: "",
        pattern: "",
        vendor: "",
        category: "Văn phòng",
        licenseType: "COMMERCIAL_PAID",
        risk: "HIGH",
        price: 0,
        foss: "",
        action: "",
        isTrap: false,
      });
      setShowAddModal(false);
    };

    const handleFileInput = (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        onUploadCatalogFile(file);
      }
      e.target.value = "";
    };

    return React.createElement(
      "div",
      { className: "space-y-4" },
      // Top Control Bar
      React.createElement(
        "div",
        {
          className:
            "bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-colors duration-200",
        },
        React.createElement(
          "div",
          null,
          React.createElement(
            "h3",
            {
              className:
                "text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2",
            },
            "⚙️ Quy Định Danh Mục & Bảng Giá Phần Mềm",
            React.createElement(
              "span",
              {
                className: `text-[10px] px-2 py-0.5 rounded font-bold ${
                  catalogSource === "CUSTOM_FILE" || catalogSource === "SHEET3_EXCEL"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    : catalogSource === "REMOTE_JSON"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                }`,
              },
              catalogSource === "CUSTOM_FILE"
                ? "Đã tùy biến trực tiếp"
                : catalogSource === "REMOTE_JSON"
                ? "Nguồn: software_catalog.json"
                : catalogSource === "SHEET3_EXCEL"
                ? "Lấy từ Sheet 3 file Excel"
                : "Danh mục chuẩn hệ thống"
            )
          ),
          React.createElement(
            "p",
            { className: "text-xs text-slate-500 dark:text-slate-400 mt-0.5" },
            catalogInfo && catalogInfo.name ? `${catalogInfo.name} (${catalogInfo.version || 'v2026.09'})` : "Hachihi SAM Standard v2026.09",
            " • Tổng số quy tắc: ",
            React.createElement("strong", { className: "text-slate-700 dark:text-slate-200" }, catalogRules.length),
            " (Bạn có thể bấm biểu tượng ✏️ để sửa tùy ý bất kỳ quy tắc nào)"
          )
        ),
        // Action buttons
        React.createElement(
          "div",
          { className: "flex flex-wrap items-center gap-2" },
          React.createElement(
            "button",
            {
              onClick: () => setShowAddModal(true),
              className:
                "px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1",
            },
            "+ Thêm Phần Mềm Mới"
          ),
          React.createElement(
            "button",
            {
              onClick: () => fileInputRef.current && fileInputRef.current.click(),
              className:
                "px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 border border-slate-300 dark:border-slate-700",
              title: "Nạp file danh mục từ máy (.xlsx, .json)",
            },
            "📂 Nạp Danh Mục Riêng"
          ),
          React.createElement("input", {
            type: "file",
            ref: fileInputRef,
            onChange: handleFileInput,
            accept: ".xlsx, .xls, .json",
            className: "hidden",
          }),
          // Download JSON button
          React.createElement(
            "button",
            {
              onClick: onExportCatalogJSON || onExportCatalog,
              className:
                "px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 border border-emerald-200 dark:border-emerald-800",
              title: "Tải file software_catalog.json để cập nhật vào thư mục data của hệ thống",
            },
            "📥 Tải File .JSON"
          ),
          // Download Excel button
          React.createElement(
            "button",
            {
              onClick: onExportCatalog,
              className:
                "px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 border border-slate-300 dark:border-slate-700",
              title: "Tải file software_catalog.xlsx",
            },
            "📊 Xuất Excel"
          ),
          React.createElement(
            "button",
            {
              onClick: onResetCatalog,
              className:
                "px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs font-semibold transition cursor-pointer border border-rose-200 dark:border-rose-900",
              title: "Khôi phục danh mục gốc 35 quy tắc",
            },
            "🔄 Khôi Phục Gốc"
          )
        )
      ),

      // Search and Filter Bar
      React.createElement(
        "div",
        { className: "flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3" },
        React.createElement("input", {
          type: "text",
          placeholder: "🔍 Tìm kiếm theo tên phần mềm, từ khóa quét, hãng sản xuất, đề xuất FOSS...",
          value: searchTerm,
          onChange: (e) => setSearchTerm(e.target.value),
          className:
            "w-full sm:w-96 px-3.5 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs",
        }),
        React.createElement(
          "div",
          { className: "flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400" },
          React.createElement(
            "span",
            null,
            "Đang hiển thị: ",
            React.createElement("strong", { className: "text-slate-700 dark:text-slate-200" }, filteredRules.length),
            "/",
            catalogRules.length,
            " quy tắc"
          )
        )
      ),

      // Catalog Table matching user layout
      React.createElement(
        "div",
        {
          className:
            "bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-200",
        },
        React.createElement(
          "div",
          { className: "overflow-x-auto max-h-[640px] overflow-y-auto" },
          React.createElement(
            "table",
            { className: "w-full text-left text-xs border-collapse" },
            React.createElement(
              "thead",
              {
                className:
                  "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700",
              },
              React.createElement(
                "tr",
                null,
                React.createElement("th", { className: "p-3 w-10 text-center" }, "#"),
                React.createElement("th", { className: "p-3 min-w-[200px]" }, "TÊN PHẦN MỀM & TỪ KHÓA"),
                React.createElement("th", { className: "p-3 min-w-[130px]" }, "HÃNG SX"),
                React.createElement("th", { className: "p-3 text-center min-w-[140px]" }, "PHÂN LOẠI BẢN QUYỀN"),
                React.createElement("th", { className: "p-3 text-center min-w-[100px]" }, "MỨC RỦI RO"),
                React.createElement("th", { className: "p-3 text-right min-w-[120px]" }, "ĐƠN GIÁ DỰ TOÁN"),
                React.createElement("th", { className: "p-3 min-w-[240px]" }, "ĐỀ XUẤT FOSS / KHUYẾN NGHỊ"),
                React.createElement("th", { className: "p-3 text-center min-w-[130px]" }, "THAO TÁC")
              )
            ),
            React.createElement(
              "tbody",
              { className: "divide-y divide-slate-100 dark:divide-slate-800" },
              filteredRules.map((rule, idx) => {
                const keywordsText = getRuleKeywords(rule);
                const price = getRulePrice(rule);
                const risk = getRuleRisk(rule);
                const foss = getRuleFoss(rule);
                const action = getRuleAction(rule);
                const isFree = rule.licenseType === "FREE_OPEN_SOURCE";

                return React.createElement(
                  "tr",
                  {
                    key: rule.id || rule.originalIndex,
                    className: "hover:bg-slate-50 dark:hover:bg-slate-800/60 transition",
                  },
                  // STT
                  React.createElement(
                    "td",
                    { className: "p-3 text-center text-slate-400 dark:text-slate-500 font-medium" },
                    idx + 1
                  ),
                  // TÊN PHẦN MỀM & TỪ KHÓA
                  React.createElement(
                    "td",
                    { className: "p-3 space-y-1" },
                    React.createElement(
                      "div",
                      { className: "font-bold text-slate-900 dark:text-slate-100 text-[13px]" },
                      rule.name
                    ),
                    React.createElement(
                      "div",
                      { className: "text-[11px] text-slate-500 dark:text-slate-400 font-mono" },
                      React.createElement("span", { className: "text-slate-400" }, "Từ khóa: "),
                      keywordsText || "—"
                    )
                  ),
                  // HÃNG SX
                  React.createElement(
                    "td",
                    { className: "p-3 text-slate-600 dark:text-slate-300 font-medium" },
                    rule.vendor || "Chưa rõ"
                  ),
                  // PHÂN LOẠI BẢN QUYỀN
                  React.createElement(
                    "td",
                    { className: "p-3 text-center" },
                    React.createElement(
                      "span",
                      {
                        className: `inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          rule.licenseType === "FREE_OPEN_SOURCE"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : rule.licenseType === "FREE_PERSONAL_ONLY"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        }`,
                      },
                      rule.licenseType === "FREE_OPEN_SOURCE"
                        ? "Miễn Phí FOSS"
                        : rule.licenseType === "FREE_PERSONAL_ONLY"
                        ? "Bẫy Bản Quyền / Cá Nhân"
                        : "Thương Mại Có Phí"
                    )
                  ),
                  // MỨC RỦI RO
                  React.createElement(
                    "td",
                    { className: "p-3 text-center" },
                    React.createElement(
                      "span",
                      {
                        className: `inline-block px-2.5 py-0.5 rounded text-[10px] font-black ${
                          risk === "CRITICAL"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                            : risk === "HIGH"
                            ? "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border border-orange-300 dark:border-orange-800"
                            : risk === "MEDIUM"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                        }`,
                      },
                      risk
                    )
                  ),
                  // ĐƠN GIÁ DỰ TOÁN
                  React.createElement(
                    "td",
                    { className: "p-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap text-[12px]" },
                    formatVND(price)
                  ),
                  // ĐỀ XUẤT FOSS / KHUYẾN NGHỊ
                  React.createElement(
                    "td",
                    { className: "p-3 space-y-1" },
                    action &&
                      React.createElement(
                        "div",
                        { className: "text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed line-clamp-2", title: action },
                        action
                      ),
                    foss &&
                      React.createElement(
                        "div",
                        { className: "text-emerald-700 dark:text-emerald-400 font-semibold text-[11px] flex items-center gap-1" },
                        React.createElement("span", null, "➡️"),
                        React.createElement("span", null, foss)
                      )
                  ),
                  // THAO TÁC
                  React.createElement(
                    "td",
                    { className: "p-3" },
                    React.createElement(
                      "div",
                      { className: "flex items-center justify-center gap-1.5" },
                      // Quick action: Gán Free (0đ)
                      !isFree &&
                        React.createElement(
                          "button",
                          {
                            onClick: () => onAssignFree && onAssignFree(rule.originalIndex),
                            className:
                              "border border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 rounded px-2 py-1 text-[10px] font-bold transition cursor-pointer whitespace-nowrap",
                            title: "Gán phần mềm này là FOSS miễn phí (0đ, rủi ro thấp)",
                          },
                          "Gán Free (0đ)"
                        ),
                      // Sửa (✏️)
                      React.createElement(
                        "button",
                        {
                          onClick: () => handleStartEdit(rule),
                          className:
                            "p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/60 transition cursor-pointer",
                          title: "Chỉnh sửa quy tắc này tùy ý (Tên, từ khóa, rủi ro, đơn giá, đề xuất FOSS...)",
                        },
                        "✏️"
                      ),
                      // Xóa (🗑️)
                      React.createElement(
                        "button",
                        {
                          onClick: () => {
                            if (confirm(`Bạn có chắc chắn muốn xóa quy tắc "${rule.name}" khỏi danh mục?`)) {
                              onDeleteRule(rule.originalIndex);
                            }
                          },
                          className:
                            "p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition cursor-pointer",
                          title: "Xóa quy tắc này",
                        },
                        "🗑️"
                      )
                    )
                  )
                );
              }),
              filteredRules.length === 0 &&
                React.createElement(
                  "tr",
                  null,
                  React.createElement(
                    "td",
                    { colSpan: 8, className: "p-8 text-center text-slate-500 dark:text-slate-400" },
                    "Không tìm thấy quy tắc nào khớp với từ khóa tìm kiếm."
                  )
                )
            )
          )
        )
      ),

      // ==========================================
      // MODAL 1: CHỈNH SỬA QUY TẮC (EDIT RULE MODAL)
      // Cho phép sửa TÙY Ý tất cả các trường
      // ==========================================
      editingRuleData &&
        React.createElement(
          "div",
          {
            className:
              "fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn",
          },
          React.createElement(
            "div",
            {
              className:
                "bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[92vh] overflow-y-auto",
            },
            React.createElement(
              "div",
              { className: "flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3" },
              React.createElement(
                "div",
                null,
                React.createElement(
                  "h3",
                  { className: "font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2" },
                  "✏️ Chỉnh Sửa Quy Tắc Bản Quyền",
                  React.createElement(
                    "span",
                    { className: "text-xs font-normal text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950" },
                    editingRuleData.name
                  )
                ),
                React.createElement(
                  "p",
                  { className: "text-xs text-slate-500 dark:text-slate-400 mt-0.5" },
                  "Bạn có thể thay đổi bất kỳ trường nào. Sau khi lưu, toàn bộ báo cáo sẽ được tính toán lại ngay."
                )
              ),
              React.createElement(
                "button",
                {
                  onClick: () => setEditingRuleData(null),
                  className: "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg cursor-pointer",
                },
                "✕"
              )
            ),
            React.createElement(
              "form",
              { onSubmit: handleSaveEdit, className: "space-y-3.5 text-xs" },
              // Tên phần mềm
              React.createElement(
                "div",
                null,
                React.createElement("label", { className: "font-bold text-slate-700 dark:text-slate-300 block mb-1" }, "Tên phần mềm chuẩn hóa *"),
                React.createElement("input", {
                  type: "text",
                  required: true,
                  value: editingRuleData.name,
                  onChange: (e) => setEditingRuleData({ ...editingRuleData, name: e.target.value }),
                  className:
                    "w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium",
                })
              ),
              // Từ khóa nhận diện
              React.createElement(
                "div",
                null,
                React.createElement("label", { className: "font-bold text-slate-700 dark:text-slate-300 block mb-1" }, "Từ khóa nhận diện (Keywords / Pattern) *"),
                React.createElement("input", {
                  type: "text",
                  required: true,
                  placeholder: "Ví dụ: winrar, rarlab, win.rar (cách nhau bởi dấu phẩy)",
                  value: editingRuleData.pattern,
                  onChange: (e) => setEditingRuleData({ ...editingRuleData, pattern: e.target.value }),
                  className:
                    "w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono",
                }),
                React.createElement("p", { className: "text-[11px] text-slate-400 mt-1" }, "Hệ thống sẽ quét chuỗi này trong tên phần mềm và nhà phát triển để tự động khớp.")
              ),
              // Hãng SX & Nhóm danh mục
              React.createElement(
                "div",
                { className: "grid grid-cols-2 gap-3" },
                React.createElement(
                  "div",
                  null,
                  React.createElement("label", { className: "font-bold text-slate-700 dark:text-slate-300 block mb-1" }, "Hãng sản xuất"),
                  React.createElement("input", {
                    type: "text",
                    value: editingRuleData.vendor,
                    onChange: (e) => setEditingRuleData({ ...editingRuleData, vendor: e.target.value }),
                    className:
                      "w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs",
                  })
                ),
                React.createElement(
                  "div",
                  null,
                  React.createElement("label", { className: "font-bold text-slate-700 dark:text-slate-300 block mb-1" }, "Nhóm danh mục"),
                  React.createElement("input", {
                    type: "text",
                    value: editingRuleData.category,
                    onChange: (e) => setEditingRuleData({ ...editingRuleData, category: e.target.value }),
                    className:
                      "w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs",
                  })
                )
              ),
              // Phân loại bản quyền & Mức rủi ro
              React.createElement(
                "div",
                { className: "grid grid-cols-2 gap-3" },
                React.createElement(
                  "div",
                  null,
                  React.createElement("label", { className: "font-bold text-slate-700 dark:text-slate-300 block mb-1" }, "Phân loại bản quyền"),
                  React.createElement(
                    "select",
                    {
                      value: editingRuleData.licenseType,
                      onChange: (e) => {
                        const nextType = e.target.value;
                        const updates = { licenseType: nextType };
                        if (nextType === "FREE_OPEN_SOURCE") {
                          updates.price = 0;
                          updates.risk = "LOW";
                          updates.isTrap = false;
                        } else if (nextType === "FREE_PERSONAL_ONLY") {
                          updates.isTrap = true;
                        }
                        setEditingRuleData({ ...editingRuleData, ...updates });
                      },
                      className:
                        "w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold",
                    },
                    React.createElement("option", { value: "COMMERCIAL_PAID" }, "Thương mại có phí (Paid)"),
                    React.createElement("option", { value: "FREE_OPEN_SOURCE" }, "Miễn phí FOSS cho Doanh Nghiệp (0đ)"),
                    React.createElement("option", { value: "FREE_PERSONAL_ONLY" }, "Bẫy Bản Quyền / Chỉ Cho Cá Nhân")
                  )
                ),
                React.createElement(
                  "div",
                  null,
                  React.createElement("label", { className: "font-bold text-slate-700 dark:text-slate-300 block mb-1" }, "Mức độ rủi ro SAM"),
                  React.createElement(
                    "select",
                    {
                      value: editingRuleData.risk,
                      onChange: (e) => setEditingRuleData({ ...editingRuleData, risk: e.target.value }),
                      disabled: editingRuleData.licenseType === "FREE_OPEN_SOURCE",
                      className:
                        "w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold disabled:opacity-60",
                    },
                    React.createElement("option", { value: "CRITICAL" }, "CRITICAL (Nghiêm trọng / Crack)"),
                    React.createElement("option", { value: "HIGH" }, "HIGH (Rủi ro cao)"),
                    React.createElement("option", { value: "MEDIUM" }, "MEDIUM (Rủi ro trung bình)"),
                    React.createElement("option", { value: "LOW" }, "LOW (Thấp / An toàn)")
                  )
                )
              ),
              // Đơn giá dự toán & Đề xuất FOSS
              React.createElement(
                "div",
                { className: "grid grid-cols-2 gap-3" },
                React.createElement(
                  "div",
                  null,
                  React.createElement("label", { className: "font-bold text-slate-700 dark:text-slate-300 block mb-1" }, "Đơn giá dự toán (VNĐ)"),
                  React.createElement("input", {
                    type: "number",
                    value: editingRuleData.price,
                    onChange: (e) => setEditingRuleData({ ...editingRuleData, price: e.target.value }),
                    disabled: editingRuleData.licenseType === "FREE_OPEN_SOURCE",
                    className:
                      "w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono disabled:opacity-60",
                  })
                ),
                React.createElement(
                  "div",
                  null,
                  React.createElement("label", { className: "font-bold text-slate-700 dark:text-slate-300 block mb-1" }, "Phần mềm FOSS thay thế"),
                  React.createElement("input", {
                    type: "text",
                    placeholder: "Ví dụ: 7-Zip, LibreOffice, RustDesk...",
                    value: editingRuleData.foss,
                    onChange: (e) => setEditingRuleData({ ...editingRuleData, foss: e.target.value }),
                    className:
                      "w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs",
                  })
                )
              ),
              // Hướng dẫn & Khuyến nghị
              React.createElement(
                "div",
                null,
                React.createElement("label", { className: "font-bold text-slate-700 dark:text-slate-300 block mb-1" }, "Hướng dẫn & Khuyến nghị pháp lý"),
                React.createElement("textarea", {
                  rows: 2,
                  value: editingRuleData.action,
                  onChange: (e) => setEditingRuleData({ ...editingRuleData, action: e.target.value }),
                  className:
                    "w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs",
                })
              ),
              // Bẫy bản quyền checkbox
              React.createElement(
                "div",
                { className: "flex items-center gap-2 pt-1" },
                React.createElement("input", {
                  type: "checkbox",
                  id: "edit_is_trap",
                  checked: editingRuleData.isTrap,
                  onChange: (e) => setEditingRuleData({ ...editingRuleData, isTrap: e.target.checked }),
                  className: "rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4",
                }),
                React.createElement(
                  "label",
                  { htmlFor: "edit_is_trap", className: "text-slate-700 dark:text-slate-300 cursor-pointer font-medium" },
                  "Đánh dấu là Bẫy Bản Quyền (Cấm nhân viên tự ý cài đặt trong mạng công ty)"
                )
              ),
              // Buttons
              React.createElement(
                "div",
                { className: "flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800" },
                React.createElement(
                  "button",
                  {
                    type: "button",
                    onClick: () => setEditingRuleData(null),
                    className: "px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-semibold cursor-pointer",
                  },
                  "Hủy Bỏ"
                ),
                React.createElement(
                  "button",
                  {
                    type: "submit",
                    className: "px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center gap-1.5",
                  },
                  "💾 Lưu Thay Đổi"
                )
              )
            )
          )
        ),

      // ==========================================
      // MODAL 2: THÊM QUY TẮC MỚI (ADD RULE MODAL)
      // ==========================================
      showAddModal &&
        React.createElement(
          "div",
          {
            className:
              "fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn",
          },
          React.createElement(
            "div",
            {
              className:
                "bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[92vh] overflow-y-auto",
            },
            React.createElement(
              "div",
              { className: "flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3" },
              React.createElement(
                "h3",
                { className: "font-bold text-base text-slate-900 dark:text-slate-100" },
                "+ Thêm Phần Mềm Vào Danh Mục Nhận Diện"
              ),
              React.createElement(
                "button",
                {
                  onClick: () => setShowAddModal(false),
                  className: "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg cursor-pointer",
                },
                "✕"
              )
            ),
            React.createElement(
              "form",
              { onSubmit: handleSaveNewRule, className: "space-y-3.5 text-xs" },
              React.createElement(
                "div",
                null,
                React.createElement("label", { className: "font-bold text-slate-700 dark:text-slate-300 block mb-1" }, "Tên phần mềm chuẩn hóa *"),
                React.createElement("input", {
                  type: "text",
                  required: true,
                  placeholder: "Ví dụ: Autodesk AutoCAD, Adobe Photoshop...",
                  value: newRule.name,
                  onChange: (e) => setNewRule({ ...newRule, name: e.target.value }),
                  className:
                    "w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                })
              ),
              React.createElement(
                "div",
                null,
                React.createElement("label", { className: "font-bold text-slate-700 dark:text-slate-300 block mb-1" }, "Từ khóa nhận diện (Keywords / Pattern) *"),
                React.createElement("input", {
                  type: "text",
                  required: true,
                  placeholder: "Ví dụ: autocad, autodesk, acad (cách nhau bởi dấu phẩy)",
                  value: newRule.pattern,
                  onChange: (e) => setNewRule({ ...newRule, pattern: e.target.value }),
                  className:
                    "w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono",
                })
              ),
              React.createElement(
                "div",
                { className: "grid grid-cols-2 gap-3" },
                React.createElement(
                  "div",
                  null,
                  React.createElement("label", { className: "font-bold text-slate-700 dark:text-slate-300 block mb-1" }, "Hãng sản xuất"),
                  React.createElement("input", {
                    type: "text",
                    placeholder: "Ví dụ: Autodesk, Adobe...",
                    value: newRule.vendor,
                    onChange: (e) => setNewRule({ ...newRule, vendor: e.target.value }),
                    className:
                      "w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                  })
                ),
                React.createElement(
                  "div",
                  null,
                  React.createElement("label", { className: "font-bold text-slate-700 dark:text-slate-300 block mb-1" }, "Nhóm danh mục"),
                  React.createElement("input", {
                    type: "text",
                    value: newRule.category,
                    onChange: (e) => setNewRule({ ...newRule, category: e.target.value }),
                    className:
                      "w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                  })
                )
              ),
              React.createElement(
                "div",
                { className: "grid grid-cols-2 gap-3" },
                React.createElement(
                  "div",
                  null,
                  React.createElement("label", { className: "font-bold text-slate-700 dark:text-slate-300 block mb-1" }, "Phân loại bản quyền"),
                  React.createElement(
                    "select",
                    {
                      value: newRule.licenseType,
                      onChange: (e) => {
                        const nextType = e.target.value;
                        const updates = { licenseType: nextType };
                        if (nextType === "FREE_OPEN_SOURCE") {
                          updates.price = 0;
                          updates.risk = "LOW";
                          updates.isTrap = false;
                        } else if (nextType === "FREE_PERSONAL_ONLY") {
                          updates.isTrap = true;
                        }
                        setNewRule({ ...newRule, ...updates });
                      },
                      className:
                        "w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold",
                    },
                    React.createElement("option", { value: "COMMERCIAL_PAID" }, "Thương mại có phí (Paid)"),
                    React.createElement("option", { value: "FREE_OPEN_SOURCE" }, "Miễn phí FOSS cho Doanh Nghiệp (0đ)"),
                    React.createElement("option", { value: "FREE_PERSONAL_ONLY" }, "Bẫy Bản Quyền / Chỉ Cho Cá Nhân")
                  )
                ),
                React.createElement(
                  "div",
                  null,
                  React.createElement("label", { className: "font-bold text-slate-700 dark:text-slate-300 block mb-1" }, "Mức độ rủi ro SAM"),
                  React.createElement(
                    "select",
                    {
                      value: newRule.risk,
                      onChange: (e) => setNewRule({ ...newRule, risk: e.target.value }),
                      disabled: newRule.licenseType === "FREE_OPEN_SOURCE",
                      className:
                        "w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold disabled:opacity-60",
                    },
                    React.createElement("option", { value: "CRITICAL" }, "CRITICAL (Nghiêm trọng)"),
                    React.createElement("option", { value: "HIGH" }, "HIGH (Rủi ro cao)"),
                    React.createElement("option", { value: "MEDIUM" }, "MEDIUM (Rủi ro trung bình)"),
                    React.createElement("option", { value: "LOW" }, "LOW (Thấp / An toàn)")
                  )
                )
              ),
              React.createElement(
                "div",
                { className: "grid grid-cols-2 gap-3" },
                React.createElement(
                  "div",
                  null,
                  React.createElement("label", { className: "font-bold text-slate-700 dark:text-slate-300 block mb-1" }, "Đơn giá dự toán (VNĐ)"),
                  React.createElement("input", {
                    type: "number",
                    value: newRule.price,
                    onChange: (e) => setNewRule({ ...newRule, price: e.target.value }),
                    disabled: newRule.licenseType === "FREE_OPEN_SOURCE",
                    className:
                      "w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono disabled:opacity-60",
                  })
                ),
                React.createElement(
                  "div",
                  null,
                  React.createElement("label", { className: "font-bold text-slate-700 dark:text-slate-300 block mb-1" }, "Phần mềm FOSS đề xuất"),
                  React.createElement("input", {
                    type: "text",
                    placeholder: "Ví dụ: 7-Zip, LibreOffice, GIMP...",
                    value: newRule.foss,
                    onChange: (e) => setNewRule({ ...newRule, foss: e.target.value }),
                    className:
                      "w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                  })
                )
              ),
              React.createElement(
                "div",
                null,
                React.createElement("label", { className: "font-bold text-slate-700 dark:text-slate-300 block mb-1" }, "Hướng dẫn xử lý & Khuyến nghị"),
                React.createElement("textarea", {
                  rows: 2,
                  placeholder: "Ví dụ: Cần xác minh hóa đơn VAT. Nếu không có hóa đơn thì gỡ bỏ và cài FOSS.",
                  value: newRule.action,
                  onChange: (e) => setNewRule({ ...newRule, action: e.target.value }),
                  className:
                    "w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                })
              ),
              React.createElement(
                "div",
                { className: "flex items-center gap-2 pt-1" },
                React.createElement("input", {
                  type: "checkbox",
                  id: "add_is_trap",
                  checked: newRule.isTrap,
                  onChange: (e) => setNewRule({ ...newRule, isTrap: e.target.checked }),
                  className: "rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4",
                }),
                React.createElement(
                  "label",
                  { htmlFor: "add_is_trap", className: "text-slate-700 dark:text-slate-300 cursor-pointer font-medium" },
                  "Đánh dấu là Bẫy Bản Quyền"
                )
              ),
              React.createElement(
                "div",
                { className: "flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800" },
                React.createElement(
                  "button",
                  {
                    type: "button",
                    onClick: () => setShowAddModal(false),
                    className: "px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-semibold cursor-pointer",
                  },
                  "Hủy Bỏ"
                ),
                React.createElement(
                  "button",
                  {
                    type: "submit",
                    className: "px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-xs cursor-pointer",
                  },
                  "+ Thêm Vào Danh Mục"
                )
              )
            )
          )
        )
    );
  }

  global.SAM_REPORTS = global.SAM_REPORTS || {};
  global.SAM_REPORTS.CatalogConfigReport = CatalogConfigReport;

})(typeof window !== 'undefined' ? window : this);
