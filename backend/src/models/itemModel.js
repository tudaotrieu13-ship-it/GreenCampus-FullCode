const db = require('../config/db');

/**
 * Get all AVAILABLE items with their primary image.
 * Returns: { id, title, price, isFree, condition, status, sellerDepartment, image }
 */
const getAllItems = async (userUniversity = null) => {
  let orderBy = "ORDER BY i.created_at DESC";
  let params = [];
  
  if (userUniversity) {
    orderBy = "ORDER BY (u.university = ?) DESC, i.created_at DESC";
    params.push(userUniversity);
  }

  const [rows] = await db.query(`
    SELECT
      i.id,
      i.title,
      i.price,
      i.item_condition  AS \`condition\`,
      i.content,
      i.created_at,
      i.status,
      u.department      AS sellerDepartment,
      u.id              AS user_id,
      u.full_name,
      u.avatar_url,
      u.created_at      AS sellerJoined,
      u.university,
      img.image_url     AS image,
      i.category_id,
      i.quantity,
      (SELECT COUNT(*) FROM transactions t WHERE t.seller_id = u.id AND t.status = 'COMPLETED') AS soldCount
    FROM items i
    LEFT JOIN item_images img
      ON img.item_id = i.id AND img.is_primary = 1
    LEFT JOIN users u
      ON u.id = i.user_id
    WHERE i.status = 'AVAILABLE'
    ${orderBy}
  `, params);

  return rows.map(row => ({
    ...row,
    isFree: Number(row.price) === 0,
  }));
};

/**
 * Get AVAILABLE items filtered by category_id.
 */
const getItemsByCategory = async (categoryId, userUniversity = null) => {
  let orderBy = "ORDER BY i.created_at DESC";
  let params = [categoryId];
  
  if (userUniversity) {
    orderBy = "ORDER BY (u.university = ?) DESC, i.created_at DESC";
    params.push(userUniversity);
  }

  const [rows] = await db.query(`
    SELECT
      i.id,
      i.title,
      i.price,
      i.item_condition  AS \`condition\`,
      i.content,
      i.created_at,
      i.status,
      u.department      AS sellerDepartment,
      u.id              AS user_id,
      u.full_name,
      u.avatar_url,
      u.created_at      AS sellerJoined,
      u.university,
      img.image_url     AS image,
      i.category_id,
      i.quantity,
      (SELECT COUNT(*) FROM transactions t WHERE t.seller_id = u.id AND t.status = 'COMPLETED') AS soldCount
    FROM items i
    LEFT JOIN item_images img
      ON img.item_id = i.id AND img.is_primary = 1
    LEFT JOIN users u
      ON u.id = i.user_id
    WHERE i.status = 'AVAILABLE' AND i.category_id = ?
    ${orderBy}
  `, params);

  return rows.map(row => ({
    ...row,
    isFree: Number(row.price) === 0,
  }));
};

/**
 * Search AVAILABLE items by title or description keyword.
 */
const searchItems = async (keyword, userUniversity = null) => {
  let cleanedKeyword = keyword.toLowerCase();
  const noiseWords = ['sách', 'truyện', 'quyển', 'cuốn', 'giáo trình', 'đồ', 'cái'];
  noiseWords.forEach(w => {
    cleanedKeyword = cleanedKeyword.replace(new RegExp(`\\b${w}\\b`, 'gi'), '');
  });
  cleanedKeyword = cleanedKeyword.replace(/\s+/g, ' ').trim();
  if (!cleanedKeyword) cleanedKeyword = keyword.trim();

  const like = `%${cleanedKeyword}%`;
  let orderBy = "ORDER BY i.created_at DESC";
  let params = [like, like];
  
  if (userUniversity) {
    orderBy = "ORDER BY (u.university = ?) DESC, i.created_at DESC";
    params.push(userUniversity);
  }

  const [rows] = await db.query(`
    SELECT
      i.id,
      i.title,
      i.price,
      i.item_condition  AS \`condition\`,
      i.content,
      i.created_at,
      i.status,
      u.department      AS sellerDepartment,
      u.id              AS user_id,
      u.full_name,
      u.avatar_url,
      u.created_at      AS sellerJoined,
      u.university,
      img.image_url     AS image,
      i.category_id,
      i.quantity,
      (SELECT COUNT(*) FROM transactions t WHERE t.seller_id = u.id AND t.status = 'COMPLETED') AS soldCount
    FROM items i
    LEFT JOIN item_images img
      ON img.item_id = i.id AND img.is_primary = 1
    LEFT JOIN users u
      ON u.id = i.user_id
    WHERE i.status = 'AVAILABLE'
      AND (i.title LIKE ? OR i.content LIKE ?)
    ${orderBy}
  `, params);

  return rows.map(row => ({ ...row, isFree: Number(row.price) === 0 }));
};

const createItem = async ({ title, content, price, condition, category_id, user_id, quantity = 1 }) => {
  const [result] = await db.query(
    `INSERT INTO items (title, content, price, item_condition, category_id, user_id, status, quantity)
     VALUES (?, ?, ?, ?, ?, ?, 'AVAILABLE', ?)`,
    [title, content, price, condition, category_id, user_id, quantity]
  );
  return result.insertId;
};

const createItemImage = async (item_id, image_url, is_primary = 1) => {
  await db.query(
    `INSERT INTO item_images (item_id, image_url, is_primary) VALUES (?, ?, ?)`,
    [item_id, image_url, is_primary]
  );
};

const getItemsByUserId = async (userId) => {
  const [rows] = await db.query(`
    SELECT
      i.id,
      i.title,
      i.price,
      i.item_condition  AS \`condition\`,
      i.content,
      i.created_at,
      i.status,
      u.department      AS sellerDepartment,
      u.id              AS user_id,
      u.full_name,
      u.avatar_url,
      u.created_at      AS sellerJoined,
      img.image_url     AS image,
      i.category_id,
      i.quantity,
      (SELECT COUNT(*) FROM transactions t WHERE t.seller_id = u.id AND t.status = 'COMPLETED') AS soldCount
    FROM items i
    LEFT JOIN item_images img
      ON img.item_id = i.id AND img.is_primary = 1
    LEFT JOIN users u
      ON u.id = i.user_id
    WHERE i.user_id = ?
    ORDER BY i.created_at DESC
  `, [userId]);

  return rows.map(row => ({
    ...row,
    isFree: Number(row.price) === 0,
  }));
};

const deleteItem = async (itemId, userId) => {
  const [result] = await db.query(
    `DELETE FROM items WHERE id = ? AND user_id = ?`,
    [itemId, userId]
  );
  return result.affectedRows > 0;
};

const updateItem = async (itemId, userId, { title, content, price, condition, category_id, quantity }) => {
  const newStatus = quantity > 0 ? 'AVAILABLE' : 'SOLD';
  const [result] = await db.query(
    `UPDATE items 
     SET title = ?, content = ?, price = ?, item_condition = ?, category_id = ?, quantity = ?, status = ? 
     WHERE id = ? AND user_id = ?`,
    [title, content, price, condition, category_id, quantity, newStatus, itemId, userId]
  );
  return result.affectedRows > 0;
};

const updateItemImage = async (item_id, image_url) => {
  const [rows] = await db.query(`SELECT id FROM item_images WHERE item_id = ? AND is_primary = 1`, [item_id]);
  if (rows.length > 0) {
    await db.query(`UPDATE item_images SET image_url = ? WHERE id = ?`, [image_url, rows[0].id]);
  } else {
    await db.query(`INSERT INTO item_images (item_id, image_url, is_primary) VALUES (?, ?, 1)`, [item_id, image_url]);
  }
};

const deleteItemImages = async (item_id) => {
  await db.query(`DELETE FROM item_images WHERE item_id = ?`, [item_id]);
};

const getItemImages = async (item_id) => {
  const [rows] = await db.query(`SELECT image_url FROM item_images WHERE item_id = ? ORDER BY is_primary DESC, id ASC`, [item_id]);
  return rows.map(row => row.image_url);
};

const getItemsPaginated = async ({ categoryId, searchKeyword, page = 1, limit = 10, userUniversity = null }) => {
  const offset = (page - 1) * limit;
  let whereClause = "WHERE i.status = 'AVAILABLE'";
  const queryParams = [];

  if (categoryId) {
    whereClause += " AND i.category_id = ?";
    queryParams.push(categoryId);
  }

  if (searchKeyword) {
    let cleanedKeyword = searchKeyword.toLowerCase();
    const noiseWords = ['sách', 'truyện', 'quyển', 'cuốn', 'giáo trình', 'đồ', 'cái'];
    noiseWords.forEach(w => {
      cleanedKeyword = cleanedKeyword.replace(new RegExp(`\\b${w}\\b`, 'gi'), '');
    });
    cleanedKeyword = cleanedKeyword.replace(/\s+/g, ' ').trim();
    if (!cleanedKeyword) cleanedKeyword = searchKeyword.trim();

    const like = `%${cleanedKeyword}%`;
    whereClause += " AND (i.title LIKE ? OR i.content LIKE ?)";
    queryParams.push(like, like);
  }

  const [countResult] = await db.query(`
    SELECT COUNT(*) as total FROM items i
    ${whereClause}
  `, queryParams);
  const totalItems = countResult[0].total;

  let orderBy = "ORDER BY i.created_at DESC";
  let finalQueryParams = [...queryParams];
  if (userUniversity) {
    orderBy = "ORDER BY (u.university = ?) DESC, i.created_at DESC";
    finalQueryParams.push(userUniversity);
  }
  finalQueryParams.push(Number(limit), Number(offset));

  const [rows] = await db.query(`
    SELECT
      i.id,
      i.title,
      i.price,
      i.item_condition  AS \`condition\`,
      i.content,
      i.created_at,
      i.status,
      u.department      AS sellerDepartment,
      u.id              AS user_id,
      u.full_name,
      u.avatar_url,
      u.created_at      AS sellerJoined,
      u.university,
      img.image_url     AS image,
      i.category_id,
      i.quantity,
      (SELECT COUNT(*) FROM transactions t WHERE t.seller_id = u.id AND t.status = 'COMPLETED') AS soldCount
    FROM items i
    LEFT JOIN item_images img
      ON img.item_id = i.id AND img.is_primary = 1
    LEFT JOIN users u
      ON u.id = i.user_id
    ${whereClause}
    ${orderBy}
    LIMIT ? OFFSET ?
  `, finalQueryParams);

  const products = rows.map(row => ({
    ...row,
    isFree: Number(row.price) === 0,
  }));

  return {
    products,
    currentPage: Number(page),
    totalPages: Math.ceil(totalItems / limit),
    totalItems
  };
};

const getItemById = async (itemId, userUniversity = null) => {
  const [rows] = await db.query(`
    SELECT
      i.id,
      i.title,
      i.price,
      i.item_condition  AS \`condition\`,
      i.content,
      i.created_at,
      i.status,
      u.department      AS sellerDepartment,
      u.id              AS user_id,
      u.full_name,
      u.avatar_url,
      u.created_at      AS sellerJoined,
      u.university,
      img.image_url     AS image,
      i.category_id,
      i.quantity,
      (SELECT COUNT(*) FROM transactions t WHERE t.seller_id = u.id AND t.status = 'COMPLETED') AS soldCount
    FROM items i
    LEFT JOIN item_images img
      ON img.item_id = i.id AND img.is_primary = 1
    LEFT JOIN users u
      ON u.id = i.user_id
    WHERE i.id = ?
  `, [itemId]);
  
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    ...row,
    isFree: Number(row.price) === 0,
  };
};

module.exports = { getAllItems, getItemsByCategory, searchItems, createItem, createItemImage, getItemsByUserId, deleteItem, updateItem, updateItemImage, deleteItemImages, getItemImages, getItemsPaginated, getItemById };
