const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
    let token = req.headers['authorization'];
    if (!token) {
        return res.status(403).send({ message: "No token provided!" });
    }
    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: "Unauthorized!" });
        }
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.userRole === 'admin') {
        next();
        return;
    }
    res.status(403).send({ message: "Require Admin Role!" });
};

const isFaculty = (req, res, next) => {
    if (req.userRole === 'faculty' || req.userRole === 'admin') {
        next();
        return;
    }
    res.status(403).send({ message: "Require Faculty Role!" });
};

const isStudent = (req, res, next) => {
    if (req.userRole === 'student') {
        next();
        return;
    }
    res.status(403).send({ message: "Require Student Role!" });
};

module.exports = {
    verifyToken,
    isAdmin,
    isFaculty,
    isStudent
};
