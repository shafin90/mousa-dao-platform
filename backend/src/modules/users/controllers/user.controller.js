const userService = require('../services/user.service');
const { respond, respondPaginated } = require('../../../utils/response');
const AppError = require('../../../errors/AppError');
const ErrorCodes = require('../../../errors/errorCodes');

const getMyProfile = async (req, res, next) => {
  try {
    const user = await userService.getMyProfile(req.user._id);
    respond(res, 200, user);
  } catch (error) { next(error); }
};

const updateMyProfile = async (req, res, next) => {
  try {
    const user = await userService.updateMyProfile(req.user._id, req.body);
    respond(res, 200, user, 'Profile updated');
  } catch (error) { next(error); }
};

const getAllUsers = async (req, res, next) => {
  try {
    const data = await userService.getAllUsers(req.user.companyId, req.query);
    respondPaginated(res, data.users, data.total, data.page, data.limit);
  } catch (error) { next(error); }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id, req.user.companyId);
    respond(res, 200, user);
  } catch (error) { next(error); }
};

const updateUserStatus = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      throw new AppError('You cannot lock your own account', 403, ErrorCodes.CANNOT_SELF_LOCK);
    }
    const user = await userService.updateUserStatus(req.params.id, req.user.companyId, req.body.isActive);
    respond(res, 200, user, 'User status updated');
  } catch (error) { next(error); }
};

const updateUserRole = async (req, res, next) => {
  try {
    const user = await userService.updateUserRole(req.params.id, req.user.companyId, req.body.role);
    respond(res, 200, user, 'User role updated');
  } catch (error) { next(error); }
};

const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.user.companyId, req.body);
    respond(res, 201, user, 'User created');
  } catch (error) { next(error); }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.user.companyId, req.body);
    if (!user) return respond(res, 404, null, 'User not found');
    respond(res, 200, user, 'User updated');
  } catch (error) { next(error); }
};

const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      throw new AppError('You cannot delete your own account', 403, ErrorCodes.CANNOT_SELF_DELETE);
    }
    const user = await userService.deleteUser(req.params.id, req.user.companyId);
    if (!user) return respond(res, 404, null, 'User not found');
    respond(res, 200, null, 'User deleted');
  } catch (error) { next(error); }
};

module.exports = { createUser, getMyProfile, updateMyProfile, getAllUsers, getUserById, updateUserStatus, updateUserRole, updateUser, deleteUser };
