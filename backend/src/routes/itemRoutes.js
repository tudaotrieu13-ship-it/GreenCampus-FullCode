const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getItems, getItemById, postItem, removeItem, putItem, getImages } = require('../controllers/itemController');
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
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'item-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// GET /api/items
// GET /api/items?category=<categoryId>
router.get('/', authMiddleware.optional, getItems);

// GET /api/items/:id
router.get('/:id', getItemById);

// GET /api/items/:id/images
router.get('/:id/images', getImages);

// POST /api/items
// Requires authentication & handles multiple file uploads named 'images'
router.post('/', authMiddleware, upload.array('images', 5), postItem);

// PUT /api/items/:id
router.put('/:id', authMiddleware, upload.array('images', 5), putItem);

// DELETE /api/items/:id
router.delete('/:id', authMiddleware, removeItem);

module.exports = router;
