const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, reportController.submitReport);

router.get('/debug', async (req, res) => {
  try {
    const db = require('../config/db');
    const [tables] = await db.query("SHOW TABLES LIKE 'reports'");
    res.json({ tableExists: tables.length > 0 });
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

module.exports = router;
