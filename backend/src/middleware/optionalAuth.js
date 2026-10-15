const jwt = require('jsonwebtoken');
const config = require('../config');
const { query } = require('../db');

/**
 * Optional authentication middleware:
 * If a valid token exists, populates req.user.
 * If not, proceeds without error (used for public endpoints where personalization is optional).
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token = null;

    if (req.cookies && req.cookies[config.jwt.cookieName]) {
      token = req.cookies[config.jwt.cookieName];
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      const userRes = await query(
        'SELECT id, name, email, role, status FROM users WHERE id = $1 AND status = $2',
        [decoded.id, 'ACTIVE']
      );

      if (userRes.rowCount > 0) {
        req.user = userRes.rows[0];
      } else {
        req.user = null;
      }
    } catch (e) {
      req.user = null;
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  optionalAuth,
};
