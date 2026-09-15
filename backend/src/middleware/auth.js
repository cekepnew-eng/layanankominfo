const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Access Denied: No token provided' });

  jwt.verify(token, process.env.JWT_SECRET || 'secret-key-kominfo-2026', (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid or Expired Token' });
    if (user.purpose) return res.status(403).json({ success: false, message: 'Temporary tokens cannot access this route' });
    req.user = user;
    next();
  });
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
