let charts = {};
let currentFilter = "week";

document.addEventListener("DOMContentLoaded", function () {
  initializeCharts();
  loadDashboardData();

  document.getElementById("time-filter").addEventListener("change", function (e) {
    currentFilter = e.target.value;
    loadDashboardData();
  });
});

function initializeCharts() {
  createDiagnosisChart();
  createVisitChart();
}

function createDiagnosisChart() {
  const ctx = document.getElementById("diagnosisChart").getContext("2d");
  charts.diagnosisChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: ["#3b82f6", "#a855f7", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"],
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: { padding: 12, font: { size: 11 }, usePointStyle: true },
        },
      },
    },
  });
}

function createVisitChart() {
  const ctx = document.getElementById("visitChart").getContext("2d");
  charts.visitChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [{ data: [], backgroundColor: "#a855f7", borderRadius: 4 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: "#f1f5f9" }, ticks: { precision: 0 } },
        x: { grid: { display: false } },
      },
    },
  });
}

async function loadDashboardData() {
  try {
    const response = await fetch(`/api/dashboard/stats?filter=${currentFilter}`);
    const data = await response.json();

    if (data.success) {
      updateStats(data);
      updateCharts(data);
      updateTable(data);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

function updateStats(data) {
  document.getElementById("total-patients").textContent = data.total_patients || 0;
}

function updateCharts(data) {
  // อัปเดตกราฟหมวดโรค
  if (data.diagnosis_categories && data.diagnosis_categories.length > 0) {
    charts.diagnosisChart.data.labels = data.diagnosis_categories.map((d) => d.name);
    charts.diagnosisChart.data.datasets[0].data = data.diagnosis_categories.map((d) => d.count);
  } else {
    charts.diagnosisChart.data.labels = ["ไม่มีข้อมูล"];
    charts.diagnosisChart.data.datasets[0].data = [1];
  }
  charts.diagnosisChart.update();

  // อัปเดตป้ายช่วงเวลา
  const periodInfo = document.getElementById("period-info");
  if (periodInfo) {
    periodInfo.textContent = data.period_label 
      ? `(${data.period_label})` 
      : (currentFilter === "week" ? "(รายสัปดาห์)" : "(รายปี)");
  }

  // อัปเดตกราฟผู้ป่วย
  if (currentFilter === "week") {
    charts.visitChart.data.labels = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];
    charts.visitChart.data.datasets[0].data = (data.visit_data && data.visit_data.length > 0) 
      ? data.visit_data 
      : [0, 0, 0, 0, 0, 0, 0];
  } else if (currentFilter === "month") {
    charts.visitChart.data.labels = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    charts.visitChart.data.datasets[0].data = (data.visit_data && data.visit_data.length > 0) 
      ? data.visit_data 
      : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  }
  charts.visitChart.update();
}

function updateTable(data) {
  const tbody = document.getElementById("medicine-tbody");

  if (data.top_medicines && data.top_medicines.length > 0) {
    tbody.innerHTML = data.top_medicines.map(med => {
      const price = parseFloat(med.price) || 0;
      return `
        <tr>
          <td>${med.name || "-"}</td>
          <td>${med.exp_date || "-"}</td>
          <td>${med.quantity || 0}</td>
          <td>${price.toFixed(2)} บาท</td>
        </tr>
      `;
    }).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="4">ไม่พบข้อมูลยา</td></tr>';
  }
}