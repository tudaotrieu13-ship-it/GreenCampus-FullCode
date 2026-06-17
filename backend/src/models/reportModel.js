const db = require('../config/db');

const createReport = async ({ target_type, target_id, reporter_id, reason }) => {
    const [result] = await db.query(
        `INSERT INTO reports (target_type, target_id, reporter_id, reason) VALUES (?, ?, ?, ?)`,
        [target_type, target_id, reporter_id, reason]
    );
    return result.insertId;
};

const getAdminReports = async () => {
    const [rows] = await db.query(`
        SELECT 
            r.id,
            r.target_type,
            r.target_id,
            r.reason,
            r.status,
            r.created_at,
            u.full_name as reporter_name,
            u.email as reporter_email,
            -- Depending on target_type, fetch title or content
            CASE
                WHEN r.target_type = 'ITEM' THEN (SELECT title FROM items WHERE id = r.target_id)
                WHEN r.target_type = 'POST' THEN (SELECT LEFT(content, 100) FROM social_posts WHERE id = r.target_id)
                WHEN r.target_type = 'USER' THEN (SELECT full_name FROM users WHERE id = r.target_id)
            END as target_name
        FROM reports r
        JOIN users u ON u.id = r.reporter_id
        ORDER BY r.created_at DESC
    `);
    return rows;
};

const updateReportStatus = async (id, status) => {
    const [result] = await db.query(`UPDATE reports SET status = ? WHERE id = ?`, [status, id]);
    return result.affectedRows > 0;
};

module.exports = { createReport, getAdminReports, updateReportStatus };
