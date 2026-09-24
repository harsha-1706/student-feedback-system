const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const courseRoutes = require('./routes/course.routes');
const assignmentRoutes = require('./routes/assignment.routes');
const feedbackRoutes = require('./routes/feedback.routes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/feedback', feedbackRoutes);

app.get('/', (req, res) => {
    res.json({ message: "Welcome to Student Feedback System API" });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});
