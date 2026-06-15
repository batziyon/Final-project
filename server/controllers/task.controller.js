// ╔══════════════════════════════════════════════════════════╗
// ║   task.controller.js — בקר משימות (Kanban)               ║
// ║  כל route כאן מתחיל ב-/api/projects/:projectId/tasks    ║
// ╚══════════════════════════════════════════════════════════╝

const TaskService = require('../services/task.service');
const { asyncHandler } = require('../middleware/errorMiddleware');

// GET /api/projects/:projectId/tasks — כל המשימות המאושרות של פרויקט
// מוצג בלוח Kanban לכל חברי הצוות
exports.getTasks = asyncHandler(async (req, res) => {
    const tasks = await TaskService.getByProject(req.params.projectId);
    res.json(tasks);
});

// GET /api/projects/:projectId/tasks/pending — משימות ממתינות לאישור
// מוצג רק לבעל הפרויקט בחלק העליון של הלוח
exports.getPendingTasks = asyncHandler(async (req, res) => {
    const tasks = await TaskService.getPending(req.params.projectId);
    res.json(tasks);
});

// POST /api/projects/:projectId/tasks — יצירת משימה חדשה
// אם הבעלים יוצר → מאושרת מיד | אם חבר → ממתינה לאישור
// msg מותאם לסטטוס שחזר מה-service
exports.createTask = asyncHandler(async (req, res) => {
    const { title, description, assignee_id, due_date } = req.body;
    const result = await TaskService.create({
        projectId: req.params.projectId,
        title, description, assignee_id, due_date,
        userId: req.user.id
    });
    const msg = result.isOwner ? 'המשימה נוצרה בהצלחה' : 'המשימה נשלחה לאישור המנהל';
    res.status(201).json({ message: msg, ...result });
});

// PATCH /api/projects/tasks/:taskId/status — עדכון סטטוס (todo/in_progress/review/done)
// כל חבר יכול לגרור משימה בלוח
exports.updateTaskStatus = asyncHandler(async (req, res) => {
    await TaskService.updateStatus(req.params.taskId, req.body.status);
    res.json({ message: 'הסטטוס עודכן' });
});

// POST /api/projects/tasks/:taskId/approve — אישור/דחיית משימה שחבר הציע
// action: 'approve' / 'reject' — רק בעל הפרויקט מורשה
exports.handleTaskApproval = asyncHandler(async (req, res) => {
    await TaskService.handleApproval(req.params.taskId, req.body.action, req.user.id);
    res.json({ message: 'הפעולה בוצעה' });
});
