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
    const [loadedFiles, setLoadedFiles] = useState([]);
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

    // Inventory File(s) Upload Handler (supports single or multiple Excel/CSV files and merging)
    const handleInventoryUpload = async (fileList, appendMode = false) => {
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList);
      setIsProcessing(true);
      const isMulti = files.length > 1 || appendMode;
      setUploadStatus({
        message: isMulti
          ? `Đang nạp và hợp nhất ${files.length} tập tin kiểm kê...`
          : `Đang xử lý tập tin ${files[0].name}...`,
        type: 'info'
      });

      try {
        const result = await DATA_LOADER.loadMultipleInventoryFiles(files, catalogRules);

        let finalComputers = result.computers || [];
        let finalRaw = result.installations || [];
        let finalLoadedFiles = result.files || [];

        if (appendMode && computers.length > 0) {
          // Merge with existing computers (deduplicating by hostname)
          const compMap = new Map();
          computers.forEach((c) => compMap.set((c.hostname || '').toUpperCase(), { ...c }));
          (result.computers || []).forEach((c) => {
            const hostKey = (c.hostname || '').toUpperCase();
            if (!compMap.has(hostKey)) {
              compMap.set(hostKey, c);
            } else {
              const existing = compMap.get(hostKey);
              ['user', 'department', 'os', 'model', 'serial', 'manufacturer', 'cpu', 'ram', 'disk'].forEach((field) => {
                if ((!existing[field] || existing[field] === 'N/A' || existing[field] === 'Chưa gán') && c[field] && c[field] !== 'N/A' && c[field] !== 'Chưa gán') {
                  existing[field] = c[field];
                }
              });
              if (c.sourceFile && existing.sourceFile && !existing.sourceFile.includes(c.sourceFile)) {
                existing.sourceFile += ', ' + c.sourceFile;
              }
            }
          });
          finalComputers = Array.from(compMap.values());
          finalRaw = [...rawInventory, ...(result.installations || [])];
          finalLoadedFiles = [...loadedFiles, ...(result.files || [])];
        }

        setComputers(finalComputers);
        setRawInventory(finalRaw);
        setLoadedFiles(finalLoadedFiles);

        // If Excel had Sheet 3 with custom catalog rules, prioritize it!
        let currentRules = catalogRules;
        if (result.sheet3Rules && result.sheet3Rules.length > 0) {
          currentRules = result.sheet3Rules;
          setCatalogRules(currentRules);
          setCatalogSource('SHEET3_EXCEL');
        }

        // Run audit matching engine
        const processed = AUDIT_ENGINE.processInstallations(finalRaw, currentRules);
        setInstallations(processed);

        // Update upload status message
        if (finalLoadedFiles.length > 1) {
          setUploadStatus({
            message: `Gộp thành công ${finalLoadedFiles.length} tập tin kiểm kê! Tổng cộng ${finalComputers.length} máy tính và ${finalRaw.length} lượt cài đặt phần mềm đã được hợp nhất vào hệ thống.`,
            type: 'success',
          });
        } else {
          setUploadStatus({
            message: `Tải thành công ${finalComputers.length} máy tính và ${finalRaw.length} lượt cài đặt phần mềm từ ${files[0].name}.`,
            type: 'success',
          });
        }

        // Auto extract client name from filename if possible
        const baseName = files[0].name.replace(/\.[^/.]+$/, '').replace(/kiem_?ke|inventory|sam|software|danh_sach/gi, '').trim();
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
      EXPORTER.exportExecutiveReport(executivePlanRows, metrics, clientName, auditDate, installations, computers, kpiBreakdown);
    };

    const handleExportMergedFile = () => {
      if (!computers || computers.length === 0) {
        alert("Chưa có dữ liệu kiểm kê để gộp và xuất file. Vui lòng nạp các file kiểm kê trước!");
        return;
      }
      EXPORTER.exportMergedInventoryWorkbook(computers, installations, catalogRules, clientName, loadedFiles);
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
          { className: "w-full max-w-[98%] 2xl:max-w-[1780px] mx-auto px-3 sm:px-6 h-16 flex items-center justify-between" },
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
            // Export Merged Excel button (Combine all into 1 file)
            React.createElement(
              "button",
              {
                onClick: handleExportMergedFile,
                className: "hidden lg:flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg transition cursor-pointer border border-indigo-200 dark:border-indigo-800",
                title: "Gộp tất cả máy tính và phần mềm từ các file nạp làm 1 file Excel duy nhất (kèm Serial và Model)",
              },
              "📦 Gộp & Xuất 1 File Excel"
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
        { className: "w-full max-w-[98%] 2xl:max-w-[1780px] mx-auto px-3 sm:px-6 py-6 flex-1 space-y-6" },

        // Section A: Control Console Card (Bảng Điều Khiển Nạp Dữ Liệu & Hợp Nhất)
        React.createElement(
          "section",
          { className: "sam-section-card print:hidden" },
          // Header Ribbon
          React.createElement(
            "div",
            { className: "sam-section-ribbon flex-wrap gap-3" },
            React.createElement(
              "div",
              { className: "flex items-center gap-2.5" },
              React.createElement("span", { className: "text-lg" }, "⚡"),
              React.createElement(
                "div",
                null,
                React.createElement(
                  "h2",
                  { className: "text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2" },
                  "Bảng Điều Khiển & Quản Lý Dữ Liệu Kiểm Kê",
                  React.createElement(
                    "span",
                    { className: "text-[10px] font-semibold text-slate-500 dark:text-slate-400 normal-case hidden sm:inline" },
                    "(Import, Gộp File & Nạp Catalog)"
                  )
                ),
                React.createElement(
                  "p",
                  { className: "text-[11px] text-slate-500 dark:text-slate-400" },
                  "Quản lý tập trung các tập tin kiểm kê máy tính, cấu hình từ điển bản quyền và xuất file hợp nhất"
                )
              )
            ),
            // Right Badges
            React.createElement(
              "div",
              { className: "flex items-center gap-2 text-xs flex-wrap" },
              React.createElement(
                "span",
                {
                  className: `catalog-status-badge ${
                    catalogSource === 'CUSTOM_FILE' || catalogSource === 'SHEET3_EXCEL'
                      ? 'catalog-status-custom'
                      : catalogSource === 'REMOTE_EXCEL' || catalogSource === 'REMOTE_JSON'
                      ? 'catalog-status-online'
                      : 'catalog-status-fallback'
                  }`,
                },
                React.createElement("span", { className: "w-2 h-2 rounded-full bg-emerald-500 animate-pulse" }),
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
                { className: "px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200 text-xs" },
                computers.length,
                " máy • ",
                installations.length,
                " phần mềm"
              )
            )
          ),

          // Main 3-Column Functional Station
          React.createElement(
            "div",
            { className: "p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-4" },

            // Column 1: Nạp Dữ Liệu Máy Tính & Phần Mềm
            React.createElement(
              "div",
              { className: "bg-slate-50/90 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between space-y-3" },
              React.createElement(
                "div",
                null,
                React.createElement(
                  "div",
                  { className: "flex items-center gap-2 mb-1" },
                  React.createElement("span", { className: "w-2.5 h-2.5 rounded-full bg-blue-600" }),
                  React.createElement("h3", { className: "text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight" }, "1. Dữ Liệu Kiểm Kê")
                ),
                React.createElement("p", { className: "text-[11px] text-slate-500 dark:text-slate-400" }, "Nạp 1 hoặc nhiều file Excel/CSV kiểm kê từ các máy tính.")
              ),
              React.createElement(
                "div",
                { className: "flex flex-col gap-2" },
                React.createElement(
                  "label",
                  {
                    className: "w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-bold shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5",
                    title: "Nhấn để nạp 1 hoặc nhiều file Excel/CSV mới",
                  },
                  "📂 Nạp File Kiểm Kê (Mới)",
                  React.createElement("input", {
                    type: "file",
                    ref: fileInputRef,
                    multiple: true,
                    onChange: (e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleInventoryUpload(e.target.files, false);
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
                    className: "w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200 rounded-lg text-xs font-semibold transition cursor-pointer border border-indigo-200 dark:border-indigo-800 flex items-center justify-center gap-1.5",
                    title: "Nạp thêm các file kiểm kê khác để gộp tiếp",
                  },
                  "➕ Nạp Thêm File Để Gộp",
                  React.createElement("input", {
                    type: "file",
                    multiple: true,
                    onChange: (e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleInventoryUpload(e.target.files, true);
                      }
                      e.target.value = "";
                    },
                    accept: ".xlsx, .xls, .csv",
                    className: "hidden",
                  })
                )
              )
            ),

            // Column 2: Danh Mục & Quy Tắc Bản Quyền (Catalog)
            React.createElement(
              "div",
              { className: "bg-slate-50/90 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between space-y-3" },
              React.createElement(
                "div",
                null,
                React.createElement(
                  "div",
                  { className: "flex items-center gap-2 mb-1" },
                  React.createElement("span", { className: "w-2.5 h-2.5 rounded-full bg-amber-500" }),
                  React.createElement("h3", { className: "text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight" }, "2. Từ Điển Bản Quyền (Catalog)")
                ),
                React.createElement(
                  "p",
                  { className: "text-[11px] text-slate-500 dark:text-slate-400" },
                  `Đang áp dụng ${catalogRules.length} quy tắc nhận diện, đơn giá và phương án FOSS.`
                )
              ),
              React.createElement(
                "div",
                { className: "flex flex-col gap-2" },
                React.createElement(
                  "button",
                  {
                    onClick: () => catalogInputRef.current && catalogInputRef.current.click(),
                    className: "w-full py-2 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition cursor-pointer border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-1.5 shadow-2xs",
                    title: "Nạp file software_catalog.xlsx riêng của doanh nghiệp",
                  },
                  "📁 Nạp Danh Mục Riêng (.xlsx)"
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
                catalogSource !== 'DEFAULT_EMBEDDED' ?
                  React.createElement(
                    "button",
                    {
                      onClick: handleResetCatalog,
                      className: "w-full py-2 px-3 text-rose-700 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 rounded-lg text-xs font-bold transition cursor-pointer border border-rose-200 dark:border-rose-900 flex items-center justify-center gap-1.5",
                      title: "Khôi phục danh mục chuẩn tích hợp sẵn của Hachihi SAM",
                    },
                    "🔄 Khôi Phục Danh Mục Gốc"
                  )
                  :
                  React.createElement(
                    "button",
                    {
                      onClick: () => setActiveTab("CATALOG_CONFIG"),
                      className: "w-full py-2 px-3 text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5",
                    },
                    "⚙️ Xem & Tùy Biến Quy Tắc"
                  )
              )
            ),

            // Column 3: Hợp Nhất Dữ Liệu & Xuất File
            React.createElement(
              "div",
              { className: "bg-slate-50/90 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between space-y-3" },
              React.createElement(
                "div",
                null,
                React.createElement(
                  "div",
                  { className: "flex items-center gap-2 mb-1" },
                  React.createElement("span", { className: "w-2.5 h-2.5 rounded-full bg-emerald-500" }),
                  React.createElement("h3", { className: "text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight" }, "3. Hợp Nhất & File Mẫu")
                ),
                React.createElement("p", { className: "text-[11px] text-slate-500 dark:text-slate-400" }, "Gộp tất cả dữ liệu thành 1 file chuẩn có Serial/Model hoặc tải mẫu kiểm kê.")
              ),
              React.createElement(
                "div",
                { className: "flex flex-col gap-2" },
                React.createElement(
                  "button",
                  {
                    onClick: handleExportMergedFile,
                    className: "w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5",
                    title: "Gộp dữ liệu tất cả máy tính và phần mềm thành 1 file Excel (2 cột đầu là Serial và Model)",
                  },
                  "📦 Gộp Làm 1 & Tải Excel"
                ),
                React.createElement(
                  "button",
                  {
                    onClick: handleDownloadTemplate,
                    className: "w-full py-2 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-1.5 shadow-2xs",
                    title: "Tải file mẫu Excel kiểm kê chuẩn 3 sheet",
                  },
                  "📥 Tải File Mẫu Kiểm Kê"
                )
              )
            )
          ),

          // File Summary Shelf (If files were loaded)
          loadedFiles.length > 0 &&
            React.createElement(
              "div",
              { className: "bg-slate-100/70 dark:bg-slate-950/70 border-t border-slate-200 dark:border-slate-800 px-4 sm:px-5 py-3 flex items-center justify-between flex-wrap gap-2 text-xs" },
              React.createElement(
                "div",
                { className: "flex items-center gap-2 flex-wrap" },
                React.createElement(
                  "span",
                  { className: "font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5" },
                  "📚 Đã nạp " + loadedFiles.length + " tập tin kiểm kê:"
                ),
                loadedFiles.map((f, i) =>
                  React.createElement(
                    "span",
                    {
                      key: i,
                      className: "px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 shadow-2xs",
                      title: `${f.name} (${f.computersCount || 0} máy, ${f.installationsCount || 0} phần mềm)`
                    },
                    "📄 " + f.name,
                    React.createElement("span", { className: "text-[11px] text-blue-600 dark:text-blue-400 font-bold" }, `• ${f.computersCount || 0} máy`),
                    React.createElement("span", { className: "text-[11px] text-emerald-600 dark:text-emerald-400 font-bold" }, `• ${f.installationsCount || 0} pm`)
                  )
                )
              ),
              React.createElement(
                "button",
                {
                  onClick: handleExportMergedFile,
                  className: "text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline cursor-pointer flex items-center gap-1 py-1",
                  title: "Xuất ngay 1 file Excel tổng hợp có 2 cột đầu của phần mềm là Serial & Model",
                },
                "⬇️ Tải File Hợp Nhất (Đã kèm Serial & Model)"
              )
            ),

          // Upload Message / Progress Feedback
          uploadStatus.message &&
            React.createElement(
              "div",
              {
                className: `mx-4 sm:mx-5 mb-4 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
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
                  className: "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer ml-2 text-sm",
                },
                "✕"
              )
            )
        ),

        // Section B: Elevated Segmented Navigation Tabs (Thanh Điều Hướng 5 Phân Hệ Báo Cáo)
        React.createElement(
          "nav",
          { className: "sam-segmented-nav print:hidden shadow-xs", "aria-label": "Danh mục phân hệ báo cáo" },
          [
            { id: 'OVERVIEW', icon: '📊', label: '1. Báo Cáo Tổng Quan', badge: `${metrics.complianceScore}% Tuân thủ` },
            { id: 'SOFTWARE_MATRIX', icon: '📑', label: '2. Ma Trận Phần Mềm', badge: `${softwareGroups.length} nhóm PM` },
            { id: 'MACHINE_AUDIT', icon: '💻', label: '3. Kiểm Toán Từng Máy', badge: `${computers.length} thiết bị` },
            { id: 'FOSS_PLAN', icon: '💡', label: '4. Kế Hoạch FOSS (0đ)', badge: `${metrics.replaceFoss} vị trí thay` },
            { id: 'CATALOG_CONFIG', icon: '⚙️', label: '5. Quy Định & Catalog', badge: `${catalogRules.length} quy tắc` },
          ].map((tab) =>
            React.createElement(
              "button",
              {
                key: tab.id,
                onClick: () => setActiveTab(tab.id),
                className: `sam-tab-btn ${activeTab === tab.id ? 'active' : ''}`,
              },
              React.createElement("span", { className: "text-sm" }, tab.icon),
              React.createElement("span", null, tab.label),
              React.createElement(
                "span",
                {
                  className: `text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                      : 'bg-slate-200/90 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                  }`,
                },
                tab.badge
              )
            )
          )
        ),

        // Section C: Tab Content Rendering Area

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
