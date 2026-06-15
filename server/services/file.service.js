const db = require('../config/db');
const { AppError } = require('../middleware/errorMiddleware');

/**
 * FileService — מנהל קבצים מצורפים לפרויקטים.
 * קבצים נשמרים בתיקיית uploads/projects/ בשרת,
 * ומטא-דאטה (שם, נתיב, סוג) נשמר בטבלת project_files.
 */
const FileService = {

    /**
     * שולף את כל הקבצים של פרויקט, ממוינים מהחדש לישן.
     */
    async getByProject(projectId) {
        const [files] = await db.query(
            'SELECT * FROM project_files WHERE project_id = ? ORDER BY uploaded_at DESC',
            [projectId]
        );
        return files;
    },

    /**
     * מעלה קובץ חדש לפרויקט.
     * הקובץ עצמו הועלה על ידי Multer לתיקיית uploads/projects/.
     * כאן שומרים את המטא-דאטה במסד הנתונים.
     * סוג הקובץ נקבע לפי mimetype: image / audio / document.
     */
    async upload(projectId, userId, file) {
        if (!file) throw new AppError('לא נבחר קובץ', 400);
        const filePath = `/uploads/projects/${file.filename}`;
        const fileType = file.mimetype.startsWith('image') ? 'image'
            : file.mimetype.startsWith('audio') ? 'audio' : 'document';

        await db.query(
            'INSERT INTO project_files (project_id, user_id, file_name, file_path, file_type) VALUES (?, ?, ?, ?, ?)',
            [projectId, userId, file.originalname, filePath, fileType]
        );
        return { path: filePath, name: file.originalname };
    }
};

module.exports = FileService;
