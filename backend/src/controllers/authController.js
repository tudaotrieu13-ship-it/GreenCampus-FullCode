const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createUser, findByEmail } = require('../models/userModel');

const generateToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role_id: user.role_id, university: user.university },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// ─── POST /api/auth/register ────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { full_name, email, password, student_id, university, account_type } = req.body;

    // Basic validation
    if (!full_name || !email || !password || !student_id || !university) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin.' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Định dạng email không hợp lệ.' });
    }

    if (!email.toLowerCase().endsWith('.edu.vn')) {
      return res.status(400).json({ message: 'Bạn phải sử dụng email trường học (có đuôi .edu.vn) để đăng ký.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
    }

    // Check duplicate email
    const existing = await findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Email này đã được đăng ký.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const newId = await createUser({ full_name, email, password: hashedPassword, student_id, university, account_type });

    // Build safe user object (no password) and sign token
    const user = { id: newId, full_name, email, student_id, role_id: 1, university, account_type };
    const token = generateToken(user);

    res.status(201).json({
      message: 'Đăng ký thành công!',
      token,
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        student_id: user.student_id,
        department: null,
        university: user.university,
        account_type: user.account_type,
        role_id: user.role_id,
        avatar_url: null
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
      return res.status(400).json({ message: 'Mã số sinh viên hoặc Email này đã được đăng ký.' });
    }
    res.status(500).json({ message: 'Lỗi máy chủ.', error: error.message });
  }
};

// ─── POST /api/auth/login ────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Định dạng email không hợp lệ.' });
    }

    // Find user
    const user = await findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
    }

    // Sign token
    const token = generateToken(user);

    res.status(200).json({
      message: 'Đăng nhập thành công!',
      token,
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        student_id: user.student_id,
        department: user.department,
        university: user.university,
        role_id: user.role_id,
        avatar_url: user.avatar_url,
        avatar: user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=E1F0C4&color=2D6A4F&bold=true`,
        bank_name: user.bank_name,
        bank_account_no: user.bank_account_no,
        bank_account_name: user.bank_account_name
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ.', error: error.message });
  }
};

// ─── POST /api/auth/reset-password ───────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { email, student_id, newPassword } = req.body;

    if (!email || !student_id || !newPassword) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Định dạng email không hợp lệ.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
    }

    // Find user
    const user = await findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản với email này.' });
    }

    // TODO: (Security) Thay thế kiểm tra student_id bằng việc gửi mã OTP thực tế qua Email
    // Hiện tại chỉ cần biết Email và MSSV là đổi được pass -> Lỗ hổng bảo mật nghiêm trọng
    if (user.student_id !== student_id) {
      return res.status(403).json({ message: 'Mã số sinh viên không khớp.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user
    const { updateUser } = require('../models/userModel');
    await updateUser(user.id, { password: hashedPassword });

    res.status(200).json({ message: 'Đặt lại mật khẩu thành công!' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ.', error: error.message });
  }
};

module.exports = { register, login, resetPassword };

