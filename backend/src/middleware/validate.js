const { AppError } = require('./errorHandler');

/**
 * Higher-order middleware factory to validate request parts (body, query, params) against Zod schemas
 * @param {import('zod').ZodSchema} schema 
 * @param {'body' | 'query' | 'params'} [source='body']
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed; // assign sanitized and parsed data
      next();
    } catch (err) {
      // Format Zod validation errors cleanly
      if (err.errors && Array.isArray(err.errors)) {
        const firstError = err.errors[0];
        const fieldName = firstError.path.join('.') || source;
        const errorMessage = `${fieldName}: ${firstError.message}`;
        return next(new AppError(errorMessage, 400, 'VALIDATION_ERROR', err.errors));
      }
      return next(new AppError('Invalid input provided.', 400, 'VALIDATION_ERROR'));
    }
  };
};

module.exports = {
  validate,
};
