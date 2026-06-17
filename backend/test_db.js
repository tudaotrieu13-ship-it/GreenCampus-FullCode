const db = require('./src/config/db');

async function test() {
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = FALSE`,
      [1]
    );
    console.log("Count query success:", rows);
  } catch (err) {
    console.error("Count query error:", err.message);
  }

  try {
    const [rows] = await db.query(
      `SELECT id, type, title, body, link_page, is_read, created_at
       FROM notifications WHERE user_id = ?
       ORDER BY created_at DESC LIMIT ?`,
      [1, 20]
    );
    console.log("Select query success:", rows);
  } catch (err) {
    console.error("Select query error:", err.message);
  }

  try {
    const [cols] = await db.query(`SHOW COLUMNS FROM notifications`);
    console.log("Columns:", cols);
  } catch (err) {
    console.error("Show columns error:", err.message);
  }

  process.exit(0);
}

test();
