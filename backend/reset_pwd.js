require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function resetPassword() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    const studentId = '221231027';
    const newPassword = '123456';
    
    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Cập nhật vào DB
    const [result] = await connection.query(
      `UPDATE users SET password = ? WHERE student_id = ?`,
      [hashedPassword, studentId]
    );

    if (result.affectedRows > 0) {
      console.log(`✅ Thành công! Đã reset mật khẩu cho MSSV ${studentId} về: ${newPassword}`);
    } else {
      console.log(`❌ Không tìm thấy tài khoản với MSSV ${studentId}`);
    }

    await connection.end();
  } catch (err) {
    console.error("Lỗi:", err.message);
  }
}

resetPassword();
