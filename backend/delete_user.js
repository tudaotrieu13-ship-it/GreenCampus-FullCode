require('dotenv').config();
const mysql = require('mysql2/promise');

async function deleteUser() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    const studentId = '221231027';
    
    // Tạm thời tắt ràng buộc khóa ngoại để tránh lỗi khi xóa
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // Xóa tài khoản
    const [result] = await connection.query(
      `DELETE FROM users WHERE student_id = ? OR email LIKE ?`,
      [studentId, '%tu221231027%']
    );

    // Bật lại ràng buộc khóa ngoại
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    if (result.affectedRows > 0) {
      console.log(`✅ Thành công! Đã xóa sạch tài khoản có MSSV ${studentId}. Bạn có thể đăng ký lại từ đầu!`);
    } else {
      console.log(`❌ Không tìm thấy tài khoản với MSSV ${studentId} để xóa.`);
    }

    await connection.end();
  } catch (err) {
    console.error("Lỗi:", err.message);
  }
}

deleteUser();
