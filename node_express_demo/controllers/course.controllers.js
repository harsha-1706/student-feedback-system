const db = require('../config/db.config');

exports.findAll = async (req, res) => {
    try {
        let query = 'SELECT * FROM courses';
        let params = [];

        // If faculty, only return courses they teach
        if (req.userRole === 'faculty') {
            query = `
                SELECT c.* FROM courses c 
                JOIN faculty_courses fc ON c.id = fc.course_id 
                WHERE fc.faculty_id = ?
            `;
            params.push(req.userId);
        } else if (req.userRole === 'student') {
            // If student, return courses they are enrolled in
            query = `
                SELECT c.* FROM courses c 
                JOIN enrollments e ON c.id = e.course_id 
                WHERE e.student_id = ?
            `;
            params.push(req.userId);
        }

        const [rows] = await db.query(query, params);
        res.status(200).send(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error retrieving courses." });
    }
};

exports.create = async (req, res) => {
    try {
        const { course_code, course_name } = req.body;
        if (!course_code || !course_name) {
            return res.status(400).send({ message: "Course code and name are required." });
        }

        const [result] = await db.query(
            'INSERT INTO courses (course_code, course_name) VALUES (?, ?)',
            [course_code, course_name]
        );

        res.status(201).send({ message: "Course created successfully.", id: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).send({ message: "Course code already exists." });
        }
        console.error(error);
        res.status(500).send({ message: "Error creating course." });
    }
};

exports.update = async (req, res) => {
    try {
        const courseId = req.params.id;
        const { course_code, course_name } = req.body;

        const [result] = await db.query(
            'UPDATE courses SET course_code = ?, course_name = ? WHERE id = ?',
            [course_code, course_name, courseId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).send({ message: "Course not found." });
        }
        res.status(200).send({ message: "Course updated successfully." });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).send({ message: "Course code already exists." });
        }
        console.error(error);
        res.status(500).send({ message: "Error updating course." });
    }
};

exports.delete = async (req, res) => {
    try {
        const courseId = req.params.id;
        const [result] = await db.query('DELETE FROM courses WHERE id = ?', [courseId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: "Course not found." });
        }
        res.status(200).send({ message: "Course deleted successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error deleting course." });
    }
};
