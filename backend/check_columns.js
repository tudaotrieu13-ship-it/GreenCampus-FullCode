const db = require('./src/config/db');

async function check() {
  try {
    const [columns] = await db.query('SHOW COLUMNS FROM users');
    console.log('--- Columns in users table ---');
    console.log(columns.map(c => `${c.Field} (${c.Type})`));
    
    const [tables] = await db.query('SHOW TABLES');
    console.log('--- Tables in DB ---');
    console.log(tables);
  } catch (err) {
    console.error('Check failed:', err);
  } finally {
    process.exit(0);
  }
}

check();
