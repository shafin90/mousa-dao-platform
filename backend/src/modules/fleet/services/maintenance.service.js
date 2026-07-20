const Maintenance = require('../models/Maintenance');

const populateFields = [
  { path: 'busId', select: 'busNumber name plateNumber' },
  { path: 'facilityId', select: 'name address phone' },
];

const getAllRecords = async (companyId, filters = {}) => {
  const query = { companyId };
  if (filters.busId) query.busId = filters.busId;
  if (filters.facilityId) query.facilityId = filters.facilityId;
  if (filters.type) query.type = filters.type;
  return await Maintenance.find(query)
    .populate(populateFields)
    .sort({ date: -1 });
};

const getRecordById = async (id, companyId) => {
  return await Maintenance.findOne({ _id: id, companyId })
    .populate(populateFields);
};

const createRecord = async (companyId, data) => {
  const record = await Maintenance.create({ ...data, companyId });
  return await Maintenance.findById(record._id)
    .populate(populateFields);
};

const updateRecord = async (id, companyId, data) => {
  return await Maintenance.findOneAndUpdate({ _id: id, companyId }, data, { new: true })
    .populate(populateFields);
};

const deleteRecord = async (id, companyId) => {
  return await Maintenance.findOneAndDelete({ _id: id, companyId });
};

module.exports = { getAllRecords, getRecordById, createRecord, updateRecord, deleteRecord };
