const db = require('../config/db.config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).send({ message: "Username and password are required!" });
        }

        const [rows] = await db.query('SELECT * FROM users WHERE username = ? AND is_active = TRUE', [username]);
        
        if (rows.length === 0) {
            return res.status(404).send({ message: "User not found or inactive." });
        }

        const user = rows[0];
        
        const passwordIsValid = bcrypt.compareSync(password, user.password_hash);
        if (!passwordIsValid) {
            return res.status(401).send({ accessToken: null, message: "Invalid Password!" });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: 86400 // 24 hours
        });

        res.status(200).send({
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            accessToken: token
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Internal server error during login." });
    }
};
