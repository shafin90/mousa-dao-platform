const stationService = require('../services/station.service');
const { respond } = require('../../../utils/response');

const getAllStations = async (req, res, next) => {
  try {
    const stations = await stationService.getAllStations(req.user.companyId);
    respond(res, 200, stations);
  } catch (error) { next(error); }
};

const getStationById = async (req, res, next) => {
  try {
    const station = await stationService.getStationById(req.params.id, req.user.companyId);
    respond(res, 200, station);
  } catch (error) { next(error); }
};

const getDistance = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return respond(res, 400, null, 'Both from and to are required');
    const data = await stationService.getDistance(from, to, req.user.companyId);
    respond(res, 200, data);
  } catch (error) { next(error); }
};

const createStation = async (req, res, next) => {
  try {
    const station = await stationService.createStation(req.user.companyId, req.body, req.user._id);
    respond(res, 201, station, 'Station created');
  } catch (error) { next(error); }
};

const updateStation = async (req, res, next) => {
  try {
    const station = await stationService.updateStation(req.params.id, req.user.companyId, req.body);
    if (!station) return respond(res, 404, null, 'Station not found');
    respond(res, 200, station, 'Station updated');
  } catch (error) { next(error); }
};

const deleteStation = async (req, res, next) => {
  try {
    const station = await stationService.deleteStation(req.params.id, req.user.companyId);
    if (!station) return respond(res, 404, null, 'Station not found');
    respond(res, 200, null, 'Station deleted');
  } catch (error) { next(error); }
};

module.exports = { getAllStations, getStationById, getDistance, createStation, updateStation, deleteStation };
