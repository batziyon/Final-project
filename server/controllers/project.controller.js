// ╔══════════════════════════════════════════════════════════════╗
// ║       project.controller.js — בקר פרויקטים                  ║
// ║  שכבה דקה בין ה-routes ל-ProjectService.                    ║
// ║  asyncHandler עוטף כל פונקציה — תופס שגיאות אוטומטית.      ║
// ╚══════════════════════════════════════════════════════════════╝

const ProjectService = require('../services/project.service');
const { asyncHandler } = require('../middleware/errorMiddleware');
const logger = require('../utils/logger');

// POST /api/projects/create — יצירת פרויקט חדש
// req.user.id = ה-owner (מגיע מהטוקן דרך authMiddleware)
// req.file = תמונה/מדיה שהועלתה דרך Multer (אופציונלי)
exports.createProject = asyncHandler(async (req, res) => {
    const owner_id = req.user.id;
    // אם הועלה קובץ — בונה נתיב יחסי לגישה דרך /uploads/projects/
    const media_url = req.file ? `/uploads/projects/${req.file.filename}` : null;
    logger.info(`[Project] יצירת פרויקט ע"י משתמש ${owner_id}`);
    // ...req.body = כל שאר שדות הפרויקט (title, description, category וכו')
    const projectId = await ProjectService.create({ ...req.body, owner_id, media_url });
    res.status(201).json({ message: 'הפרויקט נוצר בהצלחה!', projectId });
});

// GET /api/projects — שליפת כל הפרויקטים עם פילטרים
// req.query = פרמטרים מה-URL: ?category=tech&view=my_created וכו'
exports.getAllProjects = asyncHandler(async (req, res) => {
    const projects = await ProjectService.getAll(req.query, req.user.id);
    res.json(projects);
});

// GET /api/projects/:id — פרויקט בודד מלא (תפקידים, בקשות, חברים)
exports.getProjectById = asyncHandler(async (req, res) => {
    const project = await ProjectService.getById(req.params.id);
    res.json(project);
});

// GET /api/projects/:projectId/members — רשימת חברי הצוות בלבד
exports.getProjectMembers = asyncHandler(async (req, res) => {
    const members = await ProjectService.getMembers(req.params.projectId);
    res.json(members);
});
