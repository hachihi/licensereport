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

      if (rawType.includes('free') || rawType.includes('foss') || rawType.includes('mien phi') || rawType.includes('open source')) {
        licenseType = 'FREE_OPEN_SOURCE';
      } else if (rawType.includes('ca nhan') || rawType.includes('personal') || rawType.includes('bay') || isTrapVal === 'co' || isTrapVal === 'yes' || isTrapVal === 'true') {
        licenseType = 'FREE_PERSONAL_ONLY';
        isTrap = true;
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
   * Online mode: fetch catalog from relative URL
   */
  async function loadCatalogFromURL(url) {
    const targetUrl = url || './data/software_catalog.xlsx';
    const response = await fetch(targetUrl, { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error(`Không thể tải Catalog từ URL: ${targetUrl} (Mã lỗi: ${response.status})`);
    }
    const buffer = await response.arrayBuffer();
    return parseCatalogWorkbook(buffer);
  }

  /**
   * Offline mode: read catalog from user selected File object
   */
  async function loadCatalogFromFile(file) {
    if (!file) {
      throw new Error('Vui lòng chọn file Catalog hợp lệ (.xlsx, .xls)');
    }
    const buffer = await file.arrayBuffer();
    return parseCatalogWorkbook(buffer);
  }

  global.SAM_CATALOG_LOADER = {
    parseCatalogWorkbook,
    loadCatalogFromURL,
    loadCatalogFromFile
  };

})(typeof window !== 'undefined' ? window : this);
