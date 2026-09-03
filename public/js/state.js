// js/state.js - Central Application State Definition
(function (global) {
  'use strict';

  function createInitialState() {
    return {
      computers: [],
      installations: [],
      catalog: [],
      catalogSource: {
        type: 'INITIALIZING', // 'ONLINE', 'CUSTOMER_UPLOAD', 'CATALOG_FILE', 'FALLBACK', 'ERROR'
        name: 'Đang khởi động...',
        count: 0,
        version: '2026.09',
        updated: '03/09/2026',
        error: null
      },
      activeTab: "OVERVIEW",
      searchTerm: "",
      filterRisk: "ALL",
      theme: (function() {
        try {
          return localStorage.getItem("sam_theme") || "light";
        } catch (e) {
          return "light";
        }
      })(),
      filters: {
        detailFilter: "ALL",
        categoryFilter: (global.SAM_CONSTANTS && global.SAM_CONSTANTS.CATEGORY_FILTER_OPTIONS) 
          ? [...global.SAM_CONSTANTS.CATEGORY_FILTER_OPTIONS] 
          : [],
        riskFilterPlan: (global.SAM_CONSTANTS && global.SAM_CONSTANTS.RISK_FILTER_OPTIONS)
          ? [...global.SAM_CONSTANTS.RISK_FILTER_OPTIONS]
          : []
      },
      report: {
        clientName: "Hachihi.vn",
        auditDate: new Date().toLocaleDateString("vi-VN"),
        auditorUnit: "Hachihi.vn",
        type: "EXECUTIVE_PLAN"
      }
    };
  }

  global.SAM_STATE = {
    createInitialState
  };

})(typeof window !== 'undefined' ? window : this);
