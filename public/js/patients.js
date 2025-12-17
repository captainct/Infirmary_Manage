function showError(inputId, message) {
  const input = document.getElementById(inputId);
  const errorDiv = document.getElementById(inputId + "-error");
  if (input) input.style.borderColor = "red";
  if (errorDiv) errorDiv.innerHTML = `<span style="color:red">${message}</span>`;
}

function clearError(inputId) {
  const input = document.getElementById(inputId);
  const errorDiv = document.getElementById(inputId + "-error");
  if (input) input.style.borderColor = "#e9ecef";
  if (errorDiv) errorDiv.innerHTML = "";
}

function showAlert(message, type) {
  const alertDiv = document.getElementById("alert-message");
  alertDiv.innerHTML = message;
  alertDiv.className = `alert ${type}`;
  alertDiv.style.display = "block";
  setTimeout(() => (alertDiv.style.display = "none"), 5000);
}

const validations = {
  phone: function () {
    const phone = document.getElementById("phone");
    const value = phone.value.trim();

    if (value === "") {
      showError("phone", "กรุณากรอกเบอร์โทร");
      return false;
    }
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
  },

  weight: function () {
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
  },

  height: function () {
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
  },

  gender: function () {
    const genderRadios = document.querySelectorAll('input[name="gender"]');
    const isChecked = Array.from(genderRadios).some((radio) => radio.checked);

    if (!isChecked) {
      showError("gender", "กรุณาเลือกเพศ");
      return false;
    }

    clearError("gender");
    return true;
  },
};

//  ฟังก์ชันสำหรับดึงค่าจากฟอร์ม 
function getSelectedGender() {
  const genderRadios = document.querySelectorAll('input[name="gender"]');
  const selectedGender = Array.from(genderRadios).find((radio) => radio.checked);
  return selectedGender ? selectedGender.value : null;
}

// ฟังก์ชันดึงข้อมูลจาก checkbox และรองรับช่อง "อื่นๆ"
function getCheckboxData(checkboxName, otherInputId = null) {
  const checkboxes = document.querySelectorAll(`input[name="${checkboxName}"]:checked`);
  const selectedValues = Array.from(checkboxes).map((cb) => cb.value);
  
  // เพิ่มข้อมูลจากช่อง "อื่นๆ" ถ้ามีการกรอก
  if (otherInputId) {
    const otherInput = document.getElementById(otherInputId);
    if (otherInput && otherInput.value.trim()) {
      selectedValues.push(otherInput.value.trim());
    }
  }
  
  return selectedValues.length > 0 ? selectedValues.join(", ") : null;
}

function resetCheckboxes(checkboxName) {
  const checkboxes = document.querySelectorAll(`input[name="${checkboxName}"]`);
  checkboxes.forEach((cb) => (cb.checked = false));
}

// ฟังก์ชันรีเซ็ตช่อง text input "อื่นๆ"
function resetOtherInputs() {
  const allergyOther = document.getElementById("allergy-other");
  const conditionOther = document.getElementById("condition-other");
  if (allergyOther) allergyOther.value = "";
  if (conditionOther) conditionOther.value = "";
}

function validateRequiredFields() {
  const requiredFields = [
    { id: "employee_id", name: "รหัสพนักงาน" },
    { id: "department", name: "แผนก" },
    { id: "first_name", name: "ชื่อ" },
    { id: "last_name", name: "นามสกุล" },
  ];

  let allValid = true;
  requiredFields.forEach((field) => {
    const value = document.getElementById(field.id).value.trim();
    if (!value) {
      showAlert(`กรุณากรอก${field.name}`, "error");
      allValid = false;
    }
  });

  if (!getSelectedGender()) {
    showAlert("กรุณาเลือกเพศ", "error");
    allValid = false;
  }

  return allValid;
}

async function savePatientData(formData) {
  try {
    //ส่งข้อมูลไปยัง Backend
    const response = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData), //แปลงข้อมูล Checkbox เป็น JSON String
    });

    const result = await response.json();

    if (result.success) {
      showAlert(`${result.message}<br>รหัสผู้ป่วย: ${result.patient_id}<br>ชื่อ-นามสกุล: ${formData.first_name} ${formData.last_name}`, "success");
      // รีเซ็ตฟอร์ม
      document.getElementById("patient-form").reset();
      resetCheckboxes("allergies");
      resetCheckboxes("conditions");
      resetOtherInputs(); 
      await loadNextEmployeeId()
      return true;
    } else {
      showAlert("⌫ " + result.error, "error");
      return false;
    }
  } catch (error) {
    showAlert("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์", "error");
    return false;
  }
}

async function loadNextEmployeeId() {
  try {
    const response = await fetch("/api/patients/next-id");
    const result = await response.json();
    
    if (result.success) {
      document.getElementById("employee_id").value = result.nextId;
      document.getElementById("employee_id").style.backgroundColor = "#f8f9fa";
    }
  } catch (error) {
    console.error("ไม่สามารถดึงรหัสพนักงานถัดไปได้:", error);
  }
}

window.onload = function () {
  loadNextEmployeeId();
  document.getElementById("phone").addEventListener("input", validations.phone);
  document.getElementById("weight").addEventListener("input", validations.weight);
  document.getElementById("height").addEventListener("input", validations.height);
  document.querySelectorAll('input[name="gender"]').forEach((radio) => {
    radio.addEventListener("change", validations.gender);
  });

  document.getElementById("patient-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    // ตรวจสอบความถูกต้อง
    const validationFuncs = [validations.phone, validations.weight, validations.height, validations.gender];
    const allValid = validationFuncs.every((func) => func()) && validateRequiredFields();

    // ส่งข้อมูลถ้าถูกต้อง
    if (allValid) {
      const formData = {
        employee_id: document.getElementById("employee_id").value.trim(),
        department: document.getElementById("department").value.trim(),
        first_name: document.getElementById("first_name").value.trim(),
        last_name: document.getElementById("last_name").value.trim(),
        gender: getSelectedGender(),
        phone: document.getElementById("phone").value.trim(),
        weight: document.getElementById("weight").value ? parseFloat(document.getElementById("weight").value) : null,
        height: document.getElementById("height").value ? parseFloat(document.getElementById("height").value) : null,
        allergies: getCheckboxData("allergies", "allergy-other"),        // รวมช่อง "อื่นๆ" ของประวัติการแพ้ยา
        medical_conditions: getCheckboxData("conditions", "condition-other"), // รวมช่อง "อื่นๆ" ของโรคประจำตัว
      };

      await savePatientData(formData);
    }
  });
};