const logger = require('../logger');

/**
 * Custom Application Error class with HTTP status code and standardized error code
 */
class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Standardized Global Error Handler Middleware
 * Adheres strictly to the SRS format: { "error": { "code": "...", "message": "..." } }
 */
const errorHandler = (err, req, res, next) => {
  // If headers already sent, delegate to standard express error handler
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || 500;
  let code = err.errorCode || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred. Please try again later.';

  // Handle SyntaxError (e.g. malformed JSON body)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Malformed JSON in request body.';
  }

  // Handle PostgreSQL specific constraints
  if (err.code === '23505') { // unique_violation
    statusCode = 409;
    code = 'CONFLICT';
    message = 'A record with this identifier already exists.';
  } else if (err.code === '23503') { // foreign_key_violation
    statusCode = 400;
    code = 'FOREIGN_KEY_VIOLATION';
    message = 'Referenced resource does not exist.';
  }

  // Structured logging for diagnostics: log auth failures and registration conflicts
  if (process.env.NODE_ENV !== 'test') {
    const logData = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      statusCode,
      errorCode: code,
      errorMessage: err.message,
    };

    if (code === 'INVALID_CREDENTIALS' || statusCode === 401 || statusCode === 403) {
      logger.warn(logData, 'Authentication/Authorization Failure');
    } else if (code === 'EVENT_FULL' || code === 'ALREADY_REGISTERED' || statusCode === 409) {
      logger.warn(logData, 'Registration Conflict Encountered');
    } else if (statusCode >= 500) {
      logger.error({ ...logData, stack: err.stack }, 'Internal Server Exception');
    }
  }

  const responsePayload = {
    error: {
      code,
      message,
    }
  };

  if (err.details && process.env.NODE_ENV === 'development') {
    responsePayload.error.details = err.details;
  }

  return res.status(statusCode).json(responsePayload);
};

module.exports = {
  AppError,
  errorHandler,
};
