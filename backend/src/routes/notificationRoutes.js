const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, notificationController.getMyNotifications);
router.patch('/read-all', authenticateToken, notificationController.readAllNotifications);
router.patch('/ticket/:ticketId/read', authenticateToken, notificationController.readTicketNotifications);
router.patch('/:id/read', authenticateToken, notificationController.readNotification);

module.exports = router;
