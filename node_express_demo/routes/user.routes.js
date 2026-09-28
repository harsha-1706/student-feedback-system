const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controllers');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

router.use(verifyToken);
router.use(isAdmin);

router.get('/', userController.findAll);
router.post('/', userController.create);
router.put('/:id', userController.update);
router.put('/:id/deactivate', userController.deactivate);

module.exports = router;
