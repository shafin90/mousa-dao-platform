const stationService = require('../services/station.service');
const { respond, respondPaginated } = require('../../../utils/response');
const { notifyAllCustomers } = require('../../notifications/services/notification.service');

const getAllStations = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const result = await stationService.getAllStations(req.user.companyId, req.query, page, limit);
    respondPaginated(res, result.items, result.total, page, limit);
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
    notifyAllCustomers({
      companyId: req.user.companyId,
      type: 'station_update',
      title: 'Nouvelle gare',
      message: `La gare ${station.name} a été ajoutée`,
      data: { stationId: station._id },
    }).catch(() => {});
    respond(res, 201, station, 'Station created');
  } catch (error) { next(error); }
};

const updateStation = async (req, res, next) => {
  try {
    const station = await stationService.updateStation(req.params.id, req.user.companyId, req.body);
    if (!station) return respond(res, 404, null, 'Station not found');
    notifyAllCustomers({
      companyId: req.user.companyId,
      type: 'station_update',
      title: 'Gare mise à jour',
      message: `La gare ${station.name} a été mise à jour`,
      data: { stationId: station._id },
    }).catch(() => {});
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
