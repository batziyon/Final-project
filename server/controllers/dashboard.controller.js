// ╔══════════════════════════════════════════════════════════╗
// ║   dashboard.controller.js — בקר דשבורד                  ║
// ║  מחזיר סטטיסטיקות אישיות + סטטיסטיקות ציבוריות.        ║
// ╚══════════════════════════════════════════════════════════╝

const { DashboardService, StatsService } = require('../services/dashboard.service');
const { asyncHandler } = require('../middleware/errorMiddleware');

// GET /api/projects/dashboard-stats — סטטיסטיקות אישיות למשתמש המחובר
// מחזיר: פרויקטים, בקשות, התראות, המלצות תפקידים...
// req.user.id מגיע מהטוקן דרך authMiddleware
exports.getDashboardStats = asyncHandler(async (req, res) => {
    const stats = await DashboardService.getStats(req.user.id);
    res.json(stats);
});

// GET /api/projects/stats — סטטיסטיקות ציבוריות לדף הנחיתה
// לא דורש אימות — מוצג לכל גולש בדף הבית
exports.getStats = asyncHandler(async (req, res) => {
    const stats = await StatsService.getPublicStats();
    res.json(stats);
});
