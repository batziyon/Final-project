const jsonwebtoken = require('jsonwebtoken');
const db = require('../config/db');

/**
 * authMiddleware — middleware לאימות JWT.
 *
 * זרימה:
 * 1. מחלץ את הטוקן מ-Authorization header (Bearer <token>)
 * 2. מאמת את הטוקן מול JWT_SECRET
 * 3. שולף את המשתמש מהמסד לוודא שהוא קיים ופעיל
 * 4. שם את אובייקט המשתמש על req.user לשימוש ב-controllers
 *
 * אם משהו נכשל — מחזיר 401 או 403 ועוצר את הבקשה.
 */
module.exports = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // חילוץ הטוקן מ-"Bearer <token>"

    if (!token) {
        return res.status(401).json({ message: 'גישה נדחתה, חסר טוקן אבטחה' });
    }

    try {
        // פענוח הטוקן — אם פג תוקף או לא תקין, תיזרק שגיאה
        const verified = jsonwebtoken.verify(token, process.env.JWT_SECRET);

        // וידוי שהמשתמש עדיין קיים במסד ופעיל
        const [users] = await db.query('SELECT id, username, role, is_active FROM users WHERE id = ?', [verified.id]);

        if (!users.length) {
            return res.status(401).json({ message: 'משתמש לא נמצא' });
        }

        const user = users[0];

        // אם המשתמש נחסם — עצור כאן
        if (user.is_active !== 1) {
            return res.status(403).json({ message: 'החשבון חסום. פנה לתמיכה אם יש בעיה.' });
        }

        // שם את פרטי המשתמש על req לשימוש ב-controllers
        req.user = { id: user.id, username: user.username, role: user.role };
        next();
    } catch (error) {
        res.status(403).json({ message: 'טוקן לא תקין או פג תוקף' });
    }
};
