const express = require('express');
const router = express.Router();
const { toggle, getIds, getItems } = require('../controllers/wishlistController');
const authMiddleware = require('../middleware/authMiddleware');

// Order matters: /ids must precede /:itemId
router.get('/ids', authMiddleware, getIds);
router.get('/', authMiddleware, getItems);
router.post('/:itemId', authMiddleware, toggle);

module.exports = router;
