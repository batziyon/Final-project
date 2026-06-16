const logger = require('../utils/logger.js');
const adminService = require('../services/admin.service');


exports.getStats = async (req, res) => {
    try {
        const stats = await adminService.getStats();
        res.json(stats);
    } catch (error) {
        logger.error(`שגיאה בסטטיסטיקות: ${error.message}`);
        res.status(500).json({ message: 'שגיאה בשרת' });
    }
};


exports.getAllUsers = async (req, res) => {
    try {
        const users = await adminService.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        logger.error(`שגיאה בשליפת משתמשים: ${error.message}`);
        res.status(500).json({ message: 'שגיאה בשרת בשליפת המשתמשים' });
    }
};


exports.toggleUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { isActive } = req.body;
        await adminService.toggleUserStatus(req.user.id, userId, isActive);
        logger.warn(` אדמין ${req.user.id} שינה סטטוס משתמש ${userId} ל-${isActive}`);
        res.status(200).json({ message: `סטטוס המשתמש עודכן` });
    } catch (error) {
        if (error.code === 'CANNOT_SELF_LOCK') return res.status(400).json({ message: 'לא ניתן לחסום את עצמך' });
        logger.error(`שגיאה בעדכון סטטוס משתמש: ${error.message}`);
        res.status(500).json({ message: 'שגיאה בעדכון סטטוס המשתמש' });
    }
};

// ── 4. שינוי תפקיד משתמש (/api/admin/users/:userId/role) ─────────────────────
// validRoles מגדיר אילו תפקידים קיימים — listener הוסר מהמערכת
exports.changeUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;
        const result = await adminService.changeUserRole(req.user.id, userId, role);
        logger.warn(`👮 אדמין ${req.user.id} שינה תפקיד משתמש ${userId}: ${result.from} → ${result.to}`);
        res.json({ message: 'התפקיד עודכן בהצלחה' });
    } catch (error) {
        if (error.code === 'INVALID_ROLE') return res.status(400).json({ message: 'תפקיד לא תקין' });
        if (error.code === 'CANNOT_CHANGE_SELF_ROLE') return res.status(400).json({ message: 'לא ניתן לשנות את תפקידך' });
        if (error.code === 'USER_NOT_FOUND') return res.status(404).json({ message: 'משתמש לא נמצא' });
        logger.error(`שגיאה בשינוי תפקיד: ${error.message}`);
        res.status(500).json({ message: 'שגיאה בשרת' });
    }
};

// ── 5. שליפת כל הפרויקטים (/api/admin/projects) ─────────────────────────────
// JOIN עם users כדי לקבל שם הבעלים בנוסף ל-id
exports.getAllProjects = async (req, res) => {
    try {
        const projects = await adminService.getAllProjects();
        res.json(projects);
    } catch (error) {
        logger.error(`שגיאה בשליפת פרויקטים: ${error.message}`);
        res.status(500).json({ message: 'שגיאה בשרת' });
    }
};

// ── 6. הסתרה / הצגה של פרויקט (/api/admin/projects/:projectId/visibility) ────
// is_hidden = 1 → הפרויקט לא יופיע בחיפוש אבל לא נמחק
exports.toggleProjectVisibility = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { isHidden } = req.body;
        await adminService.toggleProjectVisibility(req.user.id, projectId, isHidden);
        res.json({ message: `הפרויקט ${isHidden ? 'הוסתר' : 'הוצג מחדש'}` });
    } catch (error) {
        logger.error(`שגיאה בהסתרת פרויקט: ${error.message}`);
        res.status(500).json({ message: 'שגיאה בשרת' });
    }
};

// ── 7. מחיקת פרויקט (/api/admin/projects/:projectId) ────────────────────────
// מחיקה מלאה מהמסד — שמים כותרת ב-audit log לפני המחיקה
exports.deleteProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const title = await adminService.deleteProject(req.user.id, projectId);
        logger.warn(`👮 אדמין ${req.user.id} מחק פרויקט ${projectId}: ${title}`);
        res.json({ message: 'הפרויקט נמחק' });
    } catch (error) {
        if (error.code === 'PROJECT_NOT_FOUND') return res.status(404).json({ message: 'פרויקט לא נמצא' });
        logger.error(`שגיאה במחיקת פרויקט: ${error.message}`);
        res.status(500).json({ message: 'שגיאה בשרת' });
    }
};

// ── 8. שליפת כל הבקשות (/api/admin/applications) ────────────────────────────
// JOIN כפול: users (למגיש) + projects (לשם הפרויקט)
exports.getAllApplications = async (req, res) => {
    try {
        const apps = await adminService.getAllApplications();
        res.json(apps);
    } catch (error) {
        logger.error(`שגיאה בשליפת בקשות: ${error.message}`);
        res.status(500).json({ message: 'שגיאה בשרת' });
    }
};

// ── 9. פרופיל מלא של משתמש לצפייה (/api/admin/users/:userId/profile) ─────────
// מחזיר הכל: פרטים, כישורים, פרויקטים, בקשות — לתצוגת AdminUserProfile
// 3 שאילתות מקבילות אחרי שליפת המשתמש הראשית
exports.getUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const profile = await adminService.getUserProfile(userId);
        if (!profile) return res.status(404).json({ message: 'משתמש לא נמצא' });
        res.json(profile);
    } catch (error) {
        logger.error(`שגיאה בשליפת פרופיל: ${error.message}`);
        res.status(500).json({ message: 'שגיאה בשרת' });
    }
};

// ── 10. שליפת Audit Log (/api/admin/audit-log) ───────────────────────────────
// מחזיר 100 הפעולות האחרונות — LEFT JOIN כדי לכלול גם פעולות מערכת (admin_id=NULL)
// COALESCE מחזיר 'מערכת' כשאין admin_id (ניסיון כניסה חסום = לא אדם ספציפי)
exports.getAuditLog = async (req, res) => {
    try {
        const logs = await adminService.getAuditLog();
        res.json(logs);
    } catch (error) {
        logger.error(`שגיאה בשליפת audit log: ${error.message}`);
        res.status(500).json({ message: 'שגיאה בשרת' });
    }
};
