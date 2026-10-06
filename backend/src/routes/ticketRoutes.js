const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// USER & ALL ROLES (Untuk pembuatan tiket)
router.post('/my/tickets', authenticateToken, authorizeRole(['USER', 'MASYARAKAT', 'HELPDESK', 'PEGAWAI', 'ADMIN']), ticketController.createTicket);
router.get('/my/tickets', authenticateToken, authorizeRole(['USER', 'MASYARAKAT', 'HELPDESK', 'PEGAWAI', 'ADMIN']), ticketController.getMyTickets);
router.patch('/my/tickets/:id', authenticateToken, authorizeRole(['USER', 'MASYARAKAT', 'ADMIN']), ticketController.updateTicketData);
router.post('/my/tickets/:id/feedback', authenticateToken, authorizeRole(['USER', 'MASYARAKAT', 'HELPDESK', 'PEGAWAI', 'ADMIN']), ticketController.submitFeedback);
router.post('/my/tickets/:id/dispute', authenticateToken, authorizeRole(['USER', 'MASYARAKAT', 'ADMIN']), ticketController.disputeTicket);

// HELPDESK
router.get('/helpdesk/tickets', authenticateToken, authorizeRole(['HELPDESK', 'ADMIN']), ticketController.getHelpdeskTickets);
router.patch('/helpdesk/tickets/:id/verify', authenticateToken, authorizeRole(['HELPDESK', 'ADMIN']), ticketController.verifyTicket);
router.patch('/helpdesk/tickets/:id/assign', authenticateToken, authorizeRole(['HELPDESK', 'ADMIN']), ticketController.assignTicket);

// EMPLOYEE
router.get('/employee/tickets', authenticateToken, authorizeRole(['PEGAWAI', 'ADMIN']), ticketController.getEmployeeTickets);
router.patch('/employee/tickets/:id/progress', authenticateToken, authorizeRole(['PEGAWAI']), ticketController.updateProgress);

// ADMIN
router.get('/admin/tickets', authenticateToken, authorizeRole(['ADMIN']), ticketController.getAdminTickets);

// GENERAL
router.get('/tickets/:id/history', authenticateToken, ticketController.getHistory);
router.patch('/tickets/:id/reject', authenticateToken, authorizeRole(['HELPDESK', 'PEGAWAI', 'ADMIN']), ticketController.rejectTicket);
router.post('/tickets/:id/subtasks', authenticateToken, authorizeRole(['PEGAWAI', 'ADMIN']), ticketController.createSubtask);
router.patch('/tickets/:id/subtasks/:subtaskId/status', authenticateToken, authorizeRole(['PEGAWAI', 'ADMIN']), ticketController.updateSubtaskStatus);

module.exports = router;
