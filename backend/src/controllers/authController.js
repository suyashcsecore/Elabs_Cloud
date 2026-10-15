const config = require('../config');
const authService = require('../services/authService');

/**
 * Configure secure HttpOnly cookie settings
 */
const getCookieOptions = () => ({
  httpOnly: true,
  secure: config.isProduction, // HTTPS in production
  sameSite: config.isProduction ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  path: '/',
});

/**
 * POST /api/auth/register
 * Public registration for Student accounts
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const { user, token } = await authService.registerUser({ name, email, password });

    // Set JWT in HttpOnly cookie
    res.cookie(config.jwt.cookieName, token, getCookieOptions());

    return res.status(201).json({
      message: 'Account created successfully.',
      data: {
        user,
        token, // Also returned in body for non-browser / mobile clients
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Public authentication
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.loginUser({ email, password });

    // Set JWT in HttpOnly cookie
    res.cookie(config.jwt.cookieName, token, getCookieOptions());

    return res.status(200).json({
      message: 'Logged in successfully.',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Clear authentication cookie
 */
const logout = async (req, res) => {
  res.clearCookie(config.jwt.cookieName, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'none' : 'lax',
    path: '/',
  });

  return res.status(200).json({
    message: 'Logged out successfully.',
  });
};

/**
 * GET /api/auth/me
 * Return currently authenticated user profile
 */
const getMe = async (req, res) => {
  return res.status(200).json({
    data: {
      user: req.user,
    },
  });
};

module.exports = {
  register,
  login,
  logout,
  getMe,
};
