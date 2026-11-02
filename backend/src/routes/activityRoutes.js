const express = require('express');
const activityController = require('../controllers/activityController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, activityController.getActivityLogs);

module.exports = router;
