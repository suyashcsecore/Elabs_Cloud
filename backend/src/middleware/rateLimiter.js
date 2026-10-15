const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for authentication endpoints (prevent brute-force attacks)
 * Limits requests per IP address
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 20, // generous limit during testing
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
    },
  },
});

module.exports = {
  authLimiter,
};
