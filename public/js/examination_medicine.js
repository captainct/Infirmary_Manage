// โมดูลสำหรับจัดการรายการยา
let allMedicines = [];
let selectedMedicine = null;

function setupMedicineDropdown() {
  const searchInput = document.getElementById("medicineSearchInput");
  const dropdown = document.getElementById("medicineDropdown");

  loadAllMedicines();

  searchInput.addEventListener("focus", function () {
    displayMedicineDropdown(allMedicines);
    dropdown.style.display = "block";
  });

  // เมื่อพิมพ์ค้นหา กรองยาแบบ real-time
  searchInput.addEventListener("input", function () {
    const searchTerm = this.value.toLowerCase().trim();

    if (searchTerm === "") {
      displayMedicineDropdown(allMedicines);
    } else {
      // กรองยาตามชื่อหรือรหัสยา
      const filtered = allMedicines.filter(
        (med) =>
          med.name.toLowerCase().includes(searchTerm) ||
          (med.medicine_code &&
            med.medicine_code.toLowerCase().includes(searchTerm))
      );
      displayMedicineDropdown(filtered);
    }
  });

  // ปิด dropdown เมื่อคลิกนอกพื้นที่
  document.addEventListener("click", function (event) {
    if (
      !searchInput.contains(event.target) &&
      !dropdown.contains(event.target)
    ) {
      dropdown.style.display = "none";
    }
  });
}

function loadAllMedicines() {
  fetch("/api/medicines")
    .then((response) => response.json())
    .then((data) => {
      if (data.success && data.data) {
        // เก็บเฉพาะยาที่มีสต็อกมากกว่า 0
        allMedicines = data.data.filter((med) => med.stock_quantity > 0);
      }
    })
    .catch((error) => {
      showMessage("ไม่สามารถโหลดรายการยาได้", "error");
    });
}

function displayMedicineDropdown(medicines) {
  const optionsDiv = document.getElementById("medicineOptions");

  if (!medicines || medicines.length === 0) {
    optionsDiv.innerHTML = '<div class="no-medicine">ไม่พบรายการยา</div>';
    return;
  }

  let html = '<div class="medicine-options-list">';
  medicines.forEach((medicine) => {
    html += `
      <div class="medicine-option" onclick="selectMedicineFromDropdown(${medicine.id})">
        <div class="medicine-info">
          <strong>${medicine.name}</strong>
          <div class="medicine-details">
            คงเหลือ: ${medicine.stock_quantity} ${medicine.unit} 
            ${medicine.default_instructions ? `<br>วิธีใช้: ${medicine.default_instructions}` : ""}
          </div>
        </div>
      </div>
    `;
  });
  html += "</div>";
  optionsDiv.innerHTML = html;
}

function selectMedicineFromDropdown(medicineId) {
  selectedMedicine = allMedicines.find((med) => med.id === medicineId);

  if (selectedMedicine) {
    document.getElementById("medicineSearchInput").value = selectedMedicine.name;
    document.getElementById("medicineDropdown").style.display = "none";
    document.getElementById("medicine-quantity").focus();
  }
}

function addMedicineFromDropdown() {
  const quantityInput = document.getElementById("medicine-quantity");

  if (!selectedMedicine) {
    showMessage("กรุณาเลือกยา", "error");
    return;
  }

  if (!quantityInput.value || quantityInput.value <= 0) {
    showMessage("กรุณาระบุจำนวนยา", "error");
    return;
  }

  const quantity = parseInt(quantityInput.value);

  if (quantity > selectedMedicine.stock_quantity) {
    showMessage(
      `ยามีในคลังไม่เพียงพอ (คงเหลือ: ${selectedMedicine.stock_quantity})`,
      "error"
    );
    return;
  }

  const medicine = {
    id: selectedMedicine.id,
    name: selectedMedicine.name,
    quantity: quantity,
    unit: selectedMedicine.unit,
    price: parseFloat(selectedMedicine.unit_price),
    instructions: selectedMedicine.default_instructions || "ตามแพทย์สั่ง",
    stock_quantity: selectedMedicine.stock_quantity - quantity,
  };

  window.selectedMedicines.push(medicine);
  updateMedicineList();

  document.getElementById("medicineSearchInput").value = "";
  quantityInput.value = "";
  selectedMedicine = null;
}

function updateMedicineList() {
  const listDiv = document.getElementById("medicine-list");

  if (window.selectedMedicines.length === 0) {
    listDiv.innerHTML = "ยังไม่มีรายการยา";
    return;
  }

  let html = "";

  window.selectedMedicines.forEach((medicine, index) => {
    html += `
      <div class="medicine-item">
        <div class="medicine-item-header">
          <strong>${medicine.name}</strong>
          <button onclick="removeMedicine(${index})" class="btn btn-danger btn-sm">ลบ</button>
        </div>
        <div class="medicine-item-details">
          จำนวน: ${medicine.quantity} ${medicine.unit}<br>
          คงเหลือ: ${medicine.stock_quantity} ${medicine.unit}<br>
          วิธีใช้: ${medicine.instructions}
        </div>
      </div>
    `;
  });

  listDiv.innerHTML = html;
}

function removeMedicine(index) {
  window.selectedMedicines.splice(index, 1);
  updateMedicineList();
}