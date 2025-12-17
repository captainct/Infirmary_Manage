// เพิ่มยาใหม่
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("addMedicineForm").addEventListener("submit", handleSubmit);
});

async function handleSubmit(event) {
  event.preventDefault();

  // สร้าง object เก็บข้อมูลจากฟอร์ม
  const formData = {
    medicine_code: document.getElementById("medicineCode").value.trim(),
    name: document.getElementById("medicineName").value.trim(),
    unit: document.getElementById("unit").value,
    unit_price: parseFloat(document.getElementById("unitPrice").value),
    minimum_stock: parseInt(document.getElementById("minimumStock").value),
    default_instructions:
      document.getElementById("defaultInstructions").value.trim() || null,
    description: document.getElementById("description").value.trim() || null,
  };

  try {
    const response = await fetch("/api/medicines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      alert("เพิ่มยาใหม่สำเร็จ!");
      window.location.href = "medicines_list.html";
    } else {
      throw new Error(result.error || result.message || "เกิดข้อผิดพลาด");
    }
  } catch (error) {
    alert("เกิดข้อผิดพลาด: " + error.message);
  }
}