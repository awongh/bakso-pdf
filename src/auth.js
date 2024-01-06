const jwt = require('jsonwebtoken');

module.exports = function authenticateToken(req, res, next) {
  const secretKey = process.env.BAKSO_SECRET_KEY || null;

  // if secret key isn't set, default open
  if (secretKey === null) {
    next();
  }

  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  jwt.verify(token, secretKey, (err) => {
    if (err) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  });
};
