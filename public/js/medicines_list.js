let allMedicines = [];
let dataTable;

$(document).ready(function () {
  loadMedicines();
  setupModal();
  setupFilterButtons();
});

function loadMedicines() {
  fetch("/api/medicines/all")
    .then((response) => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    })
    .then((data) => {
      allMedicines = data;
      initializeDataTable();
    })
    .catch((error) => alert("เกิดข้อผิดพลาดในการโหลดข้อมูล"));
}

function initializeDataTable() {
  const tableData = allMedicines.map((medicine) => {
    const status = getStatus(medicine);
    return [
      medicine.medicine_code,
      `<span class="medicine-name" data-code="${medicine.medicine_code}">${medicine.name}</span>`,
      `${medicine.stock_quantity} ${medicine.unit}`,
      `${parseFloat(medicine.unit_price).toFixed(2)} บาท`,
      formatDate(medicine.expiry_date),
      `<span class="${status.class}">${status.text}</span>`,
      `<button class="btn-manage-stock" data-code="${medicine.medicine_code}">จัดการสต๊อก</button>`,
    ];
  });

  dataTable = $("#medicinesTable").DataTable({
    data: tableData,
    language: { 
      zeroRecords: "ไม่พบข้อมูลที่ค้นหา",
      info: "แสดง _START_ ถึง _END_ จาก _TOTAL_ รายการ",
      infoEmpty: "ไม่มีข้อมูล",
      infoFiltered: "(กรองจาก _MAX_ รายการทั้งหมด)",
      paginate: {
        first: "หน้าแรก",
        last: "หน้าสุดท้าย",
        next: "ถัดไป",
        previous: "ก่อนหน้า",
      },
    },
    paging: true,
    pageLength: 10,
    lengthChange: false, // ซ่อน dropdown เลือกจำนวนรายการ
    info: true,
    searching: true,
    dom: "tip", // t=table, i=info, p=pagination (ไม่มี l=length menu)
    order: [[0, "asc"]],
    columnDefs: [
      { orderable: true, targets: [0, 1, 2, 3, 4, 5] },
      { orderable: false, targets: [6] },
      {
        targets: 2,
        type: "num-fmt",
        render: (data, type) => (type === "sort" || type === "type") ? parseFloat(data) || 0 : data,
      },
      {
        targets: 3,
        type: "num-fmt",
        render: (data, type) => (type === "sort" || type === "type") ? parseFloat(data) || 0 : data,
      },
      {
        targets: 4,
        render: (data, type) => {
          if (type === "sort" || type === "type") {
            const parts = data.split("/");
            if (parts.length === 3) {
              const year = parseInt(parts[2]) - 543;
              const month = parts[1].padStart(2, "0");
              const day = parts[0].padStart(2, "0");
              return year + month + day;
            }
            return 0;
          }
          return data;
        },
      },
    ],
    drawCallback: function () {
      $(".medicine-name").off("click").on("click", function () {
        const medicineCode = $(this).data("code");
        const medicine = allMedicines.find((m) => m.medicine_code === medicineCode);
        if (medicine) showMedicineDetail(medicine);
      });

      $(".btn-manage-stock").off("click").on("click", function () {
        const medicineCode = $(this).data("code");
        window.location.href = `medicines_update_stock.html?code=${medicineCode}`;
      });
    },
  });

  $("#searchInput").on("keyup", function () {
    dataTable.search(this.value).draw();
  });
}

function setupFilterButtons() {
  $(".filter-btn").on("click", function () {
    $(".filter-btn").removeClass("active");
    $(this).addClass("active");
    const status = $(this).data("status");
    dataTable.column(5).search(status === "all" ? "" : status).draw();
  });
}

function getStatus(medicine) {
  const today = new Date();
  const expiryDate = new Date(medicine.expiry_date);
  const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) return { class: "status-expired", text: "หมดอายุแล้ว" };
  if (daysUntilExpiry <= 30) return { class: "status-critical", text: `ใกล้หมดอายุ (${daysUntilExpiry} วัน)` };
  if (medicine.stock_quantity <= medicine.minimum_stock) return { class: "status-critical", text: "สต็อกต่ำ" };
  return { class: "status-normal", text: "ปกติ" };
}

function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear() + 543;
  return `${day}/${month}/${year}`;
}

function showMedicineDetail(medicine) {
  document.getElementById("modal-name").textContent = medicine.name;
  document.getElementById("modal-code").textContent = medicine.medicine_code;
  document.getElementById("modal-unit").textContent = medicine.unit;
  document.getElementById("modal-stock").textContent = medicine.stock_quantity + " " + medicine.unit;
  document.getElementById("modal-price").textContent = parseFloat(medicine.unit_price).toFixed(2) + " บาท";
  document.getElementById("modal-expiry").textContent = formatDate(medicine.expiry_date);
  document.getElementById("modal-minimum").textContent = medicine.minimum_stock + " " + medicine.unit;
  document.getElementById("modal-instructions").textContent = medicine.default_instructions || "-";
  document.getElementById("modal-description").textContent = medicine.description || "-";
  document.getElementById("medicineModal").style.display = "block";
}

function setupModal() {
  const modal = document.getElementById("medicineModal");
  const closeBtn = document.querySelector(".close");

  closeBtn.addEventListener("click", () => modal.style.display = "none");
  window.addEventListener("click", (event) => {
    if (event.target === modal) modal.style.display = "none";
  });
}