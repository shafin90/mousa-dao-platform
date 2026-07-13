const jwt = require('jsonwebtoken');
const userRepository = require('../users/repositories/user.repository');
const AppError = require('../../errors/AppError');
const ErrorCodes = require('../../errors/errorCodes');

/**
 * Authenticates a request by verifying the JWT in the Authorization header.
 *
 * FLOW:
 * 1. Extract Bearer token from Authorization header
 * 2. Decode and verify JWT
 * 3. Fetch user from DB (exclude password)
 * 4. Attach user + companyId to req.user
 *
 * INPUT:
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next
 *
 * OUTPUT:
 * - On success: attaches req.user with companyId, calls next()
 * - On failure: throws AppError
 *
 * SIDE EFFECTS: None
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401, ErrorCodes.AUTH_REQUIRED);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userRepository.findByIdAny(decoded.id);
    if (!user) throw new AppError('Invalid user', 401, ErrorCodes.USER_NOT_FOUND);

    req.user = user;
    req.user.companyId = decoded.companyId;
    next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(new AppError('Invalid token', 401, ErrorCodes.INVALID_TOKEN));
  }
};

/**
 * Restricts access to users with one of the specified roles.
 *
 * @param {Array<string>} roles - Allowed roles
 * @returns {Function} Express middleware
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Forbidden', 403, ErrorCodes.FORBIDDEN));
    }
    next();
  };
};

/**
 * Ensures the request has a tenant context (companyId).
 *
 * @returns {Function} Express middleware
 */
const requireTenantContext = (req, res, next) => {
  if (!req.user || !req.user.companyId) {
    return next(new AppError('Tenant context required', 403, ErrorCodes.TENANT_CONTEXT_REQUIRED));
  }
  next();
};

module.exports = { authenticate, requireRole, requireTenantContext };
