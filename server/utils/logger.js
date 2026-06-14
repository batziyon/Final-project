const fs = require('fs');
const path = require('path');

// הגדרת הנתיב שבו יישמר קובץ הלוגים (בתיקייה הראשית של השרת)
const logFilePath = path.join(__dirname, '../server.log');

/**
 * פונקציה חכמה שכותבת לוגים גם למסך וגם לקובץ טקסט
 * @param {string} level - סוג הלוג: 'INFO', 'SUCCESS', 'ERROR', 'WARN'
 * @param {string} message - ההודעה שנרצה לתעד
 */
const log = (level, message) => {
    const timestamp = new Date().toLocaleString('he-IL'); // תאריך ושעה בפורמט ישראלי
    const logMessage = `[${timestamp}] [${level}] : ${message}\n`;

    // 1. מדפיס לטרמינל הרגיל של ה-VS Code (עם אמוג'י לפי הסוג)
    let emoji = 'ℹ️';
    if (level === 'SUCCESS') emoji = '✅';
    if (level === 'ERROR') emoji = '❌';
    if (level === 'WARN') emoji = '⚠️';
    
    console.log(`${emoji} [${level}] ${message}`);

    // 2. כותב (או מוסיף לסוף) קובץ הטקסט server.log
    fs.appendFile(logFilePath, logMessage, (err) => {
        if (err) {
            console.error('❌ נכשלה כתיבת הלוג לקובץ:', err);
        }
    });
};

// פונקציות עזר נוחות לשימוש מהיר בקוד
module.exports = {
    info: (msg) => log('INFO', msg),
    success: (msg) => log('SUCCESS', msg),
    error: (msg) => log('ERROR', msg),
    warn: (msg) => log('WARN', msg)
};