const db = require('../config/db');

/**
 * Get all social posts joined with user info
 */
const getAllPosts = async (userUniversity = null) => {
  let orderBy = "ORDER BY p.created_at DESC";
  let params = [];
  
  if (userUniversity) {
    orderBy = "ORDER BY (u.university = ?) DESC, p.created_at DESC";
    params.push(userUniversity);
  }

  const [rows] = await db.query(`
    SELECT 
      p.id, 
      p.content, 
      p.image_url AS image, 
      (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) AS likes,
      p.is_sold AS sold, 
      p.price, 
      p.post_type, 
      p.created_at AS time, 
      u.full_name AS name, 
      u.avatar_url, 
      u.id AS user_id,
      u.university
    FROM social_posts p
    JOIN users u ON u.id = p.user_id
    ${orderBy}
  `, params);
  return rows;
};

/**
 * Get a single post by ID joined with user info
 */
const getPostById = async (postId) => {
  const [rows] = await db.query(`
    SELECT 
      p.id, 
      p.content, 
      p.image_url AS image, 
      (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) AS likes,
      p.is_sold AS sold, 
      p.price, 
      p.post_type, 
      p.created_at AS time, 
      u.full_name AS name, 
      u.avatar_url, 
      u.id AS user_id
    FROM social_posts p
    JOIN users u ON u.id = p.user_id
    WHERE p.id = ?
  `, [postId]);
  return rows[0];
};

/**
 * Create a new social post
 */
const createPost = async ({ user_id, content, image_url = null, price = null, post_type = 'NORMAL' }) => {
  const [result] = await db.query(
    `INSERT INTO social_posts (user_id, content, image_url, price, post_type) VALUES (?, ?, ?, ?, ?)`,
    [user_id, content, image_url, price, post_type]
  );
  return result.insertId;
};

/**
 * Toggle like for a post (Bonus points for schema if needed, but for now just update counter)
 */
const toggleLike = async (post_id, user_id) => {
  // Check if already liked
  const [existing] = await db.query('SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?', [post_id, user_id]);
  
  if (existing.length > 0) {
    // Unlike
    await db.query('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [post_id, user_id]);
    return false; // return false meaning unliked
  } else {
    // Like
    await db.query('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [post_id, user_id]);
    return true; // return true meaning liked
  }
};

/**
 * Toggle sold status for a sale post
 */
const toggleSold = async (post_id, user_id) => {
  // Use IF(is_sold = 1, 0, 1) to toggle, only if user owns the post
  await db.query(
    `UPDATE social_posts SET is_sold = IF(is_sold = 1, 0, 1) WHERE id = ? AND user_id = ?`, 
    [post_id, user_id]
  );
};

const getPostsByUserId = async (userId) => {
  const [rows] = await db.query(`
    SELECT 
      p.id, 
      p.content, 
      p.image_url AS image, 
      (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) AS likes,
      p.is_sold AS sold, 
      p.price, 
      p.post_type, 
      p.created_at AS time, 
      u.full_name AS name, 
      u.avatar_url, 
      u.id AS user_id
    FROM social_posts p
    JOIN users u ON u.id = p.user_id
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
  `, [userId]);
  return rows;
};

const deletePost = async (postId, userId) => {
  const [result] = await db.query(
    `DELETE FROM social_posts WHERE id = ? AND user_id = ?`,
    [postId, userId]
  );
  return result.affectedRows > 0;
};

module.exports = { getAllPosts, getPostById, createPost, toggleLike, toggleSold, getPostsByUserId, deletePost };
