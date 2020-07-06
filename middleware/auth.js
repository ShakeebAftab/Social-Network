const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).send(`Access Denied`);
    }
    try {
        const decoded = jwt.verify(token, config.get('jwtTokenSecret'));
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).send(`Token is not valid`);
    }
};
