const db = require('../config/db.config');
const bcrypt = require('bcryptjs');

exports.findAll = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, username, role, name, is_active, created_at FROM users');
        res.status(200).send(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error retrieving users." });
    }
};

exports.create = async (req, res) => {
    try {
        const { username, password, role, name } = req.body;
        if (!username || !password || !role || !name) {
            return res.status(400).send({ message: "All fields are required." });
        }
        
        const validRoles = ['admin', 'faculty', 'student'];
        if (!validRoles.includes(role)) {
            return res.status(400).send({ message: "Invalid role." });
        }

        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        const [result] = await db.query(
            'INSERT INTO users (username, password_hash, role, name) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, role, name]
        );

        res.status(201).send({ message: "User created successfully.", id: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).send({ message: "Username already exists." });
        }
        console.error(error);
        res.status(500).send({ message: "Error creating user." });
    }
};

exports.update = async (req, res) => {
    try {
        const userId = req.params.id;
        const { name, role, is_active, password } = req.body;

        let query = 'UPDATE users SET name = ?, role = ?, is_active = ?';
        let params = [name, role, is_active];

        if (password) {
            const salt = bcrypt.genSaltSync(10);
            const hashedPassword = bcrypt.hashSync(password, salt);
            query += ', password_hash = ?';
            params.push(hashedPassword);
        }

        query += ' WHERE id = ?';
        params.push(userId);

        const [result] = await db.query(query, params);
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: "User not found." });
        }
        res.status(200).send({ message: "User updated successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error updating user." });
    }
};

exports.deactivate = async (req, res) => {
    try {
        const userId = req.params.id;
        const [result] = await db.query('UPDATE users SET is_active = FALSE WHERE id = ?', [userId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: "User not found." });
        }
        res.status(200).send({ message: "User deactivated successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error deactivating user." });
    }
};
