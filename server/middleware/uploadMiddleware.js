const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// ── Profile Image Upload ─────────────────────────────────────────────────────
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/profiles/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const profileFileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('שגיאה: ניתן להעלות קבצי תמונה בלבד! (png, jpg, jpeg, webp)'));
};

const uploadProfileImage = multer({
    storage: profileStorage,
    fileFilter: profileFileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }
});

const deleteOldProfileImage = (oldFilename) => {
    if (!oldFilename || oldFilename === 'default_profile.png') return;
    const oldPath = path.join(__dirname, '../uploads/profiles/', oldFilename);
    fs.unlink(oldPath, (err) => {
        if (err && err.code !== 'ENOENT') {
            logger.error(`שגיאה במחיקת תמונת פרופיל ישנה: ${err.message}`);
        }
    });
};

// ── Project File Upload (תמונות, אודיו, PDF, Word) ───────────────────────────
const projectStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/projects/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const projectFileFilter = (req, file, cb) => {
    const allowedMime = /^(image\/(jpeg|jpg|png|webp|gif)|audio\/(mpeg|wav|ogg)|application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document))$/;
    const allowedExt = /\.(jpg|jpeg|png|webp|gif|mp3|wav|ogg|pdf|doc|docx)$/i;
    if (allowedMime.test(file.mimetype) && allowedExt.test(file.originalname)) {
        return cb(null, true);
    }
    cb(new Error('סוג קובץ לא נתמך. מותר: תמונות, אודיו (mp3/wav), PDF, Word'));
};

const uploadProjectFile = multer({
    storage: projectStorage,
    fileFilter: projectFileFilter,
    limits: { fileSize: 20 * 1024 * 1024 }
});

module.exports = uploadProfileImage;
module.exports.deleteOldProfileImage = deleteOldProfileImage;
module.exports.uploadProjectFile = uploadProjectFile;
