// js/app.js - Main Application Controller (SAM Orchestrator)
(function (global) {
  'use strict';

  const { useState, useEffect, useMemo, useRef } = React;

  // Global module references
  const CONSTANTS = global.SAM_CONSTANTS || {};
  const UTILS = global.SAM_UTILS || {};
  const AUDIT_ENGINE = global.SAM_AUDIT_ENGINE || {};
  const CATALOG_LOADER = global.SAM_CATALOG_LOADER || {};
  const DATA_LOADER = global.SAM_DATA_LOADER || {};
  const EXPORTER = global.SAM_EXPORTER || {};
  const PRINT = global.SAM_PRINT || {};
  const REPORTS = global.SAM_REPORTS || {};

  function LicenseAuditApp() {
    // 1. Core State
    const [computers, setComputers] = useState([]);
    const [rawInventory, setRawInventory] = useState([]);
    const [installations, setInstallations] = useState([]);
    const [catalogRules, setCatalogRules] = useState(CONSTANTS.DEFAULT_SOFTWARE_RULES || []);
    const [customCatalog, setCustomCatalog] = useState(null);
    const [catalogSource, setCatalogSource] = useState('DEFAULT_EMBEDDED');
    const [catalogInfo, setCatalogInfo] = useState({ name: 'Hachihi SAM Standard', version: '2026.09' });
    const [fallbackBanner, setFallbackBanner] = useState(false);

    // UI state
    const [activeTab, setActiveTab] = useState('OVERVIEW');
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadStatus, setUploadStatus] = useState({ message: '', type: 'info' });
    const [isDark, setIsDark] = useState(false);

    // Print & Executive Report metadata
    const [showPrintReportModal, setShowPrintReportModal] = useState(false);
    const [printReportType, setPrintReportType] = useState('EXECUTIVE_PLAN');
    const [clientName, setClientName] = useState('Doanh Nghiệp Tiêu Biểu');
    const [auditDate, setAuditDate] = useState(new Date().toISOString().slice(0, 10));
    const [auditorUnit, setAuditorUnit] = useState('Hachihi SAM Auditor');

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRisk, setFilterRisk] = useState('ALL');
    const [detailFilter, setDetailFilter] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState(CONSTANTS.CATEGORY_FILTER_OPTIONS || []);
    const [riskFilterPlan, setRiskFilterPlan] = useState(CONSTANTS.RISK_FILTER_OPTIONS || []);

    const fileInputRef = useRef(null);
    const catalogInputRef = useRef(null);

    // Initial Catalog Boot (Section 27 & 28)
    useEffect(() => {
      // 1. Check Theme preference
      const savedTheme = localStorage.getItem('hachihi_sam_theme');
      if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setIsDark(true);
        document.documentElement.classList.add('dark');
      } else {
        setIsDark(false);
        document.documentElement.classList.remove('dark');
      }

      // 2. Initialize with default sample data so application is immediately functional
      const defaultComps = CONSTANTS.DEFAULT_SAMPLE_COMPUTERS || [];
      const defaultInsts = CONSTANTS.DEFAULT_SAMPLE_INSTALLATIONS || [];
      const initialRules = CONSTANTS.DEFAULT_SOFTWARE_RULES || [];

      // Process default installations with audit engine
      const processed = AUDIT_ENGINE.processInstallations(defaultInsts, initialRules);
      setComputers(defaultComps);
      setRawInventory(defaultInsts);
      setInstallations(processed);
      setCatalogRules(initialRules);

      // 3. Try to fetch external catalog (Auto-detects ./data/software_catalog.json or ./data/software_catalog.xlsx)
      CATALOG_LOADER.loadCatalogFromURL()
        .then((result) => {
          if (result && result.rules && result.rules.length > 0) {
            setCatalogRules(result.rules);
            setCatalogSource(result.format === 'JSON' ? 'REMOTE_JSON' : 'REMOTE_EXCEL');
            if (result.info) setCatalogInfo(result.info);
            // Re-audit default data with fetched catalog
            setInstallations((prev) => AUDIT_ENGINE.processInstallations(defaultInsts, result.rules));
          }
        })
        .catch((err) => {
          console.warn("Could not fetch remote catalog (json/xlsx), using embedded fallback catalog.", err);
          setFallbackBanner(true);
          setCatalogSource('DEFAULT_EMBEDDED');
        });
    }, []);

    // Toggle Dark / Light Theme
    const toggleTheme = () => {
      const nextTheme = !isDark;
      setIsDark(nextTheme);
      if (nextTheme) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('hachihi_sam_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('hachihi_sam_theme', 'light');
      }
    };

    // Calculate dynamic metrics & breakdown via Audit Engine
    const metrics = useMemo(() => {
      return AUDIT_ENGINE.calculateMetrics(computers, installations);
    }, [computers, installations]);

    const kpiBreakdown = useMemo(() => {
      return AUDIT_ENGINE.calculateKpiBreakdown(installations, metrics);
    }, [installations, metrics]);

    // Group software for Matrix
    const softwareGroups = useMemo(() => {
      return AUDIT_ENGINE.groupSoftware(installations);
    }, [installations]);

    // Executive Plan Rows
    const executivePlanRows = useMemo(() => {
      return AUDIT_ENGINE.generateExecutivePlanRows(softwareGroups);
    }, [softwareGroups]);

    const totalBudgetRequired = useMemo(() => {
      return executivePlanRows.reduce((acc, curr) => acc + curr.totalEstimated, 0);
    }, [executivePlanRows]);

    // Filtered executive plan rows based on risk filter in modal
    const filteredExecutivePlanRows = useMemo(() => {
      return executivePlanRows.filter((r) => riskFilterPlan.includes(r.riskCategory));
    }, [executivePlanRows, riskFilterPlan]);

    const filteredTotalBudgetRequired = useMemo(() => {
      return filteredExecutivePlanRows.reduce((acc, curr) => acc + curr.totalEstimated, 0);
    }, [filteredExecutivePlanRows]);

    // Machine Overview Rows
    const machineOverviewRows = useMemo(() => {
      if (typeof AUDIT_ENGINE.generateMachineOverviewRows === 'function') {
        return AUDIT_ENGINE.generateMachineOverviewRows(computers, installations);
      }
      return [];
    }, [computers, installations]);

    // Detail filtered installs
    const totalViolations = useMemo(() => {
      return installations.filter((i) => {
        return (
          (i.invoiceStatus === 'MISSING_INVOICE' && i.licenseType !== 'FREE_OPEN_SOURCE') ||
          i.licenseType === 'FREE_PERSONAL_ONLY' ||
          i.isTrap ||
          i.auditRisk === 'CRITICAL' ||
          i.auditRisk === 'HIGH'
        );
      }).length;
    }, [installations]);

    const detailFilteredInstalls = useMemo(() => {
      return installations.filter((inst) => {
        if (detailFilter === 'RISKY_ONLY') {
          const isRisky =
            (inst.invoiceStatus === 'MISSING_INVOICE' && inst.licenseType !== 'FREE_OPEN_SOURCE') ||
            inst.licenseType === 'FREE_PERSONAL_ONLY' ||
            inst.isTrap ||
            inst.auditRisk === 'CRITICAL' ||
            inst.auditRisk === 'HIGH';
          if (!isRisky) return false;
        }

        if (categoryFilter.length < (CONSTANTS.CATEGORY_FILTER_OPTIONS || []).length) {
          const pmClass = UTILS.classifySoftware ? UTILS.classifySoftware(inst) : 'Thương mại';
          if (!categoryFilter.includes(pmClass)) return false;
        }
        return true;
      });
    }, [installations, detailFilter, categoryFilter]);

    // Update single installation invoice status (Section 26 & 32 Test 6)
    const updateInvoiceStatus = (installId, newStatus) => {
      setInstallations((prev) =>
        prev.map((inst) => {
          if (inst.id === installId) {
            const isFoss = inst.licenseType === 'FREE_OPEN_SOURCE' || newStatus === 'NOT_APPLICABLE';
            return {
              ...inst,
              invoiceStatus: newStatus,
              isCompliant: isFoss || newStatus === 'HAS_INVOICE',
              auditRisk: isFoss
                ? 'LOW'
                : newStatus === 'HAS_INVOICE'
                ? 'LOW'
                : (inst.catalogRule && inst.catalogRule.risk) || 'HIGH',
            };
          }
          return inst;
        })
      );
    };

    // Inventory File Upload Handler (Excel with 2 or 3 sheets or CSV)
    const handleInventoryUpload = async (file) => {
      if (!file) return;
      setIsProcessing(true);
      setUploadStatus({ message: `Đang xử lý tập tin ${file.name}...`, type: 'info' });

      try {
        const result = await DATA_LOADER.loadInventoryFile(file, catalogRules);

        if (result.computers && result.computers.length > 0) {
          setComputers(result.computers);
        }
        if (result.installations && result.installations.length > 0) {
          setRawInventory(result.installations);
        }

        // If Excel had Sheet 3 with custom catalog rules, prioritize it!
        let currentRules = catalogRules;
        if (result.sheet3Rules && result.sheet3Rules.length > 0) {
          currentRules = result.sheet3Rules;
          setCatalogRules(currentRules);
          setCatalogSource('SHEET3_EXCEL');
          setUploadStatus({
            message: `Tải thành công! Đã nạp ${result.computers.length} máy, ${result.installations.length} phần mềm và cập nhật danh mục từ Sheet 3.`,
            type: 'success',
          });
        } else {
          setUploadStatus({
            message: `Tải thành công ${result.computers.length} máy tính và ${result.installations.length} lượt cài đặt phần mềm.`,
            type: 'success',
          });
        }

        // Run audit matching engine
        const processed = AUDIT_ENGINE.processInstallations(result.installations, currentRules);
        setInstallations(processed);

        // Auto extract client name from filename if possible
        const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/kiem_?ke|inventory|sam|software/gi, '').trim();
        if (baseName.length > 2) {
          setClientName(baseName);
        }
      } catch (err) {
        console.error("Inventory upload error:", err);
        setUploadStatus({
          message: `Lỗi đọc file: ${err.message || 'Định dạng không hợp lệ'}. Vui lòng kiểm tra lại cấu trúc file.`,
          type: 'error',
        });
      } finally {
        setIsProcessing(false);
      }
    };

    // Custom Catalog File Upload Handler (.xlsx)
    const handleCatalogUpload = async (file) => {
      if (!file) return;
      setIsProcessing(true);
      setUploadStatus({ message: `Đang nạp danh mục riêng từ ${file.name}...`, type: 'info' });

      try {
        const result = await CATALOG_LOADER.loadCatalogFromFile(file);
        if (result && result.rules && result.rules.length > 0) {
          setCatalogRules(result.rules);
          setCustomCatalog(result.rules);
          setCatalogSource('CUSTOM_FILE');
          if (result.info) setCatalogInfo(result.info);

          // Re-audit current inventory with new rules immediately
          if (rawInventory.length > 0) {
            const reaudited = AUDIT_ENGINE.processInstallations(rawInventory, result.rules);
            setInstallations(reaudited);
          }

          setUploadStatus({
            message: `Đã nạp thành công danh mục riêng với ${result.rules.length} quy tắc nhận diện.`,
            type: 'success',
          });
        } else {
          throw new Error("Không tìm thấy quy tắc hợp lệ trong file danh mục.");
        }
      } catch (err) {
        console.error("Catalog upload error:", err);
        setUploadStatus({
          message: `Lỗi nạp danh mục: ${err.message || 'File không đúng định dạng mẫu danh mục'}.`,
          type: 'error',
        });
      } finally {
        setIsProcessing(false);
      }
    };

    // Reset Catalog to standard default
    const handleResetCatalog = () => {
      const defaultRules = CONSTANTS.DEFAULT_SOFTWARE_RULES || [];
      setCatalogRules(defaultRules);
      setCustomCatalog(null);
      setCatalogSource('DEFAULT_EMBEDDED');
      setCatalogInfo({ name: 'Hachihi SAM Standard', version: '2026.09' });

      if (rawInventory.length > 0) {
        const reaudited = AUDIT_ENGINE.processInstallations(rawInventory, defaultRules);
        setInstallations(reaudited);
      }

      setUploadStatus({
        message: 'Đã khôi phục danh mục tiêu chuẩn tích hợp sẵn.',
        type: 'info',
      });
    };

    // Add new catalog rule
    const handleAddRule = (rule) => {
      const updated = [rule, ...catalogRules];
      setCatalogRules(updated);
      setCatalogSource('CUSTOM_FILE');
      if (rawInventory.length > 0) {
        const reaudited = AUDIT_ENGINE.processInstallations(rawInventory, updated);
        setInstallations(reaudited);
      }
      setUploadStatus({
        message: `Đã thêm quy tắc cho "${rule.name}".`,
        type: 'success',
      });
    };

    // Delete catalog rule
    const handleDeleteRule = (index) => {
      const updated = catalogRules.filter((_, idx) => idx !== index);
      setCatalogRules(updated);
      setCatalogSource('CUSTOM_FILE');
      if (rawInventory.length > 0) {
        const reaudited = AUDIT_ENGINE.processInstallations(rawInventory, updated);
        setInstallations(reaudited);
      }
      setUploadStatus({
        message: 'Đã xóa quy tắc khỏi danh mục.',
        type: 'info',
      });
    };

    // Update existing catalog rule freely (any field)
    const handleUpdateRule = (index, updatedFields) => {
      const updated = [...catalogRules];
      if (!updated[index]) return;
      const merged = { ...updated[index], ...updatedFields };

      // Ensure consistent keywords and patterns
      if (typeof merged.keywords === 'string') {
        merged.keywords = merged.keywords.split(/[,;\n]+/).map((k) => k.trim().toLowerCase()).filter(Boolean);
      }
      if (Array.isArray(merged.keywords) && !merged.pattern) {
        merged.pattern = merged.keywords.join(', ');
      }
      if (merged.licenseType === 'FREE_OPEN_SOURCE') {
        merged.price = 0;
        merged.estimatedPriceVND = 0;
        merged.auditRisk = 'LOW';
        merged.isTrap = false;
        merged.suggestedAction = 'ALLOW_FREE';
      }

      updated[index] = merged;
      setCatalogRules(updated);
      setCatalogSource('CUSTOM_FILE');

      if (rawInventory.length > 0) {
        const reaudited = AUDIT_ENGINE.processInstallations(rawInventory, updated);
        setInstallations(reaudited);
      }

      setUploadStatus({
        message: `Đã cập nhật quy tắc cho "${merged.name}". Số liệu báo cáo đã được tự động tính lại.`,
        type: 'success',
      });
    };

    // Quick action: Assign Free / FOSS (0đ) to a catalog rule
    const handleAssignFree = (index) => {
      const target = catalogRules[index];
      if (!target) return;
      handleUpdateRule(index, {
        licenseType: 'FREE_OPEN_SOURCE',
        auditRisk: 'LOW',
        price: 0,
        estimatedPriceVND: 0,
        isTrap: false,
        suggestedAction: 'ALLOW_FREE',
        recommendedAlternative: target.recommendedAlternative || target.foss || 'Chuẩn FOSS tối ưu',
        foss: target.recommendedAlternative || target.foss || 'Chuẩn FOSS tối ưu',
        actionDetails: 'Mã nguồn mở / Freeware, được phép dùng miễn phí cho doanh nghiệp (0đ, 0 rủi ro).'
      });
    };

    // Export Excel Handlers
    const handleExportExecutive = () => {
      EXPORTER.exportExecutiveReport(executivePlanRows, metrics, clientName, auditDate);
    };

    const handleExportDetailed = () => {
      EXPORTER.exportDetailedMachines(installations, clientName, auditDate);
    };

    const handleExportCatalog = () => {
      EXPORTER.exportSoftwareCatalog(catalogRules);
    };

    const handleExportCatalogJSON = () => {
      if (EXPORTER.exportSoftwareCatalogJSON) {
        EXPORTER.exportSoftwareCatalogJSON(catalogRules, catalogInfo);
      }
    };

    const handleDownloadTemplate = () => {
      EXPORTER.generateSampleExcelTemplate();
    };

    // Print Handler
    const handlePrintReport = (type) => {
      PRINT.printReport(type, clientName, auditDate);
    };

    return React.createElement(
      "div",
      { className: "min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200" },
      // Header
      React.createElement(
        "header",
        { className: "bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs print:hidden transition-colors duration-200" },
        React.createElement(
          "div",
          { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between" },
          // Logo & Brand
          React.createElement(
            "div",
            { className: "flex items-center gap-3" },
            React.createElement("img", {
              src: "./assets/logo.svg",
              alt: "Hachihi SAM Logo",
              className: "h-9 w-9 shrink-0",
            }),
            React.createElement(
              "div",
              null,
              React.createElement(
                "h1",
                { className: "text-base font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2" },
                "Hachihi SAM Pro",
                React.createElement(
                  "span",
                  { className: "text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" },
                  "v2026.09"
                )
              ),
              React.createElement(
                "p",
                { className: "text-[11px] text-slate-500 dark:text-slate-400" },
                "Hệ Thống Kiểm Toán & Tối Ưu Bản Quyền Doanh Nghiệp"
              )
            )
          ),

          // Header Actions
          React.createElement(
            "div",
            { className: "flex items-center gap-2 sm:gap-3" },
            // Dark Mode Toggle
            React.createElement(
              "button",
              {
                onClick: toggleTheme,
                className: "p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer text-sm",
                title: isDark ? "Chuyển sang Giao diện sáng" : "Chuyển sang Giao diện tối",
              },
              isDark ? "☀️" : "🌙"
            ),
            // Template download
            React.createElement(
              "button",
              {
                onClick: handleDownloadTemplate,
                className: "hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer border border-slate-200 dark:border-slate-700",
                title: "Tải file Excel mẫu kiểm kê để nhập dữ liệu",
              },
              "📥 Tải File Mẫu"
            ),
            // Export Excel dropdown or button
            React.createElement(
              "div",
              { className: "hidden sm:flex items-center gap-1" },
              React.createElement(
                "button",
                {
                  onClick: handleExportExecutive,
                  className: "px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg transition cursor-pointer border border-emerald-200 dark:border-emerald-800 flex items-center gap-1",
                  title: "Xuất file Excel báo cáo tổng hợp",
                },
                "📊 Xuất Báo Cáo"
              )
            ),
            // Print Modal Button
            React.createElement(
              "button",
              {
                onClick: () => setShowPrintReportModal(true),
                className: "px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5",
              },
              "🖨️ In Báo Cáo (BGĐ)"
            )
          )
        )
      ),

      // Fallback Banner (if remote fetch failed)
      fallbackBanner &&
        React.createElement(
          "div",
          {
            className: "bg-blue-50 dark:bg-blue-950/80 border-b border-blue-200 dark:border-blue-900 px-4 py-2 text-center text-xs text-blue-800 dark:text-blue-300 flex items-center justify-center gap-2 print:hidden",
          },
          React.createElement("span", { className: "font-semibold" }, "ℹ️ Chế độ ngoại tuyến:"),
          React.createElement("span", null, "Đang dùng danh mục chuẩn tích hợp sẵn (Hachihi SAM Standard v2026.09). Bạn vẫn có thể nạp danh mục riêng từ máy tính.")
        ),

      // Main Container
      React.createElement(
        "main",
        { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6" },
        // Upload & Data Source Controls Bar
        React.createElement(
          "div",
          { className: "bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 print:hidden transition-colors duration-200" },
          React.createElement(
            "div",
            { className: "flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4" },
            // Left: File Upload & Drag-Drop area
            React.createElement(
              "div",
              { className: "flex-1 flex flex-wrap items-center gap-3" },
              React.createElement(
                "label",
                {
                  className: "px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer flex items-center gap-2",
                },
                "📂 Nạp File Kiểm Kê (Excel / CSV)",
                React.createElement("input", {
                  type: "file",
                  ref: fileInputRef,
                  onChange: (e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleInventoryUpload(e.target.files[0]);
                    }
                    e.target.value = "";
                  },
                  accept: ".xlsx, .xls, .csv",
                  className: "hidden",
                })
              ),
              React.createElement(
                "button",
                {
                  onClick: () => catalogInputRef.current && catalogInputRef.current.click(),
                  className: "px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer border border-slate-200 dark:border-slate-700 flex items-center gap-1.5",
                  title: "Nạp file software_catalog.xlsx riêng của doanh nghiệp",
                },
                "📁 Nạp Danh Mục Riêng"
              ),
              React.createElement("input", {
                type: "file",
                ref: catalogInputRef,
                onChange: (e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleCatalogUpload(e.target.files[0]);
                  }
                  e.target.value = "";
                },
                accept: ".xlsx, .xls",
                className: "hidden",
              }),
              catalogSource !== 'DEFAULT_EMBEDDED' &&
                React.createElement(
                  "button",
                  {
                    onClick: handleResetCatalog,
                    className: "px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-semibold transition cursor-pointer border border-rose-200 dark:border-rose-900",
                    title: "Quay về danh mục mặc định",
                  },
                  "🔄 Khôi Phục Chuẩn"
                )
            ),

            // Right: Status Badges
            React.createElement(
              "div",
              { className: "flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap" },
              React.createElement(
                "span",
                {
                  className: `px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 ${
                    catalogSource === 'CUSTOM_FILE' || catalogSource === 'SHEET3_EXCEL'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`,
                },
                React.createElement("span", { className: "w-2 h-2 rounded-full bg-emerald-500" }),
                catalogSource === 'CUSTOM_FILE'
                  ? 'Catalog: Tải lên riêng'
                  : catalogSource === 'SHEET3_EXCEL'
                  ? 'Catalog: Từ Sheet 3'
                  : catalogSource === 'REMOTE_EXCEL'
                  ? 'Catalog: Online GitHub'
                  : 'Catalog: Chuẩn tích hợp'
              ),
              React.createElement(
                "span",
                { className: "px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium" },
                computers.length,
                " máy • ",
                installations.length,
                " phần mềm"
              )
            )
          ),

          // Upload Message / Progress Feedback
          uploadStatus.message &&
            React.createElement(
              "div",
              {
                className: `px-3.5 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
                  uploadStatus.type === 'error'
                    ? 'bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border border-rose-200 dark:border-rose-900'
                    : uploadStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-900'
                    : 'bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border border-blue-200 dark:border-blue-900'
                }`,
              },
              React.createElement("span", null, uploadStatus.message),
              React.createElement(
                "button",
                {
                  onClick: () => setUploadStatus({ message: '', type: 'info' }),
                  className: "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer ml-2",
                },
                "✕"
              )
            )
        ),

        // Navigation Tabs (1 to 5)
        React.createElement(
          "div",
          { className: "border-b border-slate-200 dark:border-slate-800 flex items-center gap-1 sm:gap-2 overflow-x-auto pb-px print:hidden" },
          [
            { id: 'OVERVIEW', label: '1. Báo Cáo Tổng Quan' },
            { id: 'SOFTWARE_MATRIX', label: '2. Ma Trận Phần Mềm' },
            { id: 'MACHINE_AUDIT', label: '3. Kiểm Toán Từng Máy' },
            { id: 'FOSS_PLAN', label: '4. Kế Hoạch FOSS' },
            { id: 'CATALOG_CONFIG', label: '5. Quy Định & Danh Mục' },
          ].map((tab) =>
            React.createElement(
              "button",
              {
                key: tab.id,
                onClick: () => setActiveTab(tab.id),
                className: `px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`,
              },
              tab.label
            )
          )
        ),

        // Tab Content Rendering
        activeTab === 'OVERVIEW' &&
          React.createElement(REPORTS.OverviewReport, {
            metrics,
            kpiBreakdown,
            installations,
            executivePlanRows,
            totalBudgetRequired,
            setActiveTab,
            setShowPrintReportModal,
            formatVND: UTILS.formatVND || ((v) => `${v} ₫`),
          }),

        activeTab === 'SOFTWARE_MATRIX' &&
          React.createElement(REPORTS.SoftwareMatrixReport, {
            softwareGroups,
            searchTerm,
            setSearchTerm,
            filterRisk,
            setFilterRisk,
            formatVND: UTILS.formatVND || ((v) => `${v} ₫`),
          }),

        activeTab === 'MACHINE_AUDIT' &&
          React.createElement(REPORTS.MachineAuditReport, {
            computers,
            installations,
            updateInvoiceStatus,
          }),

        activeTab === 'FOSS_PLAN' &&
          React.createElement(REPORTS.FossPlanReport, {
            metrics,
            formatVND: UTILS.formatVND || ((v) => `${v} ₫`),
          }),

        activeTab === 'CATALOG_CONFIG' &&
          React.createElement(REPORTS.CatalogConfigReport, {
            catalogRules,
            catalogSource,
            catalogInfo,
            onAddRule: handleAddRule,
            onUpdateRule: handleUpdateRule,
            onAssignFree: handleAssignFree,
            onDeleteRule: handleDeleteRule,
            onResetCatalog: handleResetCatalog,
            onUploadCatalogFile: handleCatalogUpload,
            onExportCatalog: handleExportCatalog,
            onExportCatalogJSON: handleExportCatalogJSON,
            onDownloadTemplate: handleDownloadTemplate,
            formatVND: UTILS.formatVND || ((v) => `${v} ₫`),
          })
      ),

      // Footer
      React.createElement(
        "footer",
        { className: "border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 px-4 text-center text-xs text-slate-500 dark:text-slate-400 print:hidden transition-colors duration-200" },
        React.createElement(
          "p",
          { className: "font-medium" },
          "Hachihi SAM Pro • Hệ Thống Kiểm Toán & Tối Ưu Bản Quyền Phần Mềm Doanh Nghiệp • By hachihi.vn 0933842126"
        )
      ),

      // Executive Print Report Modal
      React.createElement(REPORTS.ExecutiveReportModal, {
        show: showPrintReportModal,
        onClose: () => setShowPrintReportModal(false),
        reportType: printReportType,
        setReportType: setPrintReportType,
        clientName,
        setClientName,
        auditDate,
        setAuditDate,
        auditorUnit,
        setAuditorUnit,
        catalogInfo,
        metrics,
        kpiBreakdown,
        computers,
        installations,
        detailFilteredInstalls,
        filteredExecutivePlanRows,
        filteredTotalBudgetRequired,
        executivePlanRows,
        machineOverviewRows,
        totalViolations,
        detailFilter,
        setDetailFilter,
        categoryFilter,
        setCategoryFilter,
        riskFilterPlan,
        setRiskFilterPlan,
        handlePrint: handlePrintReport,
        formatVND: UTILS.formatVND || ((v) => `${v} ₫`),
      })
    );
  }

  // Mount React App
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(React.createElement(LicenseAuditApp));
  }

  global.SAM_APP = {
    LicenseAuditApp,
  };

})(typeof window !== 'undefined' ? window : this);
