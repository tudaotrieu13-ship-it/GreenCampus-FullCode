const db = require('../config/db');

const getAllCategories = async () => {
  const [rows] = await db.query('SELECT * FROM categories');
  return rows;
};

module.exports = { getAllCategories };
