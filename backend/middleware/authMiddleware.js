const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'network-dashboard-dev-secret';

function authenticateToken(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication token is required.' });
  }

  const token = authorization.replace('Bearer ', '');

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (_error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

module.exports = {
  authenticateToken,
  JWT_SECRET
};