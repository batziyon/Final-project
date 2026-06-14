const TaskService = require('../services/task.service');
const { asyncHandler } = require('../middleware/errorMiddleware');

exports.getTasks = asyncHandler(async (req, res) => {
    const tasks = await TaskService.getByProject(req.params.projectId);
    res.json(tasks);
});

exports.getPendingTasks = asyncHandler(async (req, res) => {
    const tasks = await TaskService.getPending(req.params.projectId);
    res.json(tasks);
});

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

exports.updateTaskStatus = asyncHandler(async (req, res) => {
    await TaskService.updateStatus(req.params.taskId, req.body.status);
    res.json({ message: 'הסטטוס עודכן' });
});

exports.handleTaskApproval = asyncHandler(async (req, res) => {
    await TaskService.handleApproval(req.params.taskId, req.body.action, req.user.id);
    res.json({ message: 'הפעולה בוצעה' });
});
