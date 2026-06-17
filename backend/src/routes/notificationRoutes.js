const express = require('express');
const router = express.Router();
const { getNotifs, getCount, readOne, readAll } = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/',           authMiddleware, getNotifs);
router.get('/count',      authMiddleware, getCount);
router.put('/read-all',   authMiddleware, readAll);
router.put('/:id/read',   authMiddleware, readOne);

module.exports = router;
