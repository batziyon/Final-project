const db = require('../config/db');
const { AppError } = require('../middleware/errorMiddleware');

const FileService = {
    async getByProject(projectId) {
        const [files] = await db.query(
            'SELECT * FROM project_files WHERE project_id = ? ORDER BY uploaded_at DESC',
            [projectId]
        );
        return files;
    },

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
