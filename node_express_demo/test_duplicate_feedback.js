const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// We can just use global fetch since node 24 supports it.

async function runTest() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
            database: process.env.DB_NAME || 'student_feedback_system'
        });

        // Find existing submission
        const [submissions] = await connection.query('SELECT * FROM feedback_submissions LIMIT 1');
        if (submissions.length === 0) {
            console.log("No existing submissions found to test.");
            return;
        }

        const submission = submissions[0];
        const studentId = submission.student_id;
        const courseId = submission.course_id;
        const facultyId = submission.faculty_id;

        console.log(`Testing duplicate submission for Student: ${studentId}, Course: ${courseId}, Faculty: ${facultyId}`);

        // Get counts before
        const [fbBefore] = await connection.query('SELECT COUNT(*) as cnt FROM feedback');
        const [subBefore] = await connection.query('SELECT COUNT(*) as cnt FROM feedback_submissions');
        
        console.log(`BEFORE -> Feedback Count: ${fbBefore[0].cnt}, Submissions Count: ${subBefore[0].cnt}`);

        // Generate JWT for the student directly
        const token = jwt.sign({ id: studentId, role: 'student' }, process.env.JWT_SECRET, { expiresIn: 86400 });

        // Attempt second submission
        const payload = {
            course_id: courseId,
            faculty_id: facultyId,
            teaching_rating: 5,
            communication_rating: 5,
            overall_rating: 5,
            comments: "Duplicate test comment"
        };

        const res = await fetch('http://localhost:4000/api/feedback/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const status = res.status;
        const data = await res.json();
        console.log(`\nHTTP STATUS RETURNED: ${status}`);
        console.log(`ERROR MESSAGE RETURNED: ${data.message}\n`);

        // Get counts after
        const [fbAfter] = await connection.query('SELECT COUNT(*) as cnt FROM feedback');
        const [subAfter] = await connection.query('SELECT COUNT(*) as cnt FROM feedback_submissions');

        console.log(`AFTER -> Feedback Count: ${fbAfter[0].cnt}, Submissions Count: ${subAfter[0].cnt}`);

    } catch (err) {
        console.error("Test execution failed:", err);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runTest();
