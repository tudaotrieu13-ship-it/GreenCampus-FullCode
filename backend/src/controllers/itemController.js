const { getAllItems, getItemsByCategory, searchItems, createItem, createItemImage, deleteItem, updateItem, updateItemImage, deleteItemImages, getItemImages, getItemsPaginated } = require('../models/itemModel');
const { createNotification } = require('../models/notificationModel');

/**
 * GET /api/items
 * GET /api/items?category=<categoryId>
 * GET /api/items?page=1&limit=10
 */
const getItems = async (req, res) => {
  try {
    const { category, search, page, limit } = req.query;
    const userUniversity = req.user?.university;

    if (page) {
      const result = await getItemsPaginated({
        categoryId: category,
        searchKeyword: search ? search.trim() : null,
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        userUniversity
      });
      return res.status(200).json(result);
    }

    let items;
    if (search && search.trim()) {
      items = await searchItems(search.trim(), userUniversity);
    } else if (category) {
      items = await getItemsByCategory(category, userUniversity);
    } else {
      items = await getAllItems(userUniversity);
    }

    res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * POST /api/items
 * Protected route to create a new item.
 */
const postItem = async (req, res) => {
  try {
    const { title, description, price, condition, category_id, quantity } = req.body;
    
    // User ID is attached by authMiddleware
    const user_id = req.user.id;

    if (!title || !price || !condition || !category_id) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ các thông tin bắt buộc.' });
    }

    if (title.length > 255) {
      return res.status(400).json({ message: 'Tiêu đề không được vượt quá 255 ký tự.' });
    }

    if (Number(price) < 0) {
      return res.status(400).json({ message: 'Giá sản phẩm không được nhỏ hơn 0.' });
    }

    // AI Content Moderation
    const { moderateContent } = require('./aiController');
    const fs = require('fs');
    const imagesBase64 = [];
    
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const imgBuffer = fs.readFileSync(file.path);
          imagesBase64.push(imgBuffer.toString('base64'));
        } catch (err) {
          console.error("Error reading file for moderation:", err);
        }
      }
    }

    const textToModerate = `${title} ${description || ''}`;
    const modResult = await moderateContent(textToModerate, imagesBase64);
    if (modResult && modResult.isSafe === false) {
      return res.status(400).json({ message: `Sản phẩm vi phạm tiêu chuẩn cộng đồng: ${modResult.reason}` });
    }

    // Insert item into DB
    const itemId = await createItem({
      title,
      content: description || '',
      price: Number(price) || 0,
      condition,
      category_id: Number(category_id),
      user_id,
      quantity: Number(quantity) || 1
    });

    // Handle image upload if files were provided
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const imageUrl = `/uploads/${file.filename}`;
        await createItemImage(itemId, imageUrl, i === 0 ? 1 : 0);
      }
    }

    // Notify seller that their item is live
    const priceText = Number(price) === 0 ? 'miễn phí' : `${Number(price).toLocaleString('vi-VN')}đ`;
    createNotification(
      user_id,
      'item_posted',
      '\uD83C\uDF89 Đã đăng sản phẩm thành công!',
      `"${title}" đã lên sàn với giá ${priceText}. Hãy chờ người mua nhé!`,
      'profile'
    ).catch(() => {});

    res.status(201).json({ message: 'Đăng sản phẩm thành công!', itemId });
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ message: 'Lỗi khi đăng sản phẩm', error: error.message });
  }
};

/**
 * DELETE /api/items/:id
 * Protected route
 */
const removeItem = async (req, res) => {
  try {
    const success = await deleteItem(req.params.id, req.user.id);
    if (!success) {
      return res.status(404).json({ message: 'Không tìm thấy đồ hoặc bạn không có quyền xóa' });
    }
    res.status(200).json({ message: 'Đã xóa đồ thành công' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ message: 'Lỗi khi xóa đồ', error: error.message });
  }
};

/**
 * PUT /api/items/:id
 * Protected route to update an item.
 */
const putItem = async (req, res) => {
  try {
    const { title, description, price, condition, category_id, quantity } = req.body;
    const itemId = req.params.id;
    const user_id = req.user.id;

    if (!title || !price || !condition || !category_id) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ các thông tin bắt buộc.' });
    }

    if (title.length > 255) {
      return res.status(400).json({ message: 'Tiêu đề không được vượt quá 255 ký tự.' });
    }

    if (Number(price) < 0) {
      return res.status(400).json({ message: 'Giá sản phẩm không được nhỏ hơn 0.' });
    }

    // AI Content Moderation
    const { moderateContent } = require('./aiController');
    const fs = require('fs');
    const imagesBase64 = [];
    
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const imgBuffer = fs.readFileSync(file.path);
          imagesBase64.push(imgBuffer.toString('base64'));
        } catch (err) {
          console.error("Error reading file for moderation:", err);
        }
      }
    }

    const textToModerate = `${title} ${description || ''}`;
    const modResult = await moderateContent(textToModerate, imagesBase64);
    if (modResult && modResult.isSafe === false) {
      return res.status(400).json({ message: `Sản phẩm vi phạm tiêu chuẩn cộng đồng: ${modResult.reason}` });
    }

    const success = await updateItem(itemId, user_id, {
      title,
      content: description || '',
      price: Number(price) || 0,
      condition,
      category_id: Number(category_id),
      quantity: Number(quantity) || 1
    });

    if (!success) {
      return res.status(404).json({ message: 'Không tìm thấy đồ hoặc bạn không có quyền sửa' });
    }

    // Handle image update if files were provided
    if (req.files && req.files.length > 0) {
      await deleteItemImages(itemId);
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const imageUrl = `/uploads/${file.filename}`;
        await createItemImage(itemId, imageUrl, i === 0 ? 1 : 0);
      }
    }

    res.status(200).json({ message: 'Cập nhật sản phẩm thành công!' });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật sản phẩm', error: error.message });
  }
};

/**
 * GET /api/items/:id/images
 */
const getImages = async (req, res) => {
  try {
    const images = await getItemImages(req.params.id);
    res.status(200).json(images);
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ message: 'Lỗi khi tải hình ảnh', error: error.message });
  }
};

module.exports = { getItems, postItem, removeItem, putItem, getImages };
