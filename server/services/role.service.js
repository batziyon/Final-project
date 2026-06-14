const db = require('../config/db');
const { AppError } = require('../middleware/errorMiddleware');

const RoleService = {
    async addRoles(projectId, roles) {
        if (!roles || roles.length === 0) throw new AppError('לא נבחרו תפקידים', 400);
        const rolesValues = roles.map(role => {
            const name = role.startsWith('other:') ? role.replace('other:', '') : role;
            return [projectId, name, 'open'];
        });
        await db.query('INSERT INTO project_roles (project_id, role_name, status) VALUES ?', [rolesValues]);
    },

    async joinRole(roleId, userId) {
        const [result] = await db.query(
            'UPDATE project_roles SET status = "taken", user_id = ? WHERE id = ? AND status = "open"',
            [userId, roleId]
        );
        if (result.affectedRows === 0) throw new AppError('התפקיד כבר תפוס או לא קיים', 400);
    }
};

module.exports = RoleService;
