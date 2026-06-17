const { getNotifications, getUnreadCount, markAsRead, markAllAsRead } = require('../models/notificationModel');

const getNotifs = async (req, res) => {
  try {
    const notifs = await getNotifications(req.user.id);
    res.status(200).json(notifs);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

const getCount = async (req, res) => {
  try {
    const count = await getUnreadCount(req.user.id);
    res.status(200).json({ count });
  } catch (err) {
    console.error('Error fetching notification count:', err);
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

const readOne = async (req, res) => {
  try {
    await markAsRead(req.params.id, req.user.id);
    res.status(200).json({ message: 'Đã đọc.' });
  } catch (err) {
    console.error('Error marking notification read:', err);
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

const readAll = async (req, res) => {
  try {
    await markAllAsRead(req.user.id);
    res.status(200).json({ message: 'Đã đọc tất cả.' });
  } catch (err) {
    console.error('Error marking all notifications read:', err);
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

module.exports = { getNotifs, getCount, readOne, readAll };
