const db = require('../config/db.config');

exports.assignFaculty = async (req, res) => {
    try {
        const { faculty_id, course_id } = req.body;
        if (!faculty_id || !course_id) {
            return res.status(400).send({ message: "Faculty ID and Course ID are required." });
        }
        
        await db.query('INSERT IGNORE INTO faculty_courses (faculty_id, course_id) VALUES (?, ?)', [faculty_id, course_id]);
        res.status(201).send({ message: "Faculty assigned successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error assigning faculty." });
    }
};

exports.removeFaculty = async (req, res) => {
    try {
        const { facultyId, courseId } = req.params;
        await db.query('DELETE FROM faculty_courses WHERE faculty_id = ? AND course_id = ?', [facultyId, courseId]);
        res.status(200).send({ message: "Faculty assignment removed." });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error removing faculty assignment." });
    }
};

exports.getFacultyAssignments = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT fc.faculty_id, fc.course_id, u.name as faculty_name, c.course_name, c.course_code 
            FROM faculty_courses fc
            JOIN users u ON fc.faculty_id = u.id
            JOIN courses c ON fc.course_id = c.id
        `);
        res.status(200).send(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error retrieving faculty assignments." });
    }
};

exports.enrollStudent = async (req, res) => {
    try {
        const { student_id, course_id } = req.body;
        if (!student_id || !course_id) {
            return res.status(400).send({ message: "Student ID and Course ID are required." });
        }
        
        await db.query('INSERT IGNORE INTO enrollments (student_id, course_id) VALUES (?, ?)', [student_id, course_id]);
        res.status(201).send({ message: "Student enrolled successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error enrolling student." });
    }
};

exports.removeStudent = async (req, res) => {
    try {
        const { studentId, courseId } = req.params;
        await db.query('DELETE FROM enrollments WHERE student_id = ? AND course_id = ?', [studentId, courseId]);
        res.status(200).send({ message: "Student enrollment removed." });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error removing student enrollment." });
    }
};

exports.getStudentEnrollments = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT e.student_id, e.course_id, u.name as student_name, c.course_name, c.course_code 
            FROM enrollments e
            JOIN users u ON e.student_id = u.id
            JOIN courses c ON e.course_id = c.id
        `);
        res.status(200).send(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error retrieving student enrollments." });
    }
};
