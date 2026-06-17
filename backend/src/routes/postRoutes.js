const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getPosts, addPost, toggleSoldStatus, toggleLikeStatus, removePost, getPostComments, addPostComment, deletePostComment } = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');

const ALLOWED_IMAGE_TYPES = /jpeg|jpg|png|gif|webp/;

const imageFileFilter = (_req, file, cb) => {
  const extOk = ALLOWED_IMAGE_TYPES.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = ALLOWED_IMAGE_TYPES.test(file.mimetype);
  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif, webp)'));
  }
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'post-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// GET /api/posts
router.get('/', authMiddleware.optional, getPosts);

// POST /api/posts
router.post('/', authMiddleware, upload.array('images', 4), addPost);

// PUT /api/posts/:id/sold
router.put('/:id/sold', authMiddleware, toggleSoldStatus);

// PUT /api/posts/:id/like
router.put('/:id/like', authMiddleware, toggleLikeStatus);

// DELETE /api/posts/:id
router.delete('/:id', authMiddleware, removePost);

// GET /api/posts/:postId/comments
router.get('/:postId/comments', getPostComments);

// POST /api/posts/:postId/comments
router.post('/:postId/comments', authMiddleware, addPostComment);

// DELETE /api/posts/:postId/comments/:commentId
router.delete('/:postId/comments/:commentId', authMiddleware, deletePostComment);

module.exports = router;
