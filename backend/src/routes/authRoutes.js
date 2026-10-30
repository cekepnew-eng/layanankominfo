const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
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

const registrationOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    return `${ipKeyGenerator(req.ip)}:${email || 'invalid-email'}`;
  },
  message: { success: false, message: 'Terlalu banyak permintaan OTP. Coba lagi beberapa saat.' }
});

const registrationOtpIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Terlalu banyak permintaan OTP dari perangkat ini. Coba lagi beberapa saat.' }
});

const registrationVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Terlalu banyak percobaan OTP. Coba lagi beberapa saat.' }
});

const resetOtpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => {
    const identifier = String(req.body?.identifier || req.body?.email || '').trim().toLowerCase();
    return `${ipKeyGenerator(req.ip)}:${identifier || 'invalid-identifier'}`;
  },
  message: { success: false, message: 'Terlalu banyak permintaan pemulihan. Coba lagi beberapa saat.' }
});

const resetOtpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => {
    const identifier = String(req.body?.identifier || req.body?.email || '').trim().toLowerCase();
    return `${ipKeyGenerator(req.ip)}:${identifier || 'invalid-identifier'}`;
  },
  message: { success: false, message: 'Terlalu banyak percobaan kode. Coba lagi beberapa saat.' }
});

router.get('/captcha', authController.getCaptcha);
router.post('/login', authController.login);
router.post('/login-2fa', login2FaLimiter, authController.login2FA);
router.post('/2fa/skip-setup', login2FaLimiter, authenticateTempToken, authController.skip2FASetup);
router.post('/register/request-otp', registrationOtpIpLimiter, registrationOtpLimiter, authController.requestRegistrationOtp);
router.post('/register/verify-otp', registrationVerifyLimiter, authController.verifyRegistrationOtp);
router.post('/register', registrationVerifyLimiter, authController.register);
router.post('/logout', authenticateToken, authController.logout);
router.get('/me', authenticateToken, authController.getMe);
router.put('/profile', authenticateToken, authController.updateProfile);
router.post('/2fa/generate', authenticateTempToken, authController.generate2FA);
router.post('/2fa/verify-setup', login2FaLimiter, authenticateTempToken, authController.verifySetup2FA);
router.post('/2fa/profile/disable', authenticateToken, authController.disableProfile2FA);

// Forgot Password via Email OTP
router.post('/forgot-password/request-otp', resetOtpRequestLimiter, authController.requestResetOtp);
router.post('/forgot-password/validate-otp', resetOtpVerifyLimiter, authController.validateResetOtp);
router.post('/forgot-password/verify-2fa', resetOtpVerifyLimiter, authController.verifyReset2FA);
router.post('/forgot-password/verify-otp', resetOtpVerifyLimiter, authController.verifyResetOtp);

module.exports = router;
