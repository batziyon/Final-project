// ╔══════════════════════════════════════════════════════════╗
// ║   file.controller.js — בקר קבצי פרויקט                  ║
// ║  קבצים נשמרים בדיסק (uploads/projects/) דרך Multer,     ║
// ║  ומטא-דאטה (שם, נתיב) נשמר בטבלת project_files.        ║
// ╚══════════════════════════════════════════════════════════╝

const FileService = require('../services/file.service');
const { asyncHandler } = require('../middleware/errorMiddleware');

// GET /api/projects/:projectId/files — שליפת כל הקבצים של פרויקט
// מוצג בטאב "קבצים" בדף הפרויקט
exports.getProjectFiles = asyncHandler(async (req, res) => {
    const files = await FileService.getByProject(req.params.projectId);
    res.json(files);
});

// POST /api/projects/:projectId/upload-file — העלאת קובץ לפרויקט
// req.file נוצר על ידי Multer לפני שמגיעים לכאן
// 201 Created — הסטנדרט ל-HTTP כשיוצרים משאב חדש
exports.uploadProjectFile = asyncHandler(async (req, res) => {
    const result = await FileService.upload(req.params.projectId, req.user.id, req.file);
    res.status(201).json({ message: 'הקובץ הועלה בהצלחה', ...result });
});
