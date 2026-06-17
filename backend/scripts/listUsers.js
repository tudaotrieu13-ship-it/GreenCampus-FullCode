const db = require('../src/config/db');

async function listUsers() {
  try {
    const [rows] = await db.query('SELECT id, full_name, email, role_id FROM users');
    console.log('Danh sách tài khoản trong hệ thống:');
    console.table(rows);
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

listUsers();
