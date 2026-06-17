const db = require('../config/db');

const addComment = async (post_id, user_id, content) => {
  const [result] = await db.query(
    `INSERT INTO post_comments (post_id, user_id, content) VALUES (?, ?, ?)`,
    [post_id, user_id, content]
  );
  return result.insertId;
};

const getCommentsByPost = async (post_id) => {
  const [rows] = await db.query(`
    SELECT pc.id, pc.content, pc.created_at,
           u.id AS user_id, u.full_name, u.avatar_url
    FROM post_comments pc
    JOIN users u ON u.id = pc.user_id
    WHERE pc.post_id = ?
    ORDER BY pc.created_at ASC
  `, [post_id]);
  return rows;
};

const deleteComment = async (comment_id, user_id) => {
  const [result] = await db.query(
    `DELETE FROM post_comments WHERE id = ? AND user_id = ?`,
    [comment_id, user_id]
  );
  return result.affectedRows > 0;
};

module.exports = { addComment, getCommentsByPost, deleteComment };
