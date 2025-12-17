const express = require("express");
const router = express.Router();
const { connectDB } = require("../config/database");

// POST /api/login - เข้าสู่ระบบ
router.post("/login", async (req, res) => {
  const connection = await connectDB();
  if (!connection) {
    return res.json({ success: false, error: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้" });
  }

  try {
    const { staff_code, pin } = req.body;

    if (!staff_code || !pin) {
      return res.json({ success: false, error: "กรุณากรอกรหัสพนักงานและ PIN" });
    }

    const [staff] = await connection.execute(
      "SELECT * FROM staff WHERE staff_code = ? AND pin = ? AND is_active = 1",
      [staff_code.trim(), pin.trim()]
    );

    if (staff.length === 0) {
      await connection.end();
      return res.json({ success: false, error: "รหัสพนักงานหรือ PIN ไม่ถูกต้อง" });
    }

    const staffData = staff[0];
    const staffName = `${staffData.first_name} ${staffData.last_name}`;

    // เก็บข้อมูลที่จำเป็นใน session
    req.session.staff = {
      id: staffData.id, // เพิ่มบรรทัดนี้เพื่อเก็บ staff_id
      staff_code: staffData.staff_code,
      name: staffName,
    };

    await connection.execute("INSERT INTO staff_sessions (staff_id) VALUES (?)", [staffData.id]);
    await connection.end();

    res.json({
      success: true,
      message: `ยินดีต้อนรับ ${staffName}`,
      staff: { 
        id: staffData.id,  // ส่ง id กลับไปที่ frontend 
        name: staffName, 
        code: staffData.staff_code 
      },
    });
  } catch (error) {
    await connection.end();
    res.json({ success: false, error: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" });
  }
});

// POST ออกจากระบบ
router.post("/logout", async (req, res) => {
  if (!req.session.staff) {
    return res.json({ success: false, error: "ไม่พบข้อมูล session" });
  }
  req.session.destroy((err) => {
    if (err) {
      return res.json({ success: false, error: "เกิดข้อผิดพลาดในการออกจากระบบ" });
    }
    res.json({ success: true, message: "ออกจากระบบเรียบร้อยแล้ว" });
  });
});

// GET ดึงข้อมูล staff ที่ login อยู่
router.get("/current-staff", (req, res) => {
  if (req.session && req.session.staff) {
    res.json({ success: true, staff: req.session.staff });
  } else {
    res.json({ success: false, message: "ไม่ได้เข้าสู่ระบบ" });
  }
});

module.exports = router;