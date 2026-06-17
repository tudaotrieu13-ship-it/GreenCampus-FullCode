const bcrypt = require('bcryptjs');
const { findById } = require('../models/userModel');
const { getItemsByUserId } = require('../models/itemModel');
const { getPostsByUserId } = require('../models/postModel');
const { getSoldCountByUserId } = require('../models/transactionModel');

const getProfile = async (req, res) => {
  try {
    const user = await findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại.' });
    }
    // Fetch sold count
    const soldCount = await getSoldCountByUserId(req.user.id);
    
    res.status(200).json({ ...user, soldCount });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

const getMyItems = async (req, res) => {
  try {
    const items = await getItemsByUserId(req.user.id);
    res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching my items:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

const getMyPosts = async (req, res) => {
  try {
    const posts = await getPostsByUserId(req.user.id);
    res.status(200).json(posts);
  } catch (error) {
    console.error('Error fetching my posts:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

const getUserItems = async (req, res) => {
  try {
    const items = await getItemsByUserId(req.params.id);
    res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching user items:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = await findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    let isFollowing = false;
    if (req.user) {
      const [rows] = await require('../config/db').query('SELECT * FROM user_followers WHERE follower_id = ? AND following_id = ?', [req.user.id, user.id]);
      isFollowing = rows.length > 0;
    }

    const reviews = await require('../models/ratingModel').getRatingsByUser(user.id);

    res.status(200).json({
      id: user.id,
      full_name: user.full_name || user.name,
      avatar_url: user.avatar_url || user.avatar,
      department: user.department || user.faculty,
      university: user.university,
      created_at: user.created_at,
      soldCount: user.soldCount || 0,
      followerCount: user.followerCount || 0,
      ratingAvg: user.ratingAvg || "0.0",
      responseRate: user.responseRate || 100,
      isFollowing,
      reviews
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { full_name, department, university, password, bank_name, bank_account_no, bank_account_name } = req.body;
    let avatar_url = undefined;

    if (req.file) {
      avatar_url = `/uploads/${req.file.filename}`;
    }

    let hashedPassword = undefined;
    if (password && password.trim().length >= 6) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const updatedUser = await require('../models/userModel').updateUser(req.user.id, {
      full_name,
      department,
      university,
      password: hashedPassword,
      avatar_url,
      bank_name,
      bank_account_no,
      bank_account_name
    });

    res.status(200).json({
      id: updatedUser.id,
      name: updatedUser.full_name,
      email: updatedUser.email,
      student_id: updatedUser.student_id,
      department: updatedUser.department,
      university: updatedUser.university,
      avatar: updatedUser.avatar_url,
      role: updatedUser.role_id,
      bank_name: updatedUser.bank_name,
      bank_account_no: updatedUser.bank_account_no,
      bank_account_name: updatedUser.bank_account_name
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

const toggleFollowUser = async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = req.params.id;
    if (followerId == followingId) return res.status(400).json({message: "Cannot follow yourself"});
    
    const [rows] = await require('../config/db').query('SELECT * FROM user_followers WHERE follower_id = ? AND following_id = ?', [followerId, followingId]);
    if (rows.length > 0) {
      await require('../config/db').query('DELETE FROM user_followers WHERE follower_id = ? AND following_id = ?', [followerId, followingId]);
      res.json({ isFollowing: false });
    } else {
      await require('../config/db').query('INSERT INTO user_followers (follower_id, following_id) VALUES (?, ?)', [followerId, followingId]);
      res.json({ isFollowing: true });
    }
  } catch(error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getProfile, getMyItems, getMyPosts, getUserItems, updateProfile, getUserProfile, toggleFollowUser };
