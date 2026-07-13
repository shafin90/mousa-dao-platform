const AppError = require('../errors/AppError');

/**
 * Global error-handling middleware.
 *
 * FLOW:
 * 1. If AppError → return structured error with code + statusCode
 * 2. If Mongoose ValidationError → transform to 400 with VALIDATION_ERROR
 * 3. If Mongoose 11000 (duplicate) → transform to 409 with CONFLICT
 * 4. Otherwise → return 500 with INTERNAL_ERROR
 *
 * INPUT:
 * @param {Error} err - Thrown error
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next
 *
 * OUTPUT: JSON error response
 */
const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
    });
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: messages.join(', '),
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {}).join(', ');
    return res.status(409).json({
      success: false,
      code: 'CONFLICT',
      message: `Duplicate value for: ${field}`,
    });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Invalid or expired token',
    });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  });
};

module.exports = errorHandler;
