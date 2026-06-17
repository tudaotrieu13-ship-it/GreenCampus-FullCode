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

    // Danh sách CÁC CỘT CHÍNH THỨC được phép tồn tại trong bảng transactions
    const allowedCols = [
      'id', 'item_id', 'buyer_id', 'seller_id', 'amount', 'status', 'created_at',
      'buyer_confirmed', 'seller_confirmed', 'delivery_address', 'buyer_name', 
      'buyer_phone', 'payment_method'
    ];

    console.log("TIẾN HÀNH RÀ SOÁT TỔNG LỰC BẢNG TRANSACTIONS...");

    // Lấy tất cả các cột hiện tại của bảng transactions
    const [cols] = await db.query(`SHOW COLUMNS FROM transactions`);
    
    for (const row of cols) {
      const colName = row.Field;
      if (!allowedCols.includes(colName)) {
        console.log(`\nPhát hiện cột gián điệp: '${colName}'`);
        
        // 1. Tìm và cắt khóa ngoại nếu có
        const [fks] = await db.query(`
          SELECT CONSTRAINT_NAME
          FROM information_schema.KEY_COLUMN_USAGE
          WHERE TABLE_SCHEMA = ?
            AND TABLE_NAME = 'transactions'
            AND COLUMN_NAME = ?
            AND REFERENCED_TABLE_NAME IS NOT NULL
        `, [process.env.DB_NAME, colName]);

        for (const fk of fks) {
          try {
            await db.query(`ALTER TABLE transactions DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
            console.log(`  ✂️ Đã cắt khóa bảo vệ: ${fk.CONSTRAINT_NAME}`);
          } catch(e) {}
        }

        // 2. Nhổ cột
        try {
          await db.query(`ALTER TABLE transactions DROP COLUMN ${colName}`);
          console.log(`  🗑️ Đã búng tay bay màu cột: ${colName}`);
        } catch(e) {
          console.log(`  ❌ Lỗi khi xóa cột ${colName}:`, e.message);
        }
      }
    }

    console.log("\n=======================================================");
    console.log("HOÀN TẤT! BẢNG GIAO DỊCH ĐÃ SẠCH SẼ HOÀN TOÀN!");
    console.log("=======================================================\n");

    await db.end();
  } catch (e) {
    console.error("Fatal error:", e);
  }
}

run();
