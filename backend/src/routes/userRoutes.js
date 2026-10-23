const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/opd-list', authenticateToken, authorizeRole(['ADMIN', 'HELPDESK']), userController.getOpdUsers);
router.get('/', authenticateToken, authorizeRole(['ADMIN']), userController.getAllUsers);
router.put('/:id/role', authenticateToken, authorizeRole(['ADMIN']), userController.updateUserRole);
router.delete('/:id', authenticateToken, authorizeRole(['ADMIN']), userController.deleteUser);
router.post('/:id/reset2fa', authenticateToken, authorizeRole(['ADMIN']), userController.reset2FA);

router.post('/manual/verify-tnd', authenticateToken, authorizeRole(['ADMIN']), userController.verifyTndManualUser);
router.post('/manual', authenticateToken, authorizeRole(['ADMIN']), userController.createUserManual);
router.post('/manual/masyarakat', authenticateToken, authorizeRole(['ADMIN']), userController.createMasyarakatUserManual);

module.exports = router;
