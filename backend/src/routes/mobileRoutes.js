const express = require('express');
const mobileController = require('../controllers/mobileController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

router.get(
  '/sync',
  authenticateToken,
  authorizeRole(['USER', 'MASYARAKAT', 'OPD', 'PEGAWAI']),
  mobileController.getSyncData
);

module.exports = router;