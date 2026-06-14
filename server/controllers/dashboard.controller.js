const { DashboardService, StatsService } = require('../services/dashboard.service');
const { asyncHandler } = require('../middleware/errorMiddleware');

exports.getDashboardStats = asyncHandler(async (req, res) => {
    const stats = await DashboardService.getStats(req.user.id);
    res.json(stats);
});

exports.getStats = asyncHandler(async (req, res) => {
    const stats = await StatsService.getPublicStats();
    res.json(stats);
});
