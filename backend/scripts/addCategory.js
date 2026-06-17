const mysql = require('mysql2/promise');
require('dotenv').config();

async function addCategory() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'greencampus',
  });

  try {
    const [result] = await connection.execute(
      'INSERT INTO categories (name) VALUES (?) ON DUPLICATE KEY UPDATE name=name',
      ['Đồ điện tử']
    );
    console.log('Successfully added category:', result);
  } catch (err) {
    console.error('Error adding category:', err);
  } finally {
    await connection.end();
  }
}

addCategory();
