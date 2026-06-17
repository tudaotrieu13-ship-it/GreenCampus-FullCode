const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixTx() {
  console.log('Fixing transactions table schema...');
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });
    
    // Tắt kiểm tra khóa ngoại để có thể xóa bảng
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Xóa bảng cũ bị sai cấu trúc
    await connection.query('DROP TABLE IF EXISTS ratings');
    await connection.query('DROP TABLE IF EXISTS transactions');
    
    // Bật lại kiểm tra khóa ngoại
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Dropped old transactions and ratings tables.');

    // Tạo lại bảng transactions chuẩn
    await connection.query(`
      CREATE TABLE transactions (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          item_id BIGINT NOT NULL,
          buyer_id BIGINT NOT NULL,
          seller_id BIGINT NOT NULL,
          amount DECIMAL(10, 2) NOT NULL,
          status ENUM('PENDING', 'SHIPPING', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          buyer_confirmed BOOLEAN DEFAULT FALSE,
          seller_confirmed BOOLEAN DEFAULT FALSE,
          delivery_address VARCHAR(255),
          buyer_name VARCHAR(100),
          buyer_phone VARCHAR(20),
          payment_method VARCHAR(50)
      )
    `);
    console.log('Created new transactions table.');

    // Tạo lại bảng ratings chuẩn
    await connection.query(`
      CREATE TABLE ratings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          transaction_id BIGINT NOT NULL,
          rater_id BIGINT NOT NULL,
          rated_user_id BIGINT NOT NULL,
          rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
          comment TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
      )
    `);
    console.log('Created new ratings table.');

    await connection.end();
    console.log('=============================================');
    console.log('Transactions tables fixed successfully!');
    console.log('=============================================');
  } catch (err) {
    console.error('Failed:', err.message);
  }
}

fixTx();
