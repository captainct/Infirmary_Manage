function updateStepIndicator(currentStep) {
  for (let i = 1; i <= 3; i++) {
    const step = document.getElementById(`step-indicator-${i}`);
    const circle = step.querySelector(".step-circle");

    step.classList.remove("active", "completed");

    if (i < currentStep) {
      step.classList.add("completed");
      circle.innerHTML = '<i class="fas fa-check"></i>';
    } else if (i === currentStep) {
      step.classList.add("active");
      circle.textContent = i;
    } else {
      circle.textContent = i;
    }
  }
}

function nextStep() {
  if (validateStep(window.currentStep)) {
    if (window.currentStep < 3) {
      window.currentStep++;
      updateStepDisplay();
    }
  }
}

function previousStep() {
  if (window.currentStep > 1) {
    window.currentStep--;
    updateStepDisplay();
  }
}

function updateStepDisplay() {
  document.querySelectorAll(".step-content").forEach((step) => step.classList.remove("show"));
  document.getElementById(`step-${window.currentStep}`).classList.add("show");
  updateStepIndicator(window.currentStep);

  document.getElementById("prev-btn").style.display = window.currentStep > 1 ? "inline-block" : "none";
  document.getElementById("next-btn").style.display = window.currentStep < 3 ? "inline-block" : "none";
  document.getElementById("save-btn").style.display = window.currentStep === 3 ? "inline-block" : "none";
}

function validateStep(step) {
  switch (step) {
    case 1:
      if (!window.currentPatient) {
        showMessage("กรุณาค้นหาและเลือกผู้ป่วย", "error");
        return false;
      }

      const serviceType = document.getElementById("service-type").value;
      const symptoms = document.getElementById("symptoms").value.trim();

      if (!serviceType) {
        showMessage("กรุณาเลือกประเภทการมาใช้บริการ", "error");
        return false;
      }

      if (!symptoms) {
        showMessage("กรุณาบันทึกอาการ", "error");
        return false;
      }
      return true;

    case 2:
      if (!window.selectedCategory) {
        showMessage("กรุณาเลือกหมวดการวินิจฉัย", "error");
        return false;
      }
      return true;

    case 3:
      // ดึง canvas element สำหรับลายเซ็นผู้ป่วย
      const patientCanvas = document.getElementById("patient-signature");
      const patientSignatureData = patientCanvas.toDataURL();

      const emptyCanvas = document.createElement("canvas");
      emptyCanvas.width = patientCanvas.width;
      emptyCanvas.height = patientCanvas.height;
      const emptyData = emptyCanvas.toDataURL();

      if (patientSignatureData === emptyData) {
        showMessage("กรุณาลงลายเซ็นผู้รับบริการ", "error");
        return false;
      }
      return true;
  }
  return true;
}

function saveExamination() {
  if (!validateStep(3)) return;

  // สร้าง object เก็บข้อมูลที่จะส่งไป server
  const formData = {
    patient_id: window.currentPatient.id,
    blood_pressure: document.getElementById("blood-pressure").value || null,
    temperature: document.getElementById("temperature").value || null,
    service_type: document.getElementById("service-type").value,
    symptoms: document.getElementById("symptoms").value,
    diagnosis_category: window.selectedCategory,
    patient_status: document.getElementById("patient-status").value,
    observation_notes: document.getElementById("observation-text").value || null,
    photos: window.attachedPhotos || [],
    medicines: window.selectedMedicines,
    patient_signature: document.getElementById("patient-signature").toDataURL(),
    staff_signature: document.getElementById("staff-signature").toDataURL(),
    total_cost: window.selectedMedicines.reduce((sum, med) => sum + med.quantity * med.price, 0),
  };

  fetch("/api/examinations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin", 
    body: JSON.stringify(formData),
  })
    .then((response) => response.json()) // แปลงเป็น JSON
    .then((data) => {
      if (data.success) {
        showMessage("บันทึกการตรวจรักษาเรียบร้อยแล้ว", "success");
        setTimeout(() => { window.location.href = "/patients.html"; }, 1500);
      } else {
        showMessage(data.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล", "error");
      }
    })
    .catch(() => showMessage("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", "error"));
}