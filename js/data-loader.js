// js/data-loader.js - Inventory Data Reader & Parser (Excel/CSV)
(function (global) {
  'use strict';

  /**
   * Parses inventory file (3 sheets or 1-2 sheets or CSV).
   * Detects Computers sheet, Installations sheet, and optional Catalog sheet (Sheet 3).
   */
  function parseInventoryWorkbook(buffer, activeCatalog, fileName) {
    if (typeof XLSX === 'undefined') {
      throw new Error('Thư viện XLSX chưa được nạp.');
    }

    const currentFileName = fileName || '';
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

    // 2. Identify Computer & Software sheets:
    // Cụ thể tìm sheet tên "1. Danh sach may tinh" và "2. Phan mem", các sheet khác không làm gì thêm
    let compSheetName = sheetNames.find(
      (s) => {
        const norm = removeAccents(s);
        return norm === "1. danh sach may tinh" ||
          norm.includes("1. danh sach may tinh") ||
          norm.includes("danh sach may tinh") ||
          (norm.startsWith("1.") && (norm.includes("may tinh") || norm.includes("computer") || norm.includes("thiet bi")));
      }
    );
    if (!compSheetName) {
      compSheetName = sheetNames.find(
        (s) =>
          s !== catalogSheetName &&
          (removeAccents(s).includes("may tinh") ||
            removeAccents(s).includes("computer") ||
            removeAccents(s).includes("thiet bi") ||
            removeAccents(s).startsWith("1."))
      );
    }

    let softSheetName = sheetNames.find(
      (s) => {
        const norm = removeAccents(s);
        return norm === "2. phan mem" ||
          norm.includes("2. phan mem") ||
          norm.includes("phan mem") ||
          (norm.startsWith("2.") && (norm.includes("phan mem") || norm.includes("software") || norm.includes("ung dung")));
      }
    );
    if (!softSheetName) {
      softSheetName = sheetNames.find(
        (s) =>
          s !== catalogSheetName &&
          (removeAccents(s).includes("software") ||
            removeAccents(s).includes("cai dat") ||
            removeAccents(s).includes("ung dung") ||
            removeAccents(s).startsWith("2."))
      );
    }

    let compMap = new Map(); // hostKey -> compObj
    let serialMap = new Map(); // serialKey -> compObj
    let modelMap = new Map(); // modelKey -> compObj
    let newComputers = [];
    let newInstalls = [];

    const matchFn = (global.SAM_AUDIT_ENGINE && global.SAM_AUDIT_ENGINE.matchSoftwareWithCatalog)
      ? global.SAM_AUDIT_ENGINE.matchSoftwareWithCatalog
      : (name, pub, cat) => ({ name, vendor: pub || 'Chưa rõ', licenseType: 'COMMERCIAL_PAID', auditRisk: 'LOW', estimatedPriceVND: 0 });

    if (compSheetName && softSheetName) {
      // Multiple specialized sheets: "1. Danh sach may tinh" (tiêu đề A4:L4) và "2. Phan mem" (tiêu đề A4:K4)
      // Dòng 4 là dòng tiêu đề (0-indexed: 3). Dùng range: 3 để bỏ qua 3 dòng tiêu đề banner phía trên
      const compSheet = workbook.Sheets[compSheetName];
      let compRows = [];
      try {
        compRows = XLSX.utils.sheet_to_json(compSheet, { range: 3, defval: "" });
        // Kiểm tra nếu không có dữ liệu do range lệch, fallback về đọc tự động
        if (!compRows || compRows.length === 0 || !Object.keys(compRows[0] || {}).some(k => k.toLowerCase().includes("máy") || k.toLowerCase().includes("host") || k.toLowerCase().includes("stt") || k.toLowerCase().includes("serial"))) {
          const autoRows = XLSX.utils.sheet_to_json(compSheet, { defval: "" });
          if (autoRows && autoRows.length > 0) {
            compRows = autoRows;
          }
        }
      } catch (err) {
        compRows = XLSX.utils.sheet_to_json(compSheet, { defval: "" });
      }

      compRows.forEach((row, idx) => {
        const host =
          getVal(row, ["tên máy tính (hostname)", "tên máy tính", "hostname", "tên máy", "máy tính", "pc name", "computer", "id máy"]) ||
          "";
        const serial = getVal(row, ["số serial / service tag", "số serial", "serial", "service tag", "serial number", "s/n", "service_tag"]) || "";
        const user = getVal(row, ["người sử dụng", "người dùng", "nhân viên", "user", "chủ sở hữu"]);
        const department = getVal(row, ["phòng ban", "bộ phận", "department"]);
        const os = getVal(row, ["hệ điều hành", "os", "windows", "hđh", "operating system"]);
        const model = getVal(row, ["model / cấu hình phần cứng", "model / cấu hình", "model", "cấu hình / model", "cấu hình phần cứng", "dòng máy", "cấu hình", "hardware model"]);
        const manufacturer = getVal(row, ["hãng sản xuất", "hãng", "nhà sản xuất", "manufacturer", "brand", "make"]);
        const cpu = getVal(row, ["vi xử lý (cpu)", "vi xử lý", "cpu", "processor", "chip"]);
        const ram = getVal(row, ["bộ nhớ ram", "bộ nhớ", "ram", "memory"]);
        const disk = getVal(row, ["ổ cứng lưu trữ", "ổ cứng", "disk", "storage", "ssd", "hdd"]);
        const vga = getVal(row, ["vga (card màn hình)", "vga", "card màn hình", "gpu", "graphics", "card đồ họa"]);

        // Chỉ gộp các dòng thực sự có dữ liệu (bỏ qua dòng trắng hoàn toàn)
        const hasData = (host && host.trim() !== "") ||
          (serial && serial.trim() !== "" && serial.trim().toUpperCase() !== "N/A") ||
          (model && model.trim() !== "" && model.trim().toUpperCase() !== "N/A") ||
          (user && user.trim() !== "" && user.trim() !== "Chưa gán") ||
          (cpu && cpu.trim() !== "" && cpu.trim().toUpperCase() !== "N/A");

        if (!hasData) return;

        const finalHost = host.trim() || (serial && serial !== "N/A" ? ("PC-" + serial.trim()) : ("PC-" + (newComputers.length + 1)));
        const finalSerial = (serial && serial.trim() !== "") ? serial.trim() : "N/A";
        const serialNorm = finalSerial.toUpperCase();
        const hostNorm = finalHost.toUpperCase();

        // Kiểm tra chống trùng lặp ngay trong sheet bằng cả Serial và Hostname
        let existing = null;
        if (finalSerial !== "N/A" && serialMap.has(serialNorm)) {
          existing = serialMap.get(serialNorm);
        } else if (compMap.has(hostNorm)) {
          existing = compMap.get(hostNorm);
        }

        if (existing) {
          // Cập nhật các trường còn trống
          if ((!existing.user || existing.user === "Chưa gán") && user) existing.user = user;
          if ((!existing.department || existing.department === "Chung") && department) existing.department = department;
          if ((!existing.os || existing.os === "N/A") && os) existing.os = os;
          if ((!existing.model || existing.model === "N/A") && model) existing.model = model;
          if ((!existing.serial || existing.serial === "N/A") && finalSerial !== "N/A") existing.serial = finalSerial;
          if ((!existing.manufacturer || existing.manufacturer === "N/A") && manufacturer) existing.manufacturer = manufacturer;
          if ((!existing.cpu || existing.cpu === "N/A") && cpu) existing.cpu = cpu;
          if ((!existing.ram || existing.ram === "N/A") && ram) existing.ram = ram;
          if ((!existing.disk || existing.disk === "N/A") && disk) existing.disk = disk;
          if ((!existing.vga || existing.vga === "N/A") && vga) existing.vga = vga;
          return;
        }

        const compObj = {
          hostname: finalHost,
          user: user || "Chưa gán",
          department: department || "Chung",
          os: os || "N/A",
          model: model || "N/A",
          serial: finalSerial,
          manufacturer: manufacturer || "N/A",
          cpu: cpu || "N/A",
          ram: ram || "N/A",
          disk: disk || "N/A",
          vga: vga || "N/A",
          sourceFile: currentFileName,
        };

        compMap.set(hostNorm, compObj);
        if (finalSerial !== "N/A") {
          serialMap.set(serialNorm, compObj);
        }
        if (model && model !== "N/A" && model.trim() !== "") {
          if (!modelMap.has(model.trim().toUpperCase())) {
            modelMap.set(model.trim().toUpperCase(), compObj);
          }
        }
        newComputers.push(compObj);
      });

      // Đọc sheet "2. Phan mem" với dòng tiêu đề A4:K4 (range: 3)
      const softSheet = workbook.Sheets[softSheetName];
      let softRows = [];
      try {
        softRows = XLSX.utils.sheet_to_json(softSheet, { range: 3, defval: "" });
        if (!softRows || softRows.length === 0 || !Object.keys(softRows[0] || {}).some(k => k.toLowerCase().includes("phần mềm") || k.toLowerCase().includes("name") || k.toLowerCase().includes("serial") || k.toLowerCase().includes("model"))) {
          const autoSoft = XLSX.utils.sheet_to_json(softSheet, { defval: "" });
          if (autoSoft && autoSoft.length > 0) {
            softRows = autoSoft;
          }
        }
      } catch (err) {
        softRows = XLSX.utils.sheet_to_json(softSheet, { defval: "" });
      }

      softRows.forEach((row, idx) => {
        const rawName = getVal(row, ["tên phần mềm (name)", "tên phần mềm", "phần mềm", "name", "software", "ứng dụng", "tên ứng dụng"]);
        if (!rawName || rawName.trim() === "") return;

        const rowSerial = getVal(row, ["serial", "số serial / service tag", "số serial", "số serial máy tính", "serial máy tính", "serial number", "service tag", "s/n"]);
        const rowModel = getVal(row, ["model", "model / cấu hình phần cứng", "model / cấu hình", "cấu hình / model", "model máy tính", "cấu hình", "dòng máy"]);
        const rowHost = getVal(row, ["tên máy tính (hostname)", "tên máy tính", "hostname", "tên máy", "máy tính", "pc name"]);
        const version = getVal(row, ["phiên bản (version)", "phiên bản", "version", "ver"]);
        const pub = getVal(row, ["nhà phát hành (publisher)", "nhà phát hành", "publisher", "hãng sản xuất", "hãng", "vendor"]);
        const installDate = getVal(row, ["ngày cài (install date)", "ngày cài", "ngày cài đặt", "install date", "date installed", "install_date"]);
        const size = getVal(row, ["dung lượng (size)", "dung lượng", "size", "kích thước"]);
        const architecture = getVal(row, ["kiến trúc", "architecture", "arch", "bit", "64-bit/32-bit"]);
        const scope = getVal(row, ["phạm vi", "scope", "user/machine"]);
        const installLocation = getVal(row, ["vị trí cài đặt (location)", "vị trí cài đặt", "location", "đường dẫn", "path", "install location"]);
        const uninstallString = getVal(row, ["chuỗi gỡ cài đặt (uninstall string)", "chuỗi gỡ cài đặt", "uninstall string", "gỡ cài đặt", "uninstall"]);

        // Resolve computer: ưu tiên Serial chính xác trước, sau đó tới Hostname, rồi tới Model duy nhất
        let comp = null;
        if (rowSerial && rowSerial !== "N/A" && serialMap.has(rowSerial.trim().toUpperCase())) {
          comp = serialMap.get(rowSerial.trim().toUpperCase());
        } else if (rowHost && compMap.has(rowHost.trim().toUpperCase())) {
          comp = compMap.get(rowHost.trim().toUpperCase());
        } else if (rowModel && rowModel !== "N/A" && modelMap.has(rowModel.trim().toUpperCase())) {
          comp = modelMap.get(rowModel.trim().toUpperCase());
        }

        if (!comp) {
          // Tạo máy tính đại diện nếu chưa có
          const host = rowHost || (rowSerial && rowSerial !== "N/A" ? ("PC-" + rowSerial.trim()) : ("PC-" + (newComputers.length + 1)));
          const finalSerial = (rowSerial && rowSerial.trim() !== "") ? rowSerial.trim() : "N/A";
          comp = {
            hostname: host,
            user: getVal(row, ["user", "người dùng", "nhân viên", "người sử dụng"]) || "Chưa gán",
            department: getVal(row, ["department", "phòng ban", "bộ phận"]) || "Chung",
            os: "N/A",
            serial: finalSerial,
            model: rowModel || "N/A",
            manufacturer: "N/A",
            cpu: "N/A",
            ram: "N/A",
            disk: "N/A",
            vga: "N/A",
            sourceFile: currentFileName,
          };
          compMap.set(host.toUpperCase(), comp);
          if (finalSerial !== "N/A") {
            serialMap.set(finalSerial.toUpperCase(), comp);
          }
          newComputers.push(comp);
        } else {
          if ((!comp.serial || comp.serial === 'N/A') && rowSerial && rowSerial !== "N/A") {
            comp.serial = rowSerial.trim();
            serialMap.set(rowSerial.trim().toUpperCase(), comp);
          }
          if ((!comp.model || comp.model === 'N/A') && rowModel && rowModel !== "N/A") {
            comp.model = rowModel.trim();
          }
        }

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

        const finalSerial = (comp && comp.serial && comp.serial !== 'N/A') ? comp.serial : (rowSerial || 'N/A');
        const finalModel = (comp && comp.model && comp.model !== 'N/A') ? comp.model : (rowModel || 'N/A');

        newInstalls.push({
          id: "imp_" + idx,
          computerHostname: comp.hostname,
          computerSerial: finalSerial,
          computerModel: finalModel,
          userName: comp.user || getVal(row, ["user", "người dùng", "người sử dụng"]) || "Chưa gán",
          department: comp.department || getVal(row, ["department", "phòng ban"]) || "Chung",
          rawSoftwareName: rawName,
          displayName: matched ? matched.name : rawName,
          version: version || "N/A",
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
          invoiceNumber: getVal(row, ["số hóa đơn", "ghi chú", "số hóa đơn vat"]),
          isTrap: matched ? matched.isTrap : false,
          installDate: installDate || "",
          size: size || "",
          architecture: architecture || "",
          scope: scope || "",
          installLocation: installLocation || "",
          uninstallString: uninstallString || "",
          sourceFile: currentFileName,
        });
      });
    } else {
      // Single combined sheet (or CSV)
      const sheetToUse =
        sheetNames[0] === catalogSheetName && sheetNames.length > 1
          ? sheetNames[1]
          : sheetNames[0];
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetToUse], { defval: "" });

      rows.forEach((row, idx) => {
        const rawName = getVal(row, ["tên phần mềm (name)", "tên phần mềm", "phần mềm", "software", "name"]);
        const host =
          getVal(row, ["tên máy tính (hostname)", "hostname", "tên máy", "máy tính", "host"]) || "PC-" + (idx + 1);
        const pub = getVal(row, ["nhà phát hành (publisher)", "hãng", "vendor", "nhà sản xuất", "publisher"]);
        const rowSerial = getVal(row, ["serial", "số serial / service tag", "số serial máy tính", "serial máy tính", "số serial", "serial number", "s/n"]);
        const rowModel = getVal(row, ["model", "model / cấu hình phần cứng", "model / cấu hình", "cấu hình / model", "model máy tính", "cấu hình", "dòng máy"]);
        const installDate = getVal(row, ["ngày cài (install date)", "ngày cài", "ngày cài đặt", "install date", "date installed"]);
        const size = getVal(row, ["dung lượng (size)", "dung lượng", "size", "kích thước"]);
        const architecture = getVal(row, ["kiến trúc", "architecture", "arch", "bit"]);
        const scope = getVal(row, ["phạm vi", "scope", "user/machine"]);
        const installLocation = getVal(row, ["vị trí cài đặt (location)", "vị trí cài đặt", "location", "đường dẫn", "path"]);
        const uninstallString = getVal(row, ["chuỗi gỡ cài đặt (uninstall string)", "chuỗi gỡ cài đặt", "uninstall string", "gỡ cài đặt", "uninstall"]);

        if (rawName) {
          const norm = host.toUpperCase();
          if (!compMap.has(norm)) {
            const compObj = {
              hostname: host,
              user: getVal(row, ["người sử dụng", "user", "người dùng", "nhân viên"]) || "Chưa gán",
              department: getVal(row, ["phòng ban", "department"]),
              os: getVal(row, ["hệ điều hành", "os"]),
              model: rowModel || getVal(row, ["model / cấu hình phần cứng", "model", "cấu hình"]) || "N/A",
              serial: rowSerial || getVal(row, ["số serial / service tag", "serial", "số serial", "serial number", "s/n"]) || "N/A",
              manufacturer: getVal(row, ["hãng sản xuất", "hãng", "nhà sản xuất", "manufacturer", "brand", "make"]),
              cpu: getVal(row, ["vi xử lý (cpu)", "cpu", "vi xử lý", "processor"]),
              ram: getVal(row, ["bộ nhớ ram", "ram", "bộ nhớ", "memory"]),
              disk: getVal(row, ["ổ cứng lưu trữ", "ổ cứng", "disk", "storage", "ssd", "hdd"]),
              vga: getVal(row, ["vga (card màn hình)", "vga", "card màn hình", "gpu", "graphics"]),
              sourceFile: currentFileName,
            };
            compMap.set(norm, compObj);
            newComputers.push(compObj);
          } else {
            const existing = compMap.get(norm);
            if ((!existing.serial || existing.serial === 'N/A') && rowSerial) {
              existing.serial = rowSerial;
            }
            if ((!existing.model || existing.model === 'N/A') && rowModel) {
              existing.model = rowModel;
            }
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

          const finalSerial = (comp && comp.serial && comp.serial !== 'N/A') ? comp.serial : (rowSerial || 'N/A');
          const finalModel = (comp && comp.model && comp.model !== 'N/A') ? comp.model : (rowModel || 'N/A');

          newInstalls.push({
            id: "imp_" + idx,
            computerHostname: host,
            computerSerial: finalSerial,
            computerModel: finalModel,
            userName: comp.user,
            department: comp.department,
            rawSoftwareName: rawName,
            displayName: matched ? matched.name : rawName,
            version: getVal(row, ["phiên bản (version)", "version", "phiên bản"]) || "N/A",
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
            installDate: installDate || "",
            size: size || "",
            architecture: architecture || "",
            scope: scope || "",
            installLocation: installLocation || "",
            uninstallString: uninstallString || "",
            sourceFile: currentFileName,
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
   * Reads multiple inventory files (File[] or FileList), parses each,
   * merges computers (deduplicating by hostname and merging specs/serial/model),
   * merges installations (tagging with sourceFile, computerSerial, computerModel),
   * and merges custom catalog rules if present.
   */
  async function loadMultipleInventoryFiles(fileList, activeCatalog) {
    if (!fileList || fileList.length === 0) {
      throw new Error('Vui lòng chọn ít nhất một tập tin kiểm kê hợp lệ (.xlsx, .xls, .csv)');
    }
    const files = Array.from(fileList);
    const allComputers = [];
    const compMap = new Map(); // uppercase hostname -> computer
    const serialMap = new Map(); // uppercase serial -> computer
    const allInstalls = [];
    let detectedCatalogRules = null;
    let catalogToUse = activeCatalog || [];
    const loadedFiles = [];

    for (let fIdx = 0; fIdx < files.length; fIdx++) {
      const file = files[fIdx];
      const buffer = await file.arrayBuffer();
      const parsed = parseInventoryWorkbook(buffer, catalogToUse, file.name);

      if (parsed.detectedCatalogRules && parsed.detectedCatalogRules.length > 0) {
        detectedCatalogRules = parsed.detectedCatalogRules;
        catalogToUse = detectedCatalogRules;
      }

      let compsAddedThisFile = 0;
      (parsed.computers || []).forEach((comp) => {
        const hostKey = (comp.hostname || '').trim().toUpperCase();
        const serialKey = (comp.serial && comp.serial !== 'N/A' && comp.serial.trim() !== '') ? comp.serial.trim().toUpperCase() : null;
        if (!hostKey && !serialKey) return;

        // Tìm kiếm máy tính đã tồn tại dựa vào Serial Number trước, sau đó Hostname
        let existing = null;
        if (serialKey && serialMap.has(serialKey)) {
          existing = serialMap.get(serialKey);
        } else if (hostKey && compMap.has(hostKey)) {
          existing = compMap.get(hostKey);
        }

        if (!existing) {
          const compCopy = { ...comp, sourceFile: file.name };
          if (hostKey) compMap.set(hostKey, compCopy);
          if (serialKey) serialMap.set(serialKey, compCopy);
          allComputers.push(compCopy);
          compsAddedThisFile++;
        } else {
          // Merge missing details vào máy đã tồn tại (tránh trùng lặp 70 máy cùng serial)
          ['user', 'department', 'os', 'model', 'serial', 'manufacturer', 'cpu', 'ram', 'disk', 'vga'].forEach((field) => {
            if ((!existing[field] || existing[field] === 'N/A' || existing[field] === 'Chưa gán') && comp[field] && comp[field] !== 'N/A' && comp[field] !== 'Chưa gán') {
              existing[field] = comp[field];
            }
          });
          if (comp.sourceFile && existing.sourceFile && !existing.sourceFile.includes(comp.sourceFile)) {
            existing.sourceFile += ', ' + comp.sourceFile;
          }
          if (hostKey && !compMap.has(hostKey)) {
            compMap.set(hostKey, existing);
          }
          if (serialKey && !serialMap.has(serialKey)) {
            serialMap.set(serialKey, existing);
          }
        }
      });

      let installsAddedThisFile = 0;
      (parsed.installations || []).forEach((inst, iIdx) => {
        const hostKey = (inst.computerHostname || '').trim().toUpperCase();
        const serialKey = (inst.computerSerial && inst.computerSerial !== 'N/A' && inst.computerSerial.trim() !== '') ? inst.computerSerial.trim().toUpperCase() : null;
        const comp = (serialKey && serialMap.get(serialKey)) || (hostKey && compMap.get(hostKey));

        const mergedHost = (comp && comp.hostname) ? comp.hostname : inst.computerHostname;
        const mergedSerial = (comp && comp.serial && comp.serial !== 'N/A') ? comp.serial : (inst.computerSerial || 'N/A');
        const mergedModel = (comp && comp.model && comp.model !== 'N/A') ? comp.model : (inst.computerModel || 'N/A');
        const mergedUser = (comp && comp.user && comp.user !== 'Chưa gán') ? comp.user : (inst.userName || 'Chưa gán');
        const mergedDept = (comp && comp.department && comp.department !== 'Chung') ? comp.department : (inst.department || 'Chung');

        allInstalls.push({
          ...inst,
          id: `imp_f${fIdx}_${iIdx}`,
          computerHostname: mergedHost,
          computerSerial: mergedSerial,
          computerModel: mergedModel,
          userName: mergedUser,
          department: mergedDept,
          sourceFile: file.name,
        });
        installsAddedThisFile++;
      });

      loadedFiles.push({
        name: file.name,
        size: file.size,
        computersCount: compsAddedThisFile || (parsed.computers || []).length,
        installationsCount: installsAddedThisFile,
      });
    }

    return {
      files: loadedFiles,
      computers: allComputers,
      installations: allInstalls,
      detectedCatalogRules,
      sheet3Rules: detectedCatalogRules,
    };
  }

  /**
   * Reads inventory File object and parses workbook (accepts single file or delegates)
   */
  async function loadInventoryFile(file, activeCatalog) {
    if (!file) {
      throw new Error('Vui lòng chọn tập tin kiểm kê hợp lệ (.xlsx, .xls, .csv)');
    }
    return loadMultipleInventoryFiles([file], activeCatalog);
  }

  global.SAM_DATA_LOADER = {
    parseInventoryWorkbook,
    loadInventoryFile,
    loadMultipleInventoryFiles,
  };

})(typeof window !== 'undefined' ? window : this);
