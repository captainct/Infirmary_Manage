const express = require("express");
const router = express.Router();
const { connectDB } = require("../config/database");

// GET /api/medicine-lots/:code - ดึง lots ของยาตาม medicine_code
router.get("/:code", async (req, res) => {
  const connection = await connectDB();
  if (!connection) {
    return res.status(500).json({ message: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้" });
  }

  try {
    const { code } = req.params;

    const [lots] = await connection.execute(
      `SELECT id, lot_number, quantity, expiry_date, created_at
       FROM medicine_lots
       WHERE medicine_id = ? AND quantity > 0
       ORDER BY expiry_date ASC`,
      [code]
    );

    await connection.end();
    res.json(lots);
  } catch (error) {
    if (connection) await connection.end();
    res.status(500).json({ message: "เกิดข้อผิดพลาด: " + error.message });
  }
});

// POST /api/medicine-lots - เพิ่ม lot ใหม่
router.post("/", async (req, res) => {
  const connection = await connectDB();
  if (!connection) {
    return res.status(500).json({ message: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้" });
  }

  try {
    const { medicine_id, lot_number, quantity, expiry_date } = req.body;

    // ตรวจสอบว่ามียาอยู่จริง
    const [medicines] = await connection.execute(
      "SELECT medicine_code, name, unit FROM medicines WHERE medicine_code = ?",
      [medicine_id]
    );

    if (medicines.length === 0) {
      await connection.end();
      return res.status(404).json({ message: "ไม่พบยา" });
    }

    // เพิ่ม lot ใหม่
    await connection.execute(
      `INSERT INTO medicine_lots (medicine_id, lot_number, quantity, expiry_date, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [medicine_id, lot_number, quantity, expiry_date]
    );

    // อัปเดต stock รวมในตาราง medicines
    await connection.execute(
      `UPDATE medicines 
       SET stock_quantity = (
         SELECT COALESCE(SUM(quantity), 0) 
         FROM medicine_lots 
         WHERE medicine_id = ?
       )
       WHERE medicine_code = ?`,
      [medicine_id, medicine_id]
    );

    await connection.end();
    res.json({
      message: "เพิ่ม Lot สำเร็จ",
      medicine_name: medicines[0].name,
      unit: medicines[0].unit,
    });
  } catch (error) {
    if (connection) await connection.end();
    res.status(500).json({ message: "เกิดข้อผิดพลาด: " + error.message });
  }
});

// DELETE /api/medicine-lots/:lot_id - ลบ lot
router.delete("/:lot_id", async (req, res) => {
  const connection = await connectDB();
  if (!connection) {
    return res.status(500).json({ message: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้" });
  }

  try {
    const { lot_id } = req.params;

    // ดึง medicine_id (คือ medicine_code) ก่อนลบ
    const [lots] = await connection.execute(
      "SELECT medicine_id FROM medicine_lots WHERE id = ?",
      [lot_id]
    );

    if (lots.length === 0) {
      await connection.end();
      return res.status(404).json({ message: "ไม่พบ Lot" });
    }

    const medicine_code = lots[0].medicine_id;

    // ลบ lot
    await connection.execute("DELETE FROM medicine_lots WHERE id = ?", [
      lot_id,
    ]);

    // อัปเดต stock รวม
    await connection.execute(
      `UPDATE medicines 
       SET stock_quantity = (
         SELECT COALESCE(SUM(quantity), 0) 
         FROM medicine_lots 
         WHERE medicine_id = ?
       )
       WHERE medicine_code = ?`,
      [medicine_code, medicine_code]
    );

    await connection.end();
    res.json({ message: "ลบ Lot สำเร็จ" });
  } catch (error) {
    if (connection) await connection.end();
    res.status(500).json({ message: "เกิดข้อผิดพลาด: " + error.message });
  }
});

module.exports = router;
