const RoleService = require('../services/role.service');
const { asyncHandler } = require('../middleware/errorMiddleware');

exports.addRole = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { roleName, selectedRoles } = req.body;
    const roles = selectedRoles || (roleName ? [roleName] : []);
    await RoleService.addRoles(projectId, roles);
    res.json({ message: 'התפקידים נוספו בהצלחה' });
});

exports.joinRole = asyncHandler(async (req, res) => {
    await RoleService.joinRole(req.body.roleId, req.user.id);
    res.json({ message: 'הצטרפת בהצלחה לתפקיד!' });
});
