const db = require('../config/db');
const messageModel = require('../models/messageModel');
const { createNotification } = require('../models/notificationModel');

const getConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        const conversations = await messageModel.getConversations(userId);
        res.json(conversations);
    } catch (err) {
        console.error("Error in getConversations:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.query(
            `SELECT COUNT(*) as total_unread 
             FROM messages 
             WHERE receiver_id = ? AND is_read = 0 
               AND sender_id NOT IN (SELECT blocked_id FROM user_blocks WHERE blocker_id = ?)`,
            [userId, userId]
        );
        res.json({ totalUnread: rows[0].total_unread });
    } catch (err) {
        console.error("Error in getUnreadCount:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const getMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const otherUserId = req.params.userId;
        const messages = await messageModel.getMessages(userId, otherUserId);
        res.json(messages);
    } catch (err) {
        console.error("Error in getMessages:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const sendMessage = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { receiverId, content, itemId, postId } = req.body;
        
        if (!receiverId) {
            return res.status(400).json({ error: "receiverId is required" });
        }
        
        const message = await messageModel.saveMessage(senderId, receiverId, content, itemId, postId);

        // Push real-time event via Socket.IO
        const io = req.app.get('io');
        if (io) {
            // Chuẩn hóa định dạng tin nhắn trả về cho Frontend
            const emitMsg = {
                id: message.id,
                sender_id: senderId,
                content: content,
                created_at: new Date().toISOString(),
                item_id: itemId,
                post_id: postId,
                item_title: message.item_title,
                item_price: message.item_price,
                item_image: message.item_image,
                post_title: message.post_title,
                post_price: message.post_price,
                post_image: message.post_image
            };
            io.to(`user_${receiverId}`).emit('receive_message', emitMsg);
        }

        // Push notification to receiver (fire-and-forget)
        const preview = content ? content.substring(0, 60) : 'Đã gửi một tin nhắn';
        createNotification(receiverId, 'new_message', 'Tin nhắn mới', preview, 'messages').catch(() => {});

        res.status(201).json(message);
    } catch (err) {
        console.error("Error in sendMessage:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const pinItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { otherUserId, itemId } = req.body;
        if (!otherUserId || !itemId) {
            return res.status(400).json({ error: "otherUserId and itemId are required" });
        }
        const pinned = await messageModel.pinItem(userId, otherUserId, itemId, userId);
        res.json(pinned);
    } catch (err) {
        console.error("Error in pinItem:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const unpinItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { otherUserId } = req.params;
        await messageModel.unpinItem(userId, otherUserId);
        res.json({ success: true });
    } catch (err) {
        console.error("Error in unpinItem:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const getPinnedItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { otherUserId } = req.params;
        const pinned = await messageModel.getPinnedItem(userId, otherUserId);
        res.json(pinned);
    } catch (err) {
        console.error("Error in getPinnedItem:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Không tìm thấy file ảnh' });
        }
        const imageUrl = `/uploads/${req.file.filename}`;
        res.status(200).json({ url: imageUrl });
    } catch (err) {
        console.error('Error in uploadImage:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getMedia = async (req, res) => {
    try {
        const userId = req.user.id;
        const otherUserId = req.params.otherUserId;
        const [rows] = await db.query(`
            SELECT id, content as image_url, created_at
            FROM messages 
            WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
              AND content LIKE '[IMAGE] %'
            ORDER BY created_at DESC
        `, [userId, otherUserId, otherUserId, userId]);
        
        const media = rows.map(r => ({
            id: r.id,
            url: r.image_url.replace('[IMAGE] ', ''),
            created_at: r.created_at
        }));
        res.json(media);
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const searchMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const otherUserId = req.params.otherUserId;
        const q = req.query.q || '';
        const [rows] = await db.query(`
            SELECT * FROM messages 
            WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
              AND content LIKE ? AND content NOT LIKE '[IMAGE] %'
            ORDER BY created_at DESC
        `, [userId, otherUserId, otherUserId, userId, `%${q}%`]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const toggleBlock = async (req, res) => {
    try {
        const blockerId = req.user.id;
        const blockedId = req.params.otherUserId;
        const [rows] = await db.query('SELECT * FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?', [blockerId, blockedId]);
        if (rows.length > 0) {
            await db.query('DELETE FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?', [blockerId, blockedId]);
            res.json({ isBlocked: false });
        } else {
            await db.query('INSERT INTO user_blocks (blocker_id, blocked_id) VALUES (?, ?)', [blockerId, blockedId]);
            res.json({ isBlocked: true });
        }
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const toggleMute = async (req, res) => {
    try {
        const userId = req.user.id;
        const otherUserId = req.params.otherUserId;
        const [rows] = await db.query('SELECT is_muted FROM conversation_settings WHERE user_id = ? AND other_user_id = ?', [userId, otherUserId]);
        if (rows.length > 0) {
            const newState = !rows[0].is_muted;
            await db.query('UPDATE conversation_settings SET is_muted = ? WHERE user_id = ? AND other_user_id = ?', [newState, userId, otherUserId]);
            res.json({ isMuted: newState });
        } else {
            await db.query('INSERT INTO conversation_settings (user_id, other_user_id, is_muted) VALUES (?, ?, ?)', [userId, otherUserId, true]);
            res.json({ isMuted: true });
        }
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const deleteConversation = async (req, res) => {
    try {
        const userId = req.user.id;
        const otherUserId = req.params.otherUserId;
        await db.query(`
            DELETE FROM messages 
            WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
        `, [userId, otherUserId, otherUserId, userId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const otherUserId = req.params.otherUserId;
        await db.query(`
            UPDATE messages SET is_read = 1 
            WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
        `, [otherUserId, userId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = {
    getConversations,
    getUnreadCount,
    getMessages,
    sendMessage,
    pinItem,
    unpinItem,
    getPinnedItem,
    uploadImage,
    getMedia,
    searchMessages,
    toggleBlock,
    toggleMute,
    deleteConversation,
    markAsRead
};
