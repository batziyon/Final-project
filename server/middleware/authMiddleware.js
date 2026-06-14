const jsonwebtoken = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'גישה נדחתה, חסר טוקן אבטחה' });
    }

    try {
        const verified = jsonwebtoken.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.status(403).json({ message: 'טוקן לא תקין או פג תוקף' });
    }
};