// js/audit-engine.js - Core Business Logic, Matching and SAM Metrics Engine
(function (global) {
  'use strict';

  /**
   * Exact matching logic as requested by user prompt.
   * Do not modify or alter the matching algorithm.
   */
  function matchSoftwareWithCatalog(rawName, rawPub, customCatalog) {
    const cleanName = (rawName || "").toLowerCase().trim();
    const cleanPub = (rawPub || "").toLowerCase().trim();
    const fallbackCatalog = (global.SAM_CONSTANTS && global.SAM_CONSTANTS.FALLBACK_CATALOG) || [];
    const activeCatalog = customCatalog && customCatalog.length > 0 ? customCatalog : fallbackCatalog;

    for (const item of activeCatalog) {
      if (
        item.keywords &&
        item.keywords.some(
          (kw) =>
            kw &&
            (cleanName.includes(kw.toLowerCase().trim()) ||
              cleanPub.includes(kw.toLowerCase().trim()))
        )
      ) {
        return item;
      }
      if (
        item.name &&
        (cleanName.includes(item.name.toLowerCase().trim()) ||
          item.name.toLowerCase().trim().includes(cleanName))
      ) {
        return item;
      }
    }

    return {
      id: "unclassified_" + cleanName.replace(/[^a-z0-9]/g, ""),
      name: rawName,
      keywords: [cleanName],
      vendor: rawPub && rawPub !== "Chưa rõ" ? rawPub : "Nội bộ / Chưa xác định",
      category: "Ứng dụng nội bộ / Khác",
      licenseType: "FREE_OPEN_SOURCE",
      auditRisk: "LOW",
      suggestedAction: "ALLOW_FREE",
      actionDetails: "Phần mềm nội bộ hoặc công cụ freeware chưa có trong danh mục. Được tính 0đ an toàn.",
      recommendedAlternative: "Xác nhận trong Tab Quy Định / Sheet 3",
      estimatedPriceVND: 0,
      isTrap: false,
    };
  }

  /**
   * Re-evaluates installations whenever catalog changes
   */
  function applyCatalogToInstallations(installations, catalogList) {
    return (installations || []).map((inst) => {
      const matched = matchSoftwareWithCatalog(inst.rawSoftwareName, inst.vendor, catalogList);
      const isFree = matched.licenseType === "FREE_OPEN_SOURCE";
      return {
        ...inst,
        displayName: matched.name || inst.displayName,
        category: matched.category || inst.category,
        licenseType: matched.licenseType || inst.licenseType,
        auditRisk: isFree ? "LOW" : matched.auditRisk || inst.auditRisk,
        suggestedAction: isFree ? "ALLOW_FREE" : matched.suggestedAction || inst.suggestedAction,
        actionDetails: matched.actionDetails || inst.actionDetails,
        recommendedAlternative: matched.recommendedAlternative || inst.recommendedAlternative,
        estimatedPriceVND: isFree
          ? 0
          : matched.estimatedPriceVND !== undefined
            ? matched.estimatedPriceVND
            : inst.estimatedPriceVND,
        invoiceStatus: isFree ? "NOT_APPLICABLE" : inst.invoiceStatus,
        isTrap: matched.isTrap || false,
      };
    });
  }

  /**
   * Groups installations by displayName and computes counts
   */
  function groupSoftware(installations) {
    const map = new Map();
    (installations || []).forEach((inst) => {
      const key = inst.displayName;
      if (!map.has(key)) {
        map.set(key, {
          displayName: inst.displayName,
          vendor: inst.vendor || "Chưa rõ",
          category: inst.category,
          licenseType: inst.licenseType,
          auditRisk: inst.auditRisk,
          suggestedAction: inst.suggestedAction,
          actionDetails: inst.actionDetails,
          recommendedAlternative: inst.recommendedAlternative,
          estimatedPriceVND: inst.estimatedPriceVND,
          installedCount: 0,
          hasInvoiceCount: 0,
          missingInvoiceCount: 0,
          fossCount: 0,
          isTrap: inst.isTrap,
        });
      }
      const g = map.get(key);
      g.installedCount += 1;
      if (inst.licenseType === "FREE_OPEN_SOURCE" || inst.invoiceStatus === "NOT_APPLICABLE") {
        g.fossCount += 1;
      } else if (inst.invoiceStatus === "HAS_INVOICE") {
        g.hasInvoiceCount += 1;
      } else {
        g.missingInvoiceCount += 1;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.installedCount - a.installedCount);
  }

  /**
   * Calculates overall SAM compliance metrics
   */
  function calculateMetrics(computers, installations, softwareGroups) {
    let totalEstimatedCost = 0;
    let totalFossSavings = 0;
    let highRisk = 0;
    let criticalRisk = 0;
    let replaceFoss = 0;
    let trapCount = 0;

    (installations || []).forEach((inst) => {
      if (inst.licenseType !== "FREE_OPEN_SOURCE") {
        if (
          inst.suggestedAction === "PURCHASE_LICENSE" ||
          (inst.suggestedAction === "VERIFY_INVOICE" && inst.invoiceStatus === "MISSING_INVOICE")
        ) {
          totalEstimatedCost += inst.estimatedPriceVND;
        }
        if (inst.suggestedAction === "REPLACE_WITH_FOSS") {
          totalFossSavings += inst.estimatedPriceVND;
          replaceFoss++;
        }
      }
      if (inst.auditRisk === "HIGH") highRisk++;
      if (inst.auditRisk === "CRITICAL") criticalRisk++;
      if (inst.isTrap) trapCount++;
    });

    const total = (installations && installations.length) || 1;
    const penalty = criticalRisk * 2 + highRisk * 1 + trapCount * 1.5;
    const complianceScore = Math.max(0, Math.min(100, Math.round(100 - (penalty / total) * 60)));

    return {
      totalComputers: (computers && computers.length) || 0,
      totalInstalls: (installations && installations.length) || 0,
      uniqueSoftware: (softwareGroups && softwareGroups.length) || 0,
      complianceScore,
      totalEstimatedCost,
      totalFossSavings,
      highRisk,
      criticalRisk,
      replaceFoss,
      trapCount,
    };
  }

  /**
   * Computes KPI breakdown (violation, verify, valid, netInvestment)
   */
  function calculateKpiBreakdown(installations, metrics) {
    let violation = 0;
    let verify = 0;
    let valid = 0;

    (installations || []).forEach((inst) => {
      const isFree =
        inst.licenseType === "FREE_OPEN_SOURCE" || inst.invoiceStatus === "NOT_APPLICABLE";
      if (isFree || inst.invoiceStatus === "HAS_INVOICE") {
        valid++;
      } else if (inst.isTrap || inst.licenseType === "FREE_PERSONAL_ONLY") {
        verify++;
      } else {
        violation++;
      }
    });

    const netInvestment = (metrics.totalEstimatedCost || 0) - (metrics.totalFossSavings || 0);
    return { violation, verify, valid, netInvestment };
  }

  /**
   * Generates Executive Plan Table rows for the Board of Directors
   */
  function generateExecutivePlanRows(softwareGroups) {
    return (softwareGroups || []).map((g, idx) => {
      const rawLower = g.displayName.toLowerCase();
      let riskLabel = "Thấp";
      let riskColor = "bg-slate-100 text-slate-700 border-slate-300";

      if (rawLower.includes("crack") || rawLower.includes("kms") || rawLower.includes("patch")) {
        riskLabel = "Cực Kỳ Nghiêm Trọng";
        riskColor = "bg-rose-100 text-rose-800 border-rose-300 font-bold";
      } else if (g.auditRisk === "CRITICAL" || rawLower.includes("autocad")) {
        riskLabel = "Rất Cao";
        riskColor = "bg-red-100 text-red-700 border-red-300 font-bold";
      } else if (
        g.auditRisk === "HIGH" ||
        rawLower.includes("office") ||
        rawLower.includes("windows") ||
        rawLower.includes("adobe")
      ) {
        riskLabel = "Cao";
        riskColor = "bg-amber-100 text-amber-800 border-amber-300 font-bold";
      } else if (
        g.isTrap ||
        g.licenseType === "FREE_PERSONAL_ONLY" ||
        rawLower.includes("winrar") ||
        rawLower.includes("teamviewer")
      ) {
        riskLabel = "Trung Bình";
        riskColor = "bg-yellow-100 text-yellow-800 border-yellow-300 font-bold";
      } else if (g.licenseType === "FREE_OPEN_SOURCE") {
        riskLabel = "An Toàn";
        riskColor = "bg-emerald-100 text-emerald-800 border-emerald-300";
      }

      let recommendation = g.actionDetails || "";
      if (rawLower.includes("office")) {
        recommendation = `Mua mới ${g.missingInvoiceCount || 1} bản Office 365, Chuyển các máy phụ sang Google Sheets / OnlyOffice`;
      } else if (rawLower.includes("windows")) {
        recommendation = `Mua bổ sung bản quyền Windows Pro OEM cho ${g.missingInvoiceCount || 1} máy`;
      } else if (rawLower.includes("autocad")) {
        recommendation = `Mua thêm ${Math.max(1, g.missingInvoiceCount - 2)} bản AutoCAD; ${Math.min(2, g.missingInvoiceCount)} máy còn lại chuyển sang DWG TrueView (Free)`;
      } else if (
        rawLower.includes("photoshop") ||
        rawLower.includes("illustrator") ||
        rawLower.includes("adobe")
      ) {
        recommendation = `Mua 1 gói Adobe CC; các máy phụ chuyển sang Canva/GIMP/Photopea`;
      } else if (rawLower.includes("winrar")) {
        recommendation = `Gỡ bỏ 100%, Thay thế toàn bộ bằng 7-Zip (Miễn phí 100%)`;
      } else if (rawLower.includes("crack") || rawLower.includes("kms")) {
        recommendation = `Gỡ bỏ & Xóa công cụ ngay lập tức, quét sạch Virus toàn hệ thống`;
      } else if (
        rawLower.includes("driver booster") ||
        rawLower.includes("uninstaller") ||
        rawLower.includes("ccleaner")
      ) {
        recommendation = `Gỡ bỏ do không phục vụ công việc và gây rác hệ thống`;
      } else if (g.licenseType === "FREE_OPEN_SOURCE") {
        recommendation = `Hợp lệ, an toàn cho doanh nghiệp (0đ)`;
      }

      const unitPrice = g.licenseType === "FREE_OPEN_SOURCE" ? 0 : g.estimatedPriceVND;
      const totalEstimated = (g.missingInvoiceCount || 0) * unitPrice;

      return {
        stt: idx + 1,
        name: g.displayName,
        installedCount: g.installedCount,
        hasInvoiceCount: g.hasInvoiceCount,
        missingInvoiceCount: g.missingInvoiceCount,
        riskLabel,
        riskColor,
        recommendation,
        unitPrice,
        totalEstimated,
      };
    });
  }

  global.SAM_AUDIT_ENGINE = {
    matchSoftwareWithCatalog,
    applyCatalogToInstallations,
    groupSoftware,
    calculateMetrics,
    calculateKpiBreakdown,
    generateExecutivePlanRows
  };

})(typeof window !== 'undefined' ? window : this);
