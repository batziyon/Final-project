const db = require('../config/db');
const logger = require('../utils/logger');
const auditService = require('./audit.service');

const getStats = async () => {
    const [
        [userResult],
        [projectResult],
        [applicationResult],
        [pendingResult],
        [taskResult],
        [adminResult]
    ] = await Promise.all([
        db.query('SELECT COUNT(*) as cnt FROM users'),
        db.query('SELECT COUNT(*) as cnt FROM projects'),
        db.query('SELECT COUNT(*) as cnt FROM applications'),
        db.query('SELECT COUNT(*) as cnt FROM applications WHERE status = "pending"'),
        db.query('SELECT COUNT(*) as cnt FROM tasks'),
        db.query('SELECT COUNT(*) as cnt FROM users WHERE role = "admin"'),
    ]);
    return {
        users: userResult.cnt,
        projects: projectResult.cnt,
        applications: applicationResult.cnt,
        pendingApplications: pendingResult.cnt,
        tasks: taskResult.cnt,
        admins: adminResult.cnt,
    };
};

const getAllUsers = async () => {
    const [users] = await db.query(
        `SELECT id, username, email, role, is_active, created_at
         FROM users ORDER BY created_at DESC`
    );
    return users;
};

const toggleUserStatus = async (adminId, userId, isActive) => {
    if (parseInt(userId) === adminId) {
        const err = new Error('CANNOT_SELF_LOCK');
        err.code = 'CANNOT_SELF_LOCK';
        throw err;
    }
    await db.query('UPDATE users SET is_active = ? WHERE id = ?', [isActive, userId]);
    await auditService.write(adminId, isActive ? 'UNBLOCK_USER' : 'BLOCK_USER', 'user', userId, `is_active → ${isActive}`);
};

const changeUserRole = async (adminId, userId, role) => {
    const validRoles = ['creator', 'admin'];
    if (!validRoles.includes(role)) {
        const err = new Error('INVALID_ROLE');
        err.code = 'INVALID_ROLE';
        throw err;
    }
    if (parseInt(userId) === adminId) {
        const err = new Error('CANNOT_CHANGE_SELF_ROLE');
        err.code = 'CANNOT_CHANGE_SELF_ROLE';
        throw err;
    }
    const [current] = await db.query('SELECT role FROM users WHERE id = ?', [userId]);
    if (!current.length) {
        const err = new Error('USER_NOT_FOUND');
        err.code = 'USER_NOT_FOUND';
        throw err;
    }
    await db.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
    await auditService.write(adminId, 'CHANGE_ROLE', 'user', userId, `${current[0].role} → ${role}`);
    return { from: current[0].role, to: role };
};

const getAllProjects = async () => {
    const [projects] = await db.query(
        `SELECT p.id, p.title, p.category, p.status, p.is_hidden, p.created_at,
                u.username as owner_name,
                (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
         FROM projects p JOIN users u ON p.owner_id = u.id
         ORDER BY p.created_at DESC`
    );
    return projects;
};

const toggleProjectVisibility = async (adminId, projectId, isHidden) => {
    await db.query('UPDATE projects SET is_hidden = ? WHERE id = ?', [isHidden, projectId]);
    await auditService.write(adminId, isHidden ? 'HIDE_PROJECT' : 'SHOW_PROJECT', 'project', projectId);
};

const deleteProject = async (adminId, projectId) => {
    const [proj] = await db.query('SELECT title FROM projects WHERE id = ?', [projectId]);
    if (!proj.length) {
        const err = new Error('PROJECT_NOT_FOUND');
        err.code = 'PROJECT_NOT_FOUND';
        throw err;
    }
    await db.query('DELETE FROM projects WHERE id = ?', [projectId]);
    await auditService.write(adminId, 'DELETE_PROJECT', 'project', projectId, proj[0].title);
    return proj[0].title;
};

const getAllApplications = async () => {
    const [apps] = await db.query(
        `SELECT a.id, a.status, a.created_at, a.reason,
                u.id as applicant_id, u.username as applicant_name,
                p.title as project_title, p.id as project_id
         FROM applications a
         JOIN users u ON a.user_id = u.id
         JOIN projects p ON a.project_id = p.id
         ORDER BY a.created_at DESC`
    );
    return apps;
};

const getUserProfile = async (userId) => {
    const [[user]] = await db.query(
        `SELECT id, username, email, role, is_active, bio, profile_image, created_at
         FROM users WHERE id = ?`, [userId]
    );
    if (!user) return null;
    const [skills] = await db.query('SELECT skill_name FROM user_skills WHERE user_id = ?', [userId]);
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
    return {
        ...user,
        skills: skills.map(s => s.skill_name),
        projects,
        applications,
    };
};

const getAuditLog = async () => {
    const [logs] = await db.query(
        `SELECT al.*, COALESCE(u.username, 'מערכת') as admin_name
         FROM admin_audit_log al
         LEFT JOIN users u ON al.admin_id = u.id
         ORDER BY al.created_at DESC LIMIT 100`
    );
    return logs;
};

module.exports = {
    getStats,
    getAllUsers,
    toggleUserStatus,
    changeUserRole,
    getAllProjects,
    toggleProjectVisibility,
    deleteProject,
    getAllApplications,
    getUserProfile,
    getAuditLog,
};
