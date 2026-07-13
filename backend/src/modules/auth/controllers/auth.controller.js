const authService = require('../services/auth.service');
const { respond } = require('../../../utils/response');

/**
 * POST /auth/register
 */
const register = async (req, res, next) => {
  try {
    const data = await authService.register(req.body);
    respond(res, 201, data, 'User registered');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/login
 */
const login = async (req, res, next) => {
  try {
    const data = await authService.login(req.body.email, req.body.password);
    respond(res, 200, data, 'Logged in');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /auth/me
 */
const getMe = async (req, res) => {
  respond(res, 200, req.user);
};

module.exports = { register, login, getMe };
