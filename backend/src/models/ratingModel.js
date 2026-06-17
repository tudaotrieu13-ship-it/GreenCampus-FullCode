const db = require('../config/db');

const createRating = async ({ transaction_id, rater_id, rated_user_id, rating, comment }) => {
    await db.query(
        `INSERT INTO ratings (transaction_id, rater_id, rated_user_id, rating, comment)
         VALUES (?, ?, ?, ?, ?)`,
        [transaction_id, rater_id, rated_user_id, rating, comment || null]
    );
};

const getRatingsByItem = async (itemId) => {
    const [rows] = await db.query(`
        SELECT
            r.id,
            r.rating,
            r.comment,
            r.created_at,
            u.full_name AS user_name,
            u.avatar_url
        FROM ratings r
        JOIN transactions t ON r.transaction_id = t.id
        JOIN users u ON r.rater_id = u.id
        WHERE t.item_id = ?
        ORDER BY r.created_at DESC
    `, [itemId]);
    return rows;
};

const hasUserRated = async (transaction_id, user_id) => {
    const [rows] = await db.query(
        `SELECT id FROM ratings WHERE transaction_id = ? AND rater_id = ?`,
        [transaction_id, user_id]
    );
    return rows.length > 0;
};

const getRatedTransactionIds = async (user_id) => {
    const [rows] = await db.query(
        `SELECT transaction_id FROM ratings WHERE rater_id = ?`,
        [user_id]
    );
    return rows.map(r => r.transaction_id);
};

const getRatingsByUser = async (userId) => {
    const [rows] = await db.query(`
        SELECT
            r.id,
            r.rating,
            r.comment as content,
            r.created_at as date,
            u.full_name AS name,
            u.avatar_url AS avatar,
            i.title AS itemName
        FROM ratings r
        JOIN users u ON r.rater_id = u.id
        JOIN transactions t ON r.transaction_id = t.id
        LEFT JOIN items i ON t.item_id = i.id
        WHERE r.rated_user_id = ?
        ORDER BY r.created_at DESC
    `, [userId]);
    return rows;
};

module.exports = { createRating, getRatingsByItem, hasUserRated, getRatedTransactionIds, getRatingsByUser };
