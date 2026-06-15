const db = require('../config/db');

/**
 * NotificationService — שירות התראות פשוט.
 * כל התראה נשמרת בטבלת notifications עם user_id, message, project_id.
 */
const NotificationService = {

    /**
     * שולח התראה למשתמש ספציפי.
     * projectId אופציונלי — מאפשר ניווט לפרויקט בלחיצה.
     */
    async send(userId, message, projectId = null) {
        await db.query(
            'INSERT INTO notifications (user_id, message, project_id) VALUES (?, ?, ?)',
            [userId, message, projectId]
        );
    },

    /**
     * שולף התראות שלא נקראו של משתמש — לתצוגת הפעמון ב-Navbar.
     */
    async getUnread(userId) {
        const [rows] = await db.query(
            'SELECT * FROM notifications WHERE user_id = ? AND is_read = FALSE ORDER BY created_at DESC',
            [userId]
        );
        return rows;
    },

    /**
     * שולף התראות ישנות (כבר נקראו) — עד 10 האחרונות.
     */
    async getOlder(userId, limit = 10) {
        const [rows] = await db.query(
            'SELECT * FROM notifications WHERE user_id = ? AND is_read = TRUE ORDER BY created_at DESC LIMIT ?',
            [userId, limit]
        );
        return rows;
    },

    /**
     * מסמן את כל ההתראות של המשתמש כנקראו.
     * נקרא כשהמשתמש פותח את תפריט הפעמון.
     */
    async markAllRead(userId) {
        await db.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [userId]);
    }
};

module.exports = NotificationService;
