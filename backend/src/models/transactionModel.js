const db = require('../config/db');

/**
 * Create a new transaction — wrapped in a DB transaction with row lock
 * to prevent overselling when concurrent purchases happen simultaneously.
 */
const createTransaction = async ({ item_id, buyer_id, seller_id, amount, delivery_address, buyer_name, buyer_phone, payment_method }) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // Lock the row so concurrent requests wait instead of reading stale qty
        const [items] = await conn.query(
            `SELECT quantity, status FROM items WHERE id = ? FOR UPDATE`,
            [item_id]
        );
        const item = items[0];

        if (!item || item.quantity <= 0 || item.status !== 'AVAILABLE') {
            await conn.rollback();
            throw new Error('Sản phẩm không còn khả dụng hoặc đã hết hàng.');
        }

        const [result] = await conn.query(
            `INSERT INTO transactions (item_id, buyer_id, seller_id, amount, status, delivery_address, buyer_name, buyer_phone, payment_method) VALUES (?, ?, ?, ?, 'PENDING', ?, ?, ?, ?)`,
            [item_id, buyer_id, seller_id, amount, delivery_address, buyer_name, buyer_phone, payment_method]
        );

        // NOTE: Quantity is NOT decremented here.
        // The item stays visible in the marketplace while the order is PENDING.
        // Quantity is only decremented (and status set to SOLD if qty hits 0)
        // when the transaction is COMPLETED (both parties confirmed).

        await conn.commit();
        return result.insertId;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};


/**
 * Get all transactions for a user (either as buyer or seller)
 */
const getTransactionsByUser = async (userId) => {
    const [rows] = await db.query(`
        SELECT 
            t.id, 
            t.amount, 
            t.status, 
            t.created_at,
            t.buyer_id,
            t.seller_id,
            t.buyer_confirmed,
            t.seller_confirmed,
            t.delivery_address,
            t.buyer_name AS order_buyer_name,
            t.buyer_phone,
            t.payment_method,
            i.title AS item_title,
            i.id AS item_id,
            img.image_url AS item_image,
            u_buyer.full_name AS buyer_name,
            u_seller.full_name AS seller_name,
            u_seller.bank_name,
            u_seller.bank_account_no,
            u_seller.bank_account_name
        FROM transactions t
        JOIN items i ON t.item_id = i.id
        LEFT JOIN item_images img ON img.item_id = i.id AND img.is_primary = 1
        JOIN users u_buyer ON t.buyer_id = u_buyer.id
        JOIN users u_seller ON t.seller_id = u_seller.id
        WHERE t.buyer_id = ? OR t.seller_id = ?
        ORDER BY t.created_at DESC
    `, [userId, userId]);
    return rows;
};

/**
 * Update transaction status
 */
const updateTransactionStatus = async (transactionId, status) => {
    await db.query(`UPDATE transactions SET status = ? WHERE id = ?`, [status, transactionId]);

    const [rows] = await db.query(`SELECT item_id, buyer_id, seller_id FROM transactions WHERE id = ?`, [transactionId]);
    if (!rows.length) return { affectedUserId: null };

    const { item_id, buyer_id, seller_id } = rows[0];

    if (status === 'COMPLETED') {
        // Decrement quantity and mark SOLD only when truly completed
        const [itemRows] = await db.query(`SELECT quantity FROM items WHERE id = ?`, [item_id]);
        if (itemRows.length > 0) {
            const newQty = Math.max(0, itemRows[0].quantity - 1);
            await db.query(`UPDATE items SET quantity = ? WHERE id = ?`, [newQty, item_id]);
            if (newQty <= 0) {
                await db.query(`UPDATE items SET status = 'SOLD' WHERE id = ?`, [item_id]);
            }
        }
    } else if (status === 'CANCELLED') {
        // If cancelled, ensure item stays AVAILABLE (in case it was somehow changed)
        await db.query(`UPDATE items SET status = 'AVAILABLE' WHERE id = ? AND status != 'SOLD'`, [item_id]);
    }

    // Return buyer_id so the controller can notify them (seller is the one changing status)
    return { affectedUserId: buyer_id, buyer_id, seller_id };
};


const confirmTransactionRole = async (transactionId, userId, role) => {
    // role is 'buyer' or 'seller'
    if (role === 'buyer') {
        await db.query(`UPDATE transactions SET buyer_confirmed = TRUE WHERE id = ? AND buyer_id = ?`, [transactionId, userId]);
    } else if (role === 'seller') {
        await db.query(`UPDATE transactions SET seller_confirmed = TRUE WHERE id = ? AND seller_id = ?`, [transactionId, userId]);
    } else {
        throw new Error('Invalid role');
    }

    // Check if both are true now
    const [rows] = await db.query(`SELECT buyer_confirmed, seller_confirmed, item_id, buyer_id, seller_id FROM transactions WHERE id = ?`, [transactionId]);
    if (!rows.length) return null;

    const { buyer_confirmed, seller_confirmed, item_id, buyer_id, seller_id } = rows[0];
    if (buyer_confirmed && seller_confirmed) {
        await db.query(`UPDATE transactions SET status = 'COMPLETED' WHERE id = ?`, [transactionId]);

        // Now that the deal is truly done: decrement quantity and mark SOLD if out of stock
        const [itemRows] = await db.query(`SELECT quantity FROM items WHERE id = ?`, [item_id]);
        if (itemRows.length > 0) {
            const newQty = Math.max(0, itemRows[0].quantity - 1);
            await db.query(`UPDATE items SET quantity = ? WHERE id = ?`, [newQty, item_id]);
            if (newQty <= 0) {
                await db.query(`UPDATE items SET status = 'SOLD' WHERE id = ?`, [item_id]);
            }
        }

        return { status: 'COMPLETED', buyer_id, seller_id };
    }
    
    return { status: 'PENDING', buyer_id, seller_id };
};


const getSoldCountByUserId = async (userId) => {
    const [rows] = await db.query(
        `SELECT COUNT(*) as soldCount FROM transactions WHERE seller_id = ? AND status = 'COMPLETED'`,
        [userId]
    );
    return Number(rows[0].soldCount) || 0;
};

module.exports = { createTransaction, getTransactionsByUser, updateTransactionStatus, getSoldCountByUserId, confirmTransactionRole };
