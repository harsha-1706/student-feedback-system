# Student Feedback System

A full-stack web application for collecting **anonymous student feedback** on courses and faculty, with secure role-based access, duplicate-submission prevention, and feedback analytics.

Built using **HTML, CSS, Bootstrap, Vanilla JavaScript, Node.js, Express.js, MySQL, JWT, bcryptjs, and Chart.js**.

---

## 📌 Project Overview

The **Student Feedback System** is a role-based academic feedback platform designed to provide educational institutions with a secure and structured method for collecting student feedback.

Students can submit feedback for their enrolled courses and assigned faculty members without exposing their identity to faculty or administrators.

The system provides separate dashboards for:

- **Admin**
- **Faculty**
- **Student**

Administrators manage users, courses, faculty assignments, and student enrollments. Faculty members can view aggregate feedback statistics and anonymous comments for their assigned courses. Students can view their pending feedback forms and submit one anonymous response per course/faculty combination.

The application uses a **Node.js + Express REST API**, **MySQL relational database**, **JWT authentication**, **bcrypt password hashing**, and **role-based authorization**.

---

## 🎯 Problem Statement

Educational institutions require a reliable mechanism for collecting student feedback to evaluate and improve teaching quality.

A feedback system should provide:

- Student anonymity
- Secure authentication
- Role-based access
- Prevention of duplicate submissions
- Reliable data storage
- Meaningful feedback analytics
- Easy administration of courses, faculty, and students

Traditional or poorly designed feedback mechanisms may expose student identities, allow duplicate submissions, or provide limited analytical capabilities.

The Student Feedback System addresses these requirements through a centralized web-based platform with database-level integrity and backend-enforced security.

---

## ✨ Key Features

### 🔐 Secure Authentication

- JWT-based authentication
- Password hashing using bcryptjs
- Inactive accounts cannot log in
- Protected backend routes

### 👥 Role-Based Access Control

Three application roles are supported:

- Admin
- Faculty
- Student

Authorization is enforced at the backend level, preventing users from accessing functionality outside their assigned role.

### 🕵️ Anonymous Feedback

Student identity is not stored in the actual `feedback` table.

The system separates:

- feedback content
- submission-tracking information

This allows duplicate-submission prevention while keeping student identity separated from the feedback displayed to faculty.

### 🚫 Duplicate Feedback Prevention

A student can submit feedback only once for a particular course/faculty combination.

The backend uses:

- `feedback_submissions`
- composite primary keys
- MySQL transactions
- row-level locking using `FOR UPDATE`

to protect against duplicate and concurrent submissions.

### 📊 Feedback Analytics

Faculty and administrators can view aggregate feedback statistics.

Chart.js is used to visualize:

- Teaching Rating
- Communication Rating
- Overall Rating

### 💬 Anonymous Comments

Faculty members can view anonymous student comments associated with their assigned courses.

Student identity is not displayed with comments.

### 👤 User Management

Administrators can:

- Create users
- View users
- Manage user roles
- Deactivate accounts

### 📚 Course Management

Administrators can:

- Create courses
- View courses
- Manage course information

### 🎓 Enrollment & Faculty Assignment

Administrators can:

- Enroll students in courses
- Assign faculty members to courses
- View existing assignments

### ♻️ Soft Deactivation

User accounts are deactivated instead of being physically deleted, allowing historical relationships and feedback data to remain consistent.

### 📱 Responsive Interface

The frontend is designed for:

- Desktop
- Laptop
- Tablet
- Mobile

using Bootstrap and responsive CSS.

---

# 👥 User Roles

## 👨💼 Admin

The administrator manages the overall system.

### Capabilities

- Manage users
- Create and manage courses
- Assign faculty to courses
- Enroll students in courses
- Deactivate user accounts
- View global feedback statistics

---

## 👨🏫 Faculty

Faculty members can access feedback associated with their assigned courses.

### Capabilities

- View assigned courses
- View aggregate feedback ratings
- View anonymous student comments
- View feedback statistics

Faculty members cannot access administrative user-management functionality.

---

## 🎓 Student

Students can provide feedback for their enrolled courses.

### Capabilities

- View enrolled courses
- View pending feedback forms
- Submit feedback
- Provide ratings
- Add optional comments

Each student can submit only one feedback response for a particular course/faculty combination.

---

# 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | HTML5, CSS3, Bootstrap 5, Vanilla JavaScript |
| API Communication | Fetch API |
| Visualization | Chart.js |
| Backend | Node.js, Express.js |
| Database | MySQL 8.0+ |
| Database Driver | mysql2 |
| Authentication | JSON Web Token (JWT) |
| Password Security | bcryptjs |
| Architecture | REST API |

---

# 🏗️ System Architecture

The application follows a layered architecture:

```text
┌───────────────────────────────┐
│          Frontend             │
│                               │
│ HTML + CSS + Bootstrap        │
│ Vanilla JavaScript            │
│ Fetch API + Chart.js          │
└───────────────┬───────────────┘
                │
                │ HTTP / REST API
                ▼
┌───────────────────────────────┐
│        Express Backend        │
│                               │
│ Routes                        │
│ Middleware                    │
│ Controllers                   │
│ JWT Authentication            │
│ Role-Based Authorization      │
└───────────────┬───────────────┘
                │
                │ Parameterized SQL
                ▼
┌───────────────────────────────┐
│          MySQL                │
│                               │
│ Users                         │
│ Courses                       │
│ Enrollments                   │
│ Faculty Assignments           │
│ Feedback                      │
│ Submission Tracking           │
└───────────────────────────────┘
```

### Architecture Layers

**Frontend Layer**

Responsible for:

- User interface
- Form validation
- Dashboard rendering
- API communication
- Chart visualization
- Loading and notification states

**Backend API Layer**

Responsible for:

- Request routing
- Authentication
- Authorization
- Input validation
- Business logic
- Database operations
- Feedback transaction handling

**Database Layer**

Responsible for:

- Persistent data storage
- Relationships
- Primary and foreign keys
- Uniqueness constraints
- Transactional integrity

---

# 🗄️ Database Design

The system uses a relational MySQL database named:

```text
student_feedback_system
```

## Tables

### `users`

Stores authentication and user information.

Important fields include:

- `id`
- `username`
- `password_hash`
- `role`
- `name`
- `is_active`
- `created_at`

---

### `courses`

Stores course information.

Important fields:

- `id`
- `course_code`
- `course_name`

---

### `faculty_courses`

Maps faculty members to courses.

```text
faculty_id + course_id
```

are used as a composite primary key.

---

### `enrollments`

Maps students to their enrolled courses.

```text
student_id + course_id
```

are used as a composite primary key.

---

### `feedback`

Stores the actual anonymous feedback.

It contains:

- Course
- Faculty
- Teaching rating
- Communication rating
- Overall rating
- Comments
- Timestamp

**Important:** This table does not contain `student_id`.

---

### `feedback_submissions`

Tracks whether a student has already submitted feedback for a particular course/faculty combination.

Composite key:

```text
student_id + course_id + faculty_id
```

This table is used specifically for submission tracking and duplicate prevention.

---

# 🔐 Security & Privacy

## JWT Authentication

After successful login, the backend issues a JWT.

Protected requests use:

```text
Authorization: Bearer <token>
```

The backend verifies the token before allowing access to protected resources.

---

## Role-Based Authorization

Authorization is enforced by backend middleware.

Examples include:

```text
verifyToken
isAdmin
isFaculty
isStudent
```

Frontend restrictions alone are not relied upon.

Even if a user manually sends an API request, the backend verifies their role and returns `403 Forbidden` when access is not permitted.

---

## Password Security

Passwords are never stored as plaintext.

The system uses:

```text
bcryptjs
```

for password hashing and verification.

---

## SQL Injection Protection

Database operations use parameterized SQL queries.

User-provided values are passed separately from SQL statements rather than being directly concatenated into queries.

---

## Anonymous Feedback

Student identity is deliberately separated from feedback content.

The architecture uses two different concepts:

```text
Student Identity
      │
      ▼
feedback_submissions
      │
      │
      │ duplicate tracking
      ▼

Feedback Content
      │
      ▼
feedback
```

The `feedback` table does not contain a student identifier.

When faculty members view comments or statistics, student identity is not returned.

---

## Duplicate Submission Protection

Feedback submission is handled using a database transaction:

```text
BEGIN TRANSACTION
       │
       ▼
Check submission record
       │
       ▼
Acquire row lock
       │
       ▼
Insert feedback
       │
       ▼
Insert submission record
       │
       ▼
COMMIT
```

If any operation fails:

```text
ROLLBACK
```

is executed.

This prevents inconsistent database states and protects against concurrent duplicate submissions.

---

# 🔌 REST API Overview

## Authentication

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Authenticate user and return JWT |

---

## User Management

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/users` | Admin | Get users |
| POST | `/api/users` | Admin | Create user |
| PUT | `/api/users/:id` | Admin | Update user |
| DELETE | `/api/users/:id` | Admin | Delete user |
| PUT | `/api/users/:id/deactivate` | Admin | Deactivate user |

---

## Course Management

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/courses` | Authenticated | Get courses |
| POST | `/api/courses` | Admin | Create course |
| PUT | `/api/courses/:id` | Admin | Update course |
| DELETE | `/api/courses/:id` | Admin | Delete course |

---

## Faculty Assignments

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/assignments/faculty` | Admin | Assign faculty to course |
| GET | `/api/assignments/faculty` | Admin | View faculty assignments |
| DELETE | `/api/assignments/faculty/:facultyId/:courseId` | Admin | Remove assignment |

---

## Student Enrollments

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/assignments/student` | Admin | Enroll student |
| GET | `/api/assignments/student` | Admin | View enrollments |
| DELETE | `/api/assignments/student/:studentId/:courseId` | Admin | Remove enrollment |

---

## Feedback

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/feedback/pending` | Student | Get pending feedback |
| POST | `/api/feedback/submit` | Student | Submit anonymous feedback |
| GET | `/api/feedback/stats` | Admin / Faculty | Get aggregate statistics |
| GET | `/api/feedback/comments` | Admin / Faculty | Get anonymous comments |

---

# 📂 Project Structure

```text
student-feedback-system/
│
├── backend/
│   ├── config/
│   │   └── db.config.js
│   │
│   ├── controllers/
│   │   ├── assignment.controllers.js
│   │   ├── auth.controllers.js
│   │   ├── course.controllers.js
│   │   ├── feedback.controllers.js
│   │   └── user.controllers.js
│   │
│   ├── middlewares/
│   │   └── auth.middleware.js
│   │
│   ├── routes/
│   │   ├── assignment.routes.js
│   │   ├── auth.routes.js
│   │   ├── course.routes.js
│   │   ├── feedback.routes.js
│   │   └── user.routes.js
│   │
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   ├── server.js
│   └── setup_db.js
│
├── frontend/
│   ├── admin/
│   │   ├── admin.js
│   │   └── dashboard.html
│   │
│   ├── assets/
│   │   ├── css/
│   │   │   └── style.css
│   │   └── js/
│   │       ├── api.js
│   │       └── auth.js
│   │
│   ├── faculty/
│   │   └── dashboard.html
│   │
│   ├── student/
│   │   ├── dashboard.html
│   │   └── feedback-form.html
│   │
│   └── index.html
│
├── .gitignore
└── README.md
```

---

# ⚙️ Installation & Setup

## Prerequisites

Install the following before running the project:

- Node.js
- npm
- MySQL Server
- A modern web browser
- Git

---

## 1. Clone the Repository

```bash
git clone https://github.com/harsha-1706/student-feedback-system.git
cd student-feedback-system
```

---

## 2. Configure the Backend

Navigate to the backend:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create the environment file:

```bash
cp .env.example .env
```

On Windows PowerShell, you can also use:

```powershell
Copy-Item .env.example .env
```

Update `.env` with your local MySQL configuration:

```env
PORT=4000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=student_feedback_system
JWT_SECRET=your_secure_jwt_secret
```

---

## 3. Initialize the Database

From the `backend` directory:

```bash
npm run setup
```

The setup script creates:

- Database
- Tables
- Relationships
- Constraints
- Default development administrator

---

## 4. Start the Backend

```bash
npm start
```

The API will run on:

```text
http://localhost:4000
```

---

## 5. Start the Frontend

Serve the `frontend` directory using a local web server.

For example:

```bash
npx serve frontend
```

Then open the URL provided by the local server.

---

# 🔑 Default Development Account

The database setup script creates a default development administrator:

```text
Username: admin
Password: admin123
```

> ⚠️ **Development Only:** `admin123` is included solely for local development and demonstration. Change the credential or deactivate the account before using the system in a production environment.

---

# 🖥️ Application Screenshots

Screenshots can be added here to demonstrate the main application interfaces.

### Login

_Add login screenshot here._

### Admin Dashboard

_Add admin dashboard screenshot here._

### User Management

_Add user management screenshot here._

### Faculty Dashboard

_Add faculty dashboard screenshot here._

### Student Dashboard

_Add student dashboard screenshot here._

### Feedback Form

_Add feedback form screenshot here._

---

# 🧪 Testing & Verification

The application was tested across its major functional and security boundaries.

## Functional Testing

Verified workflows include:

- Admin authentication
- Faculty authentication
- Student authentication
- User creation
- User deactivation
- Course creation
- Faculty assignment
- Student enrollment
- Pending feedback retrieval
- Feedback submission
- Faculty statistics
- Anonymous comments
- Admin statistics

---

## Security Testing

The system was verified for:

- JWT authentication
- Role-based authorization
- Unauthorized API access
- Password hashing
- SQL parameterization
- Inactive account protection
- Student identity protection
- Duplicate feedback prevention
- Transaction rollback behavior

Unauthorized role access correctly returns:

```text
HTTP 403 Forbidden
```

Duplicate feedback submission is rejected without creating additional feedback records.

---

# 📈 Future Enhancements

Possible future improvements include:

- Email notifications for pending feedback
- Institution-level multi-department support
- Advanced analytics and historical trend charts
- Export feedback reports as PDF/CSV
- Semester and academic-year management
- Course-wise comparison reports
- Improved administrative reporting
- Deployment using a cloud database and hosting platform
- Additional accessibility enhancements

---

# 🎓 Academic Context

This project was developed as part of an **NRD Laboratory / academic full-stack web development project**.

The project demonstrates practical implementation of:

- Full-stack web development
- REST API design
- Relational database design
- Authentication
- Authorization
- CRUD operations
- Transaction management
- Data privacy
- Frontend-backend integration
- Data visualization
- Responsive UI/UX

---

# 👨💻 Author

**Harshavardhan Varma**

GitHub: [@harsha-1706](https://github.com/harsha-1706)

---

# 📄 License

This project is intended primarily for academic and educational purposes.
