const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { authenticateToken, authenticateTempToken } = require('../middleware/auth');

const login2FaLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // Limit each token/IP to 5 requests per windowMs
  keyGenerator: (req) => {
    // Karena endpoint ini spesifik untuk satu tempToken, batasi berdasarkan tokennya saja.
    return req.headers.authorization ? req.headers.authorization : 'unknown_token';
  },
  message: { success: false, message: 'Too many OTP attempts, please try again later.' }
});


router.get('/captcha', authController.getCaptcha);
router.post('/login', authController.login);
router.post('/login-2fa', login2FaLimiter, authController.login2FA);
router.post('/register', authController.register);
router.post('/logout', authenticateToken, authController.logout);
router.get('/me', authenticateToken, authController.getMe);
router.post('/2fa/generate', authenticateTempToken, authController.generate2FA);
router.post('/2fa/verify-setup', authenticateTempToken, authController.verifySetup2FA);

module.exports = router;
