// ╔══════════════════════════════════════════════════════════╗
// ║   notification.controller.js — בקר התראות               ║
// ║  מחזיר התראות לפעמון ב-Navbar ומסמן אותן כנקראו.       ║
// ╚══════════════════════════════════════════════════════════╝

const NotificationService = require('../services/notification.service');
const { asyncHandler } = require('../middleware/errorMiddleware');

// GET /api/projects/notifications — שליפת התראות חדשות וישנות
// מחזיר: { unread: [...], older: [...] }
// unread = אדום בפעמון | older = מוסתרות מתחת ל"הודעות קודמות"
// שתי השאילתות רצות במקביל (Promise.all) לחיסכון בזמן
exports.getNotifications = asyncHandler(async (req, res) => {
    const [unread, older] = await Promise.all([
        NotificationService.getUnread(req.user.id),
        NotificationService.getOlder(req.user.id)
    ]);
    res.json({ unread, older });
});

// POST /api/projects/notifications/clear — סימון כל ההתראות כנקראו
// נקרא כשהמשתמש פותח את תפריט הפעמון — הסיבוב האדום ייעלם
exports.clearNotifications = asyncHandler(async (req, res) => {
    await NotificationService.markAllRead(req.user.id);
    res.json({ message: 'ההתראות סומנו כנקראו' });
});
