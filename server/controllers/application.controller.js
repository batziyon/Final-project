// ╔══════════════════════════════════════════════════════════╗
// ║   application.controller.js — בקר בקשות הצטרפות         ║
// ║  מחבר בין routes ל-ApplicationService.                   ║
// ╚══════════════════════════════════════════════════════════╝

const ApplicationService = require('../services/application.service');
const { asyncHandler } = require('../middleware/errorMiddleware');

// POST /api/projects/apply — הגשת בקשה לפרויקט
// req.body: { projectId, reason, experience, portfolio }
// req.user.id = המגיש (מהטוקן)
exports.applyToProject = asyncHandler(async (req, res) => {
    const { projectId, reason, experience, portfolio } = req.body;
    await ApplicationService.apply({ projectId, userId: req.user.id, reason, experience, portfolio });
    res.json({ message: 'המועמדות הוגשה בהצלחה!' });
});

// GET /api/projects/:id/applications — בקשות ממתינות לפרויקט
// מוצג רק לבעל הפרויקט בממשק
exports.getProjectApplications = asyncHandler(async (req, res) => {
    const apps = await ApplicationService.getByProject(req.params.id);
    res.json(apps);
});

// POST /api/projects/handle-application — אישור או דחייה של בקשה
// req.body: { applicationId, projectId, userId, action: 'approve'/'reject' }
// requestingUserId = מי לוחץ (חייב להיות בעל הפרויקט)
exports.handleApplication = asyncHandler(async (req, res) => {
    const { applicationId, projectId, userId, action } = req.body;
    await ApplicationService.handle({ applicationId, projectId, userId, action, requestingUserId: req.user.id });
    res.json({ message: 'הפעולה בוצעה בהצלחה!' });
});
