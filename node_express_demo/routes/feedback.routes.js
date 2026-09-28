const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback.controllers');
const { verifyToken, isStudent, isFaculty, isAdmin } = require('../middlewares/auth.middleware');

router.use(verifyToken);

// Students submit feedback
router.post('/submit', isStudent, feedbackController.submitFeedback);

// Get courses available for feedback for a student
router.get('/pending', isStudent, feedbackController.getPendingFeedback);

// Admins and faculty can view stats
router.get('/stats', feedbackController.getStats);

// Admins and faculty can view comments
router.get('/comments', feedbackController.getComments);

module.exports = router;
