const jwt = require('jsonwebtoken');
const config = require('../config');
const { query } = require('../db');
const { AppError } = require('./errorHandler');

/**
 * Middleware: Verifies JWT token from HttpOnly cookie or Authorization Bearer header
 * Attaches authenticated user object to req.user
 */
const requireAuth = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check HttpOnly cookie first (primary auth mechanism)
    if (req.cookies && req.cookies[config.jwt.cookieName]) {
      token = req.cookies[config.jwt.cookieName];
    } 
    // 2. Fallback to Authorization Bearer header (allows CLI / API testing)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Authentication required. Please log in.', 401, 'NOT_AUTHENTICATED'));
    }

    // Verify token validity
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return next(new AppError('Session expired. Please log in again.', 401, 'TOKEN_EXPIRED'));
      }
      return next(new AppError('Invalid authentication token.', 401, 'INVALID_TOKEN'));
    }

    // Fetch user from DB to verify current status and active role
    const userRes = await query(
      'SELECT id, name, email, role, status FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userRes.rowCount === 0) {
      return next(new AppError('User account associated with this session no longer exists.', 401, 'USER_NOT_FOUND'));
    }

    const user = userRes.rows[0];

    // Check account status
    if (user.status !== 'ACTIVE') {
      return next(new AppError('Your account has been deactivated. Contact an administrator.', 403, 'ACCOUNT_DEACTIVATED'));
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware Factory: Enforces strict Role-Based Access Control (RBAC) on the server
 * @param  {...string} allowedRoles - List of roles permitted (e.g. 'ADMIN', 'ORGANIZER')
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'NOT_AUTHENTICATED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Forbidden: Access denied. Required role: [${allowedRoles.join(' or ')}]. Your role: ${req.user.role}`,
          403,
          'FORBIDDEN_ROLE'
        )
      );
    }

    next();
  };
};

module.exports = {
  requireAuth,
  requireRole,
};
