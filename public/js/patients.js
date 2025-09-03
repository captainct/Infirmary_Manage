// ฟังก์ชัน Error Handling
function showError(inputId, message) {
  const input = document.getElementById(inputId);
  const errorDiv = document.getElementById(inputId + "-error");
  if (input) input.style.borderColor = "red";
  if (errorDiv) {
    errorDiv.innerHTML = message;
    errorDiv.style.color = "red";
  }
}

function clearError(inputId) {
  const input = document.getElementById(inputId);
  const errorDiv = document.getElementById(inputId + "-error");
  if (input) input.style.borderColor = "#e9ecef";
  if (errorDiv) errorDiv.innerHTML = "";
}

// ตรวจสอบ Vital Signs
function checkTemperature() {
  const temp = document.getElementById("temperature");
  const value = parseFloat(temp.value);
  if (temp.value === "") {
    clearError("temperature");
    return true;
  }
  if (value < 35 || value > 41) {
    showError("temperature", "กรุณากรอกอุณหภูมิให้ถูกต้อง (35°C - 41°C)");
    return false;
  }
  clearError("temperature");
  return true;
}

function checkBloodPressure() {
  const bp = document.getElementById("blood_pressure");
  const value = bp.value.trim();

  if (value === "") {
    clearError("blood_pressure");
    return true;
  }

  const pattern = /^\d{1,3}\/\d{1,3}$/;
  if (!pattern.test(value)) {
    showError("blood_pressure", "กรุณากรอกรูปแบบ 120/80");
    return false;
  }

  const [systolic, diastolic] = value.split("/").map(Number);

  if (systolic < 50 || systolic > 250) {
    showError("blood_pressure", "ความดันตัวบนต้องอยู่ระหว่าง 50-250");
    return false;
  }

  if (diastolic < 0 || diastolic > 150) {
    showError("blood_pressure", "ความดันตัวล่างต้องอยู่ระหว่าง 0-150");
    return false;
  }

  if (systolic <= diastolic) {
    showError("blood_pressure", "ความดันตัวบนต้องมากกว่าตัวล่าง");
    return false;
  }

  clearError("blood_pressure");
  return true;
}

function checkPulse() {
  const pulse = document.getElementById("pulse");
  const value = parseInt(pulse.value);
  if (pulse.value === "") {
    clearError("pulse");
    return true;
  }
  if (value < 40 || value > 130) {
    showError(
      "pulse",
      "กรุณากรอกอัตราการเต้นของหัวใจให้ถูกต้อง (40 - 130 ครั้ง/นาที)"
    );
    return false;
  }
  clearError("pulse");
  return true;
}

// ตรวจสอบเบอร์โทร
function checkPhone() {
  const phone = document.getElementById("phone");
  const value = phone.value.trim();

  if (value === "") {
    showError("phone", "กรุณากรอกเบอร์โทร");
    return false;
  }

  // เช็คว่าเป็นตัวเลขเท่านั้น และไม่เกิน 10 หลัก
  if (!/^\d+$/.test(value)) {
    showError("phone", "กรุณากรอกเฉพาะตัวเลข");
    return false;
  }

  if (value.length > 10) {
    showError("phone", "เบอร์โทรต้องไม่เกิน 10 หลัก");
    return false;
  }

  clearError("phone");
  return true;
}

// ฟังก์ชันตรวจสอบการเลือกเพศ
function checkGender() {
  const genderRadios = document.querySelectorAll('input[name="gender"]');
  const isChecked = Array.from(genderRadios).some((radio) => radio.checked);

  if (!isChecked) {
    showError("gender", "กรุณาเลือกเพศ");
    return false;
  }

  clearError("gender");
  return true;
}

//  ฟังก์ชันดึงค่าเพศที่เลือก
function getSelectedGender() {
  const genderRadios = document.querySelectorAll('input[name="gender"]');
  const selectedGender = Array.from(genderRadios).find(
    (radio) => radio.checked
  );
  return selectedGender ? selectedGender.value : null;
}

// แสดง Alert
function showAlert(message, type) {
  const alertDiv = document.getElementById("alert-message");
  alertDiv.innerHTML = message;

  if (type === "success") {
    alertDiv.style.backgroundColor = "#d4edda";
    alertDiv.style.color = "#155724";
    alertDiv.style.border = "1px solid #c3e6cb";
  } else if (type === "error") {
    alertDiv.style.backgroundColor = "#f8d7da";
    alertDiv.style.color = "#721c24";
    alertDiv.style.border = "1px solid #f5c6cb";
  }

  alertDiv.style.display = "block";
  alertDiv.style.padding = "15px";
  alertDiv.style.borderRadius = "5px";
  alertDiv.style.marginBottom = "20px";

  setTimeout(() => (alertDiv.style.display = "none"), 5000);
}

// ระบบจัดการ Allergy แบบ Multi-select ใหม่
let selectedAllergies = []; // เก็บรายการยาที่แพ้ทั้งหมด

function getAllergyData() {
  return selectedAllergies.length > 0 ? selectedAllergies.join(", ") : null;
}

function addAllergy(allergyName) {
  const trimmedName = allergyName.trim();
  if (!trimmedName) return false;

  // ตรวจสอบความซ้ำ (case insensitive)
  const exists = selectedAllergies.some(
    (allergy) => allergy.toLowerCase() === trimmedName.toLowerCase()
  );

  if (!exists) {
    selectedAllergies.push(trimmedName);
    updateAllergyDisplay();
    return true;
  }
  return false;
}

function removeAllergy(allergyName) {
  selectedAllergies = selectedAllergies.filter(
    (allergy) => allergy !== allergyName
  );

  // อัพเดท checkbox ถ้าเป็นยาในรายการ
  const checkbox = document.querySelector(`input[value="${allergyName}"]`);
  if (checkbox) checkbox.checked = false;
}

function updateAllergyDisplay() {
  const container = document.getElementById("selectedTags");
  container.innerHTML = "";

  selectedAllergies.forEach((allergy) => {
    const tag = document.createElement("div");
    tag.className = "allergy-tag";
    tag.innerHTML = `
      <span title="${allergy}">${allergy}</span>
      <button type="button" class="remove-tag" onclick="removeAllergy('${allergy.replace(
        /'/g,
        "\\'"
      )}')">×</button>
    `;
    container.appendChild(tag);
  });
}

function filterMedicineOptions(searchTerm) {
  const options = document.querySelectorAll(".medicine-option");
  const customOption = document.getElementById("addCustomOption");
  const customNameSpan = document.getElementById("customMedicineName");

  let hasVisibleOptions = false;
  let exactMatch = false;

  options.forEach((option) => {
    const label = option.querySelector("label").textContent.toLowerCase();
    const matches = label.includes(searchTerm.toLowerCase());
    option.style.display = matches ? "flex" : "none";
    if (matches) {
      hasVisibleOptions = true;
      if (label === searchTerm.toLowerCase()) {
        exactMatch = true;
      }
    }
  });

  // แสดง "Add custom" ถ้าไม่มีการจับคู่ที่แน่นอนและมีข้อความค้นหา
  if (searchTerm.trim() && !exactMatch) {
    customOption.style.display = "block";
    customNameSpan.textContent = searchTerm;
  } else {
    customOption.style.display = "none";
  }

  return hasVisibleOptions;
}

function setupAllergySystem() {
  const searchInput = document.getElementById("allergySearchInput");
  const dropdown = document.getElementById("allergyDropdown");
  const addBtn = document.getElementById("addAllergyFromSearch");
  const container = document.querySelector(".allergy-input-container");

  // คลิกที่ container เพื่อ focus input
  container.addEventListener("click", (e) => {
    if (e.target === container || e.target.closest(".selected-tags")) {
      searchInput.focus();
    }
  });

  // แสดง/ซ่อน dropdown
  searchInput.addEventListener("focus", () => {
    dropdown.style.display = "block";
    filterMedicineOptions(searchInput.value);
  });

  // ซ่อน dropdown เมื่อคลิกนอกพื้นที่
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".allergy-multiselect")) {
      dropdown.style.display = "none";
    }
  });

  // ค้นหาและกรอง
  searchInput.addEventListener("input", (e) => {
    filterMedicineOptions(e.target.value);
  });

  // กด Enter หรือคลิก + เพื่อเพิ่ม
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = searchInput.value.trim();
      if (value) {
        if (addAllergy(value)) {
          searchInput.value = "";
          filterMedicineOptions("");
        }
      }
    }
  });

  addBtn.addEventListener("click", () => {
    const value = searchInput.value.trim();
    if (value) {
      if (addAllergy(value)) {
        searchInput.value = "";
        filterMedicineOptions("");
      }
    }
  });

  // Individual medicine checkboxes
  document
    .querySelectorAll('.medicine-option input[type="checkbox"]')
    .forEach((checkbox) => {
      checkbox.addEventListener("change", (e) => {
        const allergyName = e.target.value;

        if (e.target.checked) {
          addAllergy(allergyName);
        } else {
          removeAllergy(allergyName);
        }
      });
    });

  // Add custom medicine button
  document.querySelector(".add-custom-btn").addEventListener("click", () => {
    const customName =
      document.getElementById("customMedicineName").textContent;
    if (addAllergy(customName)) {
      searchInput.value = "";
      filterMedicineOptions("");
      dropdown.style.display = "none";
    }
  });
}

// ส่งข้อมูลไป API
async function savePatientData(formData) {
  try {
    console.log("ข้อมูลที่จะส่ง:", formData); // Debug

    const response = await fetch("/api/patients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();
    console.log("ผลลัพธ์จาก server:", result); // Debug

    if (result.success) {
      showAlert(
        `✅ ${result.message}<br>` +
          `รหัสผู้ป่วย: ${result.patient_id}<br>` +
          `ผู้ป่วย: ${result.data.ชื่อ}`,
        "success"
      );

      // รีเซ็ตฟอร์ม
      document.getElementById("patient-form").reset();
      resetAllergySection();

      return true;
    } else {
      showAlert("❌ " + result.error, "error");
      return false;
    }
  } catch (error) {
    console.error("Error:", error);
    showAlert("❌ เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์", "error");
    return false;
  }
}

// รีเซ็ต allergy section
function resetAllergySection() {
  selectedAllergies = [];
  updateAllergyDisplay();

  // รีเซ็ต checkboxes
  document
    .querySelectorAll('.medicine-option input[type="checkbox"]')
    .forEach((cb) => {
      cb.checked = false;
    });

  // รีเซ็ต search input
  const searchInput = document.getElementById("allergySearchInput");
  if (searchInput) searchInput.value = "";
}

// เมื่อโหลดหน้าเว็บ
window.onload = function () {
  // ตรวจสอบ vital signs และเบอร์โทร
  document
    .getElementById("temperature")
    .addEventListener("input", checkTemperature);
  document
    .getElementById("blood_pressure")
    .addEventListener("input", checkBloodPressure);
  document.getElementById("pulse").addEventListener("input", checkPulse);
  document.getElementById("phone").addEventListener("input", checkPhone);
  document.querySelectorAll('input[name="gender"]').forEach((radio) => {
    radio.addEventListener("change", checkGender);
  });

  // ฟอร์ม submit - แก้ไขการส่งข้อมูล
  document
    .getElementById("patient-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      // ตรวจสอบความถูกต้องของข้อมูล
      let allValid = true;

      if (!checkTemperature()) allValid = false;
      if (!checkBloodPressure()) allValid = false;
      if (!checkPulse()) allValid = false;
      if (!checkPhone()) allValid = false;
      if (!checkGender()) allValid = false;

      // ดึงข้อมูลจากฟอร์ม - ตรวจสอบให้แน่ใจว่าได้ค่าถูกต้อง
      const employeeId = document.getElementById("employee_id").value.trim();
      const department = document.getElementById("department").value.trim();
      const firstName = document.getElementById("first_name").value.trim();
      const lastName = document.getElementById("last_name").value.trim();
      const gender = getSelectedGender();
      const phone = document.getElementById("phone").value.trim();
      const chiefComplaint = document
        .getElementById("chief_complaint")
        .value.trim();

      console.log("ข้อมูลที่ดึงจากฟอร์ม:", {
        employeeId,
        department,
        firstName,
        lastName,
        gender,
        phone,
        chiefComplaint,
      }); // Debug

      // ตรวจสอบฟิลด์ที่จำเป็น
      if (!employeeId) {
        showAlert("กรุณากรอกรหัสพนักงาน", "error");
        allValid = false;
      }
      if (!department) {
        showAlert("กรุณาเลือกแผนก", "error");
        allValid = false;
      }
      if (!firstName) {
        showAlert("กรุณากรอกชื่อ", "error");
        allValid = false;
      }
      if (!lastName) {
        showAlert("กรุณากรอกนามสกุล", "error");
        allValid = false;
      }
      if (!gender) {
        showAlert("กรุณาเลือกเพศ", "error");
        allValid = false;
      }
      if (!phone) {
        showAlert("กรุณากรอกเบอร์โทร", "error");
        allValid = false;
      }
      if (!chiefComplaint) {
        showAlert("กรุณากรอกอาการหลัก", "error");
        allValid = false;
      }

      // ถ้าข้อมูลถูกต้อง ส่งไป API
      if (allValid) {
        const formData = {
          employee_id: employeeId,
          department: department,
          first_name: firstName,
          last_name: lastName,
          gender: gender,
          phone: phone,
          age: document.getElementById("age").value || null,
          weight: document.getElementById("weight").value || null,
          height: document.getElementById("height").value || null,
          blood_pressure:
            document.getElementById("blood_pressure").value || null,
          pulse: document.getElementById("pulse").value || null,
          temperature: document.getElementById("temperature").value || null,
          chief_complaint: chiefComplaint,
          allergies: getAllergyData(),
        };

        console.log("FormData ที่เตรียมส่ง:", formData); // Debug

        // ส่งข้อมูลไป API
        await savePatientData(formData);
      }
    });

  // Setup ระบบ Allergy ใหม่
  setupAllergySystem();
};
