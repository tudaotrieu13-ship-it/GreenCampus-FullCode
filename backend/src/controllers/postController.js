const { getAllPosts, getPostById, createPost, toggleLike, toggleSold, deletePost } = require('../models/postModel');
const { addComment, getCommentsByPost, deleteComment } = require('../models/postCommentModel');

/**
 * GET /api/posts
 */
const getPosts = async (req, res) => {
  try {
    const userUniversity = req.user?.university;
    const posts = await getAllPosts(userUniversity);
    res.status(200).json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Lỗi khi tải bài viết', error: error.message });
  }
};

/**
 * POST /api/posts
 * Protected route
 */
const addPost = async (req, res) => {
  try {
    const { content, post_type, price } = req.body;
    const user_id = req.user.id; // from authMiddleware

    if (!content && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ message: 'Bài viết không được để trống.' });
    }

    let imageUrl = null;
    if (req.files && req.files.length > 0) {
      // Store as JSON array of paths
      const paths = req.files.map(f => `/uploads/${f.filename}`);
      imageUrl = JSON.stringify(paths);
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

    if (content || imagesBase64.length > 0) {
      const modResult = await moderateContent(content || '', imagesBase64);
      if (modResult && modResult.isSafe === false) {
        return res.status(400).json({ message: `Bài viết vi phạm tiêu chuẩn cộng đồng: ${modResult.reason}` });
      }
    }

    const postId = await createPost({
      user_id,
      content: content || '',
      image_url: imageUrl,
      post_type: post_type === 'SALE' ? 'SALE' : 'NORMAL',
      price: post_type === 'SALE' && price ? Number(price) : null
    });

    const newPost = await getPostById(postId);

    res.status(201).json({ message: 'Đăng bài thành công!', postId, post: newPost });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Lỗi khi đăng bài', error: error.message });
  }
};

/**
 * PUT /api/posts/:id/sold
 * Protected route
 */
const toggleSoldStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    
    await toggleSold(id, user_id);
    
    res.status(200).json({ message: 'Đã cập nhật trạng thái' });
  } catch (error) {
    console.error('Error toggling sold status:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

/**
 * PUT /api/posts/:id/like
 * Protected route
 */
const toggleLikeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    
    const isLiked = await toggleLike(id, user_id);
    
    res.status(200).json({ message: isLiked ? 'Đã thích bài viết' : 'Đã bỏ thích', liked: isLiked });
  } catch (error) {
    console.error('Error toggling like status:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

/**
 * DELETE /api/posts/:id
 * Protected route
 */
const removePost = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    
    const success = await deletePost(id, user_id);
    if (!success) {
      return res.status(404).json({ message: 'Không tìm thấy bài viết hoặc bạn không có quyền xóa' });
    }
    
    res.status(200).json({ message: 'Đã xóa bài viết thành công' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

const getPostComments = async (req, res) => {
  try {
    const comments = await getCommentsByPost(req.params.postId);
    res.status(200).json(comments);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

const addPostComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Nội dung bình luận không được để trống.' });
    }

    // AI Content Moderation
    const { moderateContent } = require('./aiController');
    const modResult = await moderateContent(content.trim());
    if (modResult && modResult.isSafe === false) {
      return res.status(400).json({ message: `Bình luận vi phạm tiêu chuẩn cộng đồng: ${modResult.reason}` });
    }
    const id = await addComment(req.params.postId, req.user.id, content.trim());
    res.status(201).json({ message: 'Đã bình luận!', id });
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

const deletePostComment = async (req, res) => {
  try {
    const success = await deleteComment(req.params.commentId, req.user.id);
    if (!success) {
      return res.status(404).json({ message: 'Không tìm thấy bình luận hoặc bạn không có quyền xóa.' });
    }
    res.status(200).json({ message: 'Đã xóa bình luận.' });
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

module.exports = { getPosts, addPost, toggleSoldStatus, toggleLikeStatus, removePost, getPostComments, addPostComment, deletePostComment };
