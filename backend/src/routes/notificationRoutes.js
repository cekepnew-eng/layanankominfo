const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, notificationController.getMyNotifications);
router.patch('/:id/read', authenticateToken, notificationController.readNotification);
router.patch('/read-all', authenticateToken, notificationController.readAllNotifications);

module.exports = router;
