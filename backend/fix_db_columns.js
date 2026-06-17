require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixDb() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    console.log("Connected to MySQL.");

    const columnsToAdd = [
      { table: 'users', col: 'university', def: 'VARCHAR(255) AFTER department' },
      { table: 'users', col: 'account_type', def: 'VARCHAR(50) DEFAULT "Sinh viên" AFTER student_id' },
      { table: 'users', col: 'avatar_url', def: 'VARCHAR(255) AFTER university' },
      { table: 'items', col: 'status', def: 'VARCHAR(20) DEFAULT "AVAILABLE" AFTER category_id' },
      { table: 'items', col: 'quantity', def: 'INT DEFAULT 1 AFTER status' },
      { table: 'messages', col: 'post_id', def: 'BIGINT AFTER item_id' },
      { table: 'social_posts', col: 'price', def: 'DECIMAL(10, 2) AFTER content' },
      { table: 'transactions', col: 'buyer_id', def: 'BIGINT NOT NULL AFTER item_id' },
      { table: 'transactions', col: 'amount', def: 'DECIMAL(10, 2) NOT NULL AFTER seller_id' },
      { table: 'users', col: 'bank_name', def: 'VARCHAR(100) AFTER avatar_url' },
      { table: 'users', col: 'bank_account_no', def: 'VARCHAR(50) AFTER bank_name' },
      { table: 'users', col: 'bank_account_name', def: 'VARCHAR(100) AFTER bank_account_no' }
    ];

    console.log("Recreating ratings table...");
    await connection.query('DROP TABLE IF EXISTS ratings');
    await connection.query(`
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
    console.log("Recreated ratings table successfully.");

    for (const c of columnsToAdd) {
      try {
        const [rows] = await connection.query(`
          SELECT COLUMN_NAME 
          FROM information_schema.COLUMNS 
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
        `, [process.env.DB_NAME, c.table, c.col]);

        if (rows.length === 0) {
          console.log(`Adding column ${c.col} to ${c.table}...`);
          await connection.query(`ALTER TABLE ${c.table} ADD COLUMN ${c.col} ${c.def}`);
          console.log(`Success!`);
        } else {
          console.log(`Column ${c.col} already exists in ${c.table}.`);
        }
      } catch (err) {
        console.error(`Error adding ${c.col}:`, err.message);
      }
    }

    await connection.end();
    console.log("All done!");
  } catch (err) {
    console.error("Database connection failed:", err.message);
  }
}

fixDb();
