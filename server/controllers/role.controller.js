// ╔══════════════════════════════════════════════════════════╗
// ║   role.controller.js — בקר תפקידים פתוחים               ║
// ╚══════════════════════════════════════════════════════════╝

const RoleService = require('../services/role.service');
const { asyncHandler } = require('../middleware/errorMiddleware');

// POST /api/projects/:projectId/add-role — הוספת תפקידים פתוחים לפרויקט
// req.body: { selectedRoles: ['React', 'UI/UX'] } או { roleName: 'Python' }
// selectedRoles מנצח אם קיים — תמיכה בשני פורמטים מהקליינט
exports.addRole = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { roleName, selectedRoles } = req.body;
    const roles = selectedRoles || (roleName ? [roleName] : []);
    await RoleService.addRoles(projectId, roles);
    res.json({ message: 'התפקידים נוספו בהצלחה' });
});

// POST /api/projects/join-role — הצטרפות לתפקיד פתוח
// req.body: { roleId } — המשתמש לוחץ "הצטרף" על תפקיד ספציפי
exports.joinRole = asyncHandler(async (req, res) => {
    await RoleService.joinRole(req.body.roleId, req.user.id);
    res.json({ message: 'הצטרפת בהצלחה לתפקיד!' });
});
