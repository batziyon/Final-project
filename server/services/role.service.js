const db = require('../config/db');
const { AppError } = require('../middleware/errorMiddleware');

/**
 * RoleService — מנהל תפקידים פתוחים בפרויקט.
 * מאפשר לבעל פרויקט להגדיר תפקידים שהוא מחפש,
 * ולחברי צוות להצטרף לתפקיד פנוי.
 */
const RoleService = {

    /**
     * מוסיף רשימת תפקידים פתוחים לפרויקט.
     * נקרא כשבעל פרויקט מנהל את "דרושים".
     * מנרמל שמות של תפקידים מסוג "other:".
     */
    async addRoles(projectId, roles) {
        if (!roles || roles.length === 0) throw new AppError('לא נבחרו תפקידים', 400);
        const rolesValues = roles.map(role => {
            const name = role.startsWith('other:') ? role.replace('other:', '') : role;
            return [projectId, name, 'open'];
        });
        await db.query('INSERT INTO project_roles (project_id, role_name, status) VALUES ?', [rolesValues]);
    },

    /**
     * מצרף חבר צוות לתפקיד פתוח.
     * משנה סטטוס ל-"taken" ומשייך את user_id לתפקיד.
     * אם התפקיד כבר תפוס — זורק שגיאה.
     */
    async joinRole(roleId, userId) {
        const [result] = await db.query(
            'UPDATE project_roles SET status = "taken", user_id = ? WHERE id = ? AND status = "open"',
            [userId, roleId]
        );
        if (result.affectedRows === 0) throw new AppError('התפקיד כבר תפוס או לא קיים', 400);
    }
};

module.exports = RoleService;
