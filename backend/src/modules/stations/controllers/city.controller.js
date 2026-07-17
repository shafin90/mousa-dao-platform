const cityService = require('../services/city.service');
const { respond } = require('../../../utils/response');

const getAllCities = async (req, res, next) => {
  try {
    const { country, search } = req.query;
    const cities = await cityService.getAllCities(req.user.companyId, { country, search });
    respond(res, 200, cities);
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
    const city = await cityService.createCity(req.user.companyId, req.body);
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

module.exports = { getAllCities, getCityById, createCity, updateCity, deleteCity };
