const Passenger = require('../models/Passenger');

const findByUser = async (userId, companyId) => {
  return await Passenger.find({ userId, companyId });
};

const create = async (data) => {
  return await Passenger.create(data);
};

const updateOne = async (id, userId, companyId, update) => {
  return await Passenger.findOneAndUpdate({ _id: id, userId, companyId }, update, { new: true, runValidators: true });
};

const deleteOne = async (id, userId, companyId) => {
  return await Passenger.findOneAndDelete({ _id: id, userId, companyId });
};

module.exports = { findByUser, create, updateOne, deleteOne };
