const logger = require('../utils/logger');

class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const errorHandler = (err, req, res, next) => {
    const status = err.statusCode || 500;
    const message = err.message || 'שגיאה בשרת';
    logger.error(`[Error] ${status} - ${message}`);
    res.status(status).json({ error: message });
};

module.exports = { AppError, asyncHandler, errorHandler };
