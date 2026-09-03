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

  global.SAM_UTILS = {
    removeAccents,
    getVal,
    formatVND,
    getRiskEmoji,
    getActionLabelVN,
    classifySoftware,
    getInvoiceText,
    getActionRequired
  };

})(typeof window !== 'undefined' ? window : this);
