const express = require("express");
const router = express.Router();
const { connectDB } = require("../config/database");

// GET /api/medicines - ดึงข้อมูลยาทั้งหมด
router.get("/", async (req, res) => {
  const connection = await connectDB();
  if (!connection) {
    return res.json({ error: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้" });
  }

  try {
    const [medicines] = await connection.execute(`
      SELECT 
        id, medicine_code, name, unit, 
        unit_price, stock_quantity, minimum_stock, 
        default_instructions, description, is_active
      FROM medicines 
      WHERE is_active = 1 AND stock_quantity > 0
      ORDER BY name
    `);

    res.json({
      success: true,
      message: "ข้อมูลยาทั้งหมด",
      count: medicines.length,
      data: medicines,
    });

    await connection.end();
  } catch (error) {
    res.json({ error: "มีข้อผิดพลาด: " + error.message });
    await connection.end();
  }
});

// GET /api/medicines/all - ดึงยาทั้งหมด (รวมยาที่ไม่มี stock)
router.get("/all", async (req, res) => {
  const connection = await connectDB();
  if (!connection) {
    return res.json({ success: false, error: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้" });
  }

  try {
    const [medicines] = await connection.execute(`
      SELECT 
        m.medicine_code, m.name, m.unit,
        m.stock_quantity, m.unit_price, 
        m.minimum_stock, m.description, m.default_instructions,
        (SELECT MIN(expiry_date) 
         FROM medicine_lots 
         WHERE medicine_id = m.medicine_code AND quantity > 0) as expiry_date
      FROM medicines m
      WHERE m.is_active = 1
      ORDER BY m.name ASC
    `);

    await connection.end();
    res.json(medicines);
  } catch (error) {
    await connection.end();
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล", message: error.message });
  }
});

// GET /api/medicines/search - ค้นหายา
router.get("/search", async (req, res) => {
  const connection = await connectDB();
  if (!connection) {
    return res.json({ error: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้" });
  }

  try {
    const { q } = req.query;
    const searchTerm = `%${q}%`;

    const [medicines] = await connection.execute(
      `SELECT * FROM medicines 
       WHERE name LIKE ? OR medicine_code LIKE ?
       ORDER BY name ASC`,
      [searchTerm, searchTerm]
    );

    res.json({
      message: "ค้นหายาสำเร็จ",
      count: medicines.length,
      data: medicines,
    });

    await connection.end();
  } catch (error) {
    res.json({ error: "มีข้อผิดพลาด: " + error.message });
    await connection.end();
  }
});

// POST /api/medicines - เพิ่มยาใหม่
router.post("/", async (req, res) => {
  const connection = await connectDB();
  if (!connection) {
    return res.json({ error: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้" });
  }

  try {
    const { 
      medicine_code, 
      name, 
      unit, 
      unit_price, 
      minimum_stock,
      default_instructions,
      description 
    } = req.body;

    const [result] = await connection.execute(
      `INSERT INTO medicines 
       (medicine_code, name, unit, unit_price, stock_quantity, minimum_stock, 
        default_instructions, description, created_at)
       VALUES (?, ?, ?, ?, 0, ?, ?, ?, NOW())`,
      [
        medicine_code, 
        name, 
        unit || "เม็ด", 
        unit_price || 0,
        minimum_stock || 10,
        default_instructions || null,
        description || null
      ]
    );

    await connection.end();

    res.json({
      success: true,
      message: "เพิ่มยาสำเร็จ",
      medicine_id: result.insertId,
    });
  } catch (error) {
    await connection.end();
    res.json({ success: false, error: "เกิดข้อผิดพลาดในการเพิ่มยา: " + error.message });
  }
});

// GET /api/medicine_dispensed - ดึงข้อมูลยาที่จ่ายทั้งหมด
router.get("/medicine_dispensed", async (req, res) => {
  const connection = await connectDB();
  if (!connection) {
    return res.json({ error: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้" });
  }

  try {
    const [dispensedMedicines] = await connection.execute(`
      SELECT 
        md.id, md.examination_id, md.medicine_id, md.quantity,
        md.unit_price, md.subtotal, md.instructions, md.created_at,
        m.name as medicine_name, m.medicine_code, m.unit
      FROM medicine_dispensed md
      LEFT JOIN medicines m ON md.medicine_id = m.id
      ORDER BY md.created_at DESC
    `);

    await connection.end();
    res.json({
      message: "ยาที่จ่ายทั้งหมด",
      count: dispensedMedicines.length,
      data: dispensedMedicines,
    });
  } catch (error) {
    if (connection) await connection.end();
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล", message: error.message });
  }
});

module.exports = router;