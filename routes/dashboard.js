const express = require("express");
const router = express.Router();
const { connectDB } = require("../config/database");

// GET /api/dashboard/stats - ดึงสถิติสำหรับ Dashboard
router.get("/stats", async (req, res) => {
  const connection = await connectDB();
  if (!connection) {
    return res.json({ success: false, error: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้" });
  }

  try {
    // รับ filter จาก query parameter (week, month)
    const filter = req.query.filter || "week";
    // จำนวนผู้ป่วยวันนี้
    const [patientsToday] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM examinations
      WHERE DATE(created_at) = CURDATE()
    `);

    //สร้าง WHERE clause ตาม filte
    let dateFilter = "";
    let diagnosisDateFilter = "";
    let medicineeDateFilter = "";

    if (filter === "week") {
      // กรองเฉพาะสัปดาห์ปัจจุบัน
      dateFilter = "WHERE YEARWEEK(e.created_at, 1) = YEARWEEK(CURDATE(), 1)";
      diagnosisDateFilter = "WHERE YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)";
      medicineeDateFilter = "WHERE YEARWEEK(md.created_at, 1) = YEARWEEK(CURDATE(), 1)";
    } else if (filter === "month") {
      // กรองเฉพาะเดือนปัจจุบัน
      dateFilter = "WHERE YEAR(e.created_at) = YEAR(CURDATE()) AND MONTH(e.created_at) = MONTH(CURDATE())";
      diagnosisDateFilter = "WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())";
      medicineeDateFilter = "WHERE YEAR(md.created_at) = YEAR(CURDATE()) AND MONTH(md.created_at) = MONTH(CURDATE())";
    }

    //  หมวดหมู่การวินิจฉัยโรค (กรองตาม filter) 
    const [diagnosisCategories] = await connection.execute(`
      SELECT 
        CASE diagnosis_category
          WHEN 'ortho' THEN 'กระดูกและกล้ามเนื้อ'
          WHEN 'respiratory' THEN 'ทางเดินหายใจ'
          WHEN 'alimentary' THEN 'ทางเดินอาหาร'
          WHEN 'nervous' THEN 'ระบบประสาท'
          WHEN 'urinary' THEN 'ทางเดินปัสสาวะ'
          WHEN 'teeth_mouth' THEN 'ฟันและช่องปาก'
          WHEN 'skin' THEN 'ผิวหนัง'
          WHEN 'eye' THEN 'ดวงตา'
          WHEN 'ob_gyn' THEN 'สูติ-นรีเวช'
          ELSE 'อื่นๆ'
        END as name,
        COUNT(*) as count
      FROM examinations
      ${diagnosisDateFilter} AND diagnosis_category IS NOT NULL
      GROUP BY diagnosis_category
      ORDER BY count DESC
      LIMIT 10
    `);

    // ดึงข้อมูลผู้ป่วยตาม filter
    let visitData = [];
    let periodLabel = "";

    if (filter === "week") {
      const [weeklyVisits] = await connection.execute(`
        SELECT 
          CASE DAYOFWEEK(created_at)
            WHEN 1 THEN 6 
            WHEN 2 THEN 0 
            WHEN 3 THEN 1 
            WHEN 4 THEN 2
            WHEN 5 THEN 3 
            WHEN 6 THEN 4 
            WHEN 7 THEN 5
          END as day_index,
          COUNT(*) as count
        FROM examinations
        WHERE YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)
        GROUP BY day_index
        ORDER BY day_index
      `);

      // สร้าง array [จันทร์-อาทิตย์]
      visitData = [0, 0, 0, 0, 0, 0, 0];
      // เติมข้อมูลจาก database
      weeklyVisits.forEach((day) => { visitData[day.day_index] = day.count; });
      // สร้างป้ายช่วงวันที่ (จันทร์-อาทิตย์)
      const monday = new Date();
      const dayOfWeek = monday.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      monday.setDate(monday.getDate() + diffToMonday);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const formatDate = (date) => {
        const d = date.getDate().toString().padStart(2, "0");
        const m = (date.getMonth() + 1).toString().padStart(2, "0");
        const y = (date.getFullYear() + 543).toString();
        return `${d}/${m}/${y}`;
      };

      periodLabel = `${formatDate(monday)} - ${formatDate(sunday)}`;
    } else if (filter === "month") {
      const [monthlyVisits] = await connection.execute(`
        SELECT MONTH(created_at) as month_num, COUNT(*) as count
        FROM examinations
        WHERE YEAR(created_at) = YEAR(CURDATE())
        GROUP BY month_num
        ORDER BY month_num
      `);

      visitData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      // เติมข้อมูลจาก database
      monthlyVisits.forEach((month) => {
        const index = month.month_num - 1;
        if (index >= 0 && index < 12) {
          visitData[index] = month.count;
        }
      });

      const now = new Date();
      const yearBuddhist = now.getFullYear() + 543;
      periodLabel = `ปี ${yearBuddhist}`;
    }

    //  ยาที่ใช้มากที่สุด (กรองตาม filter) 
    const [topMedicines] = await connection.execute(`
      SELECT 
        m.name,
        CAST(SUM(md.quantity) AS UNSIGNED) as quantity,
        CAST(SUM(md.subtotal) AS DECIMAL(10,2)) as price,
        (
          SELECT MIN(DATE_FORMAT(ml.expiry_date, '%d/%m/%Y'))
          FROM medicine_lots ml
          WHERE ml.medicine_id = m.medicine_code AND ml.quantity > 0
          ORDER BY ml.expiry_date ASC LIMIT 1
        ) as exp_date
      FROM medicine_dispensed md
      JOIN medicines m ON md.medicine_id = m.id
      ${medicineeDateFilter}
      GROUP BY m.id, m.name, m.medicine_code
      ORDER BY quantity DESC
      LIMIT 10
    `);

    // แปลงวันหมดอายุเป็น พ.ศ.
    topMedicines.forEach((med) => {
      if (med.exp_date) {
        const parts = med.exp_date.split("/");
        if (parts.length === 3) {
          const year = parseInt(parts[2]) + 543;
          med.exp_date = `${parts[0]}/${parts[1]}/${year}`;
        }
      } else {
        med.exp_date = "-";
      }
    });

    // รวมข้อมูลทั้งหมด
    const stats = {
      success: true,
      total_patients: patientsToday[0].count,
      visit_data: visitData,
      period_label: periodLabel,
      diagnosis_categories: diagnosisCategories,
      top_medicines: topMedicines,
    };

    await connection.end();
    res.json(stats);
  } catch (error) {
    await connection.end();
    res.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูล: " + error.message });
  }
});

// GET /api/test - ทดสอบ API
router.get("/test", (req, res) => {
  res.json({
    message: "API ทำงานปกติ",
    timestamp: new Date().toISOString(),
    status: "success",
  });
});
// GET /api/check-table - ตรวจสอบโครงสร้างตาราง
router.get("/check-table", async (req, res) => {
  const connection = await connectDB();
  if (!connection) {
    return res.json({ error: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้" });
  }

  try {
    const [columns] = await connection.execute("DESCRIBE patients");
    res.json({
      message: "โครงสร้างตาราง patients",
      columns: columns.map((col) => ({
        field: col.Field,
        type: col.Type,
        null: col.Null,
        key: col.Key,
        default: col.Default,
      })),
    });
    await connection.end();
  } catch (error) {
    res.json({ error: "มีข้อผิดพลาด: " + error.message });
    await connection.end();
  }
});

module.exports = router;