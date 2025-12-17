let allPatients = [];

function setupPatientSearch() {
  const searchInput = document.getElementById("search-input");

  loadAllPatients();

  // ติด event listener ให้ทำงานทุกครั้งที่มีการพิมพ์
  searchInput.addEventListener("input", function () {
    const searchTerm = this.value.trim();
    
    // ถ้าไม่มีคำค้นหา ให้ซ่อนผลลัพธ์
    if (searchTerm.length === 0) {
      clearSearchDisplay();
      return;
    }

    const filteredPatients = allPatients.filter((patient) => {
      const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      // เช็คว่าตรงกับชื่อ รหัสพนักงาน หรือแผนก
      return fullName.includes(searchLower) ||
        patient.employee_id.toLowerCase().includes(searchLower) ||
        patient.department.toLowerCase().includes(searchLower);
    });

    displayPatientDropdown(filteredPatients);
  });
}


function loadAllPatients() {
  fetch("/api/patients")
    .then((response) => response.json())
    .then((data) => {
      if (data.data && Array.isArray(data.data)) allPatients = data.data; // โหลดครั้งเดียวตอนเริ่มต้น
    })
    .catch(() => showMessage("ไม่สามารถโหลดรายชื่อผู้ป่วยได้", "error"));
}

function displayPatientDropdown(patients) {
  const resultDiv = document.getElementById("search-result");

  if (!patients || patients.length === 0) {
    resultDiv.innerHTML = '<div class="patient-dropdown"><div class="dropdown-footer">ไม่พบข้อมูล</div></div>';
    resultDiv.classList.add("show");
    return;
  }

  let html = '<div class="patient-dropdown">';
  patients.slice(0, 8).forEach((patient) => { 
    html += `
      <div class="patient-item" data-patient-id="${patient.id}" onclick="selectPatient(${patient.id})">
        <div class="patient-main">
          <strong>${patient.employee_id}</strong> - <strong>${patient.first_name} ${patient.last_name}</strong>
        </div>
      </div>
    `;
  });

  if (patients.length > 8) {
    html += `<div class="dropdown-footer">และอีก ${patients.length - 8} คน...</div>`;
  }

  html += "</div>";
  resultDiv.innerHTML = html;
  resultDiv.classList.add("show");
}

function selectPatient(patientId) {
    // หาข้อมูลผู้ป่วยจาก id
  const patient = allPatients.find((p) => p.id == patientId);

  if (patient) {
    window.currentPatient = patient;
    document.getElementById("search-input").value = `${patient.employee_id} - ${patient.first_name} ${patient.last_name}`;
    displaySelectedPatient(patient);
  }
}

function displaySelectedPatient(patient) {
  const resultDiv = document.getElementById("search-result");
  const gender = patient.gender === "male" ? "ชาย" : "หญิง";
  const weightText = patient.weight ? `${patient.weight} กก.` : "ยังไม่ได้ระบุ";
  const heightText = patient.height ? `${patient.height} ซม.` : "ยังไม่ได้ระบุ";

  resultDiv.innerHTML = `
    <div class="selected-patient">
      <div class="selected-header">ผู้ป่วยที่เลือก:</div>
      <div class="selected-info">
        <strong>รหัส:</strong> ${patient.employee_id} <strong>ชื่อ:</strong> ${patient.first_name} ${patient.last_name}<br>
        <strong>แผนก:</strong> ${patient.department} <strong>เพศ:</strong> ${gender} <strong>เบอร์:</strong> ${patient.phone}<br>
        <strong>น้ำหนัก:</strong> ${weightText} <strong>ส่วนสูง:</strong> ${heightText}<br>
        <strong>แพ้ยา:</strong> ${patient.allergies || "ไม่มี"}
        <strong>โรคประจำตัว:</strong> ${patient.medical_conditions	 || "ไม่มี"}

      </div>
    </div>
  `;
  resultDiv.classList.add("show");
}

function clearSearchDisplay() {
  document.getElementById("search-result").classList.remove("show");
  document.getElementById("search-result").innerHTML = "";
}