const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignment.controllers');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

router.use(verifyToken);
router.use(isAdmin);

router.post('/faculty', assignmentController.assignFaculty);
router.delete('/faculty/:facultyId/:courseId', assignmentController.removeFaculty);
router.get('/faculty', assignmentController.getFacultyAssignments);

router.post('/student', assignmentController.enrollStudent);
router.delete('/student/:studentId/:courseId', assignmentController.removeStudent);
router.get('/student', assignmentController.getStudentEnrollments);

module.exports = router;
