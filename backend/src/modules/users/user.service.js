const User = require('./models/User');
const bcrypt = require('bcryptjs');

const createUser = async (companyId, data) => {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = await User.create({
    companyId,
    email: data.email,
    phone: data.phone,
    password: hashedPassword,
    role: data.role,
    profile: { firstName: data.firstName, lastName: data.lastName },
  });
  return await User.findById(user._id).select('-password');
};

const getMyProfile = async (userId) => {
  return await User.findById(userId).select('-password');
};

const updateMyProfile = async (userId, updateData) => {
  return await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');
};

const getAllUsers = async (companyId, query) => {
  const { page = 1, limit = 10, role, search } = query;
  const filter = { companyId };
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { 'profile.firstName': { $regex: search, $options: 'i' } },
      { 'profile.lastName': { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }
  
  const users = await User.find(filter)
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .select('-password');
    
  const total = await User.countDocuments(filter);
  return { users, total, page: parseInt(page), pages: Math.ceil(total / limit) };
};

const getUserById = async (id, companyId) => {
  return await User.findOne({ _id: id, companyId }).select('-password');
};

const updateUserStatus = async (id, companyId, isActive) => {
  return await User.findOneAndUpdate(
    { _id: id, companyId },
    { 'authTracking.isLocked': !isActive },
    { new: true }
  ).select('-password');
};

const updateUserRole = async (id, companyId, role) => {
  return await User.findOneAndUpdate(
    { _id: id, companyId },
    { role },
    { new: true }
  ).select('-password');
};

const updateUser = async (id, companyId, data) => {
  const update = {};
  if (data.firstName || data.lastName) {
    update.profile = {};
    if (data.firstName) update.profile.firstName = data.firstName;
    if (data.lastName) update.profile.lastName = data.lastName;
  }
  if (data.email) update.email = data.email;
  if (data.phone) update.phone = data.phone;
  if (data.role) update.role = data.role;
  if (data.password) {
    update.password = await bcrypt.hash(data.password, 10);
  }
  return await User.findOneAndUpdate({ _id: id, companyId }, update, { new: true, runValidators: true }).select('-password');
};

const deleteUser = async (id, companyId) => {
  return await User.findOneAndDelete({ _id: id, companyId });
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
