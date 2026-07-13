/**
 * Custom application error with consistent error codes and HTTP status.
 *
 * FLOW:
 * 1. Extends native Error
 * 2. Attaches HTTP status code and error code
 * 3. Used across all layers for uniform error handling
 *
 * INPUT:
 * @param {string} message - Human-readable error description
 * @param {number} statusCode - HTTP status code (default 400)
 * @param {string} code - Machine-readable error code (e.g. "SEAT_ALREADY_BOOKED")
 *
 * OUTPUT:
 * @returns {AppError} Error instance with code and statusCode
 *
 * SIDE EFFECTS: None
 */
class AppError extends Error {
  constructor(message, statusCode = 400, code = 'UNKNOWN_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
