const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const sourceLogo = path.join(publicDir, 'taro-logo.jpg');
const targetIcon = path.join(publicDir, 'icon.png');

if (fs.existsSync(sourceLogo)) {
  // คัดลอกรูปโลโก้ของคุณมาใช้เป็นไอคอนหลักทันที
  fs.copyFileSync(sourceLogo, targetIcon);
  console.log("✅ เปลี่ยนไอคอนแอปเป็นโลโก้ TARO PORTFOLIO สำเร็จแล้ว!");
} else {
  console.log("❌ ไม่พบไฟล์ taro-logo.jpg ในโฟลเดอร์ public กรุณาตรวจสอบชื่อไฟล์อีกครั้ง");
}