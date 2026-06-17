const { toggleWishlist, getWishlistIds, getWishlistItems } = require('../models/wishlistModel');

const toggle = async (req, res) => {
  try {
    const added = await toggleWishlist(req.user.id, req.params.itemId);
    res.status(200).json({ added });
  } catch (err) {
    console.error('Error toggling wishlist:', err);
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

const getIds = async (req, res) => {
  try {
    const ids = await getWishlistIds(req.user.id);
    res.status(200).json(ids);
  } catch (err) {
    console.error('Error fetching wishlist IDs:', err);
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

const getItems = async (req, res) => {
  try {
    const items = await getWishlistItems(req.user.id);
    res.status(200).json(items);
  } catch (err) {
    console.error('Error fetching wishlist items:', err);
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

module.exports = { toggle, getIds, getItems };
