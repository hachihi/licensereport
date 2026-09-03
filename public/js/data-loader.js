// js/data-loader.js - Inventory Data Reader & Parser (Excel/CSV)
(function (global) {
  'use strict';

  /**
   * Parses inventory file (3 sheets or 1-2 sheets or CSV).
   * Detects Computers sheet, Installations sheet, and optional Catalog sheet (Sheet 3).
   */
  function parseInventoryWorkbook(buffer, activeCatalog) {
    if (typeof XLSX === 'undefined') {
      throw new Error('Thư viện XLSX chưa được nạp.');
    }

    const data = new Uint8Array(buffer);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetNames = workbook.SheetNames;

    const removeAccents = (global.SAM_UTILS && global.SAM_UTILS.removeAccents)
      ? global.SAM_UTILS.removeAccents
      : (str) => String(str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    const getVal = (global.SAM_UTILS && global.SAM_UTILS.getVal)
      ? global.SAM_UTILS.getVal
      : (row, candidates) => {
          const keys = Object.keys(row || {});
          for (const cand of candidates) {
            const cleanCand = removeAccents(cand);
            const foundKey = keys.find(k => removeAccents(k) === cleanCand || removeAccents(k).includes(cleanCand));
            if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
              return String(row[foundKey]).trim();
            }
          }
          return '';
        };

    // 1. Check if file includes a Catalog Sheet (Priority #2)
    let catalogSheetName = sheetNames.find((s) => {
      const c = removeAccents(s);
      return (
        c.includes("danh muc") ||
        c.includes("catalog") ||
        c.includes("tu dien") ||
        c.includes("tieu chuan") ||
        c.includes("quy dinh")
      );
    });

    let detectedCatalogRules = null;
    let catalogToUse = activeCatalog || [];

    if (catalogSheetName) {
      try {
        const parsedCatalog = global.SAM_CATALOG_LOADER.parseCatalogWorkbook(buffer);
        if (parsedCatalog && parsedCatalog.rules && parsedCatalog.rules.length > 0) {
          detectedCatalogRules = parsedCatalog.rules;
          catalogToUse = detectedCatalogRules;
        }
      } catch (e) {
        console.warn('Lỗi đọc catalog từ file kiểm kê:', e);
      }
    }

    // 2. Identify Computer & Software sheets
    let compSheetName = sheetNames.find(
      (s) =>
        s !== catalogSheetName &&
        (removeAccents(s).includes("may") ||
          removeAccents(s).includes("computer") ||
          removeAccents(s).includes("thiet bi"))
    );

    let softSheetName = sheetNames.find(
      (s) =>
        s !== catalogSheetName &&
        (removeAccents(s).includes("phan mem") ||
          removeAccents(s).includes("software") ||
          removeAccents(s).includes("cai dat"))
    );

    let compMap = new Map();
    let newComputers = [];
    let newInstalls = [];

    const matchFn = (global.SAM_AUDIT_ENGINE && global.SAM_AUDIT_ENGINE.matchSoftwareWithCatalog)
      ? global.SAM_AUDIT_ENGINE.matchSoftwareWithCatalog
      : (name, pub, cat) => ({ name, vendor: pub || 'Chưa rõ', licenseType: 'COMMERCIAL_PAID', auditRisk: 'LOW', estimatedPriceVND: 0 });

    if (compSheetName && softSheetName) {
      // Multiple specialized sheets
      const compRows = XLSX.utils.sheet_to_json(workbook.Sheets[compSheetName], { defval: "" });
      compRows.forEach((row, idx) => {
        const host =
          getVal(row, ["hostname", "tên máy", "máy tính", "pc name", "computer", "id máy"]) ||
          "PC-" + (idx + 1);
        const norm = host.toUpperCase();
        const compObj = {
          hostname: host,
          user: getVal(row, ["user", "người dùng", "nhân viên", "người sử dụng"]),
          department: getVal(row, ["department", "phòng ban", "bộ phận"]),
          os: getVal(row, ["os", "hệ điều hành", "windows"]),
          model: getVal(row, ["model", "cấu hình", "dòng máy"]),
          serial: getVal(row, ["serial", "số serial", "serial number", "s/n"]) || "N/A",
        };
        compMap.set(norm, compObj);
        newComputers.push(compObj);
      });

      const softRows = XLSX.utils.sheet_to_json(workbook.Sheets[softSheetName], { defval: "" });
      softRows.forEach((row, idx) => {
        const host = getVal(row, ["hostname", "tên máy", "máy tính", "pc name"]) || "KT-PC-01";
        const rawName = getVal(row, ["tên phần mềm", "phần mềm", "software", "ứng dụng"]);
        const pub = getVal(row, ["hãng", "vendor", "nhà sản xuất", "publisher"]);

        if (rawName) {
          const norm = host.toUpperCase();
          const comp = compMap.get(norm) || {
            hostname: host,
            user: "Chưa gán",
            department: "Chung",
            serial: getVal(row, ["serial", "số serial", "serial number", "s/n"]) || "N/A",
          };

          const matched = matchFn(rawName, pub, catalogToUse);
          const isFree = matched.licenseType === "FREE_OPEN_SOURCE";
          const invRaw = getVal(row, ["hóa đơn", "tình trạng hóa đơn", "invoice", "status"]);

          let invStatus = "MISSING_INVOICE";
          if (isFree) {
            invStatus = "NOT_APPLICABLE";
          } else if (
            invRaw &&
            (invRaw.toLowerCase().includes("có") || invRaw.toLowerCase().includes("yes"))
          ) {
            invStatus = "HAS_INVOICE";
          }

          newInstalls.push({
            id: "imp_" + idx,
            computerHostname: host,
            userName: comp.user || getVal(row, ["user", "người dùng"]),
            department: comp.department || getVal(row, ["department", "phòng ban"]),
            rawSoftwareName: rawName,
            displayName: matched ? matched.name : rawName,
            version: getVal(row, ["version", "phiên bản"]) || "N/A",
            vendor: matched ? matched.vendor : pub || "Chưa rõ",
            category: matched ? matched.category : "Ứng dụng",
            licenseType: matched ? matched.licenseType : "COMMERCIAL_PAID",
            auditRisk: isFree ? "LOW" : matched ? matched.auditRisk : "LOW",
            suggestedAction: isFree
              ? "ALLOW_FREE"
              : matched
                ? matched.suggestedAction
                : "VERIFY_INVOICE",
            actionDetails: matched ? matched.actionDetails : "",
            recommendedAlternative: matched ? matched.recommendedAlternative : "N/A",
            estimatedPriceVND: isFree ? 0 : matched ? matched.estimatedPriceVND : 0,
            invoiceStatus: invStatus,
            invoiceNumber: getVal(row, ["số hóa đơn", "ghi chú"]),
            isTrap: matched ? matched.isTrap : false,
          });
        }
      });
    } else {
      // Single combined sheet (or CSV)
      const sheetToUse =
        sheetNames[0] === catalogSheetName && sheetNames.length > 1
          ? sheetNames[1]
          : sheetNames[0];
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetToUse], { defval: "" });

      rows.forEach((row, idx) => {
        const host =
          getVal(row, ["hostname", "tên máy", "máy tính", "host"]) || "PC-" + (idx + 1);
        const rawName = getVal(row, ["tên phần mềm", "phần mềm", "software"]);
        const pub = getVal(row, ["hãng", "vendor", "nhà sản xuất", "publisher"]);

        if (rawName) {
          const norm = host.toUpperCase();
          if (!compMap.has(norm)) {
            const compObj = {
              hostname: host,
              user: getVal(row, ["user", "người dùng", "nhân viên"]),
              department: getVal(row, ["department", "phòng ban"]),
              os: getVal(row, ["os", "hệ điều hành"]),
              model: getVal(row, ["model", "cấu hình"]),
              serial: getVal(row, ["serial", "số serial", "serial number", "s/n"]) || "N/A",
            };
            compMap.set(norm, compObj);
            newComputers.push(compObj);
          }
          const comp = compMap.get(norm);
          const matched = matchFn(rawName, pub, catalogToUse);
          const isFree = matched.licenseType === "FREE_OPEN_SOURCE";
          const invRaw = getVal(row, ["hóa đơn", "tình trạng hóa đơn", "invoice"]);
          
          let invStatus = "MISSING_INVOICE";
          if (isFree) {
            invStatus = "NOT_APPLICABLE";
          } else if (
            invRaw &&
            (invRaw.toLowerCase().includes("có") || invRaw.toLowerCase().includes("yes"))
          ) {
            invStatus = "HAS_INVOICE";
          }

          newInstalls.push({
            id: "imp_" + idx,
            computerHostname: host,
            userName: comp.user,
            department: comp.department,
            rawSoftwareName: rawName,
            displayName: matched ? matched.name : rawName,
            version: getVal(row, ["version", "phiên bản"]) || "N/A",
            vendor: matched ? matched.vendor : pub || "Chưa rõ",
            category: matched ? matched.category : "Ứng dụng",
            licenseType: matched ? matched.licenseType : "COMMERCIAL_PAID",
            auditRisk: isFree ? "LOW" : matched ? matched.auditRisk : "LOW",
            suggestedAction: isFree
              ? "ALLOW_FREE"
              : matched
                ? matched.suggestedAction
                : "VERIFY_INVOICE",
            actionDetails: matched ? matched.actionDetails : "",
            recommendedAlternative: matched ? matched.recommendedAlternative : "N/A",
            estimatedPriceVND: isFree ? 0 : matched ? matched.estimatedPriceVND : 0,
            invoiceStatus: invStatus,
            invoiceNumber: getVal(row, ["số hóa đơn", "ghi chú"]),
            isTrap: matched ? matched.isTrap : false,
          });
        }
      });
    }

    return {
      computers: newComputers,
      installations: newInstalls,
      detectedCatalogRules,
      sheet3Rules: detectedCatalogRules,
      catalogSheetName
    };
  }

  /**
   * Reads inventory File object and parses workbook
   */
  async function loadInventoryFile(file, activeCatalog) {
    if (!file) {
      throw new Error('Vui lòng chọn tập tin kiểm kê hợp lệ (.xlsx, .xls, .csv)');
    }
    const buffer = await file.arrayBuffer();
    return parseInventoryWorkbook(buffer, activeCatalog);
  }

  global.SAM_DATA_LOADER = {
    parseInventoryWorkbook,
    loadInventoryFile
  };

})(typeof window !== 'undefined' ? window : this);
