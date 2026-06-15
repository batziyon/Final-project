const db = require('../config/db');
const { AppError } = require('../middleware/errorMiddleware');
const NotificationService = require('./notification.service');
const logger = require('../utils/logger');

/**
 * ApplicationService — מנהל את מחזור החיים של בקשות הצטרפות לפרויקטים.
 * הגשה → אישור/דחייה → התראה למשתמש.
 */
const ApplicationService = {

    /**
     * מגיש בקשת הצטרפות לפרויקט.
     * בודק שהמשתמש לא הגיש בקשה קודמת לאותו פרויקט.
     * בדיקת קיום ושליפת פרויקט רצות במקביל לחיסכון בזמן.
     * לאחר הגשה — שולח התראה לבעל הפרויקט.
     */
    async apply({ projectId, userId, reason, experience, portfolio }) {
        if (!projectId) throw new AppError('מזהה פרויקט הוא שדה חובה', 400);
        if (!reason || !reason.trim()) throw new AppError('שדה "למה אתה מתאים" הוא שדה חובה', 400);
        if (!experience || !experience.trim()) throw new AppError('שדה "ניסיון קודם" הוא שדה חובה', 400);

        // בדיקת כפילות + שליפת פרויקט במקביל
        const [[exists], [project]] = await Promise.all([
            db.query('SELECT id FROM applications WHERE project_id = ? AND user_id = ?', [projectId, userId]),
            db.query('SELECT owner_id, title FROM projects WHERE id = ?', [projectId])
        ]);

        if (exists.length > 0) throw new AppError('כבר הגשת מועמדות לפרויקט זה', 400);

        await db.query(
            'INSERT INTO applications (project_id, user_id, reason, experience, portfolio, cover_letter) VALUES (?, ?, ?, ?, ?, ?)',
            [projectId, userId, reason, experience, portfolio, reason]
        );
        logger.info(`משתמש ${userId} הגיש מועמדות לפרויקט ${projectId}`);

        // שלח התראה לבעל הפרויקט
        if (project.length > 0) {
            await NotificationService.send(project[0].owner_id, `קיבלת מועמדות חדשה לפרויקט: ${project[0].title}`, projectId);
        }
    },

    /**
     * שולף את כל הבקשות הממתינות לפרויקט מסוים.
     * מצרף פרטי המגיש (תמונה, תפקיד, bio) לתצוגה בממשק הבעלים.
     */
    async getByProject(projectId) {
        const [apps] = await db.query(
            `SELECT a.*, u.username, u.profile_image, u.role as user_role, u.bio
             FROM applications a
             JOIN users u ON a.user_id = u.id
             WHERE a.project_id = ? AND a.status = 'pending'
             ORDER BY a.created_at DESC`,
            [projectId]
        );
        return apps;
    },

    /**
     * מטפל באישור או דחייה של בקשה.
     * מוודא שהמשתמש המבצע הוא בעל הפרויקט (הרשאה).
     * באישור — מוסיף את המגיש כחבר פרויקט ושולח התראת קבלה.
     * בדחייה — שולח התראת דחייה.
     */
    async handle({ applicationId, projectId, userId, action, requestingUserId }) {
        if (!applicationId || !projectId || !userId || !action)
            throw new AppError('חסרים נתונים לביצוע הפעולה', 400);

        const [project] = await db.query('SELECT owner_id, title FROM projects WHERE id = ?', [projectId]);
        if (!project.length) throw new AppError('הפרויקט לא נמצא', 404);

        // וודא שרק בעל הפרויקט יכול לאשר/לדחות
        if (project[0].owner_id !== requestingUserId) throw new AppError('אין לך הרשאה לנהל בקשות לפרויקט זה', 403);

        const status = action === 'approve' ? 'approved' : 'rejected';
        await db.query('UPDATE applications SET status = ? WHERE id = ?', [status, applicationId]);
        logger.info(`בקשה ${applicationId} לפרויקט ${projectId} עודכנה ל-${status}`);

        if (action === 'approve') {
            // הוסף לחברי הפרויקט (IGNORE מונע כפילות)
            await db.query('INSERT IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)', [projectId, userId]);
            await NotificationService.send(userId, `מזל טוב! התקבלת לפרויקט "${project[0].title}"`, projectId);
        } else {
            await NotificationService.send(userId, `לצערנו, המועמדות שלך לפרויקט "${project[0].title}" נדחתה.`, projectId);
        }
    }
};

module.exports = ApplicationService;
