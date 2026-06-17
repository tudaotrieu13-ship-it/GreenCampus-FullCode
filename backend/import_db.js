const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function importDb() {
  console.log('Connecting to database with config:');
  console.log('Host:', process.env.DB_HOST);
  console.log('User:', process.env.DB_USER);
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      multipleStatements: true
    });

    console.log('Connected to MySQL server successfully.');

    // path to greencampus.sql is in the parent directory of GreenCampus_Project
    // GreenCampus_Project is __dirname's parent parent
    const sqlPath = path.resolve(__dirname, '../../greencampus.sql');
    console.log('Reading SQL file from:', sqlPath);
    
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`SQL file not found at: ${sqlPath}`);
    }
    
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing database schema creation and seed data...');
    await connection.query(sql);
    
    console.log('================================================');
    console.log('Database schema and seed data imported successfully!');
    console.log('================================================');
    
    await connection.end();
  } catch (error) {
    console.error('Error importing database:', error);
  }
}

importDb();
