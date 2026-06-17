const express = require('express');
const router = express.Router();
const { addRating, getItemRatings, getMyRatedIds } = require('../controllers/ratingController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, addRating);
router.get('/my-rated', authMiddleware, getMyRatedIds);
router.get('/item/:itemId', getItemRatings);

module.exports = router;
