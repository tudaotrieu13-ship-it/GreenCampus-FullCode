const db = require('../config/db');
const fs = require('fs');

const createNotification = async (user_id, type, title, body = null, link_page = null) => {
  try {
    await db.query(
      `INSERT INTO notifications (user_id, type, title, body, link_page) VALUES (?, ?, ?, ?, ?)`,
      [user_id, type, title, body, link_page]
    );
  } catch (err) {
    fs.writeFileSync('error_insert.log', "DB Error in createNotification: " + err.message + "\n" + err.stack);
    console.error("DB Error in createNotification:", err);
    throw err;
  }
};

const getNotifications = async (user_id, limit = 20) => {
  try {
    const [rows] = await db.query(
      `SELECT id, type, title, body, link_page, is_read, created_at
       FROM notifications WHERE user_id = ?
       ORDER BY created_at DESC LIMIT ${Number(limit)}`,
      [user_id]
    );
    return rows;
  } catch (err) {
    fs.writeFileSync('error.log', "DB Error in getNotifications: " + err.message + "\n" + err.stack);
    console.error("DB Error in getNotifications:", err);
    throw err;
  }
};

const getUnreadCount = async (user_id) => {
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0`,
      [user_id]
    );
    return rows[0].count;
  } catch (err) {
    fs.writeFileSync('error.log', "DB Error in getUnreadCount: " + err.message + "\n" + err.stack);
    console.error("DB Error in getUnreadCount:", err);
    throw err;
  }
};

const markAsRead = async (notif_id, user_id) => {
  await db.query(
    `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
    [notif_id, user_id]
  );
};

const markAllAsRead = async (user_id) => {
  await db.query(
    `UPDATE notifications SET is_read = 1 WHERE user_id = ?`,
    [user_id]
  );
};

module.exports = { createNotification, getNotifications, getUnreadCount, markAsRead, markAllAsRead };

