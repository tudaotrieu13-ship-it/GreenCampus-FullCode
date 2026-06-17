const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const promisePool = pool.promise();

// Fix existing broken default avatars globally and update default schema
promisePool.query(`UPDATE users SET avatar_url = NULL WHERE avatar_url = '/uploads/default-avatar.png' OR avatar_url = 'default-avatar.png' OR avatar_url = ''`)
    .then(() => promisePool.query(`ALTER TABLE users MODIFY COLUMN avatar_url VARCHAR(255) DEFAULT NULL`))
    .catch(err => console.error('Error fixing default avatars:', err));

promisePool.query(`
    CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id INT NOT NULL,
        receiver_id INT NOT NULL,
        content TEXT,
        item_id BIGINT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL
    )
`).then(() => console.log('Messages table checked/created.'))
  .catch(err => console.error('Error creating messages table:', err));

// Add item_id column if it doesn't exist (migration)
ensureColumnExists('messages', 'item_id', 'BIGINT AFTER content');


// Auto-migration function
async function ensureColumnExists(tableName, columnName, columnDefinition) {
    try {
        const [columns] = await promisePool.query(`
            SELECT COLUMN_NAME 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
        `, [process.env.DB_NAME, tableName, columnName]);

        if (columns.length === 0) {
            await promisePool.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
            console.log(`Column ${columnName} added to ${tableName}.`);
        }
    } catch (err) {
        console.error(`Error ensuring column ${columnName} exists:`, err);
    }
}

// createTransactionsTable logic removed to prevent dropping tables on restart
async function ensureColumnDeleted(tableName, columnName) {
    try {
        const [columns] = await promisePool.query(`
            SELECT COLUMN_NAME 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
        `, [process.env.DB_NAME, tableName, columnName]);

        if (columns.length > 0) {
            await promisePool.query(`SET FOREIGN_KEY_CHECKS = 0`);
            await promisePool.query(`ALTER TABLE ${tableName} DROP COLUMN ${columnName}`);
            await promisePool.query(`SET FOREIGN_KEY_CHECKS = 1`);
            console.log(`Column ${columnName} dropped from ${tableName}.`);
        }
    } catch (err) {
        console.warn(`Could not drop column ${columnName} from ${tableName}:`, err.message);
        await promisePool.query(`SET FOREIGN_KEY_CHECKS = 1`);
    }
}

// Run migrations
ensureColumnExists('users', 'university', 'VARCHAR(255) AFTER department');
ensureColumnExists('users', 'account_type', 'VARCHAR(50) DEFAULT "Sinh viên" AFTER student_id');
ensureColumnExists('users', 'avatar_url', 'VARCHAR(255) AFTER university');
ensureColumnExists('items', 'status', "VARCHAR(20) DEFAULT 'AVAILABLE' AFTER category_id");
ensureColumnExists('items', 'quantity', 'INT DEFAULT 1 AFTER status');
ensureColumnExists('messages', 'post_id', 'BIGINT AFTER item_id');

// Fix social_posts columns
promisePool.query("ALTER TABLE social_posts MODIFY COLUMN post_type ENUM('NORMAL', 'SALE') DEFAULT 'NORMAL'")
  .then(() => console.log('Fixed social_posts post_type enum.'))
  .catch(err => console.error('Error fixing social_posts enum:', err));

ensureColumnExists('social_posts', 'price', 'DECIMAL(10, 2) AFTER content');

// Notifications
promisePool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'general',
        title VARCHAR(255) NOT NULL,
        body TEXT,
        link_page VARCHAR(50),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`).then(() => {
    console.log('Notifications table checked/created.');
}).catch(err => console.error('Error creating notifications table:', err));

// Reports
promisePool.query(`DROP TABLE IF EXISTS reports`).then(() => {
    return promisePool.query(`
        CREATE TABLE reports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            target_type ENUM('ITEM', 'POST', 'USER') NOT NULL,
            target_id BIGINT NOT NULL,
            reporter_id BIGINT NOT NULL,
            reason TEXT NOT NULL,
            status ENUM('PENDING', 'RESOLVED', 'REJECTED') DEFAULT 'PENDING',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}).then(() => console.log('Reports table recreated.'))
  .catch(err => console.error('Error creating reports table:', err));

// Wishlist
promisePool.query(`
    CREATE TABLE IF NOT EXISTS wishlists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL,
        item_id BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_wish (user_id, item_id)
    )
`).then(() => console.log('Wishlists table checked/created.'))
  .catch(err => console.error('Error creating wishlists table:', err));

// Followers
promisePool.query(`
    CREATE TABLE IF NOT EXISTS user_followers (
        follower_id BIGINT NOT NULL,
        following_id BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (follower_id, following_id)
    )
`).then(() => console.log('Followers table checked/created.'))
  .catch(err => console.error('Error creating followers table:', err));

// Chat Blocks
promisePool.query(`
    CREATE TABLE IF NOT EXISTS user_blocks (
        blocker_id BIGINT NOT NULL,
        blocked_id BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (blocker_id, blocked_id)
    )
`).then(() => console.log('user_blocks table checked/created.'))
  .catch(err => console.error('Error creating user_blocks table:', err));

// Chat Conversation Settings
promisePool.query(`
    CREATE TABLE IF NOT EXISTS conversation_settings (
        user_id BIGINT NOT NULL,
        other_user_id BIGINT NOT NULL,
        is_muted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, other_user_id)
    )
`).then(() => console.log('conversation_settings table checked/created.'))
  .catch(err => console.error('Error creating conversation_settings table:', err));

// Comments on social posts
promisePool.query(`
    CREATE TABLE IF NOT EXISTS post_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        user_id BIGINT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`).then(() => console.log('Post comments table checked/created.'))
  .catch(err => console.error('Error creating post_comments table:', err));

// Pinned items for chat conversations
promisePool.query(`
    CREATE TABLE IF NOT EXISTS pinned_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user1_id BIGINT NOT NULL,
        user2_id BIGINT NOT NULL,
        item_id BIGINT NOT NULL,
        pinned_by BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_conv_pin (user1_id, user2_id),
        FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    )
`).then(() => console.log('Pinned items table checked/created.'))
  .catch(err => console.error('Error creating pinned_items table:', err));

// Clean up any accidentally created columns from templates
// (No longer needed as table is recreated)

promisePool.query(`
    UPDATE categories SET name = 'Đồ dùng học tập' WHERE name = 'Đồ điện tử';
`).then(() => console.log('Renamed Đồ điện tử to Đồ dùng học tập.'))
  .catch(err => console.error('Error renaming category:', err));

promisePool.query(`
    UPDATE categories SET name = 'Đồ dùng KTX' WHERE id = 2;
`).then(() => console.log('Ensured id 2 is Đồ dùng KTX.'))
  .catch(err => console.error('Error updating category id 2:', err));

module.exports = promisePool;
