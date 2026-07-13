const stationService = require('./station.service');

const getAllStations = async (req, res) => {
  try {
    const stations = await stationService.getAllStations(req.user.companyId);
    res.json({ success: true, data: stations });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getStationById = async (req, res) => {
  try {
    const station = await stationService.getStationById(req.params.id, req.user.companyId);
    if (!station) return res.status(404).json({ success: false, message: 'Station not found' });
    res.json({ success: true, data: station });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getDistance = async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ success: false, message: 'Both from and to station IDs are required' });
    const data = await stationService.getDistance(from, to, req.user.companyId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const createStation = async (req, res) => {
  try {
    const station = await stationService.createStation(req.user.companyId, req.body);
    res.status(201).json({ success: true, message: 'Station created', data: station });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateStation = async (req, res) => {
  try {
    const station = await stationService.updateStation(req.params.id, req.user.companyId, req.body);
    if (!station) return res.status(404).json({ success: false, message: 'Station not found' });
    res.json({ success: true, message: 'Station updated', data: station });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteStation = async (req, res) => {
  try {
    const station = await stationService.deleteStation(req.params.id, req.user.companyId);
    if (!station) return res.status(404).json({ success: false, message: 'Station not found' });
    res.json({ success: true, message: 'Station deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getAllStations, getStationById, getDistance, createStation, updateStation, deleteStation };
