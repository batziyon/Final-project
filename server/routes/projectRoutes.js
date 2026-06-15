const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const { uploadProjectFile } = require('../middleware/uploadMiddleware');

const projectCtrl     = require('../controllers/project.controller');
const applicationCtrl = require('../controllers/application.controller');
const roleCtrl        = require('../controllers/role.controller');
const notifCtrl       = require('../controllers/notification.controller');
const fileCtrl        = require('../controllers/file.controller');
const dashboardCtrl   = require('../controllers/dashboard.controller');

// ── ציבורי ──────────────────────────────────────
router.get('/stats', dashboardCtrl.getStats);

// ── התראות (חייב להיות לפני /:id) ───────────────────────────────────────
router.get('/notifications',        verifyToken, notifCtrl.getNotifications);
router.post('/notifications/clear', verifyToken, notifCtrl.clearNotifications);

// ── פרויקטים ────────────────────────────────────
router.post('/create', verifyToken, uploadProjectFile.single('projectMedia'), projectCtrl.createProject);
router.get('/',        verifyToken, projectCtrl.getAllProjects);
router.get('/dashboard-stats', verifyToken, dashboardCtrl.getDashboardStats);
router.get('/:id',     verifyToken, projectCtrl.getProjectById);
router.get('/:projectId/members', verifyToken, projectCtrl.getProjectMembers);

// ── בקשות הצטרפות ────────────────────────────────
router.post('/apply',              verifyToken, applicationCtrl.applyToProject);
router.post('/handle-application', verifyToken, applicationCtrl.handleApplication);
router.get('/:id/applications',    verifyToken, applicationCtrl.getProjectApplications);

// ── תפקידים ──────────────────────────────────────
router.post('/join-role',            verifyToken, roleCtrl.joinRole);
router.post('/:projectId/add-role',  verifyToken, roleCtrl.addRole);

// ── קבצים ────────────────────────────────────────
router.get('/:projectId/files',        verifyToken, fileCtrl.getProjectFiles);
router.post('/:projectId/upload-file', verifyToken, uploadProjectFile.single('file'), fileCtrl.uploadProjectFile);

module.exports = router;
