const db = require('../config/db');

/**
 * שירות הדשבורד.
 * אחראי על שליפת כל הנתונים הסטטיסטיים של המשתמש לדשבורד.
 */
const DashboardService = {
    /**
     * שולף את כל הנתונים לדשבורד של משתמש ספציפי.
     * @param {number} userId - מזהה המשתמש
     * @returns {Promise<Object>} נתוני הדשבורד
     */
    async getStats(userId) {
        // שליפת כל הנתונים הבסיסיים במקביל לביצועים טובים יותר
        const [
            [[myProjectsRow]],
            [[pendingRow]],
            [[unreadRow]],
            [[teamRow]],
            [myProjectsList],
            [notifications]
        ] = await Promise.all([
            db.query('SELECT COUNT(*) as cnt FROM projects WHERE owner_id = ?', [userId]),
            db.query('SELECT COUNT(*) as cnt FROM applications WHERE user_id = ? AND status = "pending"', [userId]),
            db.query('SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND is_read = FALSE', [userId]),
            db.query(
                `SELECT COUNT(DISTINCT pm2.user_id) as cnt FROM project_members pm1
                 JOIN project_members pm2 ON pm1.project_id = pm2.project_id
                 WHERE pm1.user_id = ? AND pm2.user_id != ?`, [userId, userId]
            ),
            db.query(
                `SELECT p.id, p.title, p.category, p.owner_id,
                 (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
                 FROM projects p JOIN project_members pm ON p.id = pm.project_id
                 WHERE pm.user_id = ? ORDER BY p.id DESC LIMIT 6`, [userId]
            ),
            db.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 5', [userId])
        ]);

        const myProjects         = myProjectsRow.cnt;
        const pendingRequests    = pendingRow.cnt;
        const unreadNotifications = unreadRow.cnt;
        const teamMembers        = teamRow.cnt;

        // התאמת פרויקטים לפי כישורי המשתמש
        const [userSkills] = await db.query('SELECT skill_name FROM user_skills WHERE user_id = ?', [userId]);
        const skillNames = userSkills.map(s => s.skill_name.replace(/^אחר:/, ''));

        let openRoles = [];
        if (skillNames.length > 0) {
            const placeholders = skillNames.map(() => '?').join(',');
            const [matched] = await db.query(
                `SELECT DISTINCT pr.role_name, p.title as project_title, p.id as project_id, p.category
                 FROM project_roles pr JOIN projects p ON pr.project_id = p.id
                 WHERE pr.status = 'open' AND p.owner_id != ?
                 AND pr.project_id NOT IN (SELECT project_id FROM project_members WHERE user_id = ?)
                 AND pr.role_name IN (${placeholders}) LIMIT 6`,
                [userId, userId, ...skillNames]
            );
            openRoles = matched;
        }

        // אם אין התאמה לפי כישורים - הצג פרויקטים פתוחים כלליים
        if (openRoles.length === 0) {
            const [general] = await db.query(
                `SELECT DISTINCT pr.role_name, p.title as project_title, p.id as project_id, p.category
                 FROM project_roles pr JOIN projects p ON pr.project_id = p.id
                 WHERE pr.status = 'open' AND p.owner_id != ?
                 AND pr.project_id NOT IN (SELECT project_id FROM project_members WHERE user_id = ?) LIMIT 4`,
                [userId, userId]
            );
            openRoles = general;
        }

        return { myProjects, pendingRequests, unreadNotifications, teamMembers, myProjectsList, notifications, openRoles };
    }
};

/**
 * שירות סטטיסטיקות ציבוריות.
 * מחזיר נתונים כלליים על המערכת (ללא אימות).
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
