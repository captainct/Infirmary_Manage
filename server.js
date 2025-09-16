console.log("LOADED SERVER FILE");
// นำเข้าไลบรารี่
const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");
const app = express();
const PORT = 3000;

// ส่งข้อมูล JSON ได้
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// เสิร์ฟไฟล์ static จาก public folder
app.use(express.static(path.join(__dirname, "public")));

// ตั้งค่าการเชื่อมต่อฐานข้อมูล
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "workplace_infirmary_center",
};

// เชื่อมต่อฐานข้อมูล
async function connectDB() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log("เชื่อมต่อฐานข้อมูลสำเร็จ");
    return connection;
  } catch (error) {
    console.log("เชื่อมต่อฐานข้อมูลไม่สำเร็จ:", error.message);
    return null;
  }
}

// หน้าหลัก
app.get("/", (req, res) => {
  res.send(`
        <h1>🏥 ระบบจัดการคลินิก</h1>
        <p>Server ทำงานที่พอร์ต ${PORT}</p>
        <h3>ทดสอบ API:</h3>
        <ul>
            <li><a href="/api/test">🔧 ทดสอบระบบ</a></li>
            <li><a href="/api/patients">🏥 ข้อมูลผู้ป่วย</a></li>
            <li><a href="/api/check-table">🔍 ตรวจสอบโครงสร้างตาราง patients</a></li>
            <li><a href="/api/examinations">📋 ประวัติการตรวจรักษา</a></li>
        </ul>
        <h3>หน้าเว็บ:</h3>
        <ul>
            <li><a href="/patients.html">👥 กรอกข้อมูลผู้ป่วย</a></li>
            <li><a href="/examination.html">🏥 ห้องตรวจ</a></li>
            <li><a href="/patients_list.html">📋 รายชื่อผู้ป่วยทั้งหมด</a></li>
        </ul>
    `);
});

// API ทดสอบ
app.get("/api/test", (req, res) => {
  res.json({
    message: "API ทำงานปกติ",
    timestamp: new Date().toISOString(),
    status: "success",
  });
});

// API ตรวจสอบโครงสร้างตาราง patients
app.get("/api/check-table", async (req, res) => {
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

// API ข้อมูลผู้ป่วย
app.get("/api/patients", async (req, res) => {
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
      message: "ข้อมูลผู้ป่วยทั้งหมด",
      จำนวน: rows.length,
      data: rows,
    });

    await connection.end();
  } catch (error) {
    res.json({ error: "มีข้อผิดพลาด: " + error.message });
    await connection.end();
  }
});

// API นทึกข้อมูลผู้ป่วยใหม่
app.post("/api/patients", async (req, res) => {
  const connection = await connectDB();

  if (!connection) {
    return res.json({
      success: false,
      error: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้",
    });
  }

  try {
    const {
      employee_id,
      department,
      first_name,
      last_name,
      gender,
      phone,
      weight,
      height,
      allergies,
    } = req.body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!employee_id || employee_id.trim() === "") {
      return res.json({
        success: false,
        error: "กรุณากรอกรหัสพนักงาน",
      });
    }

    if (!department || department.trim() === "") {
      return res.json({
        success: false,
        error: "กรุณาเลือกแผนก",
      });
    }

    if (!first_name || first_name.trim() === "") {
      return res.json({
        success: false,
        error: "กรุณากรอกชื่อ",
      });
    }

    if (!last_name || last_name.trim() === "") {
      return res.json({
        success: false,
        error: "กรุณากรอกนามสกุล",
      });
    }

    if (!gender || gender.trim() === "") {
      return res.json({
        success: false,
        error: "กรุณาเลือกเพศ",
      });
    }

    if (!phone || phone.trim() === "") {
      return res.json({
        success: false,
        error: "กรุณากรอกเบอร์โทร",
      });
    }

    if (
      weight &&
      (isNaN(parseFloat(weight)) ||
        parseFloat(weight) < 1 ||
        parseFloat(weight) > 300)
    ) {
      return res.json({
        success: false,
        error: "น้ำหนักต้องอยู่ระหว่าง 1-300 กิโลกรัม",
      });
    }

    if (
      height &&
      (isNaN(parseFloat(height)) ||
        parseFloat(height) < 50 ||
        parseFloat(height) > 250)
    ) {
      return res.json({
        success: false,
        error: "ส่วนสูงต้องอยู่ระหว่าง 50-250 เซนติเมตร",
      });
    }

    // SQL Query
    const sql = `
      INSERT INTO patients (
        employee_id, department, first_name, last_name, gender, phone, 
        weight, height, allergies, visit_date, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), NOW())
    `;

    // ข้อมูลที่จะบันทึก
    const values = [
      employee_id.trim(),
      department.trim(),
      first_name.trim(),
      last_name.trim(),
      gender.trim(),
      phone.trim(),
      weight ? parseFloat(weight) : null,
      height ? parseFloat(height) : null,
      allergies || null,
    ];

    // บันทึกลงฐานข้อมูล
    const [result] = await connection.execute(sql, values);

    //ดึงข้อมูลผู้ป่วยที่เพิ่งบันทึก
    const [newPatient] = await connection.execute(
      "SELECT * FROM patients WHERE id = ?",
      [result.insertId]
    );

    await connection.end();

    res.json({
      success: true,
      message: "บันทึกข้อมูลผู้ป่วยเรียบร้อยแล้ว",
      patient_id: result.insertId,
      patient_data: newPatient[0],
      redirect_to_examination: true,
      data: {
        รหัสพนักงาน: employee_id.trim(),
        แผนก: department.trim(),
        ชื่อ: `${first_name.trim()} ${last_name.trim()}`,
        เพศ: gender === "male" ? "ชาย" : "หญิง",
        เบอร์โทร: phone.trim(),
        น้ำหนัก: weight ? `${weight} กก.` : "ยังไม่ได้ระบุ",
        ส่วนสูง: height ? `${height} ซม.` : "ยังไม่ได้ระบุ",
        ประวัติแพ้ยา: allergies || "ไม่มี",
        วันที่บันทึก: new Date().toLocaleString("th-TH"),
      },
    });
  } catch (error) {
    console.log("Error saving patient:", error);
    await connection.end();

    res.json({
      success: false,
      error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + error.message,
    });
  }
});

//API บันทึกการตรวจรักษา
app.post("/api/examinations", async (req, res) => {
  const connection = await connectDB();
  if (!connection) {
    return res.json({
      success: false,
      error: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้",
    });
  }

  try {
    const {
      patient_id,
      service_type,
      treatment_details,
      patient_status,
      observation_notes,
      patient_signature,
      staff_signature,
      staff_name,
      medicines,
      attached_photo,
    } = req.body;

    if (!patient_id || !service_type) {
      return res.json({ success: false, error: "กรุณาระบุข้อมูลที่จำเป็น" });
    }

    await connection.beginTransaction();

    // บันทึกการตรวจรักษา
    const visitDateTime = new Date();
    const visit_date = visitDateTime.toISOString().split("T")[0];
    const visit_time = visitDateTime.toTimeString().split(" ")[0];

    const [examResult] = await connection.execute(
      `
      INSERT INTO examinations (
        patient_id, visit_date, visit_time, service_type, treatment_details,
        patient_status, observation_notes, patient_signature, staff_signature,
        staff_name, attached_photo, total_cost
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `,
      [
        patient_id,
        visit_date,
        visit_time,
        service_type,
        treatment_details || null,
        patient_status || "discharged",
        observation_notes || null,
        patient_signature || null,
        staff_signature || null,
        staff_name || null,
        attached_photo || null,
      ]
    );

    const examination_id = examResult.insertId;
    let total_cost = 0;

    // บันทึกรายการยา
    if (medicines && medicines.length > 0) {
      for (const med of medicines) {
        // ใช้ข้อมูลยาที่ส่งมาจากหน้าบ้านก่อน
        const unit_price = med.unit_price || 0;
        const subtotal = unit_price * med.quantity;
        total_cost += subtotal;

        // บันทึกรายการยา
        await connection.execute(
          `
          INSERT INTO medicine_dispensed 
          (examination_id, medicine_id, quantity, unit_price, subtotal)
          VALUES (?, ?, ?, ?, ?)
        `,
          [
            examination_id,
            med.medicine_id || 0,
            med.quantity,
            unit_price,
            subtotal,
          ]
        );
      }
    }

    // อัพเดท totalcost
    await connection.execute(
      "UPDATE examinations SET total_cost = ? WHERE id = ?",
      [total_cost, examination_id]
    );

    await connection.commit();
    await connection.end();

    res.json({
      success: true,
      message: "บันทึกการตรวจรักษาเรียบร้อยแล้ว",
      examination_id: examination_id,
      total_cost: total_cost,
    });
  } catch (error) {
    await connection.rollback();
    await connection.end();
    res.json({ success: false, error: "เกิดข้อผิดพลาด: " + error.message });
  }
});

//API ดึงประวัติการตรวจรักษา
app.get("/api/examinations", async (req, res) => {
  const connection = await connectDB();
  if (!connection) {
    return res.json({ error: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้" });
  }

  try {
    const [examinations] = await connection.execute(`
      SELECT 
        e.*,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.employee_id, p.department
      FROM examinations e
      JOIN patients p ON e.patient_id = p.id
      ORDER BY e.created_at DESC
    `);

    res.json({
      message: "ประวัติการตรวจรักษาทั้งหมด",
      count: examinations.length,
      data: examinations,
    });

    await connection.end();
  } catch (error) {
    res.json({ error: "มีข้อผิดพลาด: " + error.message });
    await connection.end();
  }
});

// Route สำหรับเสิร์ฟไฟล์ HTML
app.get("/patients", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "patients.html"));
});

// Route สำหรับหน้าตรวจ
app.get("/examination", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "examination.html"));
});

// เริ่มต้น Server
app.listen(PORT, () => {
  console.log(`Server เริ่มทำงานแล้ว`);
  console.log(`เปิดเบราว์เซอร์ไปที่: http://localhost:${PORT}`);
  console.log(`หน้าผู้ป่วย: http://localhost:${PORT}/patients.html`);
  console.log(`หน้าห้องตรวจ: http://localhost:${PORT}/examination.html`);
  console.log(`รายชื่อผู้ป่วย: http://localhost:${PORT}/patients_list.html`);
  console.log(`ข้อมูลผู้ป่วย: http://localhost:${PORT}/api/patients`);
  console.log(`ประวัติการตรวจ: http://localhost:${PORT}/api/examinations`);
});
