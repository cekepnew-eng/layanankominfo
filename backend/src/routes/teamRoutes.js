const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/', authenticateToken, authorizeRole(['ADMIN', 'HELPDESK']), teamController.getAllTeams);
router.post('/', authenticateToken, authorizeRole(['ADMIN']), teamController.createTeam);
router.put('/:id', authenticateToken, authorizeRole(['ADMIN']), teamController.updateTeam);
router.delete('/:id', authenticateToken, authorizeRole(['ADMIN']), teamController.deleteTeam);

module.exports = router;
