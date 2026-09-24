const db = require('../config/db.config');

exports.getPendingFeedback = async (req, res) => {
    try {
        const studentId = req.userId;
        
        // Find courses student is enrolled in, and the faculty teaching those courses,
        // but LEFT JOIN with feedback_submissions to only include those NOT YET submitted
        const query = `
            SELECT c.id as course_id, c.course_name, c.course_code, u.id as faculty_id, u.name as faculty_name
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            JOIN faculty_courses fc ON c.id = fc.course_id
            JOIN users u ON fc.faculty_id = u.id
            LEFT JOIN feedback_submissions fs 
              ON fs.student_id = e.student_id 
              AND fs.course_id = c.id 
              AND fs.faculty_id = u.id
            WHERE e.student_id = ? AND fs.student_id IS NULL
        `;
        
        const [rows] = await db.query(query, [studentId]);
        res.status(200).send(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error retrieving pending feedback." });
    }
};

exports.submitFeedback = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const studentId = req.userId;
        const { course_id, faculty_id, teaching_rating, communication_rating, overall_rating, comments } = req.body;

        if (!course_id || !faculty_id || !teaching_rating || !communication_rating || !overall_rating) {
            return res.status(400).send({ message: "All ratings and IDs are required." });
        }

        if ([teaching_rating, communication_rating, overall_rating].some(r => r < 1 || r > 5)) {
            return res.status(400).send({ message: "Ratings must be between 1 and 5." });
        }

        await connection.beginTransaction();

        // 1. Verify student is enrolled in the course
        const [enrollments] = await connection.query('SELECT 1 FROM enrollments WHERE student_id = ? AND course_id = ?', [studentId, course_id]);
        if (enrollments.length === 0) {
            throw new Error("Student is not enrolled in this course.");
        }

        // 2. Verify faculty is assigned to the course
        const [assignments] = await connection.query('SELECT 1 FROM faculty_courses WHERE faculty_id = ? AND course_id = ?', [faculty_id, course_id]);
        if (assignments.length === 0) {
            throw new Error("Faculty is not assigned to this course.");
        }

        // 3. Verify student has not already submitted feedback for this combo
        const [submissions] = await connection.query('SELECT 1 FROM feedback_submissions WHERE student_id = ? AND course_id = ? AND faculty_id = ? FOR UPDATE', [studentId, course_id, faculty_id]);
        if (submissions.length > 0) {
            throw new Error("Feedback already submitted for this course and faculty.");
        }

        // 4. Insert feedback anonymously (no student_id)
        await connection.query(
            'INSERT INTO feedback (course_id, faculty_id, teaching_rating, communication_rating, overall_rating, comments) VALUES (?, ?, ?, ?, ?, ?)',
            [course_id, faculty_id, teaching_rating, communication_rating, overall_rating, comments || null]
        );

        // 5. Insert submission record
        await connection.query(
            'INSERT INTO feedback_submissions (student_id, course_id, faculty_id) VALUES (?, ?, ?)',
            [studentId, course_id, faculty_id]
        );

        await connection.commit();
        res.status(201).send({ message: "Feedback submitted successfully." });
    } catch (error) {
        await connection.rollback();
        console.error("Transaction failed:", error.message);
        res.status(400).send({ message: error.message || "Error submitting feedback." });
    } finally {
        connection.release();
    }
};

exports.getStats = async (req, res) => {
    try {
        let query = `
            SELECT 
                f.course_id, c.course_name, c.course_code,
                f.faculty_id, u.name as faculty_name,
                COUNT(f.id) as total_responses,
                AVG(f.teaching_rating) as avg_teaching,
                AVG(f.communication_rating) as avg_communication,
                AVG(f.overall_rating) as avg_overall
            FROM feedback f
            JOIN courses c ON f.course_id = c.id
            JOIN users u ON f.faculty_id = u.id
        `;
        
        let params = [];
        let conditions = [];

        if (req.userRole === 'faculty') {
            conditions.push('f.faculty_id = ?');
            params.push(req.userId);
        } else if (req.userRole === 'student') {
            return res.status(403).send({ message: "Students cannot view global stats." });
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' GROUP BY f.course_id, f.faculty_id';

        const [rows] = await db.query(query, params);
        res.status(200).send(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error retrieving feedback stats." });
    }
};

exports.getComments = async (req, res) => {
    try {
        let query = `
            SELECT 
                f.course_id, c.course_name, c.course_code,
                f.comments, f.created_at
            FROM feedback f
            JOIN courses c ON f.course_id = c.id
        `;
        
        let params = [];
        let conditions = ["f.comments IS NOT NULL AND f.comments != ''"];

        if (req.userRole === 'faculty') {
            conditions.push('f.faculty_id = ?');
            params.push(req.userId);
        } else if (req.userRole === 'student') {
            return res.status(403).send({ message: "Students cannot view comments." });
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' ORDER BY f.created_at DESC';

        const [rows] = await db.query(query, params);
        res.status(200).send(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error retrieving feedback comments." });
    }
};
