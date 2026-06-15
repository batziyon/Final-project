const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const verifyToken = require('../middleware/authMiddleware');

const isAdmin = (req, res, next) => {
    if (req.user?.role === 'admin') return next();
    return res.status(403).json({ message: 'גישה נדחתה: מנהלי מערכת בלבד' });
};

const guard = [verifyToken, isAdmin];

// ── סטטיסטיקות ──────────────────────────────────────────────────────────────
router.get('/stats', ...guard, adminController.getStats);

// ── משתמשים ─────────────────────────────────────────────────────────────────
router.get('/users',                        ...guard, adminController.getAllUsers);
router.get('/users/:userId/profile',        ...guard, adminController.getUserProfile);
router.put('/users/:userId/toggle',         ...guard, adminController.toggleUserStatus);
router.put('/users/:userId/role',           ...guard, adminController.changeUserRole);

// ── פרויקטים ────────────────────────────────────────────────────────────────
router.get('/projects',                              ...guard, adminController.getAllProjects);
router.put('/projects/:projectId/visibility',        ...guard, adminController.toggleProjectVisibility);
router.delete('/projects/:projectId',                ...guard, adminController.deleteProject);

// ── בקשות ────────────────────────────────────────────────────────────────────
router.get('/applications', ...guard, adminController.getAllApplications);

// ── Audit Log ────────────────────────────────────────────────────────────────
router.get('/audit-log', ...guard, adminController.getAuditLog);

module.exports = router;
