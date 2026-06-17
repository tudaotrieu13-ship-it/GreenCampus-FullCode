const mysql = require('mysql2/promise');
require('dotenv').config();

async function fix() {
  console.log('Connecting to Azure Database...');
  console.log('Host:', process.env.DB_HOST);
  console.log('Database:', process.env.DB_NAME);

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });
    
    console.log('Connected successfully. Running migrations...');

    const queries = [
      { desc: 'university in users', sql: 'ALTER TABLE users ADD COLUMN university VARCHAR(255) AFTER department' },
      { desc: 'account_type in users', sql: "ALTER TABLE users ADD COLUMN account_type VARCHAR(50) DEFAULT 'Sinh viên' AFTER student_id" },
      { desc: 'quantity in items', sql: 'ALTER TABLE items ADD COLUMN quantity INT DEFAULT 1 AFTER status' },
      { desc: 'item_id in messages', sql: 'ALTER TABLE messages ADD COLUMN item_id BIGINT AFTER content' },
      { desc: 'post_id in messages', sql: 'ALTER TABLE messages ADD COLUMN post_id BIGINT AFTER item_id' }
    ];

    for (const q of queries) {
      try {
        await connection.query(q.sql);
        console.log(`[OK] Added column: ${q.desc}`);
      } catch (e) {
        if (e.errno === 1060 || e.message.includes('Duplicate column name')) {
          console.log(`[SKIP] Already exists: ${q.desc}`);
        } else {
          console.error(`[ERROR] Failed to add ${q.desc}:`, e.message);
        }
      }
    }

    await connection.end();
    console.log('=============================================');
    console.log('Database fix script completed successfully!');
    console.log('=============================================');
  } catch (err) {
    console.error('Connection failed:', err.message);
  }
}

fix();
