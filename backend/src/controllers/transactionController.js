const { createTransaction, getTransactionsByUser, updateTransactionStatus, confirmTransactionRole } = require('../models/transactionModel');
const { createNotification } = require('../models/notificationModel');

const buyItem = async (req, res) => {
    try {
        const { item_id, seller_id, amount, delivery_address, buyer_name, buyer_phone, payment_method } = req.body;
        const buyer_id = req.user.id;

        // Log the IDs to check if they are BIGINT compatible (strings or numbers)
        console.log('Transaction Attempt:', { item_id, buyer_id, seller_id, amount });

        if (!item_id || !seller_id || buyer_id === undefined) {
            return res.status(400).json({ message: 'Thiếu thông tin giao dịch.' });
        }

        if (Number(buyer_id) === Number(seller_id)) {
            return res.status(400).json({ message: 'Bạn không thể mua đồ của chính mình.' });
        }

        const transactionId = await createTransaction({ item_id, buyer_id, seller_id, amount, delivery_address, buyer_name, buyer_phone, payment_method });

        // Notify seller: someone wants to buy their item
        const amountText = Number(amount) === 0 ? 'miễn phí' : `${Number(amount).toLocaleString('vi-VN')}đ`;
        createNotification(
          seller_id,
          'new_transaction',
          '\uD83D\uDED2 Có người muốn mua đồ của bạn!',
          `Giá ${amountText} • Địa điểm: ${delivery_address || 'Chưa rõ'} • Kiểm tra lịch sử để xác nhận.`,
          'history'
        ).catch(() => {});

        // Notify buyer: order placed successfully
        createNotification(
          buyer_id,
          'order_placed',
          '\u2705 Đặt hàng thành công!',
          `Đơn hàng ${amountText} đã được gửi đến người bán. Hãy chờ xác nhận từ họ nhé!`,
          'history'
        ).catch(() => {});

        res.status(201).json({ message: 'Đã tạo yêu cầu mua hàng!', transactionId });
    } catch (error) {
        console.error('Get Transactions Error:', error);
        res.status(500).json({ message: error.message || 'Lỗi khi lấy danh sách giao dịch' });
    }
};

const getMyTransactions = async (req, res) => {
    try {
        const userId = req.user.id;
        const transactions = await getTransactionsByUser(userId);
        res.status(200).json(transactions);
    } catch (error) {
        console.error('Error in getMyTransactions:', error);
        res.status(500).json({ message: error.message || 'Lỗi khi lấy lịch sử giao dịch' });
    }
};

const updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;
        const result = await updateTransactionStatus(id, status);

        // Notify the other party about status change
        if (result && result.buyer_id && result.seller_id) {
          const affectedUserId = req.user.id === result.buyer_id ? result.seller_id : result.buyer_id;
          const labels = { SHIPPING: 'Đơn hàng đang được giao', COMPLETED: 'Giao dịch hoàn tất!', CANCELLED: 'Giao dịch đã bị huỷ' };
          const title = labels[status] || 'Trạng thái đơn hàng thay đổi';
          createNotification(affectedUserId, 'transaction_status', title, `Trạng thái mới: ${status}`, 'history').catch(() => {});
        }

        res.status(200).json({ message: 'Đã cập nhật trạng thái giao dịch' });
    } catch (error) {
        console.error('Error in updateStatus:', error);
        res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái', error: error.message });
    }
};

const confirmRole = async (req, res) => {
    try {
        const { role } = req.body; // 'buyer' or 'seller'
        const { id } = req.params;
        const userId = req.user.id;

        if (role !== 'buyer' && role !== 'seller') {
            return res.status(400).json({ message: 'Role không hợp lệ.' });
        }

        const result = await confirmTransactionRole(id, userId, role);
        if (!result) {
            return res.status(404).json({ message: 'Giao dịch không tồn tại hoặc bạn không có quyền.' });
        }

        if (result.status === 'COMPLETED') {
            // Notify BOTH parties: transaction is completed
            createNotification(
              result.buyer_id,
              'transaction_completed',
              '\uD83C\uDF89 Giao dịch hoàn tất!',
              'Cả hai bên đã xác nhận. Bạn có thể đánh giá người bán ngay bây giờ!',
              'history'
            ).catch(() => {});
            createNotification(
              result.seller_id,
              'transaction_completed',
              '\uD83C\uDF89 Giao dịch hoàn tất!',
              'Cả hai bên đã xác nhận. Cảm ơn bạn đã tham gia GreenCampus!',
              'history'
            ).catch(() => {});
        } else {
            // Partial confirmation: notify the other party they need to confirm too
            const otherUserId = role === 'buyer' ? result.seller_id : result.buyer_id;
            const otherRole = role === 'buyer' ? 'người bán' : 'người mua';
            createNotification(
              otherUserId,
              'transaction_status',
              '\uD83D\uDD14 Đối phương đã xác nhận!',
              `${role === 'buyer' ? 'Người mua' : 'Người bán'} đã xác nhận xong. Bạn hãy xác nhận phần của mình để hoàn tất giao dịch!`,
              'history'
            ).catch(() => {});
        }

        res.status(200).json({ message: 'Đã xác nhận.', status: result.status });
    } catch (error) {
        console.error('Error in confirmRole:', error);
        res.status(500).json({ message: 'Lỗi khi xác nhận giao dịch', error: error.message });
    }
};

const debugTransactions = async (req, res) => {
    try {
        const [rows] = await require('../config/db').query(`SELECT * FROM transactions`);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

const fixDb = async (req, res) => {
    try {
        const db = require('../config/db');
        let results = [];
        try { await db.query(`ALTER TABLE transactions ADD COLUMN buyer_confirmed BOOLEAN DEFAULT FALSE`); results.push('buyer ok'); } catch(e) { results.push('buyer err: ' + e.message); }
        try { await db.query(`ALTER TABLE transactions ADD COLUMN seller_confirmed BOOLEAN DEFAULT FALSE`); results.push('seller ok'); } catch(e) { results.push('seller err: ' + e.message); }
        res.json({ results });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

module.exports = { buyItem, getMyTransactions, updateStatus, confirmRole, debugTransactions, fixDb };
