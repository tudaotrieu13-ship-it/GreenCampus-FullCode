const express = require('express');
const router = express.Router();
const { buyItem, getMyTransactions, updateStatus, confirmRole, debugTransactions, fixDb } = require('../controllers/transactionController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/transactions/debug
router.get('/debug', debugTransactions);

// GET /api/transactions/fix
router.get('/fix', fixDb);

// POST /api/transactions/buy
router.post('/buy', authMiddleware, buyItem);

// GET /api/transactions/me
router.get('/me', authMiddleware, getMyTransactions);

// PUT /api/transactions/:id/status
router.put('/:id/status', authMiddleware, updateStatus);

// PUT /api/transactions/:id/confirm
router.put('/:id/confirm', authMiddleware, confirmRole);

module.exports = router;
