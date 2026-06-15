const db = require('../config/db');
const { AppError } = require('../middleware/errorMiddleware');

/**
 * ProjectService — אחראי על כל הלוגיקה של פרויקטים במסד הנתונים.
 * כל פונקציה מתקשרת ישירות עם MySQL דרך connection pool.
 */
const ProjectService = {

    /**
     * יוצר פרויקט חדש.
     * בנוסף ליצירת השורה בטבלת projects —
     * מוסיף את הבעלים כ-member, ויוצר תפקיד "מנהל פרויקט" בשבילו.
     * אם הועברו תפקידים מבוקשים (seeking) — מוסיף אותם כ-open roles.
     */
    async create({ title, description, category, maturityLevel, remoteOrPhysical, paymentStatus, isStartup, isOpenSource, seeking, owner_id, media_url }) {
        if (!title) throw new AppError('שם הפרויקט הוא שדה חובה', 400);

        const [result] = await db.query(
            `INSERT INTO projects (title, description, category, owner_id, media_url, maturity_level, remote_or_physical, payment_status, is_startup, is_open_source)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, description, category, owner_id, media_url, maturityLevel, remoteOrPhysical, paymentStatus, !!isStartup, !!isOpenSource]
        );
        const projectId = result.insertId;

        // הוסף את הבעלים כחבר פרויקט
        await db.query('INSERT INTO project_members (project_id, user_id) VALUES (?, ?)', [projectId, owner_id]);

        // צור תפקיד "מנהל פרויקט" ושייך לבעלים
        await db.query(
            'INSERT INTO project_roles (project_id, role_name, status, user_id) VALUES (?, ?, ?, ?)',
            [projectId, 'מנהל פרויקט', 'taken', owner_id]
        );

        // הוסף תפקידים פתוחים שהבעלים מחפש
        let seekingArr = typeof seeking === 'string' ? JSON.parse(seeking || '[]') : (seeking || []);
        if (seekingArr.length > 0) {
            const rolesValues = seekingArr.map(role => {
                const name = role.startsWith('other:') ? role.replace('other:', '') : role;
                return [projectId, name, 'open'];
            });
            await db.query('INSERT INTO project_roles (project_id, role_name, status) VALUES ?', [rolesValues]);
        }

        return projectId;
    },

    /**
     * שולף את כל הפרויקטים עם פילטרים דינמיים.
     * תומך ב:
     *   view=my_created  — רק פרויקטים שהמשתמש יצר
     *   view=my_joined   — רק פרויקטים שהמשתמש חבר בהם
     *   category, remote_or_physical, payment_status, maturity_level — פילטר לפי שדה
     *   is_startup, is_open_source — פילטר boolean
     * מסנן אוטומטית פרויקטים מוסתרים (is_hidden).
     */
    async getAll(filters, userId) {
        const { view, category, remote_or_physical, payment_status, is_startup, is_open_source, maturity_level } = filters;
        let sql = `SELECT p.*, u.username as owner_name,
            (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
            (SELECT GROUP_CONCAT(role_name) FROM project_roles WHERE project_id = p.id AND status = 'open') as open_roles
            FROM projects p JOIN users u ON p.owner_id = u.id`;

        const params = [];
        // תמיד מסנן פרויקטים שהוסתרו על ידי מנהל
        const conditions = ['(p.is_hidden = 0 OR p.is_hidden IS NULL)'];

        if (view === 'my_created') {
            conditions.push('p.owner_id = ?');
            params.push(userId);
        } else if (view === 'my_joined') {
            sql += ` JOIN project_members pm ON p.id = pm.project_id`;
            conditions.push('pm.user_id = ?');
            params.push(userId);
        }
        if (category) { conditions.push('p.category = ?'); params.push(category); }
        if (remote_or_physical) { conditions.push('p.remote_or_physical = ?'); params.push(remote_or_physical); }
        if (payment_status) { conditions.push('p.payment_status = ?'); params.push(payment_status); }
        if (maturity_level) { conditions.push('p.maturity_level = ?'); params.push(maturity_level); }
        if (is_startup === 'true') conditions.push('p.is_startup = 1');
        if (is_open_source === 'true') conditions.push('p.is_open_source = 1');

        sql += ' WHERE ' + conditions.join(' AND ');
        sql += ' ORDER BY p.id DESC';

        const [projects] = await db.query(sql, params);
        return projects;
    },

    /**
     * שולף פרויקט בודד לפי ID — כולל תפקידים, בקשות הצטרפות, וחברי צוות.
     * שלוש השאילתות הנוספות רצות במקביל (Promise.all) לביצועים טובים.
     */
    async getById(projectId) {
        const [projects] = await db.query(
            'SELECT p.*, u.username as owner_name FROM projects p JOIN users u ON p.owner_id = u.id WHERE p.id = ?',
            [projectId]
        );
        if (!projects.length) throw new AppError('פרויקט לא נמצא', 404);

        // שלוש שאילתות במקביל — תפקידים, בקשות, חברים
        const [[roles], [applications], [members]] = await Promise.all([
            db.query('SELECT * FROM project_roles WHERE project_id = ?', [projectId]),
            db.query(
                'SELECT a.*, u.username as user_name FROM applications a JOIN users u ON a.user_id = u.id WHERE a.project_id = ?',
                [projectId]
            ),
            db.query(
                'SELECT u.id, u.username, u.email, u.profile_image FROM project_members pm JOIN users u ON pm.user_id = u.id WHERE pm.project_id = ?',
                [projectId]
            )
        ]);

        return { ...projects[0], roles, applications, members };
    },

    /**
     * שולף רשימת חברי הצוות של פרויקט (ID, שם, תמונה).
     * משמש טאב "צוות" בדף הפרויקט.
     */
    async getMembers(projectId) {
        const [members] = await db.query(
            'SELECT u.id, u.username, u.profile_image FROM users u JOIN project_members pm ON u.id = pm.user_id WHERE pm.project_id = ?',
            [projectId]
        );
        return members;
    }
};

module.exports = ProjectService;
