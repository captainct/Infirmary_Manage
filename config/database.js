// DATABASE CONFIGURATION & MIDDLEWARE
const mysql = require("mysql2/promise");

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

// Middleware ตรวจสอบการ Login
function checkAuth(req, res, next) {
  if (req.session && req.session.staff) {
    next();
  } else {
    res.redirect("/login.html");
  }
}

module.exports = {
  connectDB,
  checkAuth,
};
