# Student Feedback System

## Project Overview
The Student Feedback System is a robust web application that allows students to anonymously evaluate and provide feedback for their enrolled courses and assigned faculty. The system enforces strict role-based access, prevents duplicate feedback submissions, and aggregates analytics for faculty performance tracking.

## Problem Statement
Educational institutions require a reliable and anonymous method for collecting student feedback to improve teaching quality. Feedback mechanisms must guarantee student anonymity to encourage honest reviews, while preventing spam or duplicate submissions. Faculty and administrators need secure, clear dashboards to track feedback metrics without compromising data privacy.

## Features
- **Anonymous Feedback**: Student identity is fully decoupled from feedback records.
- **Duplicate Prevention**: Database transactions and locks prevent users from submitting feedback more than once per course/faculty.
- **Role-Based Dashboards**: Distinct interfaces and capabilities for Admins, Faculty, and Students.
- **Data Visualization**: Real-time Chart.js integration for faculty metrics.
- **Soft Deletion**: Accounts are deactivated rather than deleted to preserve historical data.

## User Roles
1. **Admin**: Can create/manage users (Faculty, Students), manage courses, enroll students, and assign faculty to courses. Can view global statistics.
2. **Faculty**: Can view aggregate feedback ratings and read anonymous comments for their assigned courses. Cannot view global statistics.
3. **Student**: Can view pending feedback forms for courses they are currently enrolled in and submit anonymous feedback.

## Technology Stack
- **Frontend**: Vanilla HTML5, CSS3, JavaScript, Bootstrap 5, Chart.js
- **Backend**: Node.js, Express.js, JSON Web Tokens (JWT) for Authentication
- **Database**: MySQL 8.0+ (using `mysql2` driver)
- **Security**: bcryptjs for password hashing

## System Architecture
A completely decoupled architecture utilizing a REST API layer. 
- **Frontend Layer**: Client-side logic handles routing, form validation, and dashboard rendering via `fetch` API calls.
- **Backend API Layer**: Express routing passes requests through sequential security middleware (`verifyToken`, `isAdmin`, etc.) before reaching controllers.
- **Database Layer**: A relational MySQL database utilizing Foreign Keys, `ON DELETE CASCADE` rules, constraints, and ACID-compliant transactions for data integrity.

## Project Structure
```text
E:\Projects\
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Business logic (auth, user, course, feedback, assignment)
│   ├── middlewares/     # JWT and role-based security validation
│   ├── routes/          # Express route definitions
│   ├── .env.example     # Environment template
│   ├── package.json     # Node dependencies
│   ├── server.js        # Entry point for the Express API
│   └── setup_db.js      # Script to initialize database schema & admin
├── frontend/
│   ├── admin/           # Admin dashboard and user management HTML/JS
│   ├── assets/          # Shared CSS, api.js, auth.js
│   ├── faculty/         # Faculty dashboard and chart visualization HTML/JS
│   ├── student/         # Student feedback portal HTML/JS
│   └── index.html       # Shared login portal
├── README.md            # Project documentation
└── .gitignore           # Git ignore rules
```

## Database Overview
- `users`: Stores all roles. Uses `is_active` for soft-deactivation.
- `courses`: Stores course details.
- `enrollments`: Maps students to courses.
- `faculty_courses`: Maps faculty to courses.
- `feedback_submissions`: Tracks whether a student has completed feedback (uses a composite Primary Key).
- `feedback`: Stores the actual ratings and comments completely anonymously.

## Environment Configuration
1. Navigate to the `backend/` directory.
2. Copy the `.env.example` file to create a new `.env` file:
   ```bash
   cp .env.example .env
   ```
3. Update `.env` with your actual MySQL `root` password and a secure JWT Secret:
   ```env
   PORT=4000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=student_feedback_system
   JWT_SECRET=your_jwt_secret
   ```

## Setup Instructions

### 1. Initialize the Database
Open your terminal in the `backend` folder and run:
```bash
cd backend
npm install
npm run setup
```
This script will automatically construct the MySQL tables, relationships, and generate the default Admin user.

### 2. Start the Backend API
Run the backend server:
```bash
npm start
```
The server will run at `http://localhost:4000`.

### 3. Run the Frontend
Use any local web server to serve the `frontend/` directory. For example, using `serve`:
```bash
npx serve frontend
```
Navigate to the provided URL (e.g., `http://localhost:3000`) to access the Login page.

## Default Development Admin Credentials
- **Username**: admin
- **Password**: admin123

> **WARNING**: `admin123` is a DEVELOPMENT/DEFAULT credential. It must be deactivated or have its password changed before deployment to any production environment!

## API Overview
**Authentication**
- `POST /api/auth/login` - Authenticate and return JWT.

**User Management (Admin Only)**
- `GET /api/users` - List all users.
- `POST /api/users` - Create a new user (Student/Faculty).
- `PUT /api/users/:id/deactivate` - Soft-delete user.

**Course Management (Admin Only)**
- `GET /api/courses` - List all courses.
- `POST /api/courses` - Create a new course.

**Assignments & Enrollments (Admin Only)**
- `POST /api/assignments/enroll` - Enroll a student in a course.
- `POST /api/assignments/assign` - Assign faculty to a course.

**Feedback (Role-Specific)**
- `GET /api/feedback/pending` (Student) - Fetch courses pending evaluation.
- `POST /api/feedback/submit` (Student) - Submit anonymous ratings and comments.
- `GET /api/feedback/stats` (Admin/Faculty) - Fetch aggregated average ratings.
- `GET /api/feedback/comments` (Admin/Faculty) - Fetch raw text feedback comments.

## Core Mechanisms
### Feedback Anonymity Mechanism
When a student submits feedback, the backend API explicitly discards the student's ID from the `feedback` table payload. Ratings and comments are stored globally under the course and faculty IDs. 

### Duplicate Feedback Prevention
To prevent spam, a secondary table (`feedback_submissions`) tracks if a student has evaluated a course. When submitting, a MySQL Transaction combined with a `FOR UPDATE` lock guarantees that concurrent requests cannot bypass the duplicate check.

### Role-Based Authorization
A robust middleware chain intercepts all API traffic. Every token is verified, and endpoints require the caller to possess the exact required role (`isAdmin`, `isFaculty`, `isStudent`). Bypassing the frontend UI will still result in `HTTP 403 Forbidden` responses from the backend.

### Testing & Verification Summary
- **Functional Testing**: End-to-end testing confirmed seamless data flow from Admin provisioning through Student feedback submission to Faculty visualization.
- **Security Testing**: Dedicated test scripts successfully verified that duplicate submissions are blocked (HTTP 400) without database corruption, and privilege escalation attacks are safely intercepted (HTTP 403).
