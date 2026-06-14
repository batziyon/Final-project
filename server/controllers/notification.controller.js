const NotificationService = require('../services/notification.service');
const { asyncHandler } = require('../middleware/errorMiddleware');

exports.getNotifications = asyncHandler(async (req, res) => {
    const [unread, older] = await Promise.all([
        NotificationService.getUnread(req.user.id),
        NotificationService.getOlder(req.user.id)
    ]);
    res.json({ unread, older });
});

exports.clearNotifications = asyncHandler(async (req, res) => {
    await NotificationService.markAllRead(req.user.id);
    res.json({ message: 'ההתראות סומנו כנקראו' });
});
