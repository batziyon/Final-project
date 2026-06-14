const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyToken = require('../middleware/authMiddleware');
const uploadProfileImage = require('../middleware/uploadMiddleware');

// 📝 1. ראוט הרשמה (כולל העלאת תמונה ראשונית)
router.post('/register', uploadProfileImage.single('profileImage'), authController.register);

// 🔑 2. ראוט התחברות
router.post('/login', authController.login);

// 👤 3. ראוט עדכון פרופיל
router.put('/update-profile', verifyToken, uploadProfileImage.single('profileImage'), authController.updateProfile);

// 👤 4. צפייה בפרופיל של משתמש אחר
router.get('/profile/:username', verifyToken, authController.getUserProfile);

module.exports = router;