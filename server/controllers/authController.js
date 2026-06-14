const db = require('../config/db'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { deleteOldProfileImage } = require('../middleware/uploadMiddleware');

// --- 📝 1. פונקציית הרשמה (Register) ---
exports.register = async (req, res) => {
    try {
        const { username, email, password, role, bio, skills } = req.body;

        if (!password || password.trim().length < 6) {
            return res.status(400).json({ message: 'סיסמה היא שדה חובה ועליה להכיל לפחות 6 תווים' });
        }

        // הצפנת סיסמה
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // בדיקת תמונת פרופיל מ-Multer
        const profileImage = req.file ? req.file.filename : 'default_profile.png';

        // הכנסה לטבלת המשתמשים
        const [result] = await db.query(
            'INSERT INTO users (username, email, password, role, bio, profile_image) VALUES (?, ?, ?, ?, ?, ?)',
            [username, email, hashedPassword, role, bio || '', profileImage]
        );

        const userId = result.insertId;

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

            if (Array.isArray(parsedSkills) && parsedSkills.length > 0) {
                const skillRecords = parsedSkills.map(skill => [userId, skill]);
                await db.query('INSERT INTO user_skills (user_id, skill_name) VALUES ?', [skillRecords]);
            }
        }

        logger.success(`משתמש חדש נרשם בהצלחה: ${username}`);
        res.status(201).json({ message: 'ההרשמה בוצעה בהצלחה! כעת ניתן להתחבר.' });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'שם המשתמש או האימייל כבר קיימים במערכת' });
        }
        logger.error(`שגיאה בהרשמה: ${error.message}`);
        res.status(500).json({ message: 'שגיאה בשרת במהלך ההרשמה' });
    }
};

// --- 👤 2. צפייה בפרופיל של משתמש אחר ---
exports.getUserProfile = async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, username, role, bio, profile_image FROM users WHERE username = ?',
            [req.params.username]
        );
        if (!users.length) return res.status(404).json({ message: 'המשתמש לא נמצא' });
        const [userSkills] = await db.query('SELECT skill_name FROM user_skills WHERE user_id = ?', [users[0].id]);
        res.json({ ...users[0], skills: userSkills.map(s => s.skill_name) });
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בשרת' });
    }
};

// --- 🔑 3. פונקציית התחברות (Login) ---
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // שליפת המשתמש מהדאטהבייס
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
        }

        const user = users[0];

        // אימות סיסמה
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
        }

        // שליפת הכישורים של המשתמש כדי לשמור אותם ב-React
        const [userSkills] = await db.query('SELECT skill_name FROM user_skills WHERE user_id = ?', [user.id]);
        const skillsArray = userSkills.map(s => s.skill_name);

        // יצירת טוקן JWT מאובטח
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        logger.success(`משתמש התחבר בהצלחה: ${user.username}`);

        // החזרת הנתונים ללקוח
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
                skills: skillsArray
            }
        });

    } catch (error) {
        logger.error(`שגיאה בהתחברות: ${error.message}`);
        res.status(500).json({ message: 'שגיאה בשרת במהלך ההתחברות' });
    }
};

// --- ⚙️ 4. עדכון פרופיל מורחב ומאובטח ---
exports.updateProfile = async (req, res) => {
    try {
        const { currentPassword, newPassword, bio, skills } = req.body;
        const userId = req.user.id; 

        const updates = {};

        // א. בדיקה ועדכון סיסמה מאובטחת
        if (newPassword && newPassword.trim() !== '') {
            if (!currentPassword) {
                return res.status(400).json({ message: 'כדי לשנות סיסמה, חובה להזין את הסיסמה הנוכחית' });
            }

            const [users] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
            if (users.length === 0) {
                return res.status(404).json({ message: 'המשתמש לא נמצא' });
            }

            const isMatch = await bcrypt.compare(currentPassword, users[0].password);
            if (!isMatch) {
                return res.status(401).json({ message: 'הסיסמה הנוכחית שהקשת אינה נכונה' });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ message: 'הסיסמה החדשה חייבת להיות לפחות 6 תווים' });
            }

            updates.password = await bcrypt.hash(newPassword, 10);
        }

        if (bio !== undefined) updates.bio = bio;

        // ב. בדיקה האם הועלתה תמונת פרופיל חדשה דרך Multer
        let updatedImageName = null;
        if (req.file) {
            updatedImageName = req.file.filename;
            updates.profile_image = updatedImageName;

            // מחיקת תמונה ישנה
            const [current] = await db.query('SELECT profile_image FROM users WHERE id = ?', [userId]);
            if (current.length) deleteOldProfileImage(current[0].profile_image);
        }

        // ג. עדכון כל השדות בשאילתה אחת
        if (Object.keys(updates).length > 0) {
            const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
            const values = [...Object.values(updates), userId];
            await db.query(`UPDATE users SET ${fields} WHERE id = ?`, values);
        }

        // ד. עדכון וסנכרון כישורים
        if (skills) {
            let parsedSkills = [];
            try {
                parsedSkills = typeof skills === 'string' ? JSON.parse(skills) : skills;
            } catch (e) {
                parsedSkills = [];
            }

            // ניקוי ערכים ריקים ורווחים, כולל ערכי 'אחר:'
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