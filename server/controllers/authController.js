// ╔══════════════════════════════════════════════════════════════╗
// ║          authController.js — בקר אימות משתמשים              ║
// ║  מטפל בהרשמה, התחברות, צפייה בפרופיל ועדכון פרופיל.        ║
// ║  כל פונקציה כאן מקבלת req (בקשה) ומחזירה res (תשובה).      ║
// ╚══════════════════════════════════════════════════════════════╝

const logger = require('../utils/logger');
const authService = require('../services/auth.service');

// ── פונקציית עזר פנימית: כתיבה ל-Audit Log ──────────────────────────────────
// audit log = יומן פעולות מנהל. כאן משתמשים בו לתיעוד אוטומטי של אירועי מערכת.
// admin_id = NULL כשהפעולה היא אוטומטית (לא יזם אדם ספציפי)
// NOTE: auditLog moved to service layer to keep controller thin

// ── 0. שליפת המשתמש המחובר (/api/auth/me) ────────────────────────────────────
// נקרא בכל טעינת אפליקציה כדי לוודא שהסשן עדיין תקין ולרענן נתונים
// req.user מגיע מ-authMiddleware שכבר אימת את הטוקן לפני שהגענו לכאן
exports.getMe = async (req, res) => {
    try {
        const user = await authService.getMe(req.user.id);
        if (!user) return res.status(404).json({ message: 'משתמש לא נמצא' });
        res.json(user);
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
        const userId = await authService.register({ ...req.body, file: req.file });
        res.status(201).json({ message: 'ההרשמה בוצעה בהצלחה! כעת ניתן להתחבר.', userId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'שם המשתמש או האימייל כבר קיימים במערכת' });
        }
        if (error.code === 'INVALID_PASSWORD') return res.status(400).json({ message: 'סיסמה לא תקינה' });
        logger.error(`שגיאה בהרשמה: ${error.message}`);
        res.status(500).json({ message: 'שגיאה בשרת במהלך ההרשמה' });
    }
};

// ── 2. צפייה בפרופיל ציבורי לפי שם משתמש (/api/auth/profile/:username) ───────
// פתוח לכל משתמש מחובר — מחזיר bio, כישורים ורשימת פרויקטים
exports.getUserProfile = async (req, res) => {
    try {
        const profile = await authService.getUserProfile(req.params.username);
        if (!profile) return res.status(404).json({ message: 'המשתמש לא נמצא' });
        res.json(profile);
    } catch (error) {
        logger.error(`getUserProfile error: ${error.message}`);
        res.status(500).json({ message: 'שגיאה בשרת' });
    }
};

// ── 2b. פרופיל ציבורי של מועמד לפי ID (/api/auth/candidate/:userId) ───────────
// רק בעל פרויקט שהמועמד הגיש אליו בקשה יכול לצפות — בדיקת הרשאה מיוחדת
exports.getCandidateProfile = async (req, res) => {
    try {
        const viewerId = req.user.id;
        const candidateId = parseInt(req.params.userId);
        const profile = await authService.getCandidateProfile(viewerId, candidateId);
        if (profile && profile.unauthorized) return res.status(403).json({ message: 'אין הרשאה לצפות בפרופיל זה' });
        if (!profile) return res.status(404).json({ message: 'המשתמש לא נמצא' });
        res.json(profile);
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
        const result = await authService.login({ email, password });
        res.status(200).json({ message: 'התחברת בהצלחה!', token: result.token, user: result.user });
    } catch (error) {
        if (error.code === 'BLOCKED') return res.status(403).json({ message: 'החשבון חסום. לא ניתן להתחבר.' });
        if (error.code === 'INVALID_CREDENTIALS') return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
        logger.error(`שגיאה בהתחברות: ${error.message}`);
        res.status(500).json({ message: 'שגיאה בשרת במהלך ההתחברות' });
    }
};

// ── 4. עדכון פרופיל (/api/auth/update-profile) ───────────────────────────────
// מקבל: bio, currentPassword, newPassword, skills (JSON), תמונה חדשה (Multer)
// חייב אימות — req.user.id נשלח מה-middleware
exports.updateProfile = async (req, res) => {
    try {
        const result = await authService.updateProfile({ userId: req.user.id, ...req.body, file: req.file });
        res.status(200).json({ message: 'הפרופיל שלך עודכן בהצלחה במערכת!', user: result });
    } catch (error) {
        if (error.code === 'MISSING_CURRENT_PASSWORD') return res.status(400).json({ message: 'כדי לשנות סיסמה, חובה להזין את הסיסמה הנוכחית' });
        if (error.code === 'INVALID_CURRENT_PASSWORD') return res.status(401).json({ message: 'הסיסמה הנוכחית שהקשת אינה נכונה' });
        if (error.code === 'NEW_PASSWORD_TOO_SHORT') return res.status(400).json({ message: 'הסיסמה החדשה חייבת להיות לפחות 6 תווים' });
        if (error.code === 'USER_NOT_FOUND') return res.status(404).json({ message: 'המשתמש לא נמצא' });
        logger.error(`שגיאה בעדכון הפרופיל: ${error.message}`);
        res.status(500).json({ message: 'שגיאה בשרת במהלך עדכון הפרופיל' });
    }
};
