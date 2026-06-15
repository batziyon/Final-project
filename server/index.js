// ╔══════════════════════════════════════════════════════════╗
// ║              index.js — נקודת הכניסה לשרת               ║
// ║  כאן מגדירים את כל ה-middleware, ה-routes, ומפעילים     ║
// ║  את השרת. זה הקובץ הראשון שרץ כשמריצים "npm start"     ║
// ╚══════════════════════════════════════════════════════════╝

// ── ייבוא חבילות חיצוניות ───────────────────────────────────────────────────
const express = require('express');       // הפריימוורק שבונה את השרת
const cors = require('cors');             // מאפשר ל-React (פורט 5173) לדבר עם השרת (פורט 5000)
require('dotenv').config();               // טוען את משתני .env לתוך process.env
const path = require('path');             // עוזר לבנות נתיבי תיקיות תקינים בכל מערכת הפעלה
const rateLimit = require('express-rate-limit'); // מגביל כמות בקשות — הגנה מ-brute force
const logger = require('./utils/logger.js');     // הלוגר שלנו — כותב לטרמינל ולקובץ server.log

// ── ייבוא ה-Routes (נתיבים) ─────────────────────────────────────────────────
// כל route file מכיל קבוצת endpoints שמתחילה בקידומת מסוימת
const authRoutes    = require('./routes/authRoutes');    // /api/auth/...    — הרשמה, התחברות, פרופיל
const projectRoutes = require('./routes/projectRoutes'); // /api/projects/... — פרויקטים, בקשות, קבצים
const adminRoutes   = require('./routes/adminRoutes');   // /api/admin/...   — ניהול מנהל מערכת
const taskRoutes    = require('./routes/taskRoutes');    // /api/projects/:id/tasks — משימות

// ── ייבוא Error Handler גלובלי ───────────────────────────────────────────────
// יתפוס כל שגיאה שלא טופלה ב-controllers וישלח תשובת JSON מסודרת
const { errorHandler } = require('./middleware/errorMiddleware');

// ── יצירת אפליקציית Express ──────────────────────────────────────────────────
const app = express();

// ── הגדרת Rate Limiters (הגבלת קצב בקשות) ───────────────────────────────────

// מגביל ניסיונות login/register: מקסימום 20 בקשות כל 15 דקות מאותה IP
// מונע ניסיונות ניחוש סיסמה (brute force attack)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // חלון זמן: 15 דקות במילישניות
    max: 20,                   // מקסימום 20 ניסיונות בחלון הזמן
    message: { message: 'יותר מדי ניסיונות. נסה שוב בעוד 15 דקות.' },
    standardHeaders: true,     // שולח headers סטנדרטיים עם מידע על ה-limit
    legacyHeaders: false       // לא שולח headers ישנים מיותרים
});

// מגביל בקשות admin: מקסימום 40 בקשות בדקה
// מנהל צריך לרענן הרבה נתונים, לכן הגבלה רופפת יותר
const adminLimiter = rateLimit({
    windowMs: 60 * 1000, // חלון זמן: דקה אחת
    max: 40,             // מקסימום 40 בקשות בדקה
    message: { message: 'יותר מדי בקשות מנהל. נסה שוב בעוד דקה.' },
    standardHeaders: true,
    legacyHeaders: false
});

// ── Middleware גלובלי ─────────────────────────────────────────────────────────
// middleware = פונקציה שרצה על כל בקשה לפני שהיא מגיעה ל-route handler

app.use(cors());            // מאפשר בקשות Cross-Origin (מ-localhost:5173 ל-localhost:5000)
app.use(express.json());    // מפרסר body של בקשות JSON אוטומטית → מגיע כ-req.body

// מגיש קבצים סטטיים מתיקיית uploads/ — תמונות פרופיל וקבצי פרויקט
// לדוגמה: GET http://localhost:5000/uploads/profiles/profileImage-123.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware לוגינג — רץ על כל בקשה ומדפיס לטרמינל מה הגיע
app.use((req, res, next) => {
    logger.info(`בקשת ${req.method} לנתיב ${req.url}`);
    next(); // next() = "תמשיך לשלב הבא בשרשרת"
});

// ── חיבור Routes לשרת ────────────────────────────────────────────────────────
// הסדר חשוב! rate limiters חייבים לבוא לפני ה-route handler

app.use('/api/auth/login',    authLimiter);  // הגבל רק login
app.use('/api/auth/register', authLimiter);  // הגבל רק register
app.use('/api/auth',      authRoutes);       // כל שאר ה-auth routes
app.use('/api/projects',  projectRoutes);    // routes של פרויקטים
app.use('/api/projects',  taskRoutes);       // routes של משימות (תחת אותה קידומת /api/projects)
app.use('/api/admin',     adminLimiter, adminRoutes); // admin routes עם הגבלת קצב

// ── Error Handler גלובלי ─────────────────────────────────────────────────────
// חייב להיות אחרון — תופס שגיאות מכל ה-routes שמעליו
app.use(errorHandler);

// ── הפעלת השרת ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000; // קרא מ-.env, ברירת מחדל: 5000
const db = require('./config/db');     // חיבור למסד הנתונים

app.listen(PORT, async () => {
  logger.info(`השרת רץ בפורט ${PORT}`);
  try {
    // בדיקת חיבור ל-MySQL — שאילתה פשוטה שמחזירה 1 אם הכל תקין
    await db.query('SELECT 1');
    logger.info('החיבור ל-MySQL הצליח!');
    // מאפשר admin_id = NULL עבור אירועי מערכת (ניסיון כניסה של משתמש חסום)
    // .catch(() => {}) — לא נכשל אם השדה כבר NULL
    await db.query('ALTER TABLE admin_audit_log MODIFY admin_id INT NULL').catch(() => {});
  } catch (error) {
    logger.error(`שגיאה בחיבור ל-MySQL: ${error.message}`);
  }
});
