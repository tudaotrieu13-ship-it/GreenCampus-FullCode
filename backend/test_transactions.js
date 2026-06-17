const db = require('./src/config/db');

async function run() {
  try {
    const [rows] = await db.query('SELECT seller_id, status, count(*) FROM transactions GROUP BY seller_id, status');
    console.log(rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
