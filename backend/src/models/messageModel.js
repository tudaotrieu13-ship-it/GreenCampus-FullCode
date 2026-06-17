const db = require('../config/db');

const getConversations = async (userId) => {
    // Get all conversations for a user, including the last message and the other user's info.
    // We want a list of unique users we have chatted with.
    const [rows] = await db.query(`
        SELECT 
            u.id as user_id, 
            u.full_name, 
            u.avatar_url,
            m.content as last_message,
            m.created_at,
            m.is_read,
            latest_msgs.unread_count
        FROM users u
        JOIN (
            SELECT 
                CASE 
                    WHEN sender_id = ? THEN receiver_id 
                    ELSE sender_id 
                END as contact_id,
                MAX(id) as last_msg_id,
                SUM(CASE WHEN is_read = 0 AND receiver_id = ? THEN 1 ELSE 0 END) as unread_count
            FROM messages
            WHERE sender_id = ? OR receiver_id = ?
            GROUP BY contact_id
        ) latest_msgs ON u.id = latest_msgs.contact_id
        JOIN messages m ON m.id = latest_msgs.last_msg_id
        WHERE u.id NOT IN (SELECT blocked_id FROM user_blocks WHERE blocker_id = ?)
          AND u.id NOT IN (SELECT blocker_id FROM user_blocks WHERE blocked_id = ?)
        ORDER BY m.created_at DESC
    `, [userId, userId, userId, userId, userId, userId]);
    return rows;
};

const getMessages = async (userId1, userId2) => {
    const [rows] = await db.query(`
        SELECT 
            m.id, 
            m.sender_id, 
            m.receiver_id, 
            m.content, 
            m.item_id, 
            m.post_id,
            m.is_read, 
            m.created_at,
            i.title as item_title, 
            i.price as item_price,
            (SELECT image_url FROM item_images WHERE item_id = i.id ORDER BY is_primary DESC LIMIT 1) as item_image,
            p.content as post_title,
            p.price as post_price,
            p.image_url as post_image
        FROM messages m
        LEFT JOIN items i ON m.item_id = i.id
        LEFT JOIN social_posts p ON m.post_id = p.id
        WHERE (m.sender_id = ? AND m.receiver_id = ?)
           OR (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.created_at ASC
    `, [userId1, userId2, userId2, userId1]);
    return rows;
};

const saveMessage = async (senderId, receiverId, content, itemId = null, postId = null) => {
    const [result] = await db.query(`
        INSERT INTO messages (sender_id, receiver_id, content, item_id, post_id)
        VALUES (?, ?, ?, ?, ?)
    `, [senderId, receiverId, content, itemId, postId]);
    
    // Return the newly created message with item/post details
    const [rows] = await db.query(`
        SELECT 
            m.id, 
            m.sender_id, 
            m.receiver_id, 
            m.content, 
            m.item_id, 
            m.post_id,
            m.is_read, 
            m.created_at,
            i.title as item_title, 
            i.price as item_price,
            (SELECT image_url FROM item_images WHERE item_id = i.id ORDER BY is_primary DESC LIMIT 1) as item_image,
            p.content as post_title,
            p.price as post_price,
            p.image_url as post_image
        FROM messages m
        LEFT JOIN items i ON m.item_id = i.id
        LEFT JOIN social_posts p ON m.post_id = p.id
        WHERE m.id = ?
    `, [result.insertId]);
    return rows[0];
};

const getPinnedItem = async (userId1, userId2) => {
    const [u1, u2] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
    const [rows] = await db.query(`
        SELECT 
            p.item_id, 
            i.title as content, 
            i.price,
            img.image_url as image
        FROM pinned_items p
        JOIN items i ON p.item_id = i.id
        LEFT JOIN item_images img ON img.item_id = i.id AND img.is_primary = 1
        WHERE user1_id = ? AND user2_id = ?
    `, [u1, u2]);
    return rows[0] || null;
};

const pinItem = async (userId1, userId2, itemId, pinnedBy) => {
    const [u1, u2] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
    await db.query(`
        INSERT INTO pinned_items (user1_id, user2_id, item_id, pinned_by)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE item_id = VALUES(item_id), pinned_by = VALUES(pinned_by)
    `, [u1, u2, itemId, pinnedBy]);
    return getPinnedItem(u1, u2);
};

const unpinItem = async (userId1, userId2) => {
    const [u1, u2] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
    await db.query(`DELETE FROM pinned_items WHERE user1_id = ? AND user2_id = ?`, [u1, u2]);
};

module.exports = {
    getConversations,
    getMessages,
    saveMessage,
    getPinnedItem,
    pinItem,
    unpinItem
};
