const db = require('../config/db');

/**
 * DashboardService — מכין את כל הנתונים הסטטיסטיים לדשבורד האישי.
 * 6 שאילתות ראשיות רצות במקביל עם Promise.all לביצועים מיטביים.
 * בנוסף, מתאים פרויקטים מומלצים לפי כישורי המשתמש.
 */
const DashboardService = {
    async getStats(userId) {
        // שלב א: 6 שאילתות במקביל — ספירות + רשימות
        const [
            [[myProjectsRow]],
            [[pendingRow]],
            [[unreadRow]],
            [[teamRow]],
            [myProjectsList],
            [notifications]
        ] = await Promise.all([
            // כמה פרויקטים המשתמש יצר
            db.query('SELECT COUNT(*) as cnt FROM projects WHERE owner_id = ?', [userId]),
            // כמה בקשות הצטרפות שלו ממתינות לאישור
            db.query('SELECT COUNT(*) as cnt FROM applications WHERE user_id = ? AND status = "pending"', [userId]),
            // כמה התראות לא נקראו
            db.query('SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND is_read = FALSE', [userId]),
            // כמה חברי צוות פעילים בפרויקטים המשותפים
            db.query(
                `SELECT COUNT(DISTINCT pm2.user_id) as cnt FROM project_members pm1
                 JOIN project_members pm2 ON pm1.project_id = pm2.project_id
                 WHERE pm1.user_id = ? AND pm2.user_id != ?`, [userId, userId]
            ),
            // רשימת הפרויקטים של המשתמש (עד 6)
            db.query(
                `SELECT p.id, p.title, p.category, p.owner_id,
                 (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
                 FROM projects p JOIN project_members pm ON p.id = pm.project_id
                 WHERE pm.user_id = ? ORDER BY p.id DESC LIMIT 6`, [userId]
            ),
            // 5 התראות אחרונות
            db.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 5', [userId])
        ]);

        const myProjects          = myProjectsRow.cnt;
        const pendingRequests     = pendingRow.cnt;
        const unreadNotifications = unreadRow.cnt;
        const teamMembers         = teamRow.cnt;

        // שלב ב: שליפת כישורי המשתמש להתאמת פרויקטים מומלצים
        const [userSkills] = await db.query('SELECT skill_name FROM user_skills WHERE user_id = ?', [userId]);
        const skillNames = userSkills.map(s => s.skill_name.replace(/^אחר:/, ''));

        let openRoles = [];

        // התאמה לפי כישורים — LEFT JOIN יעיל מ-NOT IN subquery
        if (skillNames.length > 0) {
            const placeholders = skillNames.map(() => '?').join(',');
            const [matched] = await db.query(
                `SELECT DISTINCT pr.role_name, p.title as project_title, p.id as project_id, p.category
                 FROM project_roles pr
                 JOIN projects p ON pr.project_id = p.id
                 LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
                 WHERE pr.status = 'open'
                   AND p.owner_id != ?
                   AND pm.user_id IS NULL
                   AND pr.role_name IN (${placeholders})
                 LIMIT 6`,
                [userId, userId, ...skillNames]
            );
            openRoles = matched;
        }

        // אם אין התאמה לפי כישורים — הצג תפקידים פתוחים כלליים
        if (openRoles.length === 0) {
            const [general] = await db.query(
                `SELECT DISTINCT pr.role_name, p.title as project_title, p.id as project_id, p.category
                 FROM project_roles pr
                 JOIN projects p ON pr.project_id = p.id
                 LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
                 WHERE pr.status = 'open'
                   AND p.owner_id != ?
                   AND pm.user_id IS NULL
                 LIMIT 4`,
                [userId, userId]
            );
            openRoles = general;
        }

        return { myProjects, pendingRequests, unreadNotifications, teamMembers, myProjectsList, notifications, openRoles };
    }
};

/**
 * StatsService — סטטיסטיקות ציבוריות לדף הנחיתה.
 * אינו דורש אימות — מחזיר מספרי משתמשים, פרויקטים וצוותות.
 */
const StatsService = {
    async getPublicStats() {
        const [[[usersRow]], [[projectsRow]], [[teamRow]]] = await Promise.all([
            db.query('SELECT COUNT(*) as cnt FROM users'),
            db.query('SELECT COUNT(*) as cnt FROM projects'),
            db.query('SELECT COUNT(DISTINCT user_id) as cnt FROM project_members')
        ]);
        return { users: usersRow.cnt, projects: projectsRow.cnt, teamMembers: teamRow.cnt };
    }
};

module.exports = { DashboardService, StatsService };
