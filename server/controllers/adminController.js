// ╔══════════════════════════════════════════════════════════════╗
// ║         adminController.js — בקר פאנל ניהול מערכת           ║
// ║  כל ה-endpoints כאן מוגנים: חייבים JWT תקין + role=admin.   ║
// ║  הגנה כפולה: authMiddleware + isAdmin middleware ב-routes.   ║
// ╚══════════════════════════════════════════════════════════════╝

const db = require('../config/db');
const logger = require('../utils/logger.js');

// ── פונקציית עזר: כתיבה ל-Audit Log ─────────────────────────────────────────
// כל פעולת מנהל (חסימה, שינוי תפקיד, מחיקה) נרשמת אוטומטית
// adminId = מי ביצע | action = מה עשה | targetType = על מה | targetId = על איזה ID
const audit = async (adminId, action, targetType, targetId, details = '') => {
    try {
        await db.query(
            'INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
            [adminId, action, targetType, targetId, details]
        );
    } catch (e) {
        logger.error(`Audit log error: ${e.message}`);
    }
};

// ── 1. סטטיסטיקות מערכת (/api/admin/stats) ──────────────────────────────────
// מחזיר מספרים לכרטיסיות בדשבורד המנהל (משתמשים, פרויקטים, בקשות...)
// 6 COUNT שאילתות רצות במקביל עם Promise.all — הרבה יותר מהיר מסדרתי
exports.getStats = async (req, res) => {
    try {
        const [
            [[users]], [[projects]], [[applications]], [[pendingApplications]], [[tasks]], [[admins]]
        ] = await Promise.all([
            db.query('SELECT COUNT(*) as cnt FROM users'),                                      // סה"כ משתמשים
            db.query('SELECT COUNT(*) as cnt FROM projects'),                                   // סה"כ פרויקטים
            db.query('SELECT COUNT(*) as cnt FROM applications'),                               // סה"כ בקשות
            db.query('SELECT COUNT(*) as cnt FROM applications WHERE status = "pending"'),      // בקשות ממתינות
            db.query('SELECT COUNT(*) as cnt FROM tasks'),                                      // סה"כ משימות
            db.query('SELECT COUNT(*) as cnt FROM users WHERE role = "admin"'),                 // מנהלי מערכת
        ]);
        // מחזיר אובייקט עם כל המספרים — הקליינט ממפה אותם לכרטיסיות
        res.json({
            users: users.cnt,
            projects: projects.cnt,
            applications: applications.cnt,
            pendingApplications: pendingApplications.cnt,
            tasks: tasks.cnt,
            admins: admins.cnt,
        });
    } catch (error) {
        logger.error(`שגיאה בסטטיסטיקות: ${error.message}`);
        res.status(500).json({ message: 'שגיאה בשרת' });
    }
};

// ── 2. שליפת כל המשתמשים (/api/admin/users) ──────────────────────────────────
// מחזיר רשימה לתצוגת הטבלה בדשבורד — ממוין מהחדש לישן
// לא מחזיר סיסמאות! SELECT מגדיר בדיוק אילו עמודות
exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT id, username, email, role, is_active, created_at
             FROM users ORDER BY created_at DESC`
        );
        res.status(200).json(users);
    } catch (error) {
        logger.error(`שגיאה בשליפת משתמשים: ${error.message}`);
        res.status(500).json({ message: 'שגיאה בשרת בשליפת המשתמשים' });
    }
};

// ── 3. חסימה / שחרור משתמש (/api/admin/users/:userId/toggle) ─────────────────
// isActive: 1 = פעיל, 0 = חסום
// מנהל לא יכול לחסום את עצמו — בדיקת בטיחות
exports.toggleUserStatus = async (req, res) => {
    try {
        const { userId } = req.params; // ה-ID מה-URL
        const { isActive } = req.body;  // 0 או 1 מהקליינט

        // מניעת self-lock — מנהל לא יכול לנעול את עצמו
        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({ message: 'לא ניתן לחסום את עצמך' });
        }

        await db.query('UPDATE users SET is_active = ? WHERE id = ?', [isActive, userId]);

        // תיעוד הפעולה: BLOCK_USER או UNBLOCK_USER עם הערה על הסטטוס החדש
        await audit(req.user.id, isActive ? 'UNBLOCK_USER' : 'BLOCK_USER', 'user', userId,
            `is_active → ${isActive}`);

        logger.warn(`👮 אדמין ${req.user.id} שינה סטטוס משתמש ${userId} ל-${isActive}`);
        res.status(200).json({ message: `סטטוס המשתמש עודכן` });
    } catch (error) {
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

        // ולידציה: רק תפקידים מוכרים
        const validRoles = ['creator', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: 'תפקיד לא תקין' });
        }
        // מניעת self-role-change
        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({ message: 'לא ניתן לשנות את תפקידך' });
        }

        const [current] = await db.query('SELECT role FROM users WHERE id = ?', [userId]);
        if (!current.length) return res.status(404).json({ message: 'משתמש לא נמצא' });

        await db.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);

        // תיעוד: "creator → admin" לדוגמה
        await audit(req.user.id, 'CHANGE_ROLE', 'user', userId,
            `${current[0].role} → ${role}`);

        logger.warn(`👮 אדמין ${req.user.id} שינה תפקיד משתמש ${userId}: ${current[0].role} → ${role}`);
        res.json({ message: 'התפקיד עודכן בהצלחה' });
    } catch (error) {
        logger.error(`שגיאה בשינוי תפקיד: ${error.message}`);
        res.status(500).json({ message: 'שגיאה בשרת' });
    }
};

// ── 5. שליפת כל הפרויקטים (/api/admin/projects) ─────────────────────────────
// JOIN עם users כדי לקבל שם הבעלים בנוסף ל-id
exports.getAllProjects = async (req, res) => {
    try {
        const [projects] = await db.query(
            `SELECT p.id, p.title, p.category, p.status, p.is_hidden, p.created_at,
                    u.username as owner_name,
                    (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
             FROM projects p JOIN users u ON p.owner_id = u.id
             ORDER BY p.created_at DESC`
        );
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
        const { isHidden } = req.body; // true/false מהקליינט

        await db.query('UPDATE projects SET is_hidden = ? WHERE id = ?', [isHidden, projectId]);
        await audit(req.user.id, isHidden ? 'HIDE_PROJECT' : 'SHOW_PROJECT', 'project', projectId);

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
        const [proj] = await db.query('SELECT title FROM projects WHERE id = ?', [projectId]);
        if (!proj.length) return res.status(404).json({ message: 'פרויקט לא נמצא' });

        await db.query('DELETE FROM projects WHERE id = ?', [projectId]);
        // תיעוד כולל את שם הפרויקט שנמחק
        await audit(req.user.id, 'DELETE_PROJECT', 'project', projectId, proj[0].title);

        logger.warn(`👮 אדמין ${req.user.id} מחק פרויקט ${projectId}: ${proj[0].title}`);
        res.json({ message: 'הפרויקט נמחק' });
    } catch (error) {
        logger.error(`שגיאה במחיקת פרויקט: ${error.message}`);
        res.status(500).json({ message: 'שגיאה בשרת' });
    }
};

// ── 8. שליפת כל הבקשות (/api/admin/applications) ────────────────────────────
// JOIN כפול: users (למגיש) + projects (לשם הפרויקט)
exports.getAllApplications = async (req, res) => {
    try {
        const [apps] = await db.query(
            `SELECT a.id, a.status, a.created_at, a.reason,
                    u.id as applicant_id, u.username as applicant_name,
                    p.title as project_title, p.id as project_id
             FROM applications a
             JOIN users u ON a.user_id = u.id
             JOIN projects p ON a.project_id = p.id
             ORDER BY a.created_at DESC`
        );
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

        // [[user]] — שליפה ישירה של אובייקט בודד (לא מערך)
        const [[user]] = await db.query(
            `SELECT id, username, email, role, is_active, bio, profile_image, created_at
             FROM users WHERE id = ?`, [userId]
        );
        if (!user) return res.status(404).json({ message: 'משתמש לא נמצא' });

        // 3 שאילתות מקבילות: כישורים, פרויקטים, בקשות
        const [skills] = await db.query(
            'SELECT skill_name FROM user_skills WHERE user_id = ?', [userId]
        );
        const [projects] = await db.query(
            `SELECT p.id, p.title, p.category, p.status,
                    CASE WHEN p.owner_id = ? THEN 'owner' ELSE 'member' END as relation
             FROM projects p
             LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
             WHERE p.owner_id = ? OR pm.user_id = ?
             ORDER BY p.created_at DESC`, [userId, userId, userId, userId]
        );
        const [applications] = await db.query(
            `SELECT a.id, a.status, a.reason, a.created_at, p.title as project_title
             FROM applications a JOIN projects p ON a.project_id = p.id
             WHERE a.user_id = ? ORDER BY a.created_at DESC`, [userId]
        );

        res.json({
            ...user,
            skills: skills.map(s => s.skill_name),
            projects,
            applications,
        });
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
        const [logs] = await db.query(
            `SELECT al.*, COALESCE(u.username, 'מערכת') as admin_name
             FROM admin_audit_log al
             LEFT JOIN users u ON al.admin_id = u.id
             ORDER BY al.created_at DESC LIMIT 100`
        );
        res.json(logs);
    } catch (error) {
        logger.error(`שגיאה בשליפת audit log: ${error.message}`);
        res.status(500).json({ message: 'שגיאה בשרת' });
    }
};
