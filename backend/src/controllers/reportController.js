const { createReport } = require('../models/reportModel');
const db = require('../config/db');

exports.submitReport = async (req, res) => {
  try {
    const { target_type, target_id, reason } = req.body;
    const reporter_id = req.user.id;

    if (!target_type || !target_id || !reason) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đủ thông tin.' });
    }

    try {
      const reportId = await createReport({ target_type, target_id, reporter_id, reason });
      res.status(201).json({ message: 'Đã gửi báo cáo', id: reportId });
    } catch (dbErr) {
      if (dbErr.code === 'ER_BAD_FIELD_ERROR' || dbErr.message.includes('Unknown column')) {
        // Force table recreation
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
        // Retry
        const reportId = await createReport({ target_type, target_id, reporter_id, reason });
        res.status(201).json({ message: 'Đã gửi báo cáo', id: reportId });
      } else {
        throw dbErr;
      }
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
