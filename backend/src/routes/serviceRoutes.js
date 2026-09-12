const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Public Route
router.get('/services', serviceController.getPublicServices);

// Admin Routes for Categories
router.get('/admin/service-categories', authenticateToken, authorizeRole(['ADMIN']), serviceController.getCategories);
router.post('/admin/service-categories', authenticateToken, authorizeRole(['ADMIN']), serviceController.createCategory);
router.put('/admin/service-categories/:id', authenticateToken, authorizeRole(['ADMIN']), serviceController.updateCategory);
router.delete('/admin/service-categories/:id', authenticateToken, authorizeRole(['ADMIN']), serviceController.deleteCategory);

// Admin Routes for Services
router.get('/admin/services', authenticateToken, authorizeRole(['ADMIN']), serviceController.getAdminServices);
router.post('/admin/services', authenticateToken, authorizeRole(['ADMIN']), serviceController.createService);
router.put('/admin/services/:id', authenticateToken, authorizeRole(['ADMIN']), serviceController.updateService);
router.delete('/admin/services/:id', authenticateToken, authorizeRole(['ADMIN']), serviceController.deleteService);

// Admin Routes for Requirements
router.post('/admin/services/:id/requirements', authenticateToken, authorizeRole(['ADMIN']), serviceController.addRequirement);
router.delete('/admin/requirements/:id', authenticateToken, authorizeRole(['ADMIN']), serviceController.deleteRequirement);

module.exports = router;
