const express = require("express");
const router = express.Router();
const { connectDB } = require("../config/database");

// POST /api/examinations - บันทึกการตรวจรักษา
router.post("/", async (req, res) => {
  const connection = await connectDB();
  if (!connection) {
    return res.json({ success: false, error: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้" });
  }

  try {
    // ตรวจสอบว่ามี session หรือไม่
    if (!req.session || !req.session.staff || !req.session.staff.id) {
      await connection.end();
      return res.json({ success: false, error: "กรุณาเข้าสู่ระบบก่อนทำการบันทึก" });
    }

    const staff_id = req.session.staff.id; // ดึง staff_id จาก session

    await connection.beginTransaction();

    const {
      patient_id, blood_pressure, temperature, service_type, symptoms,
      diagnosis_category, patient_status, observation_notes, photos,
      patient_signature, staff_signature, total_cost, medicines,
    } = req.body;

    // แยกความดันเป็น systolic และ diastolic
    let systolic_pressure = null;
    let diastolic_pressure = null;

    if (blood_pressure && blood_pressure.includes("/")) {
      const [systolic, diastolic] = blood_pressure.split("/");
      systolic_pressure = parseInt(systolic) || null;
      diastolic_pressure = parseInt(diastolic) || null;
    }
    const [examResult] = await connection.execute(
      `INSERT INTO examinations (
        patient_id, staff_id, systolic_pressure, diastolic_pressure, temperature, service_type, 
        symptoms, diagnosis_category, patient_status, observation_notes, 
        patient_signature, staff_signature, total_cost, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        patient_id || null, staff_id, systolic_pressure, diastolic_pressure, temperature || null,
        service_type || null, symptoms || null, diagnosis_category || null,
        patient_status || "discharged", observation_notes || null,
        patient_signature || null, staff_signature || null, total_cost || 0,
      ]
    );

    const examination_id = examResult.insertId;
    let actualTotalCost = 0;

    // บันทึกรูปภาพทั้งหมด
    if (photos && Array.isArray(photos) && photos.length > 0) {
      for (let i = 0; i < photos.length; i++) {
        // บันทึกรูปทีละรูป
        const photo = photos[i];
        await connection.execute(
          `INSERT INTO examination_photos (examination_id, photo_data) VALUES (?, ?)`,
          [examination_id, photo.data]
        );
      }
    }

    // บันทึกรายการยาและตัด stock
    if (medicines && medicines.length > 0) {
      for (const med of medicines) {
        // ดึงข้อมูลยา
        const [medicineData] = await connection.execute(
          "SELECT id, unit_price, stock_quantity FROM medicines WHERE id = ?",
          [med.id]
        );

        if (medicineData.length === 0) {
          throw new Error(`ไม่พบข้อมูลยา ID: ${med.id}`);
        }

        const medicine = medicineData[0];
        const unitPrice = parseFloat(medicine.unit_price);
        const subtotal = unitPrice * med.quantity;
        actualTotalCost += subtotal;

        // ตรวจสอบ stock
        if (medicine.stock_quantity < med.quantity) {
          throw new Error(`ยา ID: ${med.id} มี stock ไม่เพียงพอ (คงเหลือ: ${medicine.stock_quantity})`);
        }

        // บันทึกรายการยา
        try {
          await connection.execute(
            `INSERT INTO prescriptions 
            (examination_id, medicine_id, quantity, unit_price, subtotal, instructions)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [examination_id, med.id, med.quantity, unitPrice, subtotal, med.instructions || "ตามแพทย์สั่ง"]
          );
        } catch (prescriptionError) {
          await connection.execute(
            `INSERT INTO medicine_dispensed 
            (examination_id, medicine_id, quantity, unit_price, subtotal, instructions)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [examination_id, med.id, med.quantity, unitPrice, subtotal, med.instructions || "ตามแพทย์สั่ง"]
          );
        }

        // ตัด stock ยา
        await connection.execute(
          `UPDATE medicines SET stock_quantity = stock_quantity - ? WHERE id = ?`,
          [med.quantity, med.id]
        );
      }
    }
    // อัพเดทค่าใช้จ่ายรวม
    await connection.execute(
      "UPDATE examinations SET total_cost = ? WHERE id = ?",
      [actualTotalCost, examination_id]
    );

    // ยืนยันการทำงาน
    await connection.commit();
    await connection.end();

    res.json({
      success: true,
      message: "บันทึกการตรวจรักษาและตัด stock ยาเรียบร้อยแล้ว",
      examination_id: examination_id,
      total_cost: actualTotalCost,
      medicines_count: medicines ? medicines.length : 0,
      photos_count: photos ? photos.length : 0,
    });
  } catch (error) {
    // ยกเลิกการทำงานถ้าเกิดข้อผิดพลาด
    await connection.rollback();
    await connection.end();
    res.json({ success: false, error: error.message });
  }
});

// GET /api/examinations - ดึงประวัติการตรวจ
router.get("/", async (req, res) => {
  const connection = await connectDB();
  if (!connection) {
    return res.json({ error: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้" });
  }

  try {
    // JOIN กับตาราง staff เพื่อดึงชื่อพนักงานที่ตรวจ
    const [examinations] = await connection.execute(`
      SELECT 
        e.*,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.employee_id, p.department,
        CONCAT(s.first_name, ' ', s.last_name) as staff_name,
        s.staff_code
      FROM examinations e
      JOIN patients p ON e.patient_id = p.id
      LEFT JOIN staff s ON e.staff_id = s.id 
      ORDER BY e.created_at DESC
    `);

    // รวมความดันตัวบนและล่างกลับเป็น blood_pressure เพื่อแสดงผล
    const formattedExaminations = examinations.map((exam) => ({
      ...exam,
      blood_pressure: exam.systolic_pressure && exam.diastolic_pressure
        ? `${exam.systolic_pressure}/${exam.diastolic_pressure}`
        : "",
    }));

    res.json({
      message: "ประวัติการตรวจรักษาทั้งหมด",
      count: formattedExaminations.length,
      data: formattedExaminations,
    });

    await connection.end();
  } catch (error) {
    res.json({ error: "มีข้อผิดพลาด: " + error.message });
    await connection.end();
  }
});

// GET /api/examinations/:id - ดึงข้อมูลการตรวจครั้งเดียว
router.get("/:id", async (req, res) => {
  const connection = await connectDB();
  if (!connection) {
    return res.json({ error: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้" });
  }

  try {
    const { id } = req.params;

    // JOIN กับตาราง staff เพื่อดึงชื่อพนักงานที่ตรวจ
    const [examination] = await connection.execute(
      `SELECT 
        e.*,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.employee_id, p.department,
        CONCAT(s.first_name, ' ', s.last_name) as staff_name,
        s.staff_code
      FROM examinations e
      JOIN patients p ON e.patient_id = p.id
      LEFT JOIN staff s ON e.staff_id = s.id
      WHERE e.id = ?`,
      [id]
    );

    if (examination.length === 0) {
      await connection.end();
      return res.json({ success: false, error: "ไม่พบข้อมูลการตรวจ" });
    }
    
    // รวมความดันตัวบนและล่างกลับเป็น blood_pressure 
    const examData = {
      ...examination[0],
      blood_pressure: examination[0].systolic_pressure && examination[0].diastolic_pressure
        ? `${examination[0].systolic_pressure}/${examination[0].diastolic_pressure}`
        : "",
    };
    
    // ดึงรายการยาที่จ่าย
    const [medicines] = await connection.execute(
      `SELECT 
        md.*,
        m.name as medicine_name,
        m.unit
      FROM medicine_dispensed md
      JOIN medicines m ON md.medicine_id = m.id
      WHERE md.examination_id = ?`,
      [id]
    );

    // ดึงรูปภาพทั้งหมด
    let photos = [];
    try {
      const [photosData] = await connection.execute(
        `SELECT id, photo_data, uploaded_at 
         FROM examination_photos 
         WHERE examination_id = ? 
         ORDER BY uploaded_at ASC`,
        [id]
      );
      photos = photosData;
    } catch (error) {
      // ตาราง examination_photos อาจยังไม่ถูกสร้าง
    }

    await connection.end();

    res.json({
      success: true,
      examination: examData,
      medicines: medicines,
      photos: photos,
    });
  } catch (error) {
    res.json({ error: "มีข้อผิดพลาด: " + error.message });
    await connection.end();
  }
});

module.exports = router;