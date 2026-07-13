const Bus = require('./models/Bus');
const InventoryLog = require('./models/InventoryLog');

const createBus = async (companyId, data) => {
  return await Bus.create({ ...data, companyId });
};

const getAllBuses = async (companyId, filters, page = 1, limit = 10) => {
  const query = { companyId };
  if (filters.status) query.status = filters.status;
  if (filters.type) query.type = filters.type;

  const buses = await Bus.find(query)
    .populate('assignedDriver', 'profile.firstName profile.lastName email')
    .skip((page - 1) * limit)
    .limit(limit);
  
  const total = await Bus.countDocuments(query);
  return { buses, total };
};

const getBusById = async (id, companyId) => {
  return await Bus.findOne({ _id: id, companyId }).populate('assignedDriver');
};

const updateBus = async (id, companyId, data) => {
  return await Bus.findOneAndUpdate({ _id: id, companyId }, data, { new: true });
};

const updateBusStatus = async (id, companyId, status) => {
  return await Bus.findOneAndUpdate({ _id: id, companyId }, { status }, { new: true });
};

const assignDriver = async (id, companyId, driverId) => {
  return await Bus.findOneAndUpdate({ _id: id, companyId }, { assignedDriver: driverId }, { new: true });
};

const addMaintenanceLog = async (id, companyId, data) => {
  return await InventoryLog.create({ ...data, companyId, busId: id });
};

const deleteBus = async (id, companyId) => {
  return await Bus.findOneAndDelete({ _id: id, companyId });
};

module.exports = { createBus, getAllBuses, getBusById, updateBus, updateBusStatus, assignDriver, addMaintenanceLog, deleteBus };
