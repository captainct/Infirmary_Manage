// ตัวแปรส่วนกลาง (Global State)
window.currentStep = 1;
window.currentPatient = null;
window.selectedMedicines = [];
window.selectedCategory = "";
window.attachedPhoto = null;

// เริ่มต้นระบบเมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener("DOMContentLoaded", function () {
  // โหลดโมดูลต่างๆ
  setupSignatures(); // จาก examination_signature.js
  setupPhotoUpload(); // จาก examination_utils.js
  setupPatientSearch(); // จาก examination_patient_search.js
  setupMedicineDropdown(); // จาก examination_medicine.js
  updateStepDisplay(); // แสดง Step 1
});
