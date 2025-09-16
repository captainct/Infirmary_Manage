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

// ตรวจสอบน้ำหนัก
function checkWeight() {
  const weight = document.getElementById("weight");
  const value = parseFloat(weight.value);

  if (weight.value === "") {
    clearError("weight");
    return true;
  }

  if (value < 1 || value > 300) {
    showError("weight", "น้ำหนักต้องอยู่ระหว่าง 1-300 กิโลกรัม");
    return false;
  }

  clearError("weight");
  return true;
}

// ตรวจสอบส่วนสูง
function checkHeight() {
  const height = document.getElementById("height");
  const value = parseFloat(height.value);

  if (height.value === "") {
    clearError("height");
    return true;
  }

  if (value < 50 || value > 250) {
    showError("height", "ส่วนสูงต้องอยู่ระหว่าง 50-250 เซนติเมตร");
    return false;
  }

  clearError("height");
  return true;
}

// ตรวจสอบเลือกเพศ
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

// ดึงค่าเพศที่เลือก
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

// ระบบจัดการ Allergy แบบ Multi-select
let selectedAllergies = []; // เก็บรายการยาที่แพ้ทั้งหมด

function getAllergyData() {
  return selectedAllergies.length > 0 ? selectedAllergies.join(", ") : null;
}

function addAllergy(allergyName) {
  const trimmedName = allergyName.trim();
  if (!trimmedName) return false;

  // ตรวจสอบความซ้ำ
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
  updateAllergyDisplay();
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

  // checkboxes ยา
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

  // button เพิ่มยา
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
    console.log("ข้อมูลที่จะส่ง:", formData);

    const response = await fetch("/api/patients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();
    console.log("ผลลัพธ์จาก server:", result);

    if (result.success) {
      showAlert(
        `✅ ${result.message}<br>` +
          `รหัสผู้ป่วย: ${result.patient_id}<br>` +
          `ผู้ป่วย: ${result.data.ชื่อ}`,
        "success"
      );

      // รีฟอร์ม
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

// โหลดหน้าเว็บ
window.onload = function () {
  // ตรวจสอบเบอร์โทรและเพศ
  document.getElementById("phone").addEventListener("input", checkPhone);
  document.getElementById("weight").addEventListener("input", checkWeight);
  document.getElementById("height").addEventListener("input", checkHeight);
  document.querySelectorAll('input[name="gender"]').forEach((radio) => {
    radio.addEventListener("change", checkGender);
  });

  // ฟอร์ม submit
  document
    .getElementById("patient-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      // ตรวจสอบความถูกต้องของข้อมูล
      let allValid = true;

      if (!checkPhone()) allValid = false;
      if (!checkWeight()) allValid = false;
      if (!checkHeight()) allValid = false;
      if (!checkGender()) allValid = false;

      // ดึงข้อมูลจากฟอร์ม
      const employeeId = document.getElementById("employee_id").value.trim();
      const department = document.getElementById("department").value.trim();
      const firstName = document.getElementById("first_name").value.trim();
      const lastName = document.getElementById("last_name").value.trim();
      const gender = getSelectedGender();
      const phone = document.getElementById("phone").value.trim();
      const weight = document.getElementById("weight").value || null;
      const height = document.getElementById("height").value || null;

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

      // ถ้าข้อมูลถูกต้อง ส่งไป API
      if (allValid) {
        const formData = {
          employee_id: employeeId,
          department: department,
          first_name: firstName,
          last_name: lastName,
          gender: gender,
          phone: phone,
          weight: weight ? parseFloat(weight) : null,
          height: height ? parseFloat(height) : null,
          allergies: getAllergyData(),
        };

        console.log("FormData ที่เตรียมส่ง:", formData);

        // ส่งข้อมูลไป API
        await savePatientData(formData);
      }
    });

  setupAllergySystem();
};
