const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');

const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role_id === 2) {
    next();
  } else {
    res.status(403).json({ message: 'Quyền truy cập bị từ chối' });
  }
};

router.use(authMiddleware, adminMiddleware);

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.get('/posts', adminController.getPosts);
router.delete('/posts/:id', adminController.deletePost);
router.delete('/users/:id', adminController.deleteUser);
router.delete('/items/:id', adminController.deleteItem);
router.get('/reports', adminController.getReports);
router.put('/reports/:id/status', adminController.updateReportStatus);

module.exports = router;
