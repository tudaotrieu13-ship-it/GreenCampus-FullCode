const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { analyzeImage, chatBot, moderateContentApi } = require('../controllers/aiController');

// All AI routes require authentication
router.use(authMiddleware);

// POST /api/ai/analyze-image
router.post('/analyze-image', analyzeImage);

// POST /api/ai/chat
router.post('/chat', chatBot);

// POST /api/ai/moderate
router.post('/moderate', moderateContentApi);

module.exports = router;
