console.log("Login.js loaded successfully");

const form = document.getElementById("login-form");
const loginBtn = document.getElementById("login-btn");

// ตรวจสอบว่า login แล้วหรือยัง
fetch("/api/current-staff")
  .then((res) => res.json())
  .then((data) => {
    if (data.success) {
      window.location.href = "/patients.html";
    }
  })
  .catch((error) => {
    console.error("Error checking current staff:", error);
  });

// form submit
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const staffCode = document.getElementById("staff_code").value.trim();
    const pin = document.getElementById("pin").value.trim();

    if (!staffCode || !pin) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (pin.length !== 4) {
      alert("PIN ต้องเป็นตัวเลข 4 หลัก");
      return;
    }

    loginBtn.disabled = true;

    try {
      // ส่งข้อมูลไป Backend
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          staff_code: staffCode,
          pin: pin,
        }),
      });

      const data = await response.json();

      if (data.success) {
        window.location.href = "/patients.html";
      } else {
        alert(data.error);
        loginBtn.disabled = false;
        loginBtn.textContent = "เข้าสู่ระบบ";
        document.getElementById("pin").value = "";
        document.getElementById("pin").focus();
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
      loginBtn.disabled = false;
      loginBtn.textContent = "เข้าสู่ระบบ";
    }
  });
}

// ให้ PIN รับเฉพาะตัวเลขเท่านั้น
document.getElementById("pin").addEventListener("input", function (e) {
  this.value = this.value.replace(/[^0-9]/g, "");
});

document.getElementById("staff_code").focus();
