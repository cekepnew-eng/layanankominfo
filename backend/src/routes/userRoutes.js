const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/', authenticateToken, authorizeRole(['ADMIN']), userController.getAllUsers);
router.put('/:id/role', authenticateToken, authorizeRole(['ADMIN']), userController.updateUserRole);
router.delete('/:id', authenticateToken, authorizeRole(['ADMIN']), userController.deleteUser);

module.exports = router;
