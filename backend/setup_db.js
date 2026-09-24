const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setupDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : ''
        });

        console.log("Connected to MySQL server.");

        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
        console.log(`Database ${process.env.DB_NAME} created or already exists.`);

        await connection.query(`USE \`${process.env.DB_NAME}\``);

        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('admin', 'faculty', 'student') NOT NULL,
                name VARCHAR(255) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await connection.query(createUsersTable);
        console.log("users table created.");

        const createCoursesTable = `
            CREATE TABLE IF NOT EXISTS courses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                course_code VARCHAR(50) UNIQUE NOT NULL,
                course_name VARCHAR(255) NOT NULL
            )
        `;
        await connection.query(createCoursesTable);
        console.log("courses table created.");

        const createFacultyCoursesTable = `
            CREATE TABLE IF NOT EXISTS faculty_courses (
                faculty_id INT,
                course_id INT,
                PRIMARY KEY (faculty_id, course_id),
                FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
            )
        `;
        await connection.query(createFacultyCoursesTable);
        console.log("faculty_courses table created.");

        const createEnrollmentsTable = `
            CREATE TABLE IF NOT EXISTS enrollments (
                student_id INT,
                course_id INT,
                PRIMARY KEY (student_id, course_id),
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
            )
        `;
        await connection.query(createEnrollmentsTable);
        console.log("enrollments table created.");

        const createFeedbackTable = `
            CREATE TABLE IF NOT EXISTS feedback (
                id INT AUTO_INCREMENT PRIMARY KEY,
                course_id INT NOT NULL,
                faculty_id INT NOT NULL,
                teaching_rating INT NOT NULL CHECK (teaching_rating BETWEEN 1 AND 5),
                communication_rating INT NOT NULL CHECK (communication_rating BETWEEN 1 AND 5),
                overall_rating INT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
                comments TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `;
        await connection.query(createFeedbackTable);
        console.log("feedback table created.");

        const createFeedbackSubmissionsTable = `
            CREATE TABLE IF NOT EXISTS feedback_submissions (
                student_id INT NOT NULL,
                course_id INT NOT NULL,
                faculty_id INT NOT NULL,
                PRIMARY KEY (student_id, course_id, faculty_id),
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `;
        await connection.query(createFeedbackSubmissionsTable);
        console.log("feedback_submissions table created.");

        // Check if admin exists
        const [rows] = await connection.query(`SELECT id FROM users WHERE username = 'admin'`);
        if (rows.length === 0) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            await connection.query(
                `INSERT INTO users (username, password_hash, role, name) VALUES (?, ?, ?, ?)`,
                ['admin', hashedPassword, 'admin', 'System Administrator']
            );
            console.log("Default admin account created. (username: admin, password: admin123)");
        } else {
            console.log("Admin account already exists.");
        }

        await connection.end();
        console.log("Database setup completed successfully.");
        process.exit(0);

    } catch (error) {
        console.error("Error setting up database:", error);
        process.exit(1);
    }
}

setupDatabase();
