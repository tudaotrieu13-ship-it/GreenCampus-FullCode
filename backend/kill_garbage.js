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

    // Các cột rác có thể đã bị lọt vào bảng transactions
    const garbageCols = ['receiver_id', 'content', 'is_read', 'post_id'];

    console.log("Đang càn quét mọi tàn dư cuối cùng trong bảng transactions...");

    for (const col of garbageCols) {
      // Tìm tên khóa ngoại của cột này (nếu có)
      const [rows] = await db.query(`
        SELECT CONSTRAINT_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME = 'transactions'
          AND COLUMN_NAME = ?
          AND REFERENCED_TABLE_NAME IS NOT NULL
      `, [process.env.DB_NAME, col]);

      if (rows.length > 0) {
        for (const row of rows) {
          try {
            await db.query(`ALTER TABLE transactions DROP FOREIGN KEY ${row.CONSTRAINT_NAME}`);
            console.log(`✅ Đã cắt khóa ngoại ${row.CONSTRAINT_NAME} của cột ${col}`);
          } catch(e) {
            console.log(`Lỗi khi cắt khóa ${row.CONSTRAINT_NAME}:`, e.message);
          }
        }
      }

      // Xóa cột
      try {
        await db.query(`ALTER TABLE transactions DROP COLUMN ${col}`);
        console.log(`✅ Đã nhổ tận gốc cột rác: ${col}`);
      } catch (e) {
        // Cột không tồn tại, bỏ qua
      }
    }

    console.log("HOÀN TẤT DỌN DẸP! CSDL ĐÃ SẠCH BÓNG QUÂN THÙ!");
    await db.end();
  } catch (e) {
    console.error("Fatal error:", e);
  }
}

run();
