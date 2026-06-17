const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  try {
    const db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    console.log("Tiến hành cắt đứt khóa ngoại bảo vệ...");
    try {
      await db.query("ALTER TABLE transactions DROP FOREIGN KEY transactions_ibfk_2");
      console.log("✅ Đã cắt đứt khóa ngoại 'transactions_ibfk_2'");
    } catch(e) {
      console.log("Khóa ngoại không tồn tại hoặc đã bị xóa:", e.message);
    }

    console.log("Tiến hành nhổ cột sender_id...");
    try {
      await db.query("ALTER TABLE transactions DROP COLUMN sender_id");
      console.log("✅ Đã nhổ thành công cột 'sender_id' khỏi bảng transactions!");
    } catch(e) {
      console.log("Lỗi khi nhổ cột:", e.message);
    }

    await db.end();
  } catch (e) {
    console.error("Fatal error:", e);
  }
}

run();
