const busService = require('./bus.service');

const createBus = async (req, res) => {
  try {
    const bus = await busService.createBus(req.user.companyId, req.body);
    res.status(201).json({ success: true, message: 'Bus created', data: bus });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAllBuses = async (req, res) => {
  try {
    const { page, limit, ...filters } = req.query;
    const data = await busService.getAllBuses(req.user.companyId, filters, parseInt(page) || 1, parseInt(limit) || 10);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getBusById = async (req, res) => {
  try {
    const bus = await busService.getBusById(req.params.id, req.user.companyId);
    if (!bus) return res.status(404).json({ success: false, message: 'Bus not found' });
    res.json({ success: true, data: bus });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateBus = async (req, res) => {
  try {
    const bus = await busService.updateBus(req.params.id, req.user.companyId, req.body);
    if (!bus) return res.status(404).json({ success: false, message: 'Bus not found' });
    res.json({ success: true, message: 'Bus updated', data: bus });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateBusStatus = async (req, res) => {
  try {
    const bus = await busService.updateBusStatus(req.params.id, req.user.companyId, req.body.status);
    if (!bus) return res.status(404).json({ success: false, message: 'Bus not found' });
    res.json({ success: true, message: 'Bus status updated', data: bus });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const assignDriver = async (req, res) => {
  try {
    const bus = await busService.assignDriver(req.params.id, req.user.companyId, req.body.driverId);
    if (!bus) return res.status(404).json({ success: false, message: 'Bus not found' });
    res.json({ success: true, message: 'Driver assigned', data: bus });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const addMaintenanceLog = async (req, res) => {
  try {
    const log = await busService.addMaintenanceLog(req.params.id, req.user.companyId, req.body);
    res.status(201).json({ success: true, message: 'Maintenance log added', data: log });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteBus = async (req, res) => {
  try {
    const bus = await busService.deleteBus(req.params.id, req.user.companyId);
    if (!bus) return res.status(404).json({ success: false, message: 'Bus not found' });
    res.json({ success: true, message: 'Bus deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { createBus, getAllBuses, getBusById, updateBus, updateBusStatus, assignDriver, addMaintenanceLog, deleteBus };
