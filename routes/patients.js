const express = require("express");
const router = express.Router();
const { connectDB } = require("../config/database");

// GET /api/patients - ดึงข้อมูลผู้ป่วยทั้งหมด
router.get("/", async (req, res) => {
  const connection = await connectDB();
  if (!connection) {
    return res.json({ error: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้" });
  }

  try {
    const [rows] = await connection.execute(`
      SELECT * FROM patients 
      ORDER BY created_at DESC
    `);
    res.json({
      message: "ดึงข้อมูลผู้ป่วยสำเร็จ",
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    res.json({ error: "มีข้อผิดพลาด: " + error.message });
  } finally {
    await connection.end();
  }
});

// GET /api/patients/next-id - ดึงรหัสพนักงานถัดไป
router.get("/next-id", async (req, res) => {
  const connection = await connectDB();
  if (!connection) {
    return res.json({ error: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้" });
  }

  try {
    // ดึงรหัสพนักงานล่าสุดที่มี format IMS + ตัวเลข
    const [rows] = await connection.execute(`
      SELECT employee_id FROM patients 
      WHERE employee_id LIKE 'IMS%'
      ORDER BY employee_id DESC 
      LIMIT 1
    `);

    let nextId;
    if (rows.length === 0) {
      // ถ้ายังไม่มีข้อมูล เริ่มที่ IMS001
      nextId = "IMS001";
    } else {
      // แยกตัวเลขออกมา เช่น IMS021 -> 21
      const lastId = rows[0].employee_id;
      const numPart = parseInt(lastId.replace("IMS", ""));
      // เพิ่ม 1 แล้วเติม 0 ข้างหน้าให้ครบ 3 หลัก
      nextId = "IMS" + String(numPart + 1).padStart(3, "0");
    }

    res.json({ success: true, nextId });
  } catch (error) {
    res.json({ error: "มีข้อผิดพลาด: " + error.message });
  } finally {
    await connection.end();
  }
});

// GET /api/patients/search - ค้นหาผู้ป่วย
router.get("/search", async (req, res) => {
  const connection = await connectDB();
  if (!connection) {
    return res.json({ error: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้" });
  }

  try {
    const { q } = req.query;
    const searchTerm = `%${q}%`;

    const [rows] = await connection.execute(
      `SELECT * FROM patients 
       WHERE first_name LIKE ? OR last_name LIKE ? OR employee_id LIKE ?
       ORDER BY created_at DESC`,
      [searchTerm, searchTerm, searchTerm]
    );

    res.json({
      message: "ค้นหาสำเร็จ",
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    res.json({ error: "มีข้อผิดพลาด: " + error.message });
  } finally {
    await connection.end();
  }
});

// POST เพิ่มผู้ป่วยใหม่
router.post("/", async (req, res) => {
  const connection = await connectDB();
  if (!connection) {
    return res.json({ success: false, error: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้" });
  }

  try {
    const {
      employee_id, department, first_name, last_name, gender, phone,
      weight, height, allergies, medical_conditions,
    } = req.body;

    if (!employee_id || !first_name || !last_name || !department || !phone) {
      return res.json({ success: false, error: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน" });
    }

    // ตรวจสอบว่ามีรหัสพนักงานนี้แล้วหรือยัง
    const [existing] = await connection.execute(
      "SELECT id FROM patients WHERE employee_id = ?",
      [employee_id]
    );

    if (existing.length > 0) {
      return res.json({ success: false, error: "รหัสพนักงานนี้มีในระบบแล้ว" });
    }

    // เพิ่มข้อมูลผู้ป่วยใหม่ 
    const [result] = await connection.execute(
      `INSERT INTO patients (
        employee_id, first_name, last_name, gender, phone, 
        department, weight, height, allergies, medical_conditions, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        employee_id, first_name, last_name, gender || "male", phone,
        department, weight || null, height || null,
        allergies || null, medical_conditions || null,
      ]
    );

    res.json({
      success: true,
      message: "เพิ่มข้อมูลผู้ป่วยสำเร็จ",
      patient_id: result.insertId, // ส่ง Response กลับพร้อม patient_id
    });
  } catch (error) {
    res.json({ success: false, error: "เกิดข้อผิดพลาดในการเพิ่มข้อมูล: " + error.message });
  } finally {
    await connection.end();
  }
});

module.exports = router;