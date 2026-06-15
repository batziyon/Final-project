const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyToken = require('../middleware/authMiddleware');
const uploadProfileImage = require('../middleware/uploadMiddleware');

// 👤 0. שליפת פרטי המשתמש המחובר — לולידציית session בטעינת האפליקציה
router.get('/me', verifyToken, authController.getMe);

// 📝 1. הרשמת משתמש חדש (כולל העלאת תמונת פרופיל אופציונלית)
router.post('/register', uploadProfileImage.single('profileImage'), authController.register);

// 🔑 2. התחברות — מחזיר JWT token
router.post('/login', authController.login);

// ⚙️ 3. עדכון פרופיל — bio, סיסמה, תמונה, כישורים
router.put('/update-profile', verifyToken, uploadProfileImage.single('profileImage'), authController.updateProfile);

// 🔍 4. צפייה בפרופיל מלא לפי שם משתמש (כולל פרויקטים וכישורים)
router.get('/profile/:username', verifyToken, authController.getUserProfile);

// 👁️ 5. פרופיל ציבורי של מועמד לפי ID — לבעל פרויקט בלבד
router.get('/candidate/:userId', verifyToken, authController.getCandidateProfile);

module.exports = router;
