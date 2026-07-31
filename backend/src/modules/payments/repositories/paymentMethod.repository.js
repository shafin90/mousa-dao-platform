const PaymentMethod = require('../models/PaymentMethod');

const findByUser = async (userId, companyId) => {
  return await PaymentMethod.find({ userId, companyId });
};

const findById = async (id, userId, companyId) => {
  return await PaymentMethod.findOne({ _id: id, userId, companyId });
};

const create = async (data) => {
  return await PaymentMethod.create(data);
};

const updateOne = async (id, userId, companyId, update) => {
  return await PaymentMethod.findOneAndUpdate({ _id: id, userId, companyId }, update, { new: true, runValidators: true });
};

const deleteOne = async (id, userId, companyId) => {
  return await PaymentMethod.findOneAndDelete({ _id: id, userId, companyId });
};

const unsetDefault = async (userId, companyId) => {
  return await PaymentMethod.updateMany({ userId, companyId, isDefault: true }, { isDefault: false });
};

module.exports = { findByUser, findById, create, updateOne, deleteOne, unsetDefault };
