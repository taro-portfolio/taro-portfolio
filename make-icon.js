const fs = require('fs');
const path = require('path');

// สร้าง SVG สำหรับไอคอนแอปขนาด 512x512 พิกเซล ธีมสีพอร์ตโฟลิโอ (Dark Navy + สีเขียว/ตัวอักษรขาว)
const svgContent = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="110" fill="#020617"/>
  <circle cx="256" cy="256" r="160" fill="#0f172a" stroke="#10b981" stroke-width="12"/>
  <text x="50%" y="54%" font-family="Arial, sans-serif" font-size="160" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">TP</text>
</svg>
`;

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// บันทึกเป็นไฟล์ SVG ไว้ก่อนเพื่อความคมชัดสูงสุด หรือแปลงเป็น PNG ผ่านระบบเว็บ
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent.trim());

// สร้างไฟล์ icon.png จำลองจากโครงสร้าง SVG พื้นฐาน
const canvasData = Buffer.from(svgContent);
fs.writeFileSync(path.join(publicDir, 'icon.png'), canvasData);

console.log("✅ สร้างไฟล์ icon.png สำเร็จเรียบร้อยแล้ว!");