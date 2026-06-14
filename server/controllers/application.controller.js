const ApplicationService = require('../services/application.service');
const { asyncHandler } = require('../middleware/errorMiddleware');

exports.applyToProject = asyncHandler(async (req, res) => {
    const { projectId, reason, experience, portfolio } = req.body;
    await ApplicationService.apply({ projectId, userId: req.user.id, reason, experience, portfolio });
    res.json({ message: 'המועמדות הוגשה בהצלחה!' });
});

exports.getProjectApplications = asyncHandler(async (req, res) => {
    const apps = await ApplicationService.getByProject(req.params.id);
    res.json(apps);
});

exports.handleApplication = asyncHandler(async (req, res) => {
    const { applicationId, projectId, userId, action } = req.body;
    await ApplicationService.handle({ applicationId, projectId, userId, action, requestingUserId: req.user.id });
    res.json({ message: 'הפעולה בוצעה בהצלחה!' });
});
