const express = require('express');
const router = express.Router();
const { register, login, resetPassword } = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/reset-password
router.post('/reset-password', resetPassword);

module.exports = router;

