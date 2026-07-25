const cityService = require('../services/city.service');
const { respond, respondPaginated } = require('../../../utils/response');

const getAllCities = async (req, res, next) => {
  try {
    const { country, search, isActive, page = 1, limit = 20 } = req.query;
    const result = await cityService.getAllCitiesPaginated(
      req.user.companyId,
      { country, search, isActive },
      parseInt(page, 10),
      parseInt(limit, 10),
    );
    respondPaginated(res, result.items, result.total, parseInt(page, 10), parseInt(limit, 10));
  } catch (error) { next(error); }
};

const getCityById = async (req, res, next) => {
  try {
    const city = await cityService.getCityById(req.params.id, req.user.companyId);
    if (!city) return respond(res, 404, null, 'City not found');
    respond(res, 200, city);
  } catch (error) { next(error); }
};

const createCity = async (req, res, next) => {
  try {
    const city = await cityService.createCity(req.user.companyId, req.body, req.user._id);
    respond(res, 201, city, 'City created');
  } catch (error) { next(error); }
};

const updateCity = async (req, res, next) => {
  try {
    const city = await cityService.updateCity(req.params.id, req.user.companyId, req.body);
    if (!city) return respond(res, 404, null, 'City not found');
    respond(res, 200, city, 'City updated');
  } catch (error) { next(error); }
};

const deleteCity = async (req, res, next) => {
  try {
    const city = await cityService.deleteCity(req.params.id, req.user.companyId);
    if (!city) return respond(res, 404, null, 'City not found');
    respond(res, 200, null, 'City deleted');
  } catch (error) { next(error); }
};

const getCityDistance = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return respond(res, 400, null, 'from and to query params are required');
    const result = await cityService.calculateDistance(from, to, req.user.companyId);
    respond(res, 200, result);
  } catch (error) { next(error); }
};

const geocodeCity = async (req, res, next) => {
  try {
    const city = await cityService.geocodeCity(req.params.id, req.user.companyId);
    respond(res, 200, city, 'City geocoded');
  } catch (error) { next(error); }
};

module.exports = { getAllCities, getCityById, createCity, updateCity, deleteCity, getCityDistance, geocodeCity };
