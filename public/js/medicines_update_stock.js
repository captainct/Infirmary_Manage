// จัดการ Stock ยา
let selectedMedicine = null;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("updateStockForm")?.addEventListener("submit", handleSubmit);
  loadMedicineFromURL();
});

async function loadMedicineFromURL() {
  const medicineCode = new URLSearchParams(window.location.search).get("code");

  if (!medicineCode) {
    alert("ไม่พบรหัสยา กรุณาเลือกยาจากหน้ารายการ");
    window.location.href = "medicines_list.html";
    return;
  }

  try {
    const res = await fetch("/api/medicines/all");
    if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลได้");

    const allMedicines = await res.json();
    selectedMedicine = allMedicines.find((m) => m.medicine_code === medicineCode);

    if (!selectedMedicine) {
      alert("ไม่พบข้อมูลยา");
      window.location.href = "medicines_list.html";
      return;
    }

    displayMedicineInfo();
    await loadLots();
  } catch (error) {
    alert("เกิดข้อผิดพลาด: " + error.message);
    window.location.href = "medicines_list.html";
  }
}

function displayMedicineInfo() {
  document.getElementById("info-code").textContent = selectedMedicine.medicine_code;
  document.getElementById("info-name").textContent = selectedMedicine.name;
  document.getElementById("info-unit").textContent = selectedMedicine.unit;
  document.getElementById("info-current").textContent = 
    `${selectedMedicine.stock_quantity || 0} ${selectedMedicine.unit}`;
}

async function loadLots() {
  try {
    const res = await fetch(`/api/medicine-lots/${selectedMedicine.medicine_code}`);
    const lots = await res.json();
    displayLots(lots);
  } catch (error) {
    alert("เกิดข้อผิดพลาดในการโหลดข้อมูล LOT");
  }
}

function displayLots(lots) {
  const list = document.getElementById("lotsList");
  if (!list) return;

  if (lots.length === 0) {
    list.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">ยังไม่มี Lot</p>';
    return;
  }

  list.innerHTML = lots.map(lot => `
    <div class="lot-item">
      <span class="lot-number">Lot: ${lot.lot_number}</span>
      <span class="lot-qty">จำนวน: ${lot.quantity} ${selectedMedicine.unit}</span>
      <span class="lot-exp">หมดอายุ: ${formatDate(lot.expiry_date)}</span>
      <button type="button" class="btn-delete-lot" onclick="deleteLot(${lot.id})">
        <i class="fas fa-trash"></i> ลบ
      </button>
    </div>
  `).join("");
}

async function handleSubmit(e) {
  e.preventDefault();

  const lotNumber = document.getElementById("lotNumber").value.trim();
  const quantity = parseInt(document.getElementById("addQuantity").value);
  const expiryDate = document.getElementById("expiryDate").value;

  if (!lotNumber || !quantity || !expiryDate) {
    alert("กรุณากรอกข้อมูลให้ครบ");
    return;
  }

  try {
    const res = await fetch("/api/medicine-lots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        medicine_id: selectedMedicine.medicine_code,
        lot_number: lotNumber,
        quantity,
        expiry_date: expiryDate,
      }),
    });

    const result = await res.json();
    
    if (res.ok) {
      alert(`เพิ่ม Lot สำเร็จ\n${lotNumber}`);
      document.getElementById("updateStockForm").reset();
      await loadMedicineFromURL();
    } else {
      alert("❌ " + (result.message || "เกิดข้อผิดพลาด"));
    }
  } catch (error) {
    alert("❌ เกิดข้อผิดพลาด: " + error.message);
  }
}

async function deleteLot(lotId) {
  if (!confirm("ต้องการลบ Lot นี้?")) return;

  try {
    const res = await fetch(`/api/medicine-lots/${lotId}`, {
      method: "DELETE",
    });
    const result = await res.json();

    if (res.ok) {
      alert("ลบ Lot สำเร็จ");
      await loadMedicineFromURL();
    } else {
      alert("❌ " + (result.message || "เกิดข้อผิดพลาด"));
    }
  } catch (error) {
    alert("❌ เกิดข้อผิดพลาด: " + error.message);
  }
}

function formatDate(d) {
  const date = new Date(d);
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${date.getFullYear() + 543}`;
}