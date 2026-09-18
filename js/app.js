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
    const [activeTab, setActiveTab] = useState('HOME');
    const [userMode, setUserMode] = useState('SIMPLE'); // 'SIMPLE' (Thông thường) or 'EXPERT' (Chuyên gia)
    const [actionFilter, setActionFilter] = useState('ALL');
    const [showAdvancedMenu, setShowAdvancedMenu] = useState(false);
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
    const appendFileInputRef = useRef(null);
    const catalogInputRef = useRef(null);
    const advancedMenuRef = useRef(null);

    // Close advanced menu when clicking outside
    useEffect(() => {
      const handleOutsideClick = (e) => {
        if (advancedMenuRef.current && !advancedMenuRef.current.contains(e.target)) {
          setShowAdvancedMenu(false);
        }
      };
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

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
      setLoadedFiles([
        {
          name: 'sample_inventory_2026.xlsx',
          size: 45820,
          computersCount: defaultComps.length,
          installationsCount: defaultInsts.length,
          timestamp: 'Dữ liệu kiểm kê mẫu',
        }
      ]);

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
          // Merge with existing computers (deduplicating by serial first, then hostname)
          const compMap = new Map();
          const serialMap = new Map();
          computers.forEach((c) => {
            const h = (c.hostname || '').toUpperCase();
            const s = (c.serial && c.serial !== 'N/A' && c.serial.trim() !== '') ? c.serial.trim().toUpperCase() : null;
            const copy = { ...c };
            if (h) compMap.set(h, copy);
            if (s) serialMap.set(s, copy);
          });

          (result.computers || []).forEach((c) => {
            const hostKey = (c.hostname || '').toUpperCase();
            const serialKey = (c.serial && c.serial !== 'N/A' && c.serial.trim() !== '') ? c.serial.trim().toUpperCase() : null;

            let existing = null;
            if (serialKey && serialMap.has(serialKey)) {
              existing = serialMap.get(serialKey);
            } else if (hostKey && compMap.has(hostKey)) {
              existing = compMap.get(hostKey);
            }

            if (!existing) {
              const compCopy = { ...c };
              if (hostKey) compMap.set(hostKey, compCopy);
              if (serialKey) serialMap.set(serialKey, compCopy);
            } else {
              ['user', 'department', 'os', 'model', 'serial', 'manufacturer', 'cpu', 'ram', 'disk', 'vga'].forEach((field) => {
                if ((!existing[field] || existing[field] === 'N/A' || existing[field] === 'Chưa gán') && c[field] && c[field] !== 'N/A' && c[field] !== 'Chưa gán') {
                  existing[field] = c[field];
                }
              });
              if (c.sourceFile && existing.sourceFile && !existing.sourceFile.includes(c.sourceFile)) {
                existing.sourceFile += ', ' + c.sourceFile;
              }
              if (hostKey && !compMap.has(hostKey)) compMap.set(hostKey, existing);
              if (serialKey && !serialMap.has(serialKey)) serialMap.set(serialKey, existing);
            }
          });
          finalComputers = Array.from(new Set(compMap.values()));
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
        message: 'Đã đổi thành Danh Mục Mẫu chuẩn Hachihi SAM Standard v2026.09 (khôi phục danh mục gốc thành công).',
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
          { className: "w-full max-w-[98%] 2xl:max-w-[1780px] mx-auto px-3 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4" },
          // Logo & Brand (HACHIHI – KIỂM TRA BẢN QUYỀN PHẦN MỀM)
          React.createElement(
            "div",
            {
              className: "flex items-center gap-3 cursor-pointer shrink-0",
              onClick: () => setActiveTab('HOME'),
              title: "Về màn hình Tổng quan",
            },
            React.createElement("img", {
              src: "./assets/logo.svg",
              alt: "Hachihi SAM Logo",
              className: "h-9 w-9 shrink-0",
            }),
            React.createElement(
              "div",
              { className: "hidden sm:block" },
              React.createElement(
                "h1",
                { className: "text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2 uppercase" },
                "Hachihi – Kiểm Tra Bản Quyền Phần Mềm",
                React.createElement(
                  "span",
                  { className: "text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 normal-case" },
                  "v2026.09"
                )
              ),
              React.createElement(
                "p",
                { className: "text-[11px] text-slate-500 dark:text-slate-400 font-medium" },
                "Kiểm tra phần mềm đang sử dụng và những vấn đề cần xử lý."
              )
            )
          ),

          // Navigation Bar (6 items: 🏠 Tổng quan | 🖥️ Máy tính | 📦 Phần mềm | ⚠️ Cần xử lý | 📄 Báo cáo | ⚙️ Nâng cao)
          React.createElement(
            "nav",
            { className: "flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1 px-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs" },
            [
              { id: 'HOME', icon: '🏠', label: 'Tổng quan' },
              { id: 'COMPUTERS', icon: '🖥️', label: 'Máy tính', count: computers.length },
              { id: 'SOFTWARE', icon: '📦', label: 'Phần mềm', count: softwareGroups.length },
              {
                id: 'ACTION_ITEMS',
                icon: '⚠️',
                label: 'Cần xử lý',
                count: installations.filter((i) => i.invoiceStatus === 'MISSING_INVOICE' && i.licenseType !== 'FREE_OPEN_SOURCE').length,
                alert: true,
              },
              { id: 'EXECUTIVE_REPORT', icon: '📄', label: 'Báo cáo' },
              { id: 'ADVANCED', icon: '⚙️', label: 'Nâng cao' },
            ].map((tab) => {
              const isActive =
                activeTab === tab.id ||
                (tab.id === 'ADVANCED' && ['OVERVIEW', 'SOFTWARE_MATRIX', 'MACHINE_AUDIT', 'FOSS_PLAN', 'CATALOG_CONFIG'].includes(activeTab));
              return React.createElement(
                "button",
                {
                  key: tab.id,
                  onClick: () => {
                    if (tab.id === 'ADVANCED' && activeTab === 'ADVANCED') {
                      setShowAdvancedMenu(!showAdvancedMenu);
                    } else {
                      setActiveTab(tab.id);
                      if (tab.id === 'ADVANCED') setShowAdvancedMenu(true);
                      else setShowAdvancedMenu(false);
                    }
                  },
                  className: `px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                  }`,
                  title: `Chuyển sang ${tab.label}`,
                },
                React.createElement("span", { className: "text-sm" }, tab.icon),
                React.createElement("span", null, tab.label),
                tab.count !== undefined &&
                  React.createElement(
                    "span",
                    {
                      className: `text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        tab.alert && tab.count > 0
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : isActive
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`,
                    },
                    tab.count
                  )
              );
            })
          ),

          // Header Actions (Right Controls)
          React.createElement(
            "div",
            { className: "flex items-center gap-2 sm:gap-2.5 shrink-0" },

            // Chế độ: Thông thường vs Chuyên gia Toggle
            React.createElement(
              "button",
              {
                onClick: () => {
                  const nextMode = userMode === 'SIMPLE' ? 'EXPERT' : 'SIMPLE';
                  setUserMode(nextMode);
                },
                className: `px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                  userMode === 'EXPERT'
                    ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-500'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`,
                title: userMode === 'SIMPLE' ? "Chuyển sang Chế độ Chuyên Gia (Xem đầy đủ các trạm kỹ thuật)" : "Chuyển về Chế độ Thông Thường (Trợ lý đơn giản)",
              },
              React.createElement("span", null, userMode === 'SIMPLE' ? '👤' : '🛠️'),
              React.createElement(
                "span",
                { className: "hidden md:inline" },
                userMode === 'SIMPLE' ? 'Chế độ thông thường' : 'Chế độ chuyên gia'
              )
            ),

            // Menu Cài Đặt Nâng Cao Dropdown Button
            React.createElement(
              "div",
              { className: "sam-dropdown", ref: advancedMenuRef },
              React.createElement(
                "button",
                {
                  onClick: () => setShowAdvancedMenu(!showAdvancedMenu),
                  className: `p-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 border ${
                    showAdvancedMenu
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`,
                  title: "Xem các cài đặt & phân hệ nâng cao",
                },
                "⚙️",
                React.createElement("span", { className: "text-[10px] opacity-75 hidden lg:inline" }, showAdvancedMenu ? "▲" : "▼")
              ),
              showAdvancedMenu &&
                React.createElement(
                  "div",
                  { className: "sam-dropdown-menu shadow-xl" },
                  React.createElement(
                    "div",
                    { className: "px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between" },
                    React.createElement(
                      "span",
                      { className: "text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider" },
                      "⚙️ Cài Đặt & Báo Cáo Nâng Cao"
                    ),
                    React.createElement(
                      "span",
                      { className: "text-[10px] text-blue-600 dark:text-blue-400 font-bold" },
                      "Chuyên Sâu"
                    )
                  ),
                  [
                    { id: 'ADVANCED', icon: '🗂️', label: 'Trạm Xử Lý & Gộp File (3 Sheet)', badge: `${loadedFiles.length} file` },
                    { id: 'OVERVIEW', icon: '📊', label: '1. Báo Cáo Tổng Quan Kỹ Thuật', badge: `${metrics.complianceScore}%` },
                    { id: 'SOFTWARE_MATRIX', icon: '📑', label: '2. Ma Trận Phần Mềm Chi Tiết', badge: `${softwareGroups.length} nhóm` },
                    { id: 'MACHINE_AUDIT', icon: '💻', label: '3. Kiểm Toán Từng Máy (Serial/Model)', badge: `${computers.length} máy` },
                    { id: 'FOSS_PLAN', icon: '💡', label: '4. Kế Hoạch Thay Thế FOSS (0đ)', badge: `${metrics.replaceFoss} vị trí` },
                    { id: 'CATALOG_CONFIG', icon: '⚙️', label: '5. Quy Định Cài Đặt & Từ Điển', badge: `${catalogRules.length} quy tắc` },
                  ].map((item) =>
                    React.createElement(
                      "button",
                      {
                        key: item.id,
                        onClick: () => {
                          setActiveTab(item.id);
                          setShowAdvancedMenu(false);
                        },
                        className: `sam-dropdown-item ${activeTab === item.id ? 'active' : ''}`,
                      },
                      React.createElement(
                        "div",
                        { className: "flex items-center gap-2" },
                        React.createElement("span", { className: "text-base" }, item.icon),
                        React.createElement("span", { className: "font-bold text-xs" }, item.label)
                      ),
                      React.createElement(
                        "span",
                        {
                          className: `text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            activeTab === item.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`,
                        },
                        item.badge
                      )
                    )
                  )
                )
            ),

            // Print Modal Button (In Báo Cáo BGĐ)
            React.createElement(
              "button",
              {
                onClick: () => setShowPrintReportModal(true),
                className: "px-3 sm:px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5",
                title: "Mở hộp thoại in báo cáo cho Ban Giám Đốc",
              },
              React.createElement("span", null, "🖨️"),
              React.createElement("span", { className: "hidden sm:inline" }, "In Báo Cáo (BGĐ)")
            ),

            // Dark Mode Toggle
            React.createElement(
              "button",
              {
                onClick: toggleTheme,
                className: "p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer text-sm",
                title: isDark ? "Chuyển sang Giao diện sáng" : "Chuyển sang Giao diện tối",
              },
              isDark ? "☀️" : "🌙"
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
        { className: "w-full max-w-[98%] 2xl:max-w-[1780px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-8 lg:space-y-12" },

        // Main Container Content: Assistant Views or Technical Dashboard or Reports
        activeTab === 'HOME' && userMode === 'SIMPLE'
          ? React.createElement(global.SAM_ASSISTANT_HOME.AssistantHomeView, {
              computers,
              installations,
              softwareGroups,
              loadedFiles,
              onUploadFiles: (files) => handleInventoryUpload(files, false),
              onAppendFiles: (files) => handleInventoryUpload(files, true),
              onDownloadTemplate: handleDownloadTemplate,
              onExportMergedFile: handleExportMergedFile,
              setActiveTab,
              setActionFilter,
              fileInputRef,
              appendFileInputRef,
              formatVND: UTILS.formatVND,
            })
          : activeTab === 'COMPUTERS'
          ? React.createElement(global.SAM_ASSISTANT_COMPUTERS.AssistantComputersView, {
              computers,
              installations,
              onUpdateInvoiceStatus: updateInvoiceStatus,
            })
          : activeTab === 'SOFTWARE'
          ? React.createElement(global.SAM_ASSISTANT_SOFTWARE.AssistantSoftwareView, {
              softwareGroups,
              installations,
              onUpdateInvoiceStatus: updateInvoiceStatus,
              formatVND: UTILS.formatVND,
            })
          : activeTab === 'ACTION_ITEMS'
          ? React.createElement(global.SAM_ASSISTANT_ACTIONS.AssistantActionsView, {
              softwareGroups,
              installations,
              initialFilter: actionFilter,
              onUpdateInvoiceStatus: updateInvoiceStatus,
              formatVND: UTILS.formatVND,
              setActiveTab,
            })
          : activeTab === 'EXECUTIVE_REPORT'
          ? React.createElement(global.SAM_ASSISTANT_EXECUTIVE.AssistantExecutiveView, {
              computers,
              installations,
              softwareGroups,
              metrics,
              formatVND: UTILS.formatVND,
              onTriggerPrint: () => setShowPrintReportModal(true),
            })
          : (activeTab === 'HOME' && userMode === 'EXPERT') || activeTab === 'ADVANCED'
          ? React.createElement(
              "div",
              { className: "space-y-8 lg:space-y-12 animate-fadeIn" },

              // Main Header Banner
              React.createElement(
                "div",
                { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5" },
                React.createElement(
                  "div",
                  { className: "flex items-center gap-4" },
                  React.createElement(
                    "div",
                    { className: "w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-3xl shadow-md shrink-0" },
                    "⚡"
                  ),
                  React.createElement(
                    "div",
                    null,
                    React.createElement(
                      "h2",
                      { className: "text-base sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2.5 flex-wrap" },
                      "Trạm Quản Lý, Gộp File & Nạp Dữ Liệu Kiểm Kê",
                      React.createElement(
                        "span",
                        { className: "text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 normal-case" },
                        "Màn hình chính"
                      )
                    ),
                    React.createElement(
                      "p",
                      { className: "text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1" },
                      "Nhập dữ liệu kiểm kê máy tính, gộp file tự động kèm Serial & Model, đối soát từ điển bản quyền và chuẩn bị báo cáo."
                    )
                  )
                ),
                // Quick Badges
                React.createElement(
                  "div",
                  { className: "flex items-center gap-2.5 flex-wrap text-xs" },
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
                      : 'Catalog: Mẫu tích hợp'
                  ),
                  React.createElement(
                    "span",
                    { className: "px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200 shadow-2xs" },
                    loadedFiles.length,
                    " file đã nạp • ",
                    computers.length,
                    " máy duy nhất"
                  )
                )
              ),

              // Upload status notification banner
              uploadStatus.message &&
                React.createElement(
                  "div",
                  {
                    className: `p-4 sm:p-5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between transition-all border shadow-xs ${
                      uploadStatus.type === 'error'
                        ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/70 dark:text-rose-200 border-rose-200 dark:border-rose-900'
                        : uploadStatus.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200 border-emerald-200 dark:border-emerald-900'
                        : 'bg-blue-50 text-blue-800 dark:bg-blue-950/70 dark:text-blue-200 border-blue-200 dark:border-blue-900'
                    }`,
                  },
                  React.createElement(
                    "div",
                    { className: "flex items-center gap-2.5" },
                    React.createElement("span", { className: "text-lg" }, uploadStatus.type === 'error' ? '⚠️' : uploadStatus.type === 'success' ? '✅' : 'ℹ️'),
                    React.createElement("span", null, uploadStatus.message)
                  ),
                  React.createElement(
                    "button",
                    {
                      onClick: () => setUploadStatus({ message: '', type: 'info' }),
                      className: "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer ml-3 text-base font-bold",
                    },
                    "✕"
                  )
                ),

              // 4 LARGE ACTION STATIONS WITH CLEAR SPACING AND THEMATIC ACCENTS
              React.createElement(
                "div",
                { className: "grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 xl:gap-12 my-3" },

                // STATION 1: KHU VỰC NẠP FILE & THÊM FILE
                React.createElement(
                  "div",
                  { className: "sam-action-station sam-station-upload p-5 sm:p-6 space-y-3" },
                  React.createElement(
                    "div",
                    null,
                    React.createElement(
                      "div",
                      { className: "flex items-center justify-between mb-2" },
                      React.createElement(
                        "div",
                        { className: "flex items-center gap-2" },
                        React.createElement("span", { className: "text-xl p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600" }, "📂"),
                        React.createElement(
                          "h3",
                          { className: "text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight" },
                          "1. Khu Vực Nạp File & Thêm File"
                        )
                      ),
                      React.createElement(
                        "span",
                        { className: "text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" },
                        ".xlsx, .xls, .csv"
                      )
                    ),
                    React.createElement(
                      "p",
                      { className: "text-xs text-slate-600 dark:text-slate-400 leading-snug mb-2.5" },
                      "Nhập dữ liệu kiểm kê máy tính và phần mềm từ các phòng ban. Chọn nạp mới từ đầu hoặc nạp thêm nhiều file để tự động gộp dữ liệu."
                    ),
                    // Visual Drag-and-drop / select box
                    React.createElement(
                      "div",
                      {
                        className: "border-2 border-dashed border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 rounded-xl p-2.5 text-center mb-1 text-xs text-slate-600 dark:text-slate-400 font-medium",
                        onDragOver: (e) => e.preventDefault(),
                        onDrop: (e) => {
                          e.preventDefault();
                          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            handleInventoryUpload(e.dataTransfer.files, false);
                          }
                        },
                      },
                      "Kéo thả tập tin kiểm kê vào đây hoặc chọn 1 trong 2 nút bên dưới"
                    )
                  ),
                  React.createElement(
                    "div",
                    { className: "mt-auto pt-2.5 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5" },
                    React.createElement(
                      "label",
                      {
                        className: "w-full py-2 px-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5",
                        title: "Nhấn để nạp 1 hoặc nhiều file Excel mới (thay thế toàn bộ dữ liệu hiện tại)",
                      },
                      React.createElement("span", { className: "text-base" }, "📂"),
                      React.createElement("span", null, "Nạp File Mới"),
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
                        className: "w-full py-2 px-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/70 text-indigo-900 dark:text-indigo-200 rounded-xl text-xs font-bold transition cursor-pointer border border-indigo-200 dark:border-indigo-800 flex items-center justify-center gap-1.5 shadow-xs",
                        title: "Nạp thêm các file kiểm kê từ phòng ban khác để gộp tiếp vào dữ liệu hiện có",
                      },
                      React.createElement("span", { className: "text-base" }, "➕"),
                      React.createElement("span", null, "Nạp Thêm File Để Gộp"),
                      React.createElement("input", {
                        type: "file",
                        ref: appendFileInputRef,
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

                // STATION 2: KHU VỰC GỘP FILE
                React.createElement(
                  "div",
                  { className: "sam-action-station sam-station-merge p-5 sm:p-6 space-y-3" },
                  React.createElement(
                    "div",
                    null,
                    React.createElement(
                      "div",
                      { className: "flex items-center justify-between mb-2" },
                      React.createElement(
                        "div",
                        { className: "flex items-center gap-2" },
                        React.createElement("span", { className: "text-xl p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600" }, "📦"),
                        React.createElement(
                          "h3",
                          { className: "text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight" },
                          "2. Khu Vực Gộp File & Hợp Nhất"
                        )
                      ),
                      React.createElement(
                        "span",
                        { className: "text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
                        "1 File Duy Nhất"
                      )
                    ),
                    React.createElement(
                      "p",
                      { className: "text-xs text-slate-600 dark:text-slate-400 leading-snug mb-2.5" },
                      "Tự động gom toàn bộ máy tính và phần mềm từ tất cả file nạp làm 1 file Excel duy nhất chuẩn 3 sheet."
                    ),
                    React.createElement(
                      "div",
                      { className: "bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-2.5 text-xs text-emerald-900 dark:text-emerald-300 space-y-1 mb-1" },
                      React.createElement("div", { className: "flex items-center gap-1.5 font-bold" }, "✓ 2 cột đầu của phần mềm là Số Serial & Model máy tính"),
                      React.createElement("div", { className: "flex items-center gap-1.5 opacity-90" }, "✓ Đã tự động khử trùng lặp thiết bị (theo Hostname & Serial)")
                    )
                  ),
                  React.createElement(
                    "div",
                    { className: "mt-auto pt-2.5 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5" },
                    React.createElement(
                      "button",
                      {
                        onClick: handleExportMergedFile,
                        className: "w-full py-2 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5",
                        title: "Gộp tất cả dữ liệu thành 1 file Excel duy nhất kèm Serial và Model",
                      },
                      React.createElement("span", { className: "text-base" }, "📦"),
                      React.createElement("span", null, "Gộp & Tải 1 File Excel")
                    ),
                    React.createElement(
                      "button",
                      {
                        onClick: handleExportExecutive,
                        className: "w-full py-2 px-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-1.5 shadow-2xs",
                        title: "Xuất file Excel báo cáo tổng hợp",
                      },
                      React.createElement("span", { className: "text-base" }, "📊"),
                      React.createElement("span", null, "Xuất Báo Cáo (.xlsx)")
                    )
                  )
                ),

                // STATION 3: KHU VỰC TẢI FILE MẪU & TẢI DANH MỤC MẪU
                React.createElement(
                  "div",
                  { className: "sam-action-station sam-station-templates p-5 sm:p-6 space-y-3" },
                  React.createElement(
                    "div",
                    null,
                    React.createElement(
                      "div",
                      { className: "flex items-center justify-between mb-2" },
                      React.createElement(
                        "div",
                        { className: "flex items-center gap-2" },
                        React.createElement("span", { className: "text-xl p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600" }, "📥"),
                        React.createElement(
                          "h3",
                          { className: "text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight" },
                          "3. Khu Vực Tải File Mẫu, Tải Danh Mục Mẫu"
                        )
                      ),
                      React.createElement(
                        "span",
                        { className: "text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300" },
                        "Biểu Mẫu Chuẩn"
                      )
                    ),
                    React.createElement(
                      "p",
                      { className: "text-xs text-slate-600 dark:text-slate-400 leading-snug mb-2.5" },
                      "Tải biểu mẫu kiểm kê mẫu để gửi các phòng ban điền dữ liệu hoặc tải danh mục mẫu chứa đầy đủ bảng giá và giải pháp FOSS."
                    ),
                    React.createElement(
                      "div",
                      { className: "bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 rounded-xl p-2.5 text-xs text-purple-900 dark:text-purple-300 space-y-1 mb-1" },
                      React.createElement("div", { className: "flex items-center gap-1.5 font-bold" }, "✓ Biểu mẫu Excel chuẩn 3 sheet: Máy tính, Phần mềm, Catalog"),
                      React.createElement("div", { className: "flex items-center gap-1.5 opacity-90" }, "✓ Tích hợp sẵn giá niêm yết thương mại & giải pháp FOSS 0đ")
                    )
                  ),
                  React.createElement(
                    "div",
                    { className: "mt-auto pt-2.5 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5" },
                    React.createElement(
                      "button",
                      {
                        onClick: handleDownloadTemplate,
                        className: "w-full py-2 px-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5",
                        title: "Tải file mẫu Excel kiểm kê chuẩn 3 sheet",
                      },
                      React.createElement("span", { className: "text-base" }, "📥"),
                      React.createElement("span", null, "Tải File Mẫu Kiểm Kê")
                    ),
                    React.createElement(
                      "button",
                      {
                        onClick: handleExportCatalog,
                        className: "w-full py-2 px-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-1.5 shadow-2xs",
                        title: "Tải danh mục mẫu phần mềm bản quyền (.xlsx)",
                      },
                      React.createElement("span", { className: "text-base" }, "📑"),
                      React.createElement("span", null, "Tải Danh Mục Mẫu")
                    )
                  )
                ),

                // STATION 4: KHU VỰC KHÔI PHỤC DANH MỤC GỐC - ĐỔI THÀNH DANH MỤC MẪU
                React.createElement(
                  "div",
                  { className: "sam-action-station sam-station-catalog p-5 sm:p-6 space-y-3" },
                  React.createElement(
                    "div",
                    null,
                    React.createElement(
                      "div",
                      { className: "flex items-center justify-between mb-2" },
                      React.createElement(
                        "div",
                        { className: "flex items-center gap-2" },
                        React.createElement("span", { className: "text-xl p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600" }, "🔄"),
                        React.createElement(
                          "h3",
                          { className: "text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight" },
                          "4. Đổi Thành Danh Mục Mẫu & Khôi Phục"
                        )
                      ),
                      React.createElement(
                        "span",
                        { className: "text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
                        `${catalogRules.length} Quy tắc`
                      )
                    ),
                    React.createElement(
                      "p",
                      { className: "text-xs text-slate-600 dark:text-slate-400 leading-snug mb-2.5" },
                      "Đặt lại từ điển bản quyền về Danh Mục Mẫu chuẩn (Hachihi SAM Standard v2026.09) hoặc nạp file catalog riêng của doanh nghiệp."
                    ),
                    React.createElement(
                      "div",
                      { className: "bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-2.5 text-xs text-amber-900 dark:text-amber-300 space-y-1 mb-1" },
                      React.createElement("div", { className: "flex items-center gap-1.5 font-bold" }, `✓ Đang áp dụng: ${catalogRules.length} quy tắc nhận diện bản quyền`),
                      React.createElement("div", { className: "flex items-center gap-1.5 opacity-90" }, "✓ Hỗ trợ nạp file catalog tùy biến hoặc phục hồi từ điển gốc")
                    )
                  ),
                  React.createElement(
                    "div",
                    { className: "mt-auto pt-2.5 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5" },
                    React.createElement(
                      "button",
                      {
                        onClick: handleResetCatalog,
                        className: "w-full py-2 px-2.5 text-amber-900 dark:text-amber-100 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/80 dark:hover:bg-amber-900/80 rounded-xl text-xs font-black transition cursor-pointer border border-amber-300 dark:border-amber-800 flex items-center justify-center gap-1.5 shadow-xs",
                        title: "Đổi về Danh Mục Mẫu chuẩn và khôi phục danh mục gốc ban đầu",
                      },
                      React.createElement("span", { className: "text-base" }, "🔄"),
                      React.createElement("span", null, "Danh Mục Mẫu (Khôi Phục Gốc)")
                    ),
                    React.createElement(
                      "button",
                      {
                        onClick: () => catalogInputRef.current && catalogInputRef.current.click(),
                        className: "w-full py-2 px-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-1.5 shadow-2xs",
                        title: "Nạp file software_catalog.xlsx riêng của bạn",
                      },
                      React.createElement("span", { className: "text-base" }, "📁"),
                      React.createElement("span", null, "Nạp Danh Mục Riêng")
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
                    })
                  )
                )
              ),

              // KHU VỰC KẾT QUẢ TIẾP NHẬN DỮ LIỆU (HIỆN TO RÕ BÊN DƯỚI SAU KHI GỬI FILE)
              React.createElement(
                "section",
                { className: "sam-reception-box p-6 sm:p-8 lg:p-9 space-y-6 sm:space-y-8 mt-10 lg:mt-14" },
                // Header
                React.createElement(
                  "div",
                  { className: "flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-blue-200/80 dark:border-blue-900/60 gap-4" },
                  React.createElement(
                    "div",
                    { className: "flex items-center gap-3.5" },
                    React.createElement(
                      "div",
                      { className: "w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-bold shadow-xs shrink-0" },
                      "📋"
                    ),
                    React.createElement(
                      "div",
                      null,
                      React.createElement(
                        "span",
                        { className: "text-[11px] font-black tracking-widest text-blue-600 dark:text-blue-400 uppercase block mb-0.5" },
                        "Khu Vực Báo Cáo Tiếp Nhận"
                      ),
                      React.createElement(
                        "h3",
                        { className: "text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight" },
                        "Kết Quả Tiếp Nhận & Hợp Nhất Dữ Liệu Kiểm Kê"
                      ),
                      React.createElement(
                        "p",
                        { className: "text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1" },
                        "Thông tin tổng hợp thời gian thực sau khi đọc và hợp nhất tất cả các tập tin kiểm kê nạp vào hệ thống."
                      )
                    )
                  ),
                  React.createElement(
                    "div",
                    { className: "flex items-center gap-2.5" },
                    React.createElement(
                      "button",
                      {
                        onClick: () => setActiveTab('OVERVIEW'),
                        className: "px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-2",
                      },
                      React.createElement("span", null, "👉"),
                      "Xem Toàn Bộ Báo Cáo Chi Tiết"
                    )
                  )
                ),

                // 4 BIG STAT CARDS (HIỆN TO RÕ: ĐÃ NHẬN BAO NHIÊU FILE, ĐƯỢC BAO NHIÊU MÁY KHÔNG TRÙNG NHAU...)
                React.createElement(
                  "div",
                  { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4.5 my-1.5" },

                  // Card 1: Số file đã nhận
                  React.createElement(
                    "div",
                    { className: "sam-metric-giant border-blue-200 dark:border-blue-900/70 p-4 sm:p-4.5" },
                    React.createElement(
                      "div",
                      { className: "flex items-center justify-between" },
                      React.createElement("span", { className: "text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider" }, "📁 Đã Nhận"),
                      React.createElement("span", { className: "text-xl" }, "📂")
                    ),
                    React.createElement(
                      "div",
                      { className: "text-3xl sm:text-4xl font-black text-blue-700 dark:text-blue-400 tracking-tight" },
                      loadedFiles.length,
                      React.createElement("span", { className: "text-sm font-bold text-slate-500 dark:text-slate-400 ml-1.5" }, "Tập tin")
                    ),
                    React.createElement(
                      "p",
                      { className: "text-xs text-slate-500 dark:text-slate-400" },
                      "Tất cả tập tin kiểm kê đã nạp & phân tích"
                    )
                  ),

                  // Card 2: Số máy tính không trùng nhau (DUY NHẤT)
                  React.createElement(
                    "div",
                    { className: "sam-metric-giant border-indigo-200 dark:border-indigo-900/70 bg-gradient-to-br from-indigo-50/70 to-blue-50/40 dark:from-indigo-950/30 dark:to-blue-950/20 p-4 sm:p-4.5" },
                    React.createElement(
                      "div",
                      { className: "flex items-center justify-between" },
                      React.createElement("span", { className: "text-xs font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-wider" }, "🖥️ Máy Tính Không Trùng"),
                      React.createElement("span", { className: "text-xl" }, "⚡")
                    ),
                    React.createElement(
                      "div",
                      { className: "text-3xl sm:text-4xl font-black text-indigo-700 dark:text-indigo-300 tracking-tight" },
                      computers.length,
                      React.createElement("span", { className: "text-sm font-bold text-indigo-600 dark:text-indigo-400 ml-1.5" }, "Máy Duy Nhất")
                    ),
                    React.createElement(
                      "p",
                      { className: "text-xs text-indigo-950/70 dark:text-indigo-300/80 font-medium" },
                      "Đã khử trùng lặp theo Hostname, Serial & Model"
                    )
                  ),

                  // Card 3: Tổng lượt cài đặt phần mềm
                  React.createElement(
                    "div",
                    { className: "sam-metric-giant border-emerald-200 dark:border-emerald-900/70 p-4 sm:p-4.5" },
                    React.createElement(
                      "div",
                      { className: "flex items-center justify-between" },
                      React.createElement("span", { className: "text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider" }, "📦 Lượt Cài Đặt"),
                      React.createElement("span", { className: "text-xl" }, "📑")
                    ),
                    React.createElement(
                      "div",
                      { className: "text-3xl sm:text-4xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight" },
                      installations.length,
                      React.createElement("span", { className: "text-sm font-bold text-slate-500 dark:text-slate-400 ml-1.5" }, "Lượt cài")
                    ),
                    React.createElement(
                      "p",
                      { className: "text-xs text-slate-500 dark:text-slate-400" },
                      `${softwareGroups.length} nhóm phần mềm khác nhau`
                    )
                  ),

                  // Card 4: Tỷ lệ tuân thủ & rủi ro
                  React.createElement(
                    "div",
                    { className: "sam-metric-giant border-amber-200 dark:border-amber-900/70 p-4 sm:p-4.5" },
                    React.createElement(
                      "div",
                      { className: "flex items-center justify-between" },
                      React.createElement("span", { className: "text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider" }, "⚖️ Điểm Tuân Thủ"),
                      React.createElement("span", { className: "text-xl" }, "🛡️")
                    ),
                    React.createElement(
                      "div",
                      { className: "text-3xl sm:text-4xl font-black text-amber-700 dark:text-amber-400 tracking-tight" },
                      metrics.complianceScore,
                      React.createElement("span", { className: "text-sm font-bold text-slate-500 dark:text-slate-400 ml-1.5" }, "%")
                    ),
                    React.createElement(
                      "p",
                      { className: "text-xs text-slate-500 dark:text-slate-400" },
                      `${metrics.missingInvoiceCount} phần mềm cần đối soát / rủi ro`
                    )
                  )
                ),

                // CHI TIẾT CÁC TẬP TIN ĐÃ NHẬN
                loadedFiles.length > 0 &&
                  React.createElement(
                    "div",
                    { className: "bg-white/90 dark:bg-slate-900/90 rounded-2xl p-5 sm:p-7 border border-blue-200/80 dark:border-blue-900/60 space-y-4 shadow-xs" },
                    React.createElement(
                      "div",
                      { className: "flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100 dark:border-slate-800" },
                      React.createElement(
                        "h4",
                        { className: "text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2" },
                        React.createElement("span", { className: "text-base" }, "📁"),
                        "Danh Sách ",
                        loadedFiles.length,
                        " Tập Tin Đã Nạp Từ Các Phòng Ban:"
                      ),
                      React.createElement(
                        "button",
                        {
                          onClick: handleExportMergedFile,
                          className: "text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1",
                        },
                        "⬇️ Tải 1 file Excel hợp nhất ngay"
                      )
                    ),
                    React.createElement(
                      "div",
                      { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" },
                      loadedFiles.map((file, idx) =>
                        React.createElement(
                          "div",
                          {
                            key: idx,
                            className: "p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-start gap-3 shadow-2xs",
                          },
                          React.createElement("span", { className: "text-2xl mt-0.5" }, "📄"),
                          React.createElement(
                            "div",
                            { className: "min-w-0 flex-1 text-xs" },
                            React.createElement("p", { className: "font-bold text-slate-900 dark:text-white truncate", title: file.name }, file.name),
                            React.createElement(
                              "div",
                              { className: "flex items-center gap-2.5 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap" },
                              file.size ? React.createElement("span", null, `${(file.size / 1024).toFixed(1)} KB`) : null,
                              React.createElement("span", { className: "font-bold text-blue-600 dark:text-blue-400" }, `${file.computersCount || 0} máy`),
                              React.createElement("span", { className: "font-bold text-emerald-600 dark:text-emerald-400" }, `${file.installationsCount || 0} phần mềm`)
                            )
                          )
                        )
                      )
                    )
                  ),

                // BẢNG TÓM TẮT CÁC MÁY TÍNH KHÔNG TRÙNG NHAU (UNIQUE COMPUTERS PREVIEW)
                computers.length > 0 &&
                  React.createElement(
                    "div",
                    { className: "bg-white/90 dark:bg-slate-900/90 rounded-2xl p-5 sm:p-7 border border-blue-200/80 dark:border-blue-900/60 space-y-4 shadow-xs" },
                    React.createElement(
                      "div",
                      { className: "flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100 dark:border-slate-800" },
                      React.createElement(
                        "h4",
                        { className: "text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2" },
                        React.createElement("span", { className: "text-base" }, "🖥️"),
                        "Danh Sách ",
                        computers.length,
                        " Máy Tính Duy Nhất (Đã Khử Trùng):"
                      ),
                      React.createElement(
                        "button",
                        {
                          onClick: () => setActiveTab('MACHINE_AUDIT'),
                          className: "text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer",
                        },
                        "Xem toàn bộ kiểm toán từng máy →"
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
                            React.createElement("th", { className: "px-4 py-3" }, "Hostname"),
                            React.createElement("th", { className: "px-4 py-3" }, "Người Dùng"),
                            React.createElement("th", { className: "px-4 py-3" }, "Phòng Ban"),
                            React.createElement("th", { className: "px-4 py-3" }, "Số Serial / Service Tag"),
                            React.createElement("th", { className: "px-4 py-3" }, "Model Phần Cứng"),
                            React.createElement("th", { className: "px-4 py-3 text-center" }, "Số Phần Mềm")
                          )
                        ),
                        React.createElement(
                          "tbody",
                          { className: "divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200" },
                          computers.slice(0, 8).map((comp, i) => {
                            const instCount = installations.filter(inst => (inst.hostname || '').toUpperCase() === (comp.hostname || '').toUpperCase()).length;
                            return React.createElement(
                              "tr",
                              { key: i, className: "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" },
                              React.createElement("td", { className: "px-4 py-3 font-mono font-bold text-blue-700 dark:text-blue-400" }, comp.hostname || "-"),
                              React.createElement("td", { className: "px-4 py-3 font-semibold" }, comp.user || "-"),
                              React.createElement("td", { className: "px-4 py-3" }, comp.department || "-"),
                              React.createElement("td", { className: "px-4 py-3 font-mono text-slate-700 dark:text-slate-300" }, comp.serialNumber || "-"),
                              React.createElement("td", { className: "px-4 py-3 text-slate-600 dark:text-slate-400" }, comp.model || "-"),
                              React.createElement(
                                "td",
                                { className: "px-4 py-3 text-center" },
                                React.createElement(
                                  "span",
                                  { className: "px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]" },
                                  instCount
                                )
                              )
                            );
                          })
                        )
                      )
                    ),
                    computers.length > 8 &&
                      React.createElement(
                        "div",
                        { className: "text-center pt-2" },
                        React.createElement(
                          "button",
                          {
                            onClick: () => setActiveTab('MACHINE_AUDIT'),
                            className: "text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer",
                          },
                          `+ Xem thêm ${computers.length - 8} máy tính khác trong tab Kiểm toán từng máy`
                        )
                      )
                  ),

                // QUICK JUMP ACTION BAR
                React.createElement(
                  "div",
                  { className: "flex items-center justify-between flex-wrap gap-3 pt-2" },
                  React.createElement(
                    "div",
                    { className: "flex items-center gap-2 flex-wrap" },
                    React.createElement(
                      "button",
                      {
                        onClick: () => setActiveTab('OVERVIEW'),
                        className: "px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5",
                      },
                      "📊 1. Báo Cáo Tổng Quan"
                    ),
                    React.createElement(
                      "button",
                      {
                        onClick: () => setActiveTab('SOFTWARE_MATRIX'),
                        className: "px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs flex items-center gap-1.5",
                      },
                      "📑 2. Ma Trận Phần Mềm"
                    ),
                    React.createElement(
                      "button",
                      {
                        onClick: () => setActiveTab('MACHINE_AUDIT'),
                        className: "px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs flex items-center gap-1.5",
                      },
                      "💻 3. Kiểm Toán Từng Máy"
                    )
                  ),
                  React.createElement(
                    "div",
                    { className: "flex items-center gap-2" },
                    React.createElement(
                      "button",
                      {
                        onClick: () => setShowPrintReportModal(true),
                        className: "px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5",
                      },
                      "🖨️ In Báo Cáo (BGĐ)"
                    )
                  )
                )
              )
            )
          : // WHEN IN REPORT MODE: Show sub-navigation and active report component
            React.createElement(
              "div",
              { className: "space-y-6" },

              // Top Breadcrumb & Report Navigation Bar
              React.createElement(
                "div",
                { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 print:hidden" },
                // Back to home button
                React.createElement(
                  "button",
                  {
                    onClick: () => setActiveTab('HOME'),
                    className: "px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 border border-slate-200 dark:border-slate-700 shrink-0",
                    title: "Quay về Bảng Nạp & Gộp File Kiểm Kê (Màn hình chính)",
                  },
                  React.createElement("span", { className: "text-base" }, "←"),
                  "Quay Lại Bảng Xử Lý File"
                ),
                // 5 Tab pills
                React.createElement(
                  "nav",
                  { className: "sam-segmented-nav shadow-none border-0 p-1 flex-1 overflow-x-auto", "aria-label": "Danh mục phân hệ báo cáo" },
                  [
                    { id: 'OVERVIEW', icon: '📊', label: '1. Báo Cáo Tổng Quan', badge: `${metrics.complianceScore}%` },
                    { id: 'SOFTWARE_MATRIX', icon: '📑', label: '2. Ma Trận Phần Mềm', badge: `${softwareGroups.length}` },
                    { id: 'MACHINE_AUDIT', icon: '💻', label: '3. Kiểm Toán Từng Máy', badge: `${computers.length}` },
                    { id: 'FOSS_PLAN', icon: '💡', label: '4. Kế Hoạch FOSS (0đ)', badge: `${metrics.replaceFoss}` },
                    { id: 'CATALOG_CONFIG', icon: '⚙️', label: '5. Quy Định Cài Đặt', badge: `${catalogRules.length}` },
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
                )
              ),

              // Active Report Component Rendering
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
            )
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
