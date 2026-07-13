const AppError = require('../errors/AppError');
const ErrorCodes = require('../errors/errorCodes');

/**
 * Joi validation middleware factory.
 *
 * Validates req.body against a provided Joi schema.
 * Throws AppError with VALIDATION_ERROR code on failure.
 *
 * @param {Object} schema - Joi schema object
 * @returns {Function} Express middleware
 */
module.exports = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const message = error.details.map((d) => d.message).join(', ');
      return next(new AppError(message, 400, ErrorCodes.VALIDATION_ERROR));
    }
    next();
  };
};
