// js/print.js - Print Manager and Document Title Formatter
(function (global) {
  'use strict';

  function getDocumentTitleForPrint(type, clientName, auditDate) {
    const cleanClient = String(clientName || "Doanh_Nghiep")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .replace(/_+/g, "_");

    const cleanDate = String(auditDate || new Date().toISOString().slice(0, 10))
      .replace(/[/\\:]/g, "-");

    switch (type) {
      case "EXECUTIVE_PLAN":
        return `Bao_Cao_Tong_Hop_Ban_Quyen_BGD_${cleanClient}_${cleanDate}`;
      case "DETAILED_MACHINES":
        return `Danh_Sach_Chi_Tiet_May_Tinh_${cleanClient}_${cleanDate}`;
      case "FOSS_PLAN":
        return `Ke_Hoach_Toi_Uu_FOSS_Tiet_Kiem_${cleanClient}_${cleanDate}`;
      case "MACHINE_OVERVIEW":
        return `Bao_Cao_Tong_Quan_May_Tinh_Da_Kiem_Tra_${cleanClient}_${cleanDate}`;
      case "BOTH":
      default:
        return `Bao_Cao_Toan_Dien_SAM_Audit_${cleanClient}_${cleanDate}`;
    }
  }

  function printReport(type, clientName, auditDate) {
    const originalTitle = document.title;
    const targetTitle = getDocumentTitleForPrint(type, clientName, auditDate);
    document.title = targetTitle;

    document.body.classList.add('has-print-modal');
    document.body.classList.add('is-printing-report');

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.title = originalTitle;
        document.body.classList.remove('is-printing-report');
      }, 1000);
    }, 150);
  }

  global.SAM_PRINT = {
    getDocumentTitleForPrint,
    printReport
  };

})(typeof window !== 'undefined' ? window : this);
