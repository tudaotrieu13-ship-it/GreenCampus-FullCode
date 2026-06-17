const db = require('../config/db');
const { getAdminReports, updateReportStatus } = require('../models/reportModel');

exports.getStats = async (req, res) => {
  try {
    const [[{ userCount }]] = await db.query('SELECT COUNT(*) as userCount FROM users');
    const [[{ itemCount }]] = await db.query("SELECT COUNT(*) as itemCount FROM items");
    const [[{ postCount }]] = await db.query('SELECT COUNT(*) as postCount FROM social_posts');
    const [[{ transactionCount }]] = await db.query("SELECT COUNT(*) as transactionCount FROM transactions");

    res.json({ userCount, itemCount, postCount, transactionCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, full_name as name, email, role_id, created_at FROM users ORDER BY created_at DESC');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const [posts] = await db.query(`
      SELECT p.id, p.content, p.image_url, p.created_at, p.post_type, p.price, u.full_name as author_name, u.avatar_url 
      FROM social_posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    // Clear dependencies to avoid FK constraint errors
    await db.query('DELETE FROM post_comments WHERE post_id = ?', [id]);
    await db.query('DELETE FROM reports WHERE target_type = "POST" AND target_id = ?', [id]);
    
    await db.query('DELETE FROM social_posts WHERE id = ?', [id]);
    res.json({ message: 'Đã xóa bài viết' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'Đã xóa người dùng' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Clear dependencies
    await db.query('DELETE FROM item_images WHERE item_id = ?', [id]);
    await db.query('DELETE FROM wishlists WHERE item_id = ?', [id]);
    await db.query('DELETE FROM pinned_items WHERE item_id = ?', [id]);
    await db.query('UPDATE messages SET item_id = NULL WHERE item_id = ?', [id]);
    await db.query('DELETE FROM reports WHERE target_type = "ITEM" AND target_id = ?', [id]);
    
    // Delete ratings related to transactions of this item
    const [txs] = await db.query('SELECT id FROM transactions WHERE item_id = ?', [id]);
    if (txs.length > 0) {
        const txIds = txs.map(t => t.id);
        await db.query(`DELETE FROM ratings WHERE transaction_id IN (?)`, [txIds]);
        await db.query(`DELETE FROM transactions WHERE item_id = ?`, [id]);
    }
    
    await db.query('DELETE FROM items WHERE id = ?', [id]);
    res.json({ message: 'Đã xóa sản phẩm' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getReports = async (req, res) => {
  try {
    try {
      const reports = await getAdminReports();
      res.json(reports);
    } catch (dbErr) {
      if (dbErr.code === 'ER_BAD_FIELD_ERROR' || dbErr.message.includes('Unknown column')) {
        await db.query(`DROP TABLE IF EXISTS reports`);
        await db.query(`
          CREATE TABLE reports (
              id INT AUTO_INCREMENT PRIMARY KEY,
              target_type ENUM('ITEM', 'POST', 'USER') NOT NULL,
              target_id BIGINT NOT NULL,
              reporter_id BIGINT NOT NULL,
              reason TEXT NOT NULL,
              status ENUM('PENDING', 'RESOLVED', 'REJECTED') DEFAULT 'PENDING',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        res.json([]);
      } else {
        throw dbErr;
      }
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const success = await updateReportStatus(id, status);
    if (!success) {
      return res.status(404).json({ message: 'Không tìm thấy báo cáo' });
    }
    res.json({ message: 'Cập nhật thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
