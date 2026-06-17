const { createRating, getRatingsByItem, hasUserRated, getRatedTransactionIds } = require('../models/ratingModel');
const { createNotification } = require('../models/notificationModel');
const db = require('../config/db');

const addRating = async (req, res) => {
    try {
        const { transaction_id, rated_user_id, rating, comment } = req.body;
        const rater_id = req.user.id;

        if (!transaction_id || !rated_user_id || !rating) {
            return res.status(400).json({ message: 'Thiếu thông tin đánh giá.' });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Điểm đánh giá phải từ 1 đến 5.' });
        }

        const alreadyRated = await hasUserRated(transaction_id, rater_id);
        if (alreadyRated) {
            return res.status(409).json({ message: 'Bạn đã đánh giá giao dịch này rồi.' });
        }

        await createRating({ transaction_id, rater_id, rated_user_id, rating: Number(rating), comment });

        // Get item_id from transaction to link notification
        let linkPage = 'history';
        try {
            const [txnRows] = await db.query('SELECT item_id FROM transactions WHERE id = ?', [transaction_id]);
            if (txnRows.length > 0 && txnRows[0].item_id) {
                linkPage = `product:${txnRows[0].item_id}`;
            }
        } catch (e) {
            console.error('Error getting item_id for rating notif:', e);
        }

        // Notify the person being rated
        const stars = '\u2B50'.repeat(Number(rating));
        createNotification(
          rated_user_id,
          'new_rating',
          `Bạn nhận được đánh giá ${stars}`,
          comment ? `"${comment.substring(0, 80)}${comment.length > 80 ? '...' : ''}"` : 'Giao dịch đã được đánh giá.',
          linkPage
        ).catch(() => {});

        res.status(201).json({ message: 'Đánh giá thành công!' });
    } catch (err) {
        console.error('Error adding rating:', err);
        res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
    }
};

const getItemRatings = async (req, res) => {
    try {
        const { itemId } = req.params;
        const ratings = await getRatingsByItem(itemId);
        res.status(200).json(ratings);
    } catch (err) {
        console.error('Error fetching ratings:', err);
        res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
    }
};

const getMyRatedIds = async (req, res) => {
    try {
        const ids = await getRatedTransactionIds(req.user.id);
        res.status(200).json(ids);
    } catch (err) {
        console.error('Error fetching rated ids:', err);
        res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
    }
};

module.exports = { addRating, getItemRatings, getMyRatedIds };
