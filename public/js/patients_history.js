let patientData = null;
let examinationsData = [];
let dispensedMedicinesData = [];

// ดึง patient ID จาก URL
function getPatientId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("id");
}

// แสดงสถานะ
function showStatus(message, type = "loading") {
  const status = document.getElementById("status");
  status.textContent = message;
  status.className = `status ${type}`;
  status.classList.remove("hidden");
}

// ซ่อนสถานะ
function hideStatus() {
  document.getElementById("status").classList.add("hidden");
}

// โหลดข้อมูลผู้ป่วย
async function loadPatientData() {
  const patientId = getPatientId();
  if (!patientId) {
    showStatus("ไม่พบรหัสผู้ป่วย", "error");
    return;
  }

  try {
    showStatus("กำลังโหลดข้อมูล...");

    const response = await fetch("/api/patients");
    const result = await response.json();

    if (result.data) {
      patientData = result.data.find((p) => p.id == patientId);
      if (patientData) {
        displayPatientInfo();
        await loadExaminations();
      } else {
        showStatus("ไม่พบข้อมูลผู้ป่วย", "error");
      }
    }
  } catch (error) {
    showStatus("เกิดข้อผิดพลาดในการโหลดข้อมูล", "error");
  }
}

// แสดงข้อมูลผู้ป่วย
function displayPatientInfo() {
  const p = patientData;
  document.getElementById("patientInfo").innerHTML = `
    <div class="info-card">
      <div class="patient-info-grid">
        <div class="info-column">
          <div class="info-item"><strong>ชื่อ-นามสกุล:</strong> ${p.first_name} ${p.last_name}</div>
          <div class="info-item"><strong>รหัสพนักงาน:</strong> ${p.employee_id}</div>
          <div class="info-item"><strong>แผนก:</strong> ${p.department}</div>
          <div class="info-item"><strong>เพศ:</strong> ${p.gender === "male" ? "ชาย" : "หญิง"}</div>
          <div class="info-item"><strong>โรคประจำตัว:</strong> ${p.medical_conditions || "ไม่มี"}</div>
        </div>
        <div class="info-column">
          <div class="info-item"><strong>เบอร์โทร:</strong> ${p.phone}</div>
          <div class="info-item"><strong>น้ำหนัก:</strong> ${p.weight || "-"} กก.</div>
          <div class="info-item"><strong>ส่วนสูง:</strong> ${p.height || "-"} ซม.</div>
          <div class="info-item"><strong>ประวัติแพ้:</strong> ${p.allergies || "ไม่มี"}</div>
        </div>
      </div>
    </div>
  `;
  document.getElementById("patientOverview").classList.remove("hidden");
}

// โหลดประวัติการตรวจ
async function loadExaminations() {
  try {
    showStatus("กำลังโหลดข้อมูล...");

    const [examResult, dispensedResult] = await Promise.all([
      fetch("/api/examinations").then((r) => r.json()),
      fetch("/api/medicine_dispensed").then((r) => r.json()),
    ]);

    if (examResult.data) {
      examinationsData = examResult.data.filter(
        (exam) => exam.patient_id == patientData.id
      );
    }

    if (dispensedResult.data) {
      dispensedMedicinesData = dispensedResult.data;
    }

    displayExaminations();
    hideStatus();
  } catch (error) {
    showStatus("เกิดข้อผิดพลาดในการโหลดประวัติ", "error");
  }
}

// แสดงประวัติการตรวจ
function displayExaminations() {
  const visitList = document.getElementById("visitList");

  if (!examinationsData.length) {
    document.getElementById("noVisitData").classList.remove("hidden");
    return;
  }

  visitList.innerHTML = examinationsData.map((exam, index) => {
    const visitNumber = examinationsData.length - index;
    const date = new Date(exam.created_at).toLocaleDateString("th-TH");
    const time = new Date(exam.created_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });

    const dispensed = dispensedMedicinesData.filter((d) => d.examination_id == exam.id);
    const medicineDisplay = dispensed.length ? dispensed.map((d) => d.medicine_name || "ไม่ระบุชื่อยา").join("<br>") : '<span style="color: #999;">ไม่มีรายการยา</span>';

    // แสดงชื่อพนักงานที่ตรวจ
    const staffDisplay = exam.staff_name 
      ? `<div class="detail-item">
           <div class="detail-label">พนักงานที่ตรวจ</div>
           <div class="detail-value">${exam.staff_name}</div>
         </div>` 
      : '';

    // สร้างข้อความแสดงตัวอย่างโรคและอาการ
    const diagnosisPreview = exam.diagnosis_category || 'ไม่ระบุหมวดโรค';
    const symptomsPreview = exam.symptoms 
      ? (exam.symptoms.length > 50 ? exam.symptoms.substring(0, 50) + '...' : exam.symptoms)
      : 'ไม่มีอาการ';

    return `
      <div class="visit-item" onclick="toggleVisit(this)">
        <div class="visit-header">
          <div class="visit-header-content">
            <h4>การตรวจครั้งที่ ${visitNumber}</h4>
            <div class="visit-preview">${diagnosisPreview} - ${symptomsPreview}</div>
          </div>
          <div class="visit-meta">
            <div class="visit-date">${date} เวลา ${time}</div>
            <div class="expand-icon">▼</div>
          </div>
        </div>
        <div class="visit-details">
          <div class="detail-grid">
            <div class="detail-item"><div class="detail-label">หมวดโรค</div><div class="detail-value">${exam.diagnosis_category || "-"}</div></div>
            <div class="detail-item"><div class="detail-label">ความดันโลหิต</div><div class="detail-value">${exam.blood_pressure || "-"}</div></div>
            <div class="detail-item"><div class="detail-label">อุณหภูมิ</div><div class="detail-value">${exam.temperature || "-"} °C</div></div>
            ${staffDisplay}
          </div>
          ${exam.symptoms ? `<div class="symptoms-notes"><h5>อาการ</h5><div>${exam.symptoms}</div></div>` : ""}
          ${exam.observation_notes ? `<div class="symptoms-notes"><h5>หมายเหตุ</h5><div>${exam.observation_notes}</div></div>` : ""}
          <div class="symptoms-notes"><h5>รายการยา</h5><div>${medicineDisplay}</div></div>
        </div>
      </div>
    `;
  }).join("");

  visitList.classList.remove("hidden");
}

// สลับการแสดงรายละเอียด
function toggleVisit(element) {
  element.classList.toggle("expanded");
}

// เริ่มต้นเมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener("DOMContentLoaded", function () {
  loadPatientData();
});