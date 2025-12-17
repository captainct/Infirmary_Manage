console.log("LOADED SERVER FILE");

// import
const express = require("express");
const path = require("path");
const session = require("express-session");

// นำเข้า middleware และ routes
const { checkAuth } = require("./config/database");
const authRoutes = require("./routes/auth");
const patientsRoutes = require("./routes/patients");
const medicinesRoutes = require("./routes/medicines");
const medicineLotRoutes = require("./routes/medicine_lot");
const examinationsRoutes = require("./routes/examinations");
const dashboardRoutes = require("./routes/dashboard");

const app = express();
const PORT = 3000;

// CONFIGURATION
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "infirmary-secret-2025",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,        
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax'       
    },
  })
);

// PUBLIC ROUTES
app.get("/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/", (req, res) => {
  res.redirect("/login.html");
});

// PROTECTED PAGES
app.get("/patients", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "patients.html"));
});

app.get("/patients.html", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "patients.html"));
});

app.get("/examination", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "examination.html"));
});

app.get("/examination.html", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "examination.html"));
});

app.get("/patients_history", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "patients_history.html"));
});

app.get("/patients_history.html", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "patients_history.html"));
});

app.get("/patients_list.html", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "patients_list.html"));
});

app.get("/dashboard.html", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

app.get("/medicines_list.html", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "medicines_list.html"));
});

// API ROUTES
app.use("/api", authRoutes);
app.use("/api/patients", patientsRoutes);
app.use("/api/medicines", medicinesRoutes);
app.use("/api/medicine-lots", medicineLotRoutes);
app.use("/api", medicinesRoutes); // สำหรับ /api/medicine_dispensed
app.use("/api/examinations", examinationsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api", dashboardRoutes); // สำหรับ /api/test และ /api/check-table

// START SERVER
app.listen(PORT, () => {
  console.log(`Server เริ่มทำงานแล้ว`);
  console.log(`เปิดเบราว์เซอร์ไปที่: http://localhost:${PORT}`);
  console.log(`Login: http://localhost:${PORT}/login.html`);
  console.log(`หน้าผู้ป่วย: http://localhost:${PORT}/patients.html`);
  console.log(`หน้าห้องตรวจ: http://localhost:${PORT}/examination.html`);
  console.log(`รายชื่อผู้ป่วย: http://localhost:${PORT}/patients_list.html`);
  console.log(`ข้อมูลผู้ป่วย: http://localhost:${PORT}/api/patients`);
  console.log(`ประวัติการตรวจ: http://localhost:${PORT}/api/examinations`);
});
