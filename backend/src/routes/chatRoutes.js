const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'chat-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.post('/upload', authMiddleware, upload.single('image'), chatController.uploadImage);

router.get('/conversations', authMiddleware, chatController.getConversations);
router.get('/unread-count', authMiddleware, chatController.getUnreadCount);
router.get('/:userId', authMiddleware, chatController.getMessages);
router.post('/send', authMiddleware, chatController.sendMessage);

// Pinned items
router.get('/pinned/:otherUserId', authMiddleware, chatController.getPinnedItem);
router.post('/pin', authMiddleware, chatController.pinItem);
router.delete('/unpin/:otherUserId', authMiddleware, chatController.unpinItem);

// Chat actions
router.get('/media/:otherUserId', authMiddleware, chatController.getMedia);
router.get('/search/:otherUserId', authMiddleware, chatController.searchMessages);
router.post('/block/:otherUserId', authMiddleware, chatController.toggleBlock);
router.post('/mute/:otherUserId', authMiddleware, chatController.toggleMute);
router.delete('/:otherUserId', authMiddleware, chatController.deleteConversation);
router.put('/read/:otherUserId', authMiddleware, chatController.markAsRead);

module.exports = router;
