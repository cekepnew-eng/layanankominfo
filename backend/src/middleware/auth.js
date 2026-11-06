const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Access Denied: No token provided' });

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || 'secret-key-kominfo-2026');
    if (user.purpose) return res.status(403).json({ success: false, message: 'Temporary tokens cannot access this route' });
    const sessionResult = await db.query(
      'SELECT session_version FROM users WHERE id = $1 AND is_active = true',
      [user.id]
    );
    if (!sessionResult.rows[0] || Number(user.sessionVersion) !== Number(sessionResult.rows[0].session_version)) {
      return res.status(401).json({
        success: false,
        message: 'Sesi login telah digantikan oleh login baru. Silakan login kembali.'
      });
    }
    const passwordChangeRequired = Boolean(
      user.passwordChangeRequired ||
      (user.passwordExpiresAt !== null &&
        user.passwordExpiresAt !== undefined &&
        Date.now() >= Number(user.passwordExpiresAt))
    );
    if (
      passwordChangeRequired
      && !(req.method === 'PUT' && req.baseUrl === '/api/auth' && req.path === '/profile')
      && !(req.method === 'POST' && req.baseUrl === '/api/auth' && req.path === '/logout')
    ) {
      return res.status(403).json({
        success: false,
        requiresPasswordChange: true,
        message: 'Masa berlaku kata sandi satu tahun telah berakhir. Ganti kata sandi untuk melanjutkan.'
      });
    }
    req.user = { ...user, passwordChangeRequired };
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError' || err.name === 'NotBeforeError') {
      return res.status(403).json({ success: false, message: 'Invalid or Expired Token' });
    }
    console.error('authenticateToken session validation error:', err);
    return res.status(500).json({ success: false, message: 'Sesi pengguna tidak dapat divalidasi.' });
  }
};

const authorizeRole = (rolesArray) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges' });
    }
    
    const userRoles = req.user.roles || [req.user.role];
    const hasAccess = userRoles.some(r => rolesArray.includes(r));
    
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges' });
    }
    next();
  };
};

const authenticateTempToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Access Denied: No token provided' });

  jwt.verify(token, process.env.JWT_SECRET || 'secret-key-kominfo-2026', (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid or Expired Token' });
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken, authorizeRole, authenticateTempToken };
