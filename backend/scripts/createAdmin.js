const bcrypt = require('bcryptjs');
const db = require('../src/config/db');

async function createAdmin() {
  try {
    const email = 'admin@gmail.com';
    const password = '123456';
    const fullName = 'Quản Trị Viên';
    const studentId = 'ADMIN001';

    console.log('Đang mã hoá mật khẩu...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Check if exists
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length > 0) {
      console.log('Tài khoản admin@gmail.com đã tồn tại, đang cập nhật role_id thành 2 và đổi mật khẩu thành 123456...');
      await db.query('UPDATE users SET role_id = 2, password = ? WHERE email = ?', [hashedPassword, email]);
      console.log('Cập nhật thành công!');
    } else {
      console.log('Đang tạo tài khoản admin mới...');
      await db.query(
        'INSERT INTO users (full_name, email, password, student_id, role_id) VALUES (?, ?, ?, ?, 2)',
        [fullName, email, hashedPassword, studentId]
      );
      console.log('Tạo tài khoản admin thành công!');
    }

    console.log('\n===================================');
    console.log('TÀI KHOẢN ADMIN ĐÃ SẴN SÀNG:');
    console.log('Email: admin@gmail.com');
    console.log('Mật khẩu: 123456');
    console.log('===================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Lỗi tạo tài khoản admin:', err);
    process.exit(1);
  }
}

createAdmin();
