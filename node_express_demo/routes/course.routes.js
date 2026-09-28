const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controllers');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

router.use(verifyToken);

router.get('/', courseController.findAll);

// Admin only routes
router.post('/', isAdmin, courseController.create);
router.put('/:id', isAdmin, courseController.update);
router.delete('/:id', isAdmin, courseController.delete);

module.exports = router;
