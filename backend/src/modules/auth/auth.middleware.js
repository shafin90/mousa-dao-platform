const jwt = require('jsonwebtoken');
const userRepository = require('../users/repositories/user.repository');
const AppError = require('../../errors/AppError');
const ErrorCodes = require('../../errors/errorCodes');
const Audit = require('../audit/audit.model');
const { isTokenBlacklisted } = require('./services/auth.token.service');

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
    if (await isTokenBlacklisted(token)) {
      throw new AppError('Token has been revoked', 401, ErrorCodes.INVALID_TOKEN);
    }

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

/**
 * Logs manager actions to the audit trail.
 * Fire-and-forget: never blocks the request.
 */
const logManagerAction = (action, module) => {
  return (req, res, next) => {
    if (req.user && req.user.role === 'manager') {
      Audit.create({
        companyId: req.user.companyId,
        userId: req.user._id,
        action,
        module,
        description: `${req.method} ${req.originalUrl}`,
        metadata: {
          body: ['PATCH', 'POST'].includes(req.method) ? req.body : undefined,
          params: req.params,
        },
        status: 'success',
        ipAddress: req.ip || req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent'],
      }).catch(err => console.error('Manager audit log failed:', err));
    }
    next();
  };
};

/**
 * Authenticates a download request by verifying the JWT.
 * Accepts token from Authorization header or query parameter.
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next
 */
const downloadAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization
      ? req.headers.authorization.split(' ')[1]
      : req.query.token;

    if (!token) {
      throw new AppError('Authentication required', 401, ErrorCodes.AUTH_REQUIRED);
    }

    if (await isTokenBlacklisted(token)) {
      throw new AppError('Token has been revoked', 401, ErrorCodes.INVALID_TOKEN);
    }

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

module.exports = { authenticate, downloadAuth, requireRole, requireTenantContext, logManagerAction };
