const db = require('../config/db');
const { AppError } = require('../middleware/errorMiddleware');
const NotificationService = require('./notification.service');
const logger = require('../utils/logger');

const VALID_STATUSES = ['todo', 'in_progress', 'review', 'done'];

const TaskService = {
    async getByProject(projectId) {
        const [tasks] = await db.query(
            `SELECT t.*, u.username as assignee_name, c.username as creator_name
             FROM tasks t
             LEFT JOIN users u ON t.assigned_to = u.id
             LEFT JOIN users c ON t.created_by = c.id
             WHERE t.project_id = ? AND t.approval_status = 'approved'
             ORDER BY t.created_at DESC`,
            [projectId]
        );
        return tasks;
    },

    async getPending(projectId) {
        const [tasks] = await db.query(
            `SELECT t.*, u.username as assignee_name, c.username as creator_name
             FROM tasks t
             LEFT JOIN users u ON t.assigned_to = u.id
             LEFT JOIN users c ON t.created_by = c.id
             WHERE t.project_id = ? AND t.approval_status = 'pending'
             ORDER BY t.created_at DESC`,
            [projectId]
        );
        return tasks;
    },

    async create({ projectId, title, description, assignee_id, due_date, userId }) {
        if (!title) throw new AppError('כותרת המשימה חובה', 400);

        const [project] = await db.query('SELECT owner_id FROM projects WHERE id = ?', [projectId]);
        if (!project.length) throw new AppError('פרויקט לא נמצא', 404);

        const isOwner = project[0].owner_id === userId;
        const approval_status = isOwner ? 'approved' : 'pending';

        const [result] = await db.query(
            'INSERT INTO tasks (project_id, title, description, assigned_to, due_date, created_by, approval_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [projectId, title, description || null, assignee_id || null, due_date || null, userId, approval_status]
        );

        if (!isOwner) {
            await NotificationService.send(project[0].owner_id, 'משימה חדשה ממתינה לאישורך בפרויקט', projectId);
        }

        logger.info(`משימה חדשה נוצרה בפרויקט ${projectId} על ידי משתמש ${userId} (סטטוס: ${approval_status})`);
        return { taskId: result.insertId, approval_status, isOwner };
    },

    async updateStatus(taskId, status) {
        if (!VALID_STATUSES.includes(status)) throw new AppError('סטטוס לא תקין', 400);
        await db.query('UPDATE tasks SET status = ? WHERE id = ?', [status, taskId]);
    },

    async handleApproval(taskId, action, requestingUserId) {
        const [tasks] = await db.query(
            'SELECT t.*, p.owner_id FROM tasks t JOIN projects p ON t.project_id = p.id WHERE t.id = ?',
            [taskId]
        );
        if (!tasks.length) throw new AppError('משימה לא נמצאה', 404);
        if (tasks[0].owner_id !== requestingUserId) throw new AppError('אין הרשאה', 403);

        const approval_status = action === 'approve' ? 'approved' : 'rejected';
        await db.query('UPDATE tasks SET approval_status = ? WHERE id = ?', [approval_status, taskId]);
        logger.info(`משימה ${taskId} עודכנה ל-${approval_status} על ידי משתמש ${requestingUserId}`);

        const msg = action === 'approve' ? 'המשימה שהצעת אושרה ✅' : 'המשימה שהצעת נדחתה ❌';
        await NotificationService.send(tasks[0].created_by, msg, tasks[0].project_id);
    }
};

module.exports = TaskService;
