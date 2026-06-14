const express = require('express');
const router = express.Router();
const taskCtrl = require('../controllers/task.controller');
const verifyToken = require('../middleware/authMiddleware');

router.get('/:projectId/tasks',         verifyToken, taskCtrl.getTasks);
router.get('/:projectId/tasks/pending', verifyToken, taskCtrl.getPendingTasks);
router.post('/:projectId/tasks',        verifyToken, taskCtrl.createTask);
router.patch('/tasks/:taskId/status',   verifyToken, taskCtrl.updateTaskStatus);
router.post('/tasks/:taskId/approve',   verifyToken, taskCtrl.handleTaskApproval);

module.exports = router;
