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
        </ul>
        <h3>หน้าเว็บ:</h3>
        <ul>
            <li><a href="/patients.html">👥 กรอกข้อมูลผู้ป่วย</a></li>
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

// API สำหรับบันทึกข้อมูลผู้ป่วยใหม่
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
      age,
      weight,
      height,
      blood_pressure,
      pulse,
      temperature,
      chief_complaint,
      allergies,
    } = req.body;

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

    if (!chief_complaint || chief_complaint.trim() === "") {
      return res.json({
        success: false,
        error: "กรุณากรอกอาการหลัก",
      });
    }

    // SQL Query
    const sql = `
      INSERT INTO patients (
        first_name, last_name, gender, phone, employee_id, department, 
        visit_date, age, weight, height, blood_pressure, 
        pulse, temperature, chief_complaint, allergies, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    // ข้อมูลที่จะบันทึก
    const values = [
      first_name.trim(),
      last_name.trim(),
      gender.trim(),
      phone.trim(),
      employee_id.trim(),
      department.trim(),
      age ? parseInt(age) : null,
      weight ? parseFloat(weight) : null,
      height ? parseFloat(height) : null,
      blood_pressure ? blood_pressure.trim() : null,
      pulse ? parseInt(pulse) : null,
      temperature ? parseFloat(temperature) : null,
      chief_complaint.trim(),
      allergies || null,
    ];

    // บันทึกลงฐานข้อมูล
    const [result] = await connection.execute(sql, values);

    await connection.end();

    res.json({
      success: true,
      message: "บันทึกข้อมูลผู้ป่วยเรียบร้อยแล้ว",
      patient_id: result.insertId,
      data: {
        รหัสพนักงาน: employee_id.trim(),
        แผนก: department.trim(),
        ชื่อ: `${first_name.trim()} ${last_name.trim()}`,
        เพศ: gender === "male" ? "ชาย" : "หญิง",
        เบอร์โทร: phone.trim(),
        อาการหลัก: chief_complaint.trim(),
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

// Route สำหรับเสิร์ฟไฟล์ HTML
app.get("/patients", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "patients.html"));
});

// เริ่มต้น Server
app.listen(PORT, () => {
  console.log(`Server เริ่มทำงานแล้ว`);
  console.log(`เปิดเบราว์เซอร์ไปที่: http://localhost:${PORT}`);
  console.log(`หน้าผู้ป่วย: http://localhost:${PORT}/patients.html`);
  console.log(`ข้อมูลผู้ป่วย: http://localhost:${PORT}/api/patients`);
});
