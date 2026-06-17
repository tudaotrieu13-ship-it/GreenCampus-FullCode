const db = require('./src/config/db');

async function migrate() {
  try {
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS bank_account_no VARCHAR(50),
      ADD COLUMN IF NOT EXISTS bank_account_name VARCHAR(100);
    `);
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS transactions (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          item_id BIGINT NOT NULL,
          buyer_id BIGINT NOT NULL,
          seller_id BIGINT NOT NULL,
          amount DECIMAL(10, 2) NOT NULL,
          status ENUM('PENDING', 'SHIPPING', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS ratings (
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

    await db.query(`
      ALTER TABLE transactions
      ADD COLUMN IF NOT EXISTS buyer_confirmed BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS seller_confirmed BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS delivery_address VARCHAR(255),
      ADD COLUMN IF NOT EXISTS buyer_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS buyer_phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          user_id BIGINT NOT NULL,
          type VARCHAR(50) NOT NULL DEFAULT 'general',
          title VARCHAR(255) NOT NULL,
          body TEXT,
          link_page VARCHAR(100),
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id),
          INDEX idx_is_read (is_read)
      )
    `);

    console.log("Migration successful");
  } catch (e) {
    // MySQL 5.7 doesn't support IF NOT EXISTS on ADD COLUMN
    console.error("Migration error, trying manual fallback...");
    try { await db.query(`ALTER TABLE users ADD COLUMN bank_name VARCHAR(100)`); } catch(e) {}
    try { await db.query(`ALTER TABLE users ADD COLUMN bank_account_no VARCHAR(50)`); } catch(e) {}
    try { await db.query(`ALTER TABLE users ADD COLUMN bank_account_name VARCHAR(100)`); } catch(e) {}
    try { await db.query(`ALTER TABLE transactions ADD COLUMN buyer_confirmed BOOLEAN DEFAULT FALSE`); } catch(e) { console.error('buyer_confirmed err:', e.message); }
    try { await db.query(`ALTER TABLE transactions ADD COLUMN seller_confirmed BOOLEAN DEFAULT FALSE`); } catch(e) { console.error('seller_confirmed err:', e.message); }
    try { await db.query(`ALTER TABLE transactions ADD COLUMN delivery_address VARCHAR(255)`); } catch(e) { console.error('delivery_address err:', e.message); }
    try { await db.query(`ALTER TABLE transactions ADD COLUMN buyer_name VARCHAR(100)`); } catch(e) { console.error('buyer_name err:', e.message); }
    try { await db.query(`ALTER TABLE transactions ADD COLUMN buyer_phone VARCHAR(20)`); } catch(e) { console.error('buyer_phone err:', e.message); }
    try { await db.query(`ALTER TABLE transactions ADD COLUMN payment_method VARCHAR(50)`); } catch(e) { console.error('payment_method err:', e.message); }
    console.log("Migration fallback completed.");
  }
}

module.exports = migrate;
