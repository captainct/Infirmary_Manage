// เชื่อมต่อฐานข้อมูล MySQL
const mysql = require('mysql2/promise');

// ตั้งค่าการเชื่อมต่อฐานข้อมูล
const dbConfig = {
    host: 'localhost',        // ที่อยู่เซิร์ฟเวอร์ 
    user: 'root',            // ชื่อผู้ใช้ MySQL
    password: '',           
    database: 'workplace_infirmary_center',  // ชื่อฐานข้อมูลที่เราสร้าง
    charset: 'utf8mb4'       // รองรับภาษาไทย
};

// สร้างตัวเชื่อมต่อ 
const pool = mysql.createPool(dbConfig);

// ฟังก์ชันทดสอบว่าเชื่อมต่อได้หรือไม่
async function testConnection() {
    try {
        // ลองเชื่อมต่อ
        const connection = await pool.getConnection();
        console.log('เชื่อมต่อฐานข้อมูลสำเร็จ!');
        
        // ปิดการเชื่อมต่อ
        connection.release();
        return true;
    } catch (error) {
        console.log('เชื่อมต่อฐานข้อมูลไม่ได้:', error.message);
        return false;
    }
}

// ฟังก์ชันดึงสถิติ
async function getSimpleStats() {
    try {
        // นับจำนวนพนักงาน
        const [employees] = await pool.execute('SELECT COUNT(*) as total FROM employees');
        
        // นับจำนวนผู้ป่วย
        const [patients] = await pool.execute('SELECT COUNT(*) as total FROM patients');
        
        // นับจำนวนยา
        const [medicines] = await pool.execute('SELECT COUNT(*) as total FROM medicines');
        
        return {
            employees: employees[0].total,
            patients: patients[0].total,
            medicines: medicines[0].total
        };
    } catch (error) {
        console.log('ดึงสถิติไม่ได้:', error.message);
        return null;
    }
}

// ส่งออกฟังก์ชันให้ไฟล์อื่นใช้
module.exports = { 
    pool,              // ตัวเชื่อมต่อฐานข้อมูล
    testConnection,    // ฟังก์ชันทดสอบ
    getSimpleStats     // ฟังก์ชันดึงสถิติ
};