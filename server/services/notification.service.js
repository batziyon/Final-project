const db = require('../config/db');

const NotificationService = {
    async send(userId, message, projectId = null) {
        await db.query(
            'INSERT INTO notifications (user_id, message, project_id) VALUES (?, ?, ?)',
            [userId, message, projectId]
        );
    },

    async getUnread(userId) {
        const [rows] = await db.query(
            'SELECT * FROM notifications WHERE user_id = ? AND is_read = FALSE ORDER BY created_at DESC',
            [userId]
        );
        return rows;
    },

    async getOlder(userId, limit = 10) {
        const [rows] = await db.query(
            'SELECT * FROM notifications WHERE user_id = ? AND is_read = TRUE ORDER BY created_at DESC LIMIT ?',
            [userId, limit]
        );
        return rows;
    },

    async markAllRead(userId) {
        await db.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [userId]);
    }
};

module.exports = NotificationService;
