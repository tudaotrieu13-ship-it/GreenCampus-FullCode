const db = require('./src/config/db');

async function addColumn() {
  try {
    await db.query("ALTER TABLE users ADD COLUMN university VARCHAR(255);");
    console.log("Column 'university' added successfully.");
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log("Column 'university' already exists.");
    } else {
      console.error(err);
    }
  }
  process.exit();
}

addColumn();
