let allPatients = [];
let dataTable;

$(document).ready(function () {
  loadPatients();
});

// โหลดข้อมูลจาก API
async function loadPatients() {
  try {
    const response = await fetch("/api/patients");
    const result = await response.json();

    if (result.error) throw new Error(result.error);

    allPatients = result.data || [];
    initializeDataTable();
  } catch (error) {
    alert("เกิดข้อผิดพลาด: " + error.message);
  }
}

// สร้าง DataTable
function initializeDataTable() {
  const tableData = allPatients.map((patient) => {
    const fullName = `${patient.first_name || ""} ${patient.last_name || ""}`;
    const gender = patient.gender === "male" ? "ชาย" : "หญิง";
    const genderClass = patient.gender === "male" ? "gender-male" : "gender-female";

    return [
      patient.employee_id || "ไม่ระบุ",
      `<a href="#" class="patient-name-link" data-id="${patient.id}">${fullName}</a>`,
      patient.department || "ไม่ระบุ",
      `<span class="gender-badge ${genderClass}">${gender}</span>`,
    ];
  });

  dataTable = $("#patientsDataTable").DataTable({
    data: tableData,
    language: {
      zeroRecords: "ไม่พบข้อมูลผู้ป่วย",
      info: "แสดง _START_ ถึง _END_ จาก _TOTAL_ รายการ",
      infoEmpty: "ไม่มีข้อมูล",
      infoFiltered: "(กรองจาก _MAX_ รายการทั้งหมด)",
      lengthMenu: "แสดง _MENU_ รายการ",
      search: "ค้นหา:",
      paginate: {
        first: "หน้าแรก",
        last: "หน้าสุดท้าย",
        next: "ถัดไป",
        previous: "ก่อนหน้า",
      },
    },
    paging: true,
    pageLength: 10,
    lengthMenu: [
      [10, 25, 50, -1],
      [10, 25, 50, "ทั้งหมด"],
    ],
    info: true,
    searching: true,
    order: [[0, "asc"]], // เรียงตามรหัสพนักงาน (คอลัมน์แรก)
    columnDefs: [
      { orderable: true, targets: [0, 1, 2, 3] }, // ทุกคอลัมน์เรียงได้
    ],
    drawCallback: function () {
      // เพิ่ม event listener สำหรับคลิกชื่อผู้ป่วย
      $(".patient-name-link")
        .off("click")
        .on("click", function (e) {
          e.preventDefault();
          const patientId = $(this).data("id");
          viewPatient(patientId);
        });
    },
  });

  // เชื่อมต่อ search input ที่มีอยู่แล้วกับ DataTable
  $("#searchInput").on("keyup", function () {
    dataTable.search(this.value).draw();
  });
}

// ดูรายละเอียดผู้ป่วย
function viewPatient(id) {
  const patient = allPatients.find((p) => p.id === id);
  if (!patient) {
    alert("ไม่พบข้อมูลผู้ป่วย");
    return;
  }
  window.location.href = `/patients_history.html?id=${id}`;
}