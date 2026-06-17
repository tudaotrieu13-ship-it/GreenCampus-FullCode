const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');

async function check() {
  try {
    const db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });
    
    const [items] = await db.query('DESCRIBE items');
    const [users] = await db.query('DESCRIBE users');
    
    const output = `items.id type: ${items.find(c => c.Field === 'id').Type}\n` +
                   `users.id type: ${users.find(c => c.Field === 'id').Type}\n`;
                   
    fs.writeFileSync(path.join(__dirname, 'schema_output.txt'), output);
    db.end();
    console.log('Schema output written');
  } catch (err) {
    console.error(err);
  }
}
check();
