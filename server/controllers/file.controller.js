const FileService = require('../services/file.service');
const { asyncHandler } = require('../middleware/errorMiddleware');

exports.getProjectFiles = asyncHandler(async (req, res) => {
    const files = await FileService.getByProject(req.params.projectId);
    res.json(files);
});

exports.uploadProjectFile = asyncHandler(async (req, res) => {
    const result = await FileService.upload(req.params.projectId, req.user.id, req.file);
    res.status(201).json({ message: 'הקובץ הועלה בהצלחה', ...result });
});
