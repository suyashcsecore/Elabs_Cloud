const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { query } = require('../db');
const { AppError } = require('../middleware/errorHandler');

const SALT_ROUNDS = 12;

/**
 * Register a new Student user
 * Requirement: Always creates STUDENT role; ignores any role sent by client.
 */
const registerUser = async ({ name, email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Check if email already registered
  const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
  if (existing.rowCount > 0) {
    throw new AppError('An account with this email address already exists.', 409, 'DUPLICATE_EMAIL');
  }

  // 2. Hash password with bcrypt
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // 3. Create user in database (always forced to STUDENT)
  const insertRes = await query(
    `INSERT INTO users (name, email, password_hash, role, status)
     VALUES ($1, $2, $3, 'STUDENT', 'ACTIVE')
     RETURNING id, name, email, role, status, created_at`,
    [name.trim(), normalizedEmail, passwordHash]
  );

  const newUser = insertRes.rows[0];

  // 4. Generate JWT
  const token = generateToken(newUser);

  return {
    user: newUser,
    token,
  };
};

/**
 * Authenticate user credentials and return JWT
 */
const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Lookup user by email
  const userRes = await query(
    'SELECT id, name, email, password_hash, role, status FROM users WHERE email = $1',
    [normalizedEmail]
  );

  if (userRes.rowCount === 0) {
    // Generic error message for security (SRS 12.1)
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  const user = userRes.rows[0];

  // 2. Check if user is active
  if (user.status !== 'ACTIVE') {
    throw new AppError('Your account has been deactivated. Please contact support.', 403, 'ACCOUNT_DEACTIVATED');
  }

  // 3. Verify bcrypt password hash
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  // 4. Generate JWT
  const token = generateToken(user);

  // Exclude password_hash from returned object
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  };

  return {
    user: safeUser,
    token,
  };
};

/**
 * Helper: Generate signed JWT containing user ID and Role
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn,
    }
  );
};

module.exports = {
  registerUser,
  loginUser,
  generateToken,
};
