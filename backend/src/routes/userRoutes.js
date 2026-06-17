const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getProfile, getMyItems, getMyPosts, getUserItems, updateProfile, getUserProfile, toggleFollowUser } = require('../controllers/userController');
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
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, upload.single('avatar'), updateProfile);
router.get('/my-items', authMiddleware, getMyItems);
router.get('/my-posts', authMiddleware, getMyPosts);
router.get('/:id/items', getUserItems);
router.get('/:id', authMiddleware.optional, getUserProfile);
router.post('/:id/follow', authMiddleware, toggleFollowUser);

module.exports = router;
