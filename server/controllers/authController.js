// ╔══════════════════════════════════════════════════════════════╗
// ║          authController.js — בקר אימות משתמשים              ║
// ║  מטפל בהרשמה, התחברות, צפייה בפרופיל ועדכון פרופיל.        ║
// ║  כל פונקציה כאן מקבלת req (בקשה) ומחזירה res (תשובה).      ║
// ╚══════════════════════════════════════════════════════════════╝

const db = require('../config/db');       // חיבור ל-MySQL דרך connection pool
const bcrypt = require('bcryptjs');       // הצפנת סיסמאות — לא שומרים סיסמה גלויה!
const jwt = require('jsonwebtoken');      // יצירה ואימות של טוקני JWT
const logger = require('../utils/logger'); // לוגים לטרמינל וקובץ
const { deleteOldProfileImage } = require('../middleware/uploadMiddleware'); // מחיקת תמונה ישנה

// ── פונקציית עזר פנימית: כתיבה ל-Audit Log ──────────────────────────────────
// audit log = יומן פעולות מנהל. כאן משתמשים בו לתיעוד אוטומטי של אירועי מערכת.
// admin_id = NULL כשהפעולה היא אוטומטית (לא יזם אדם ספציפי)
const auditLog = async (action, targetId, details = '') => {
    try {
        await db.query(
            'INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details) VALUES (NULL, ?, "user", ?, ?)',
            [action, targetId, details]
        );
    } catch (e) {
        // לוג שגיאה אם הכתיבה נכשלת — לא עוצרים את זרימת הבקשה הראשית
        logger.error(`Audit log error: ${e.message}`);
    }
};

// ── 0. שליפת המשתמש המחובר (/api/auth/me) ────────────────────────────────────
// נקרא בכל טעינת אפליקציה כדי לוודא שהסשן עדיין תקין ולרענן נתונים
// req.user מגיע מ-authMiddleware שכבר אימת את הטוקן לפני שהגענו לכאן
exports.getMe = async (req, res) => {
    try {
        // [[user]] — destructuring כפול: db.query מחזיר [rows, fields]
        // הסוגריים הכפולים שולפים את האלמנט הראשון ישירות (המשתמש הספציפי)
        const [[user]] = await db.query(
            'SELECT id, username, email, role, bio, profile_image, is_active FROM users WHERE id = ?',
            [req.user.id] // id מגיע מהטוקן שאומת ב-middleware
        );
        if (!user) return res.status(404).json({ message: 'משתמש לא נמצא' });

        // שליפת כישורים בשאילתה נפרדת (טבלת many-to-many)
        const [userSkills] = await db.query('SELECT skill_name FROM user_skills WHERE user_id = ?', [user.id]);

        // מחזירים את כל פרטי המשתמש + מערך כישורים בפורמט נקי
        res.json({ ...user, skills: userSkills.map(s => s.skill_name) });
    } catch (error) {
        logger.error(`getMe error: ${error.message}`);
        res.status(500).json({ message: 'שגיאה בשרת' });
    }
};

// ── 1. הרשמת משתמש חדש (/api/auth/register) ──────────────────────────────────
// מקבל: username, email, password, bio, skills (JSON string), תמונת פרופיל (Multer)
// מחזיר: הודעת הצלחה בלבד — המשתמש צריך להתחבר בנפרד
exports.register = async (req, res) => {
    try {
        const { username, email, password, bio, skills } = req.body;
        // role קבוע ל-creator — אין אפשרות לשנות בהרשמה
        const role = 'creator';

        // ולידציה בסיסית של הסיסמה בצד השרת (גם אם הקליינט בדק)
        if (!password || password.trim().length < 6) {
            return res.status(400).json({ message: 'סיסמה היא שדה חובה ועליה להכיל לפחות 6 תווים' });
        }

        // הצפנת הסיסמה — genSalt יוצר "מלח" אקראי, hash מצרף אותו לסיסמה
        // המספר 10 = כמה פעמים לרוץ על האלגוריתם (יותר = בטוח יותר, איטי יותר)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // req.file נוצר על ידי Multer אם המשתמש העלה תמונה
        // אם לא — נשמור שם ברירת מחדל
        const profileImage = req.file ? req.file.filename : 'default_profile.png';

        // הכנסת המשתמש החדש לטבלת users
        const [result] = await db.query(
            'INSERT INTO users (username, email, password, role, bio, profile_image) VALUES (?, ?, ?, ?, ?, ?)',
            [username, email, hashedPassword, role, bio || '', profileImage]
        );

        // insertId = ה-id שנוצר אוטומטית לשורה החדשה
        const userId = result.insertId;

        // טיפול בכישורים — נשמרים בטבלה נפרדת user_skills (many-to-many)
        if (skills) {
            let parsedSkills = [];
            try {
                // skills מגיע כ-JSON string מה-FormData, צריך לפרסר אותו
                parsedSkills = typeof skills === 'string' ? JSON.parse(skills) : skills;
            } catch (e) {
                parsedSkills = []; // אם הפרסור נכשל — מתעלמים מהכישורים
            }

            // ניקוי: מסיר רווחים, כישורים ריקים, ומנרמל כישורי "אחר:"
            parsedSkills = parsedSkills
                .filter(s => typeof s === 'string' && s.trim().length > 0)
                .map(s => s.startsWith('אחר:') ? `אחר:${s.replace('אחר:', '').trim()}` : s)
                .filter(s => s !== 'אחר:'); // מסיר "אחר:" ריק

            if (Array.isArray(parsedSkills) && parsedSkills.length > 0) {
                // VALUES ? עם מערך של מערכים = bulk insert יעיל בשאילתה אחת
                const skillRecords = parsedSkills.map(skill => [userId, skill]);
                await db.query('INSERT INTO user_skills (user_id, skill_name) VALUES ?', [skillRecords]);
            }
        }

        logger.success(`משתמש חדש נרשם בהצלחה: ${username}`);
        // 201 = Created — הסטנדרט ל-HTTP כשיוצרים משאב חדש
        res.status(201).json({ message: 'ההרשמה בוצעה בהצלחה! כעת ניתן להתחבר.' });

    } catch (error) {
        // ER_DUP_ENTRY = MySQL זורק כשיש unique constraint violation (username/email כפול)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'שם המשתמש או האימייל כבר קיימים במערכת' });
        }
        logger.error(`שגיאה בהרשמה: ${error.message}`);
        res.status(500).json({ message: 'שגיאה בשרת במהלך ההרשמה' });
    }
};

// ── 2. צפייה בפרופיל ציבורי לפי שם משתמש (/api/auth/profile/:username) ───────
// פתוח לכל משתמש מחובר — מחזיר bio, כישורים ורשימת פרויקטים
exports.getUserProfile = async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, username, role, bio, profile_image, is_active, created_at FROM users WHERE username = ?',
            [req.params.username] // username מגיע מה-URL: /profile/john
        );
        if (!users.length) return res.status(404).json({ message: 'המשתמש לא נמצא' });
        const u = users[0];

        // שתי שאילתות מקבילות: כישורים + פרויקטים (חוסך זמן לעומת סדרתי)
        const [[userSkills], projects] = await Promise.all([
            db.query('SELECT skill_name FROM user_skills WHERE user_id = ?', [u.id]),
            (async () => {
                try {
                    // שולף פרויקטים שהמשתמש בעלים שלהם או חבר בהם
                    // CASE WHEN = קובע אם "owner" או "member" לכל פרויקט
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
                    return []; // אם שאילתת הפרויקטים נכשלת — מחזיר מערך ריק
                }
            })()
        ]);

        res.json({ ...u, skills: userSkills.map(s => s.skill_name), projects });
    } catch (error) {
        logger.error(`getUserProfile error: ${error.message}`);
        res.status(500).json({ message: 'שגיאה בשרת' });
    }
};

// ── 2b. פרופיל ציבורי של מועמד לפי ID (/api/auth/candidate/:userId) ───────────
// רק בעל פרויקט שהמועמד הגיש אליו בקשה יכול לצפות — בדיקת הרשאה מיוחדת
exports.getCandidateProfile = async (req, res) => {
    try {
        const viewerId    = req.user.id;                    // מי מבקש לצפות
        const candidateId = parseInt(req.params.userId);   // על מי מבקשים

        // בדיקת הרשאה: האם למועמד יש בקשה בפרויקט שהצופה בעל שלו?
        // JOIN בין applications ל-projects — שאילתה אחת בודקת את שניהם
        const [authCheck] = await db.query(
            `SELECT a.id FROM applications a
             JOIN projects p ON p.id = a.project_id
             WHERE a.user_id = ? AND p.owner_id = ? LIMIT 1`,
            [candidateId, viewerId]
        );
        if (!authCheck.length) {
            return res.status(403).json({ message: 'אין הרשאה לצפות בפרופיל זה' });
        }

        const [users] = await db.query(
            'SELECT id, username, role, bio, profile_image, created_at FROM users WHERE id = ?',
            [candidateId]
        );
        if (!users.length) return res.status(404).json({ message: 'המשתמש לא נמצא' });
        const u = users[0];

        // שתי שאילתות מקבילות: כישורים + פרויקטים
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

        res.json({
            ...u,
            skills: userSkills.map(s => s.skill_name),
            projects,
            // active_projects = מספר פרויקטים פעילים — מוצג בכרטיס המועמד
            active_projects: projects.filter(p => p.status === 'active').length,
        });
    } catch (error) {
        logger.error(`getCandidateProfile error: ${error.message}`);
        res.status(500).json({ message: 'שגיאה בשרת' });
    }
};

// ── 3. התחברות (/api/auth/login) ─────────────────────────────────────────────
// מקבל: email, password
// מחזיר: JWT token + אובייקט משתמש מלא לשמירה ב-localStorage של הקליינט
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // שולף את המשתמש לפי אימייל (לא לפי username — אימייל הוא unique)
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
        }

        const user = users[0];

        // בדיקת חסימה — משתמש חסום לא יכול להתחבר גם עם סיסמה נכונה
        if (user.is_active !== 1) {
            // תיעוד ב-audit log: מי ניסה להתחבר ומתי
            const attemptTime = new Date().toLocaleString('he-IL');
            await auditLog('BLOCKED_LOGIN_ATTEMPT', user.id, `ניסיון כניסה בשעה ${attemptTime}`);
            logger.warn(`🚫 ניסיון כניסה של משתמש חסום: ${user.username} (ID: ${user.id})`);
            return res.status(403).json({ message: 'החשבון חסום. לא ניתן להתחבר.' });
        }

        // bcrypt.compare משווה הסיסמה הגולמית עם ה-hash השמור במסד
        // לא צריך "לפענח" — bcrypt מצפין שוב ומשווה
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
        }

        // שליפת כישורים לשמירה ב-state של הקליינט (ל-Profile ו-Dashboard)
        const [userSkills] = await db.query('SELECT skill_name FROM user_skills WHERE user_id = ?', [user.id]);
        const skillsArray = userSkills.map(s => s.skill_name);

        // יצירת JWT — מכיל id, username, role בתוכו (payload)
        // פג תוקף אחרי 24 שעות — המשתמש יצטרך להתחבר מחדש
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET, // המפתח הסודי מה-.env — אף פעם לא ב-code!
            { expiresIn: '24h' }
        );

        logger.success(`משתמש התחבר בהצלחה: ${user.username}`);

        // מחזיר token + כל פרטי המשתמש שהקליינט צריך לשמור ב-localStorage
        res.status(200).json({
            message: 'התחברת בהצלחה!',
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
        });

    } catch (error) {
        logger.error(`שגיאה בהתחברות: ${error.message}`);
        res.status(500).json({ message: 'שגיאה בשרת במהלך ההתחברות' });
    }
};

// ── 4. עדכון פרופיל (/api/auth/update-profile) ───────────────────────────────
// מקבל: bio, currentPassword, newPassword, skills (JSON), תמונה חדשה (Multer)
// חייב אימות — req.user.id נשלח מה-middleware
exports.updateProfile = async (req, res) => {
    try {
        const { currentPassword, newPassword, bio, skills } = req.body;
        const userId = req.user.id; // ה-id מהטוקן — לא ניתן לזייף!

        // אובייקט דינמי שאוסף רק את השדות שצריך לעדכן
        // (לא נעדכן שדות שלא השתנו)
        const updates = {};

        // א. שינוי סיסמה — רק אם המשתמש שלח newPassword
        if (newPassword && newPassword.trim() !== '') {
            if (!currentPassword) {
                return res.status(400).json({ message: 'כדי לשנות סיסמה, חובה להזין את הסיסמה הנוכחית' });
            }

            const [users] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
            if (users.length === 0) {
                return res.status(404).json({ message: 'המשתמש לא נמצא' });
            }

            // אימות הסיסמה הנוכחית לפני עדכון
            const isMatch = await bcrypt.compare(currentPassword, users[0].password);
            if (!isMatch) {
                return res.status(401).json({ message: 'הסיסמה הנוכחית שהקשת אינה נכונה' });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ message: 'הסיסמה החדשה חייבת להיות לפחות 6 תווים' });
            }

            // מצפין ושומר את הסיסמה החדשה
            updates.password = await bcrypt.hash(newPassword, 10);
        }

        // ב. עדכון bio אם נשלח (גם אם ריק — המשתמש יכול למחוק את ה-bio שלו)
        if (bio !== undefined) updates.bio = bio;

        // ג. עדכון תמונת פרופיל — Multer שמר את הקובץ בתיקייה ומסר req.file
        let updatedImageName = null;
        if (req.file) {
            updatedImageName = req.file.filename;
            updates.profile_image = updatedImageName;

            // מחיקת התמונה הישנה מהדיסק (לחיסכון בנפח)
            const [current] = await db.query('SELECT profile_image FROM users WHERE id = ?', [userId]);
            if (current.length) deleteOldProfileImage(current[0].profile_image);
        }

        // ד. עדכון כל השדות בשאילתה אחת דינמית
        // בונה: "bio = ?, profile_image = ?" וכו' לפי מה שנמצא ב-updates
        if (Object.keys(updates).length > 0) {
            const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
            const values = [...Object.values(updates), userId];
            await db.query(`UPDATE users SET ${fields} WHERE id = ?`, values);
        }

        // ה. סנכרון כישורים — מחיקה והכנסה מחדש (הכי פשוט לניהול many-to-many)
        if (skills) {
            let parsedSkills = [];
            try {
                parsedSkills = typeof skills === 'string' ? JSON.parse(skills) : skills;
            } catch (e) {
                parsedSkills = [];
            }

            parsedSkills = parsedSkills
                .filter(s => typeof s === 'string' && s.trim().length > 0)
                .map(s => s.startsWith('אחר:') ? `אחר:${s.replace('אחר:', '').trim()}` : s)
                .filter(s => s !== 'אחר:');

            // מוחק את כל הכישורים הישנים ומכניס חדשים — גישה פשוטה ובטוחה
            await db.query('DELETE FROM user_skills WHERE user_id = ?', [userId]);

            if (Array.isArray(parsedSkills) && parsedSkills.length > 0) {
                const skillRecords = parsedSkills.map(skill => [userId, skill]);
                await db.query('INSERT INTO user_skills (user_id, skill_name) VALUES ?', [skillRecords]);
            }
        }

        logger.success(`פרופיל משתמש ID: ${userId} עודכן בהצלחה.`);

        // מחזיר רק את שם התמונה החדשה (אם הועלתה) — הקליינט יעדכן את ה-state שלו
        res.status(200).json({
            message: 'הפרופיל שלך עודכן בהצלחה במערכת!',
            user: {
                profile_image: updatedImageName
            }
        });

    } catch (error) {
        logger.error(`שגיאה בעדכון הפרופיל: ${error.message}`);
        res.status(500).json({ message: 'שגיאה בשרת במהלך עדכון הפרופיל' });
    }
};
