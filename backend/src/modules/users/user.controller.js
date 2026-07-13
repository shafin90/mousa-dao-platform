const userService = require('./user.service');

const getMyProfile = async (req, res) => {
  try {
    const user = await userService.getMyProfile(req.user._id);
    res.json({ success: true, message: 'Profile retrieved', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const user = await userService.updateMyProfile(req.user._id, req.body);
    res.json({ success: true, message: 'Profile updated', data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const data = await userService.getAllUsers(req.user.companyId, req.query);
    res.json({ success: true, message: 'Users retrieved', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id, req.user.companyId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User retrieved', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You cannot lock your own account' });
    }
    const user = await userService.updateUserStatus(req.params.id, req.user.companyId, req.body.isActive);
    res.json({ success: true, message: 'User status updated', data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const user = await userService.updateUserRole(req.params.id, req.user.companyId, req.body.role);
    res.json({ success: true, message: 'User role updated', data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.user.companyId, req.body);
    res.status(201).json({ success: true, message: 'User created', data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.user.companyId, req.body);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User updated', data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You cannot delete your own account' });
    }
    const user = await userService.deleteUser(req.params.id, req.user.companyId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted', data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { 
  createUser,
  getMyProfile, 
  updateMyProfile, 
  getAllUsers, 
  getUserById, 
  updateUserStatus, 
  updateUserRole,
  updateUser,
  deleteUser
};
