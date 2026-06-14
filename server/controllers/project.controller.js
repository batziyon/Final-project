const ProjectService = require('../services/project.service');
const { asyncHandler } = require('../middleware/errorMiddleware');
const logger = require('../utils/logger');

exports.createProject = asyncHandler(async (req, res) => {
    const owner_id = req.user.id;
    const media_url = req.file ? `/uploads/projects/${req.file.filename}` : null;
    logger.info(`[Project] יצירת פרויקט ע"י משתמש ${owner_id}`);
    const projectId = await ProjectService.create({ ...req.body, owner_id, media_url });
    res.status(201).json({ message: 'הפרויקט נוצר בהצלחה!', projectId });
});

exports.getAllProjects = asyncHandler(async (req, res) => {
    const projects = await ProjectService.getAll(req.query, req.user.id);
    res.json(projects);
});

exports.getProjectById = asyncHandler(async (req, res) => {
    const project = await ProjectService.getById(req.params.id);
    res.json(project);
});

exports.getProjectMembers = asyncHandler(async (req, res) => {
    const members = await ProjectService.getMembers(req.params.projectId);
    res.json(members);
});
