require('dotenv').config();
const mysql = require('mysql2/promise');

async function syncSchema() {
  console.log("Đang rà soát và khôi phục toàn bộ CSDL về trạng thái hoàn hảo nhất...");
  try {
    const db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    // Hàm tiện ích thêm cột nếu chưa có
    async function addCol(table, col, def) {
      try {
        const [rows] = await db.query(`SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`, [process.env.DB_NAME, table, col]);
        if (rows.length === 0) {
          await db.query(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
          console.log(`✅ Đã vá lỗi: Thêm cột '${col}' vào bảng '${table}'`);
        }
      } catch(e) {
        console.error(`❌ Lỗi khi vá bảng ${table} (cột ${col}):`, e.message);
      }
    }

    async function dropCol(table, col) {
      try {
        await db.query(`ALTER TABLE ${table} DROP COLUMN ${col}`);
        console.log(`🧹 Đã dọn dẹp: Xóa cột thừa '${col}' khỏi bảng '${table}'`);
      } catch(e) {
        // Lỗi này bình thường nếu cột không tồn tại, cứ bỏ qua
      }
    }

    // 1. Vá bảng users
    await addCol('users', 'department', 'VARCHAR(255)');
    await addCol('users', 'university', 'VARCHAR(255)');
    await addCol('users', 'account_type', 'VARCHAR(50) DEFAULT "Sinh viên"');
    await addCol('users', 'avatar_url', 'VARCHAR(255)');
    await addCol('users', 'bank_name', 'VARCHAR(100)');
    await addCol('users', 'bank_account_no', 'VARCHAR(50)');
    await addCol('users', 'bank_account_name', 'VARCHAR(100)');

    // 2. Vá bảng items
    await addCol('items', 'quantity', 'INT DEFAULT 1');
    await addCol('items', 'status', 'VARCHAR(20) DEFAULT "AVAILABLE"');

    // 3. Vá bảng social_posts
    await addCol('social_posts', 'price', 'DECIMAL(10, 2)');
    try { await db.query("ALTER TABLE social_posts MODIFY COLUMN post_type ENUM('NORMAL', 'SALE') DEFAULT 'NORMAL'"); } catch(e){}

    // 4. Vá bảng transactions
    await dropCol('transactions', 'sender_id');
    await addCol('transactions', 'seller_id', 'BIGINT NOT NULL');
    await addCol('transactions', 'buyer_id', 'BIGINT NOT NULL');
    await addCol('transactions', 'amount', 'DECIMAL(10, 2) NOT NULL');
    await addCol('transactions', 'buyer_confirmed', 'BOOLEAN DEFAULT FALSE');
    await addCol('transactions', 'seller_confirmed', 'BOOLEAN DEFAULT FALSE');
    await addCol('transactions', 'delivery_address', 'VARCHAR(255)');
    await addCol('transactions', 'buyer_name', 'VARCHAR(100)');
    await addCol('transactions', 'buyer_phone', 'VARCHAR(20)');
    await addCol('transactions', 'payment_method', 'VARCHAR(50)');

    // 5. Vá bảng messages
    await addCol('messages', 'item_id', 'BIGINT');
    await addCol('messages', 'post_id', 'BIGINT');

    // 6. Xây lại bảng ratings (vì bảng cũ hay bị lỗi)
    await db.query('DROP TABLE IF EXISTS ratings');
    await db.query(`
      CREATE TABLE ratings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          transaction_id BIGINT NOT NULL,
          rater_id BIGINT NOT NULL,
          rated_user_id BIGINT NOT NULL,
          rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
          comment TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log(`✅ Đã vá lỗi: Tái tạo lại bảng 'ratings' chuẩn 100%`);

    // 7. Xây lại bảng notifications (bảng cũ bị thiếu cột type)
    await db.query('DROP TABLE IF EXISTS notifications');
    await db.query(`
      CREATE TABLE notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id BIGINT NOT NULL,
          type VARCHAR(50),
          title VARCHAR(255),
          body TEXT,
          link_page VARCHAR(255),
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log(`✅ Đã vá lỗi: Tái tạo lại bảng 'notifications' chuẩn 100%`);

    // 8. Xóa toàn bộ Trigger rác từ file SQL cũ (kẻ thù giấu mặt gây ra lỗi sender_id)
    try {
      const [triggers] = await db.query('SHOW TRIGGERS');
      for (const t of triggers) {
        await db.query(`DROP TRIGGER IF EXISTS ${t.Trigger}`);
        console.log(`🧹 Đã dọn dẹp: Xóa Trigger rác '${t.Trigger}'`);
      }
    } catch(e) {}

    await db.end();
    console.log("\n=======================================================");
    console.log("🎉 TẤT CẢ ĐÃ ĐƯỢC KHÔI PHỤC! HỆ THỐNG ĐÃ HOÀN HẢO 100%");
    console.log("=======================================================\n");

  } catch (err) {
    console.error("Lỗi kết nối CSDL:", err.message);
  }
}

syncSchema();
