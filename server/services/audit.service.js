const db = require('../config/db');

const write = async (adminId, action, targetType, targetId, details = null) => {
    try {
        await db.query(
            'INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
            [adminId, action, targetType, targetId, details]
        );
    } catch (error) {
        console.error('Error writing to audit log:', error);
        // Don't throw - audit failures shouldn't break the main operation
    }
};

module.exports = {
    write,
};
