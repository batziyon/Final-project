const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger.js');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const adminRoutes = require('./routes/adminRoutes');
const taskRoutes = require('./routes/taskRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { message: 'יותר מדי ניסיונות. נסה שוב בעוד 15 דקות.' },
    standardHeaders: true,
    legacyHeaders: false
});

const adminLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 40,
    message: { message: 'יותר מדי בקשות מנהל. נסה שוב בעוד דקה.' },
    standardHeaders: true,
    legacyHeaders: false
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
    logger.info(`בקשת ${req.method} לנתיב ${req.url}`);
    next();
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects', taskRoutes);
app.use('/api/admin', adminLimiter, adminRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const db = require('./config/db');

app.listen(PORT, async () => {
  logger.info(`השרת רץ בפורט ${PORT}`);
  try {
    await db.query('SELECT 1');
    logger.info('החיבור ל-MySQL הצליח!');
    // מאפשר admin_id = NULL עבור אירועי מערכת (ניסיון כניסה של משתמש חסום)
    await db.query('ALTER TABLE admin_audit_log MODIFY admin_id INT NULL').catch(() => {});
  } catch (error) {
    logger.error(`שגיאה בחיבור ל-MySQL: ${error.message}`);
  }
});