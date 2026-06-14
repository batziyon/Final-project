// 1. מייבאים את החבילה שהתקנת בטרמינל
const mysql = require('mysql2');
require('dotenv').config(); // מאפשר לקרוא את קובץ ה-.env

// 2. יוצרים "בריכת חיבורים" (Connection Pool) שמחברת את השרת ל-MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,       // localhost
  user: process.env.DB_USER,       // root
  password: process.env.DB_PASSWORD, // הסיסמה שלך
  database: process.env.DB_NAME,   // שם בסיס הנתונים של הפרויקט
  waitForConnections: true,
  connectionLimit: 10
});

// 3. מייצאים את החיבור כדי שכל השרת יוכל להשתמש בו
module.exports = pool.promise();