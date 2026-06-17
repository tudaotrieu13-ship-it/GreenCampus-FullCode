const db = require('../config/db');

/**
 * Create a new user.
 * role_id = 1 → student (default)
 */
const createUser = async ({ full_name, email, password, student_id, university, account_type }) => {
  const [result] = await db.query(
    `INSERT INTO users (full_name, email, password, student_id, role_id, university, account_type)
     VALUES (?, ?, ?, ?, 1, ?, ?)`,
    [full_name, email, password, student_id, university || null, account_type || 'Sinh viên']
  );
  return result.insertId;
};

/**
 * Find a user by email (used for login check).
 */
const findByEmail = async (email) => {
  const [rows] = await db.query(
    `SELECT id, full_name, email, password, student_id, department, university, account_type, avatar_url, role_id, bank_name, bank_account_no, bank_account_name
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email]
  );
  return rows[0] || null;
};

/**
 * Find a user by ID.
 */
const findById = async (id) => {
  const [rows] = await db.query(
    `SELECT id, full_name, email, student_id, department, university, account_type, role_id, avatar_url, created_at, bank_name, bank_account_no, bank_account_name,
      (SELECT COUNT(*) FROM transactions t WHERE t.seller_id = users.id AND t.status = 'COMPLETED') AS soldCount,
      (SELECT COUNT(*) FROM user_followers uf WHERE uf.following_id = users.id) AS followerCount,
      (SELECT AVG(rating) FROM ratings r WHERE r.rated_user_id = users.id) AS ratingAvg
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  
  if (rows[0]) {
    rows[0].ratingAvg = rows[0].ratingAvg ? Number(rows[0].ratingAvg).toFixed(1) : "0.0";
    rows[0].responseRate = 100; // Mocked real-ish for now
  }
  
  return rows[0] || null;
};

/**
 * Update user profile
 */
const updateUser = async (id, data) => {
  const fields = [];
  const values = [];

  if (data.full_name !== undefined) { fields.push('full_name = ?'); values.push(data.full_name); }
  if (data.department !== undefined) { fields.push('department = ?'); values.push(data.department); }
  if (data.university !== undefined) { fields.push('university = ?'); values.push(data.university); }
  if (data.avatar_url !== undefined) { fields.push('avatar_url = ?'); values.push(data.avatar_url); }
  if (data.password !== undefined) { fields.push('password = ?'); values.push(data.password); }
  if (data.bank_name !== undefined) { fields.push('bank_name = ?'); values.push(data.bank_name); }
  if (data.bank_account_no !== undefined) { fields.push('bank_account_no = ?'); values.push(data.bank_account_no); }
  if (data.bank_account_name !== undefined) { fields.push('bank_account_name = ?'); values.push(data.bank_account_name); }

  if (fields.length === 0) return null;

  values.push(id);
  const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
  await db.query(query, values);
  return findById(id);
};

module.exports = { createUser, findByEmail, findById, updateUser };
