const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { deleteOldProfileImage } = require('../middleware/uploadMiddleware');

const auditLog = async (action, targetId, details = '') => {
    try {
        await db.query(
            'INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details) VALUES (NULL, ?, "user", ?, ?)',
            [action, targetId, details]
        );
    } catch (e) {
        logger.error(`Audit log error: ${e.message}`);
    }
};

const getMe = async (userId) => {
    const [[user]] = await db.query(
        'SELECT id, username, email, role, bio, profile_image, is_active FROM users WHERE id = ?',
        [userId]
    );
    if (!user) return null;
    const [userSkills] = await db.query('SELECT skill_name FROM user_skills WHERE user_id = ?', [user.id]);
    return { ...user, skills: userSkills.map(s => s.skill_name) };
};

const register = async ({ username, email, password, bio, skills, file }) => {
    const role = 'creator';
    if (!password || password.trim().length < 6) {
        const err = new Error('Invalid password');
        err.code = 'INVALID_PASSWORD';
        throw err;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const profileImage = file ? file.filename : 'default_profile.png';

    const [result] = await db.query(
        'INSERT INTO users (username, email, password, role, bio, profile_image) VALUES (?, ?, ?, ?, ?, ?)',
        [username, email, hashedPassword, role, bio || '', profileImage]
    );

    const userId = result.insertId;

    if (skills) {
        let parsedSkills = [];
        try { parsedSkills = typeof skills === 'string' ? JSON.parse(skills) : skills; } catch (e) { parsedSkills = []; }
        parsedSkills = parsedSkills
            .filter(s => typeof s === 'string' && s.trim().length > 0)
            .map(s => s.startsWith('אחר:') ? `אחר:${s.replace('אחר:', '').trim()}` : s)
            .filter(s => s !== 'אחר:');
        if (Array.isArray(parsedSkills) && parsedSkills.length > 0) {
            const skillRecords = parsedSkills.map(skill => [userId, skill]);
            await db.query('INSERT INTO user_skills (user_id, skill_name) VALUES ?', [skillRecords]);
        }
    }

    logger.success(`משתמש חדש נרשם בהצלחה: ${username}`);
    return userId;
};

const getUserProfile = async (username) => {
    const [users] = await db.query(
        'SELECT id, username, role, bio, profile_image, is_active, created_at FROM users WHERE username = ?',
        [username]
    );
    if (!users.length) return null;
    const u = users[0];
    const [[userSkills], projects] = await Promise.all([
        db.query('SELECT skill_name FROM user_skills WHERE user_id = ?', [u.id]),
        (async () => {
            try {
                const [rows] = await db.query(
                    `SELECT p.id, p.title, p.category, p.status,
                            (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) + 1 as member_count,
                            CASE WHEN p.owner_id = ? THEN 'owner' ELSE 'member' END as relation
                     FROM projects p
                     LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
                     WHERE (p.owner_id = ? OR pm.user_id = ?) AND p.is_hidden = 0
                     ORDER BY p.created_at DESC`,
                    [u.id, u.id, u.id, u.id]
                );
                return rows;
            } catch (e) {
                logger.warn(`getUserProfile projects query failed: ${e.message}`);
                return [];
            }
        })()
    ]);
    return { ...u, skills: userSkills.map(s => s.skill_name), projects };
};

const getCandidateProfile = async (viewerId, candidateId) => {
    const [authCheck] = await db.query(
        `SELECT a.id FROM applications a
         JOIN projects p ON p.id = a.project_id
         WHERE a.user_id = ? AND p.owner_id = ? LIMIT 1`,
        [candidateId, viewerId]
    );
    if (!authCheck.length) return { unauthorized: true };

    const [users] = await db.query(
        'SELECT id, username, role, bio, profile_image, created_at FROM users WHERE id = ?',
        [candidateId]
    );
    if (!users.length) return null;
    const u = users[0];

    const [[userSkills], [projects]] = await Promise.all([
        db.query('SELECT skill_name FROM user_skills WHERE user_id = ?', [u.id]),
        db.query(
            `SELECT p.id, p.title, p.category, p.status,
                    (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) + 1 as member_count,
                    CASE WHEN p.owner_id = ? THEN 'owner' ELSE 'member' END as relation
             FROM projects p
             LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
             WHERE (p.owner_id = ? OR pm.user_id = ?) AND p.is_hidden = 0
             ORDER BY p.created_at DESC`,
            [u.id, u.id, u.id, u.id]
        )
    ]);

    return {
        ...u,
        skills: userSkills.map(s => s.skill_name),
        projects,
        active_projects: projects.filter(p => p.status === 'active').length
    };
};

const login = async ({ email, password }) => {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
        const err = new Error('Invalid credentials');
        err.code = 'INVALID_CREDENTIALS';
        throw err;
    }
    const user = users[0];
    if (user.is_active !== 1) {
        const attemptTime = new Date().toLocaleString('he-IL');
        await auditLog('BLOCKED_LOGIN_ATTEMPT', user.id, `ניסיון כניסה בשעה ${attemptTime}`);
        const err = new Error('BLOCKED');
        err.code = 'BLOCKED';
        throw err;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        const err = new Error('Invalid credentials');
        err.code = 'INVALID_CREDENTIALS';
        throw err;
    }
    const [userSkills] = await db.query('SELECT skill_name FROM user_skills WHERE user_id = ?', [user.id]);
    const skillsArray = userSkills.map(s => s.skill_name);
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
    logger.success(`משתמש התחבר בהצלחה: ${user.username}`);
    return {
        token,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            bio: user.bio,
            profile_image: user.profile_image,
            is_active: user.is_active,
            skills: skillsArray
        }
    };
};

const updateProfile = async ({ userId, currentPassword, newPassword, bio, skills, file }) => {
    const updates = {};
    if (newPassword && newPassword.trim() !== '') {
        if (!currentPassword) {
            const err = new Error('MISSING_CURRENT_PASSWORD');
            err.code = 'MISSING_CURRENT_PASSWORD';
            throw err;
        }
        const [users] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            const err = new Error('USER_NOT_FOUND');
            err.code = 'USER_NOT_FOUND';
            throw err;
        }
        const isMatch = await bcrypt.compare(currentPassword, users[0].password);
        if (!isMatch) {
            const err = new Error('INVALID_CURRENT_PASSWORD');
            err.code = 'INVALID_CURRENT_PASSWORD';
            throw err;
        }
        if (newPassword.length < 6) {
            const err = new Error('NEW_PASSWORD_TOO_SHORT');
            err.code = 'NEW_PASSWORD_TOO_SHORT';
            throw err;
        }
        updates.password = await bcrypt.hash(newPassword, 10);
    }

    if (bio !== undefined) updates.bio = bio;

    let updatedImageName = null;
    if (file) {
        updatedImageName = file.filename;
        updates.profile_image = updatedImageName;
        const [current] = await db.query('SELECT profile_image FROM users WHERE id = ?', [userId]);
        if (current.length) deleteOldProfileImage(current[0].profile_image);
    }

    if (Object.keys(updates).length > 0) {
        const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        const values = [...Object.values(updates), userId];
        await db.query(`UPDATE users SET ${fields} WHERE id = ?`, values);
    }

    if (skills) {
        let parsedSkills = [];
        try { parsedSkills = typeof skills === 'string' ? JSON.parse(skills) : skills; } catch (e) { parsedSkills = []; }
        parsedSkills = parsedSkills
            .filter(s => typeof s === 'string' && s.trim().length > 0)
            .map(s => s.startsWith('אחר:') ? `אחר:${s.replace('אחר:', '').trim()}` : s)
            .filter(s => s !== 'אחר:');
        await db.query('DELETE FROM user_skills WHERE user_id = ?', [userId]);
        if (Array.isArray(parsedSkills) && parsedSkills.length > 0) {
            const skillRecords = parsedSkills.map(skill => [userId, skill]);
            await db.query('INSERT INTO user_skills (user_id, skill_name) VALUES ?', [skillRecords]);
        }
    }

    logger.success(`פרופיל משתמש ID: ${userId} עודכן בהצלחה.`);
    return { profile_image: updatedImageName };
};

module.exports = {
    getMe,
    register,
    getUserProfile,
    getCandidateProfile,
    login,
    updateProfile,
};
