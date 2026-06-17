const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  try {
    const db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    console.log("Checking triggers...");
    const [triggers] = await db.query('SHOW TRIGGERS');
    console.log("Found triggers:", triggers.length);

    for (const t of triggers) {
      console.log(`Trigger name: ${t.Trigger}, Table: ${t.Table}, Event: ${t.Event}`);
      await db.query(`DROP TRIGGER IF EXISTS \`${t.Trigger}\``);
      console.log(`Dropped ${t.Trigger}`);
    }

    console.log("Checking if sender_id exists in transactions...");
    try {
      const [cols] = await db.query("SHOW COLUMNS FROM transactions LIKE 'sender_id'");
      if (cols.length > 0) {
        console.log("sender_id EXISTS in transactions! Dropping it...");
        await db.query("ALTER TABLE transactions DROP COLUMN sender_id");
        console.log("Dropped sender_id");
      } else {
        console.log("sender_id does NOT exist in transactions.");
      }
    } catch(e) {
      console.log("Error checking cols:", e.message);
    }

    await db.end();
  } catch (e) {
    console.error("Fatal error:", e);
  }
}

run();
