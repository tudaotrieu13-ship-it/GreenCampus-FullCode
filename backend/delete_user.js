const mysql = require('mysql2/promise');
require('dotenv').config();

async function deleteUser() {
  const email = 'tu.dao.221231027@utc.edu.vn';
  console.log(`Đang tiến hành xóa tài khoản: ${email} và toàn bộ dữ liệu rác liên quan...`);
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    const [users] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      console.log('Tài khoản này không tồn tại hoặc đã bị xóa từ trước!');
      await connection.end();
      return;
    }
    const userId = users[0].id;

    // Tạm thời tắt kiểm tra khóa ngoại để xóa cho sạch
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // Xóa các dữ liệu liên quan để tránh bị lỗi hiển thị
    await connection.query('DELETE FROM item_tags WHERE item_id IN (SELECT id FROM items WHERE user_id = ?)', [userId]);
    await connection.query('DELETE FROM item_images WHERE item_id IN (SELECT id FROM items WHERE user_id = ?)', [userId]);
    await connection.query('DELETE FROM items WHERE user_id = ?', [userId]);
    await connection.query('DELETE FROM social_posts WHERE user_id = ?', [userId]);
    await connection.query('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?', [userId, userId]);
    await connection.query('DELETE FROM notifications WHERE user_id = ?', [userId]);
    
    // Xóa tài khoản chính
    await connection.query('DELETE FROM users WHERE id = ?', [userId]);

    // Bật lại khóa ngoại
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('====================================================');
    console.log(`Đã xóa sạch bóng tài khoản ${email}!`);
    console.log('Bây giờ bạn có thể đăng ký lại tài khoản này trên Web.');
    console.log('====================================================');
    
    await connection.end();
  } catch (err) {
    console.error('Lỗi khi xóa:', err.message);
  }
}

deleteUser();
