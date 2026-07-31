const authService = require('../services/auth.service');
const tokenService = require('../services/auth.token.service');
const { respond } = require('../../../utils/response');

const register = async (req, res, next) => {
  try {
    const data = await authService.register(req.body);
    respond(res, 201, data, 'User registered');
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const data = await authService.login(req.body);
    respond(res, 200, data, 'Logged in');
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res) => {
  respond(res, 200, req.user);
};

const setPassword = async (req, res, next) => {
  try {
    const data = await authService.setPassword(req.user._id, req.user.companyId, req.body.password);
    respond(res, 200, data, 'Password set successfully');
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];
    await tokenService.blacklistToken(token);
    respond(res, 200, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const data = await authService.refreshToken(req.body.refreshToken);
    respond(res, 200, data, 'Token refreshed');
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const data = await authService.forgotPassword(req.body.email);
    respond(res, 200, data, 'Password reset email sent');
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const data = await authService.resetPassword(req.body.token, req.body.password);
    respond(res, 200, data, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const data = await authService.changePassword(
      req.user._id,
      req.user.companyId,
      req.body.currentPassword,
      req.body.newPassword,
    );
    respond(res, 200, data, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  setPassword,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
};
