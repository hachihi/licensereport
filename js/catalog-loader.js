// js/catalog-loader.js - Specialized Catalog Reader and Parser
(function (global) {
  'use strict';

  /**
   * Parses workbook buffer into catalog rules array and catalog info object.
   * Supports standard Sheet "Catalog" and metadata Sheet "Catalog_Info".
   * Also supports legacy sheet aliases like "Danh Mục", "Từ Điển", "Tiêu Chuẩn".
   */
  function parseCatalogWorkbook(buffer) {
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

    // 1. Extract Metadata from Catalog_Info if present
    let catalogInfo = {
      name: 'Hachihi SAM Standard',
      version: '2026.09',
      updated: '03/09/2026',
      author: 'Hachihi',
      description: 'Danh mục tiêu chuẩn bản quyền'
    };

    const infoSheetName = sheetNames.find(s => {
      const c = removeAccents(s);
      return c.includes('info') || c.includes('thong tin') || c.includes('metadata');
    });

    if (infoSheetName) {
      try {
        const infoRows = XLSX.utils.sheet_to_json(workbook.Sheets[infoSheetName], { defval: '' });
        infoRows.forEach(r => {
          const field = removeAccents(r.Field || r['Trường'] || r['Thuộc tính'] || Object.values(r)[0]);
          const val = r.Value || r['Giá trị'] || Object.values(r)[1];
          if (field && val) {
            if (field.includes('name') || field.includes('ten')) catalogInfo.name = String(val).trim();
            if (field.includes('version') || field.includes('phien ban')) catalogInfo.version = String(val).trim();
            if (field.includes('update') || field.includes('ngay')) catalogInfo.updated = String(val).trim();
            if (field.includes('author') || field.includes('tac gia')) catalogInfo.author = String(val).trim();
            if (field.includes('desc') || field.includes('mo ta')) catalogInfo.description = String(val).trim();
          }
        });
      } catch (err) {
        console.warn('Lỗi đọc sheet Catalog_Info:', err);
      }
    }

    // 2. Locate Catalog Sheet
    let catalogSheetName = sheetNames.find(s => {
      const c = removeAccents(s);
      return c === 'catalog' || c.includes('danh muc') || c.includes('catalog') || c.includes('tu dien') || c.includes('tieu chuan') || c.includes('quy dinh');
    });

    if (!catalogSheetName) {
      // Fallback: use first sheet if not info
      catalogSheetName = sheetNames[0] !== infoSheetName ? sheetNames[0] : (sheetNames[1] || sheetNames[0]);
    }

    const sheet = workbook.Sheets[catalogSheetName];
    if (!sheet) {
      throw new Error(`Không tìm thấy sheet danh mục (${catalogSheetName})`);
    }

    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    const rules = [];

    rows.forEach((r, idx) => {
      const name = getVal(r, ['tên phần mềm', 'phần mềm', 'software name', 'name']);
      if (!name) return;

      const rawKw = getVal(r, ['từ khóa nhận diện', 'từ khóa', 'keywords', 'keyword']) || name.toLowerCase();
      const rawType = removeAccents(getVal(r, ['loại bản quyền', 'phân loại bản quyền', 'loại', 'license type', 'license']));
      const isTrapVal = removeAccents(getVal(r, ['bẫy bản quyền', 'bẫy cá nhân', 'trap', 'is trap']));
      
      let licenseType = 'COMMERCIAL_PAID';
      let isTrap = false;

      if (rawType.includes('ca nhan') || rawType.includes('personal') || rawType.includes('bay') || isTrapVal === 'co' || isTrapVal === 'yes' || isTrapVal === 'true' || rawType === 'free_personal_only') {
        licenseType = 'FREE_PERSONAL_ONLY';
        isTrap = true;
      } else if (rawType.includes('foss') || rawType.includes('open source') || rawType.includes('mien phi') || rawType === 'free_open_source' || (rawType.includes('free') && !rawType.includes('personal') && !rawType.includes('ca nhan'))) {
        licenseType = 'FREE_OPEN_SOURCE';
      } else {
        licenseType = 'COMMERCIAL_PAID';
      }

      const id = getVal(r, ['id', 'mã', 'code']) || ('rule_' + idx + '_' + name.toLowerCase().replace(/[^a-z0-9]/g, ''));
      const vendor = getVal(r, ['hãng sản xuất', 'hãng', 'vendor', 'publisher']) || 'Chưa rõ';
      const category = getVal(r, ['nhóm phân loại', 'nhóm', 'category']) || 'Văn phòng';
      const actionDetails = getVal(r, ['ghi chú & hướng dẫn pháp lý', 'ghi chú', 'action details', 'khuyến nghị', 'hướng dẫn']) || (licenseType === 'FREE_OPEN_SOURCE' ? 'Miễn phí cho DN.' : 'Cần hóa đơn VAT hợp lệ.');
      const recommendedAlternative = getVal(r, ['phần mềm foss thay thế', 'phần mềm foss thay thế (0đ)', 'foss thay thế', 'alternative', 'đề xuất foss']) || (licenseType === 'FREE_OPEN_SOURCE' ? 'Chuẩn FOSS' : 'FOSS Thay thế');
      
      const priceStr = String(getVal(r, ['đơn giá dự toán (vnđ)', 'đơn giá', 'đơn giá dự toán', 'price', 'estimated price']) || 0);
      const estimatedPriceVND = licenseType === 'FREE_OPEN_SOURCE' ? 0 : (parseFloat(priceStr.replace(/[^0-9.-]+/g, '')) || 0);

      const rawRisk = removeAccents(getVal(r, ['mức rủi ro', 'rủi ro', 'risk', 'audit risk']));
      let auditRisk = 'LOW';
      if (licenseType !== 'FREE_OPEN_SOURCE') {
        if (rawRisk.includes('nghiem trong') || rawRisk.includes('critical') || rawRisk.includes('cuc ky')) {
          auditRisk = 'CRITICAL';
        } else if (rawRisk.includes('cao') || rawRisk.includes('high')) {
          auditRisk = 'HIGH';
        } else if (rawRisk.includes('trung binh') || rawRisk.includes('medium')) {
          auditRisk = 'MEDIUM';
        } else {
          auditRisk = 'HIGH';
        }
      }

      let suggestedAction = 'ALLOW_FREE';
      if (licenseType === 'FREE_PERSONAL_ONLY') {
        suggestedAction = 'REPLACE_WITH_FOSS';
      } else if (licenseType === 'COMMERCIAL_PAID') {
        suggestedAction = 'VERIFY_INVOICE';
      }

      const keywords = rawKw
        .split(/[,;\n]+/)
        .map(k => k.trim().toLowerCase())
        .filter(Boolean);

      rules.push({
        id,
        name: name.trim(),
        keywords: keywords.length > 0 ? keywords : [name.trim().toLowerCase()],
        vendor,
        category,
        licenseType,
        auditRisk,
        suggestedAction,
        actionDetails,
        recommendedAlternative,
        estimatedPriceVND,
        isTrap
      });
    });

    return {
      rules,
      info: catalogInfo
    };
  }

  /**
   * Parses JSON catalog string/object into standardized rules and info
   */
  function parseCatalogJSON(jsonContent) {
    const data = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;
    const rawRules = Array.isArray(data) ? data : (data.rules || []);
    const info = (!Array.isArray(data) && data.info) ? data.info : {
      name: 'Hachihi SAM Standard',
      version: '2026.09',
      updated: '03/09/2026',
      author: 'Hachihi',
      description: 'Danh mục tiêu chuẩn bản quyền (JSON)'
    };

    const rules = rawRules.map((r, idx) => {
      const name = String(r.name || r['Tên phần mềm'] || '').trim();
      const rawKw = r.keywords || r.pattern || r['Từ khóa'] || name.toLowerCase();
      const keywords = Array.isArray(rawKw)
        ? rawKw.map(k => String(k).trim().toLowerCase()).filter(Boolean)
        : String(rawKw).split(/[,;\n]+/).map(k => k.trim().toLowerCase()).filter(Boolean);

      const rawType = String(r.licenseType || r['Loại bản quyền'] || '').toUpperCase();
      let licenseType = 'COMMERCIAL_PAID';
      if (rawType === 'FREE_PERSONAL_ONLY' || rawType.includes('PERSONAL') || rawType.includes('CÁ NHÂN') || rawType.includes('CA NHAN') || rawType.includes('BẪY') || rawType.includes('BAY') || r.isTrap === true || r.isTrap === 'Có') {
        licenseType = 'FREE_PERSONAL_ONLY';
      } else if (rawType === 'FREE_OPEN_SOURCE' || rawType.includes('FOSS') || rawType.includes('OPEN') || rawType.includes('MIỄN PHÍ') || rawType.includes('MIEN PHI') || (rawType.includes('FREE') && !rawType.includes('PERSONAL'))) {
        licenseType = 'FREE_OPEN_SOURCE';
      } else {
        licenseType = 'COMMERCIAL_PAID';
      }

      const rawRisk = String(r.auditRisk || r.risk || r['Rủi ro'] || '').toUpperCase();
      let auditRisk = 'HIGH';
      if (licenseType === 'FREE_OPEN_SOURCE') {
        auditRisk = 'LOW';
      } else if (rawRisk.includes('CRITICAL') || rawRisk.includes('NGHIÊM TRỌNG')) {
        auditRisk = 'CRITICAL';
      } else if (rawRisk.includes('MEDIUM') || rawRisk.includes('TRUNG BÌNH')) {
        auditRisk = 'MEDIUM';
      } else if (rawRisk.includes('LOW') || rawRisk.includes('THẤP')) {
        auditRisk = 'LOW';
      }

      const priceVal = r.estimatedPriceVND !== undefined ? r.estimatedPriceVND : (r.price || r['Đơn giá'] || 0);
      const estimatedPriceVND = licenseType === 'FREE_OPEN_SOURCE' ? 0 : (Number(priceVal) || 0);

      const isTrap = licenseType === 'FREE_PERSONAL_ONLY' || r.isTrap === true || r.isTrap === 'Có' || r.isTrap === 'yes';

      return {
        id: r.id || ('rule_' + idx + '_' + name.toLowerCase().replace(/[^a-z0-9]/g, '')),
        name: name || `Quy tắc ${idx + 1}`,
        pattern: keywords.join(', '),
        keywords: keywords.length > 0 ? keywords : [name.toLowerCase()],
        vendor: r.vendor || r['Hãng'] || 'Chưa rõ',
        category: r.category || r['Nhóm'] || 'Văn phòng',
        licenseType,
        auditRisk,
        suggestedAction: r.suggestedAction || (licenseType === 'FREE_OPEN_SOURCE' ? 'ALLOW_FREE' : (licenseType === 'FREE_PERSONAL_ONLY' ? 'REPLACE_WITH_FOSS' : 'VERIFY_INVOICE')),
        actionDetails: r.actionDetails || r.action || r['Ghi chú'] || (licenseType === 'FREE_OPEN_SOURCE' ? 'Miễn phí cho DN.' : 'Cần hóa đơn VAT hợp lệ.'),
        recommendedAlternative: r.recommendedAlternative || r.foss || r['Đề xuất FOSS'] || (licenseType === 'FREE_OPEN_SOURCE' ? 'Chuẩn FOSS' : 'FOSS Thay thế'),
        foss: r.recommendedAlternative || r.foss || (licenseType === 'FREE_OPEN_SOURCE' ? 'Chuẩn FOSS' : 'FOSS Thay thế'),
        price: estimatedPriceVND,
        estimatedPriceVND,
        isTrap
      };
    }).filter(r => r.name);

    return {
      rules,
      info,
      format: 'JSON'
    };
  }

  /**
   * Online mode: fetch catalog from relative URL.
   * Smart loader: Automatically checks ./data/software_catalog.json first (easier to edit directly on GitHub),
   * then falls back to ./data/software_catalog.xlsx.
   */
  async function loadCatalogFromURL(url) {
    // If specific URL requested, load that format directly
    if (url) {
      const response = await fetch(url, { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`Không thể tải Catalog từ URL: ${url} (Mã lỗi: ${response.status})`);
      }
      if (url.endsWith('.json')) {
        const text = await response.text();
        return parseCatalogJSON(text);
      }
      const buffer = await response.arrayBuffer();
      return parseCatalogWorkbook(buffer);
    }

    // Default dual strategy: Try JSON first (fast & easily editable in GitHub/Notepad), then fallback to XLSX
    try {
      const jsonRes = await fetch('./data/software_catalog.json', { cache: 'no-cache' });
      if (jsonRes.ok) {
        const jsonText = await jsonRes.text();
        const parsed = parseCatalogJSON(jsonText);
        if (parsed.rules && parsed.rules.length > 0) {
          return parsed;
        }
      }
    } catch (jsonErr) {
      console.warn('Không tải được software_catalog.json, thử nạp software_catalog.xlsx:', jsonErr);
    }

    // Fallback to Excel
    const xlsxRes = await fetch('./data/software_catalog.xlsx', { cache: 'no-cache' });
    if (!xlsxRes.ok) {
      throw new Error(`Không thể tải Catalog mặc định từ ./data/software_catalog.xlsx (Mã lỗi: ${xlsxRes.status})`);
    }
    const buffer = await xlsxRes.arrayBuffer();
    return parseCatalogWorkbook(buffer);
  }

  /**
   * Offline mode: read catalog from user selected File object (.xlsx, .xls or .json)
   */
  async function loadCatalogFromFile(file) {
    if (!file) {
      throw new Error('Vui lòng chọn file Catalog hợp lệ (.xlsx, .xls, .json)');
    }
    if (file.name.endsWith('.json')) {
      const text = await file.text();
      return parseCatalogJSON(text);
    }
    const buffer = await file.arrayBuffer();
    return parseCatalogWorkbook(buffer);
  }

  global.SAM_CATALOG_LOADER = {
    parseCatalogWorkbook,
    parseCatalogJSON,
    loadCatalogFromURL,
    loadCatalogFromFile
  };

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
