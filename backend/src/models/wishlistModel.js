const db = require('../config/db');

const toggleWishlist = async (user_id, item_id) => {
  const [rows] = await db.query(
    `SELECT id FROM wishlists WHERE user_id = ? AND item_id = ?`,
    [user_id, item_id]
  );
  if (rows.length > 0) {
    await db.query(`DELETE FROM wishlists WHERE user_id = ? AND item_id = ?`, [user_id, item_id]);
    return false;
  }
  await db.query(`INSERT INTO wishlists (user_id, item_id) VALUES (?, ?)`, [user_id, item_id]);
  return true;
};

const getWishlistIds = async (user_id) => {
  const [rows] = await db.query(`SELECT item_id FROM wishlists WHERE user_id = ?`, [user_id]);
  return rows.map(r => r.item_id);
};

const getWishlistItems = async (user_id) => {
  const [rows] = await db.query(`
    SELECT
      i.id, i.title, i.price, i.item_condition AS \`condition\`,
      i.content, i.created_at, i.status, i.quantity, i.category_id,
      u.department AS sellerDepartment, u.id AS user_id, u.full_name, u.avatar_url,
      img.image_url AS image
    FROM wishlists w
    JOIN items i ON i.id = w.item_id AND i.status = 'AVAILABLE'
    LEFT JOIN item_images img ON img.item_id = i.id AND img.is_primary = 1
    LEFT JOIN users u ON u.id = i.user_id
    WHERE w.user_id = ?
    ORDER BY w.created_at DESC
  `, [user_id]);
  return rows.map(row => ({ ...row, isFree: Number(row.price) === 0 }));
};

module.exports = { toggleWishlist, getWishlistIds, getWishlistItems };
