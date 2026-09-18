// js/reports/assistant-home.js - Màn hình Tổng Quan Trợ Lý Rõ Ràng, Dễ Nhìn, Đầy Đủ Tải Mẫu
(function (global) {
  'use strict';

  function AssistantHomeView(props) {
    const {
      computers = [],
      installations = [],
      softwareGroups = [],
      loadedFiles = [],
      onUploadFiles,
      onAppendFiles,
      onDownloadTemplate,
      onExportMergedFile,
      setActiveTab,
      setActionFilter,
      fileInputRef,
      appendFileInputRef,
    } = props;

    const totalComputers = computers.length;
    const totalInstalls = installations.length;

    const handleDownloadSample = () => {
      if (typeof onDownloadTemplate === 'function') {
        onDownloadTemplate();
      } else if (global.SAM_EXPORT && global.SAM_EXPORT.generateSampleExcelTemplate) {
        global.SAM_EXPORT.generateSampleExcelTemplate();
      } else if (global.SAM_EXPORTER && global.SAM_EXPORTER.generateSampleExcelTemplate) {
        global.SAM_EXPORTER.generateSampleExcelTemplate();
      }
    };

    // Phân loại nhóm phần mềm
    const classified = React.useMemo(() => {
      let missingInvoiceCount = 0;
      const missingExamples = [];
      let personalTrapCount = 0;
      const personalExamples = [];
      let fossCount = 0;
      let replaceableCount = 0;
      const replaceableExamples = [];

      (softwareGroups || []).forEach((g) => {
        const isFoss = g.licenseType === 'FREE_OPEN_SOURCE' || g.suggestedAction === 'ALLOW_FREE';
        const isTrap = g.licenseType === 'FREE_PERSONAL_ONLY' || g.isTrap;
        const hasMissing = g.missingInvoiceCount > 0 && !isFoss;
        const hasAlternative = !isFoss && (g.recommendedAlternative || g.foss);

        if (hasMissing) {
          missingInvoiceCount += 1;
          if (missingExamples.length < 3) missingExamples.push(g.displayName || g.rawName);
        }
        if (isTrap) {
          personalTrapCount += 1;
          if (personalExamples.length < 3) personalExamples.push(g.displayName || g.rawName);
        }
        if (isFoss) {
          fossCount += 1;
        }
        if (hasAlternative) {
          replaceableCount += 1;
          if (replaceableExamples.length < 3) {
            replaceableExamples.push(`${g.displayName || g.rawName} → ${g.recommendedAlternative || g.foss}`);
          }
        }
      });

      const compliantInstalls = installations.filter((i) => {
        return (
          i.licenseType === 'FREE_OPEN_SOURCE' ||
          i.invoiceStatus === 'HAS_INVOICE' ||
          i.invoiceStatus === 'NOT_APPLICABLE' ||
          (!i.isTrap && i.auditRisk === 'LOW' && i.invoiceStatus !== 'MISSING_INVOICE')
        );
      }).length;

      const needReviewInstalls = Math.max(0, totalInstalls - compliantInstalls);

      return {
        missingInvoiceCount,
        missingExamples,
        personalTrapCount,
        personalExamples,
        fossCount,
        replaceableCount,
        replaceableExamples,
        compliantInstalls,
        needReviewInstalls,
      };
    }, [softwareGroups, installations, totalInstalls]);

    const handleGoToAction = (filterType) => {
      if (setActionFilter) {
        setActionFilter(filterType);
      }
      setActiveTab('ACTION_ITEMS');
    };

    // =========================================================================
    // TRƯỜNG HỢP 1: CHƯA CÓ DỮ LIỆU (EMPTY STATE)
    // Thiết kế rõ ràng, chữ to dễ đọc, nút tải file và tải file mẫu cực kỳ nổi bật
    // =========================================================================
    if (totalComputers === 0) {
      return React.createElement(
        "div",
        { className: "max-w-3xl mx-auto py-8 sm:py-14 px-4 animate-fadeIn" },

        // Card trung tâm chính
        React.createElement(
          "div",
          { className: "bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 shadow-sm text-center space-y-7" },

          // Biểu tượng nổi bật
          React.createElement(
            "div",
            { className: "w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-950/80 border-2 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center text-4xl shadow-xs" },
            "📋"
          ),

          // Tiêu đề và diễn giải rõ ràng, chữ kích thước thoải mái
          React.createElement(
            "div",
            { className: "space-y-3 max-w-xl mx-auto" },
            React.createElement(
              "h2",
              { className: "text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight" },
              "Kiểm Tra Bản Quyền Phần Mềm Doanh Nghiệp"
            ),
            React.createElement(
              "p",
              { className: "text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal" },
              "Nạp danh sách máy tính và phần mềm để hệ thống tự động kiểm tra rủi ro bản quyền, đối soát hóa đơn VAT và đề xuất giải pháp tiết kiệm chi phí."
            )
          ),

          // KHU VỰC THAO TÁC: NẠP FILE & TẢI FILE MẪU NẰM CẠNH NHAU CỰC KỲ DỄ THẤY
          React.createElement(
            "div",
            { className: "pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-lg mx-auto" },

            // Nút 1: Nạp file kiểm kê chính (To, xanh đậm, nổi bật)
            React.createElement(
              "label",
              {
                id: "btn-home-upload-empty",
                className: "w-full sm:w-auto px-7 py-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-2xl text-base font-bold shadow-md hover:shadow-lg cursor-pointer transition flex items-center justify-center gap-2.5",
              },
              React.createElement("span", { className: "text-xl" }, "📂"),
              React.createElement("span", null, "Nạp File Kiểm Kê (Excel/CSV)"),
              React.createElement("input", {
                type: "file",
                ref: fileInputRef,
                multiple: true,
                onChange: (e) => {
                  if (e.target.files && e.target.files.length > 0 && onUploadFiles) {
                    onUploadFiles(e.target.files, false);
                  }
                  e.target.value = "";
                },
                accept: ".xlsx, .xls, .csv",
                className: "hidden",
              })
            ),

            // Nút 2: Tải file Excel mẫu (Nằm ngay cạnh nút nạp file, viền xanh bắt mắt)
            React.createElement(
              "button",
              {
                id: "btn-home-download-template-empty",
                type: "button",
                onClick: handleDownloadSample,
                className: "w-full sm:w-auto px-6 py-4 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-300 dark:border-emerald-700 rounded-2xl text-base font-bold shadow-xs transition flex items-center justify-center gap-2.5 cursor-pointer",
                title: "Tải file mẫu Excel 3 Sheets chuẩn Hachihi",
              },
              React.createElement("span", { className: "text-xl" }, "📥"),
              React.createElement("span", null, "Tải File Excel Mẫu")
            )
          ),

          // Lời nhắc nhỏ dễ hiểu về định dạng file mẫu
          React.createElement(
            "div",
            { className: "pt-2 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium" },
            React.createElement("span", null, "💡"),
            React.createElement(
              "span",
              null,
              "Chưa có file kiểm kê? Nhấn ",
              React.createElement("strong", { className: "text-emerald-700 dark:text-emerald-400" }, "Tải File Excel Mẫu"),
              " để xem định dạng chuẩn 3 Sheets gồm máy tính & phần mềm."
            )
          )
        )
      );
    }

    // =========================================================================
    // TRƯỜNG HỢP 2: ĐÃ CÓ DỮ LIỆU ĐƯỢC NẠP VÀO HỆ THỐNG
    // Layout thông thoáng, chữ to rõ nét, thanh nạp file + tải file mẫu cực kỳ dễ thấy
    // =========================================================================
    return React.createElement(
      "div",
      { className: "max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn pb-8" },

      // 1. THANH TRẠNG THÁI & HÀNH ĐỘNG FILE (NẠP FILE MỚI, THÊM FILE, VÀ TẢI FILE MẪU)
      React.createElement(
        "div",
        { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5" },

        // Cột trái: Tình trạng dữ liệu hiện hành (Chữ to, rõ nét)
        React.createElement(
          "div",
          { className: "flex items-center gap-4" },
          React.createElement(
            "div",
            { className: "w-13 h-13 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl shrink-0 shadow-2xs" },
            "📊"
          ),
          React.createElement(
            "div",
            null,
            React.createElement(
              "h2",
              { className: "text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight" },
              "Tổng Quan Tình Trạng Bản Quyền"
            ),
            React.createElement(
              "p",
              { className: "text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium" },
              React.createElement("span", { className: "font-bold text-blue-600 dark:text-blue-400" }, `${totalComputers} máy tính`),
              " đang được quản lý • ",
              React.createElement("span", { className: "font-bold text-slate-800 dark:text-slate-200" }, `${totalInstalls} lượt phần mềm`),
              " đã cài đặt"
            )
          )
        ),

        // Cột phải: Cụm nút thao tác nạp file và tải file mẫu (Gần nhau, chữ to, dễ click)
        React.createElement(
          "div",
          { className: "flex flex-wrap items-center gap-2.5 shrink-0" },

          // Nút 1: Tải file Excel mẫu (Được đặt cạnh cụm nạp file để người dùng dễ nhìn thấy)
          React.createElement(
            "button",
            {
              id: "btn-home-download-template",
              type: "button",
              onClick: handleDownloadSample,
              className: "px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer shadow-2xs",
              title: "Tải file mẫu Excel chuẩn để nhập liệu",
            },
            React.createElement("span", { className: "text-base" }, "📥"),
            React.createElement("span", null, "Tải file mẫu")
          ),

          // Nút 2: Nạp file mới (Xóa dữ liệu cũ, nạp mới)
          React.createElement(
            "label",
            {
              id: "btn-home-upload-new",
              className: "px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition cursor-pointer flex items-center gap-2 shadow-xs",
              title: "Tải file kiểm kê mới thay thế",
            },
            React.createElement("span", { className: "text-base" }, "📂"),
            React.createElement("span", null, "Nạp file mới"),
            React.createElement("input", {
              type: "file",
              ref: fileInputRef,
              multiple: true,
              onChange: (e) => {
                if (e.target.files && e.target.files.length > 0 && onUploadFiles) {
                  onUploadFiles(e.target.files, false);
                }
                e.target.value = "";
              },
              accept: ".xlsx, .xls, .csv",
              className: "hidden",
            })
          ),

          // Nút 3: Nạp thêm file từ máy tính khác (Gộp file)
          React.createElement(
            "label",
            {
              id: "btn-home-append-file",
              className: "px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold transition cursor-pointer flex items-center gap-2 shadow-2xs",
              title: "Nạp thêm file kiểm kê từ phòng ban hoặc máy tính khác để gộp lại",
            },
            React.createElement("span", { className: "text-base" }, "➕"),
            React.createElement("span", null, "Gộp thêm file"),
            React.createElement("input", {
              type: "file",
              ref: appendFileInputRef,
              multiple: true,
              onChange: (e) => {
                if (e.target.files && e.target.files.length > 0 && onAppendFiles) {
                  onAppendFiles(e.target.files, true);
                }
                e.target.value = "";
              },
              accept: ".xlsx, .xls, .csv",
              className: "hidden",
            })
          ),

          // Nút 4: Tải file Excel đã gộp (Chuẩn Hachihi.vn: 1. Danh sach may tinh + 2. Phan mem)
          onExportMergedFile &&
            React.createElement(
              "button",
              {
                id: "btn-home-download-merged",
                type: "button",
                onClick: onExportMergedFile,
                className: "px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer shadow-xs",
                title: "Tải file Excel đã gộp dữ liệu từ tất cả các máy (1. Danh sach may tinh & 2. Phan mem)",
              },
              React.createElement("span", { className: "text-base" }, "📊"),
              React.createElement("span", null, "Tải file Excel đã gộp")
            )
        )
      ),

      // 2. BA THẺ TÌNH TRẠNG CHÍNH (Chữ to, màu sắc tương phản cao, trực quan)
      React.createElement(
        "div",
        { className: "grid grid-cols-1 md:grid-cols-3 gap-5" },

        // Thẻ 1: Máy tính trong doanh nghiệp
        React.createElement(
          "div",
          {
            id: "card-stat-computers",
            onClick: () => setActiveTab('COMPUTERS'),
            className: "p-6 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400 dark:hover:border-blue-600 cursor-pointer transition group",
          },
          React.createElement(
            "div",
            { className: "flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider" },
            React.createElement("span", { className: "flex items-center gap-1.5" }, "🖥️ Máy tính kiểm kê"),
            React.createElement("span", { className: "text-sm text-blue-600 dark:text-blue-400 font-bold group-hover:translate-x-1 transition-transform" }, "Xem danh sách →")
          ),
          React.createElement("div", { className: "text-4xl sm:text-5xl font-black text-slate-900 dark:text-white my-3 tracking-tight" }, totalComputers),
          React.createElement("p", { className: "text-sm text-slate-600 dark:text-slate-400 font-medium" }, `Tổng cộng ${totalInstalls} lượt phần mềm đã cài đặt trên các máy`)
        ),

        // Thẻ 2: Đã an tâm (Hợp lệ / FOSS miễn phí doanh nghiệp)
        React.createElement(
          "div",
          {
            id: "card-stat-compliant",
            onClick: () => setActiveTab('SOFTWARE'),
            className: "p-6 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-2xl border-2 border-emerald-300 dark:border-emerald-800 shadow-xs hover:border-emerald-500 cursor-pointer transition group",
          },
          React.createElement(
            "div",
            { className: "flex items-center justify-between text-sm text-emerald-800 dark:text-emerald-300 font-bold uppercase tracking-wider" },
            React.createElement("span", { className: "flex items-center gap-1.5" }, "✅ Đã An Tâm (Hợp lệ)"),
            React.createElement("span", { className: "text-sm text-emerald-700 dark:text-emerald-400 font-bold group-hover:translate-x-1 transition-transform" }, "Xem chi tiết →")
          ),
          React.createElement("div", { className: "text-4xl sm:text-5xl font-black text-emerald-600 dark:text-emerald-400 my-3 tracking-tight" }, classified.compliantInstalls),
          React.createElement("p", { className: "text-sm text-emerald-700 dark:text-emerald-400 font-medium" }, "Phần mềm mã nguồn mở (0đ) hoặc đã có đầy đủ giấy phép sử dụng")
        ),

        // Thẻ 3: Cần kiểm tra & xử lý (Thiếu hóa đơn hoặc bẫy bản quyền)
        React.createElement(
          "div",
          {
            id: "card-stat-need-review",
            onClick: () => setActiveTab('ACTION_ITEMS'),
            className: "p-6 bg-amber-50/40 dark:bg-amber-950/20 rounded-2xl border-2 border-amber-300 dark:border-amber-800 shadow-xs hover:border-amber-500 cursor-pointer transition group",
          },
          React.createElement(
            "div",
            { className: "flex items-center justify-between text-sm text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wider" },
            React.createElement("span", { className: "flex items-center gap-1.5" }, "⚠️ Cần Kiểm Tra & Xử Lý"),
            React.createElement("span", { className: "text-sm text-amber-700 dark:text-amber-400 font-bold group-hover:translate-x-1 transition-transform" }, "Xử lý ngay →")
          ),
          React.createElement("div", { className: "text-4xl sm:text-5xl font-black text-amber-600 dark:text-amber-400 my-3 tracking-tight" }, classified.needReviewInstalls),
          React.createElement("p", { className: "text-sm text-amber-700 dark:text-amber-400 font-medium" }, "Cần tìm hóa đơn VAT chứng minh hoặc gỡ bỏ / thay bằng FOSS 0đ")
        )
      ),

      // 3. KHỐI TRỌNG TÂM: CÁC VẤN ĐỀ CẦN XỬ LÝ (CHỮ RÕ RÀNG, BỐ CỤC ĐẸP)
      React.createElement(
        "div",
        { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-5" },
        React.createElement(
          "div",
          { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800" },
          React.createElement(
            "h3",
            { className: "text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2.5" },
            React.createElement("span", { className: "text-xl" }, "📌"),
            "Danh Sách Việc Cần Làm Ngay"
          ),
          React.createElement(
            "button",
            {
              onClick: () => setActiveTab('ACTION_ITEMS'),
              className: "text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 cursor-pointer self-start sm:self-auto",
            },
            "Xem toàn bộ danh sách việc cần xử lý →"
          )
        ),

        // Danh sách 3 nhóm vấn đề chính với chữ to rõ ràng
        React.createElement(
          "div",
          { className: "space-y-3" },

          // Mục 1: Chưa có hóa đơn VAT
          React.createElement(
            "div",
            {
              onClick: () => handleGoToAction('MISSING_INVOICE'),
              className: "p-4 sm:p-5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20 hover:bg-rose-50/60 dark:hover:bg-rose-950/40 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4",
            },
            React.createElement(
              "div",
              { className: "flex items-start gap-3.5" },
              React.createElement("div", { className: "w-4 h-4 rounded-full bg-rose-500 mt-1 shrink-0 shadow-xs" }),
              React.createElement(
                "div",
                { className: "space-y-1" },
                React.createElement(
                  "div",
                  { className: "text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5 flex-wrap" },
                  `Phần mềm thương mại chưa có hóa đơn VAT (${classified.missingInvoiceCount} phần mềm)`,
                  React.createElement("span", { className: "text-xs font-bold px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300" }, "Cần đối chiếu hóa đơn")
                ),
                React.createElement(
                  "p",
                  { className: "text-sm text-slate-600 dark:text-slate-300" },
                  classified.missingExamples.length > 0
                    ? `Các phần mềm tiêu biểu: ${classified.missingExamples.join(", ")}... Nhấn để đối soát hóa đơn hoặc lên kế hoạch mua bổ sung.`
                    : "Tất cả phần mềm thương mại đều đã được gắn số hóa đơn hợp lệ."
                )
              )
            ),
            React.createElement(
              "span",
              { className: "px-4 py-2 rounded-lg bg-white dark:bg-slate-800 text-sm font-bold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 shrink-0 self-start sm:self-center shadow-2xs" },
              "Kiểm tra hóa đơn →"
            )
          ),

          // Mục 2: Phần mềm bản quyền cá nhân (Bẫy bản quyền trong DN)
          React.createElement(
            "div",
            {
              onClick: () => handleGoToAction('PERSONAL_TRAP'),
              className: "p-4 sm:p-5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20 hover:bg-amber-50/60 dark:hover:bg-amber-950/40 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4",
            },
            React.createElement(
              "div",
              { className: "flex items-start gap-3.5" },
              React.createElement("div", { className: "w-4 h-4 rounded-full bg-amber-500 mt-1 shrink-0 shadow-xs" }),
              React.createElement(
                "div",
                { className: "space-y-1" },
                React.createElement(
                  "div",
                  { className: "text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5 flex-wrap" },
                  `Bẫy bản quyền: Miễn phí cá nhân nhưng cấm dùng trong DN (${classified.personalTrapCount} phần mềm)`,
                  React.createElement("span", { className: "text-xs font-bold px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" }, "Nguy cơ phạt tiền")
                ),
                React.createElement(
                  "p",
                  { className: "text-sm text-slate-600 dark:text-slate-300" },
                  classified.personalExamples.length > 0
                    ? `Phát hiện: ${classified.personalExamples.join(", ")}... Các hãng thường gửi thư cảnh báo hoặc kiểm tra đột xuất.`
                    : "Không phát hiện phần mềm nào vướng bẫy bản quyền cá nhân."
                )
              )
            ),
            React.createElement(
              "span",
              { className: "px-4 py-2 rounded-lg bg-white dark:bg-slate-800 text-sm font-bold text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shrink-0 self-start sm:self-center shadow-2xs" },
              "Xem và gỡ bỏ →"
            )
          ),

          // Mục 3: Giải pháp miễn phí thay thế (FOSS 0đ)
          React.createElement(
            "div",
            {
              onClick: () => handleGoToAction('REPLACEABLE_FOSS'),
              className: "p-4 sm:p-5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/20 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4",
            },
            React.createElement(
              "div",
              { className: "flex items-start gap-3.5" },
              React.createElement("div", { className: "w-4 h-4 rounded-full bg-indigo-500 mt-1 shrink-0 shadow-xs" }),
              React.createElement(
                "div",
                { className: "space-y-1" },
                React.createElement(
                  "div",
                  { className: "text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5 flex-wrap" },
                  `Giải pháp thay thế miễn phí (FOSS 0đ) (${classified.replaceableCount} phần mềm)`,
                  React.createElement("span", { className: "text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300" }, "Tiết kiệm 100% chi phí")
                ),
                React.createElement(
                  "p",
                  { className: "text-sm text-slate-600 dark:text-slate-300" },
                  classified.replaceableExamples.length > 0
                    ? `Đề xuất: ${classified.replaceableExamples.join(" | ")}... Tiết kiệm ngân sách tối đa cho công ty.`
                    : "Các phần mềm hiện tại đã được tối ưu hóa tốt."
                )
              )
            ),
            React.createElement(
              "span",
              { className: "px-4 py-2 rounded-lg bg-white dark:bg-slate-800 text-sm font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shrink-0 self-start sm:self-center shadow-2xs" },
              "Xem giải pháp 0đ →"
            )
          )
        )
      ),

      // 4. LỐI TẮT BÁO CÁO CHO LÃNH ĐẠO (ĐƠN GIẢN, CHỮ TO, 1 CLICK MỞ NGAY)
      React.createElement(
        "div",
        { className: "p-6 rounded-2xl bg-blue-50/80 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-5" },
        React.createElement(
          "div",
          { className: "space-y-1.5" },
          React.createElement(
            "h4",
            { className: "text-base sm:text-lg font-bold text-blue-950 dark:text-blue-100 flex items-center gap-2" },
            React.createElement("span", null, "📑"),
            "Báo Cáo Tóm Tắt Trình Ban Giám Đốc"
          ),
          React.createElement(
            "p",
            { className: "text-sm text-blue-800 dark:text-blue-300 max-w-2xl font-normal leading-relaxed" },
            "Bản báo cáo tinh gọn in ra giấy hoặc xuất file Excel tóm tắt số máy, tỷ lệ tuân thủ, ước tính ngân sách cần mua bổ sung và số tiền tiết kiệm được từ giải pháp FOSS."
          )
        ),
        React.createElement(
          "button",
          {
            id: "btn-open-executive-report",
            onClick: () => setActiveTab('EXECUTIVE_REPORT'),
            className: "px-6 py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl text-sm sm:text-base font-bold shadow-sm transition cursor-pointer whitespace-nowrap self-start sm:self-auto",
          },
          "Mở Báo Cáo Ban Giám Đốc →"
        )
      )
    );
  }

  global.SAM_ASSISTANT_HOME = {
    AssistantHomeView,
  };
})(typeof window !== 'undefined' ? window : this);
