const cityRepository = require('../repositories/city.repository');
const AppError = require('../../../errors/AppError');
const ErrorCodes = require('../../../errors/errorCodes');

/**
 * Lists all cities for a company, optionally filtered by country/search.
 *
 * @param {string} companyId
 * @param {Object} filters
 * @returns {Promise<Array>}
 */
const getAllCities = async (companyId, filters = {}) => {
  return await cityRepository.findAll(companyId, filters);
};

/**
 * Fetches a single city by ID within company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const getCityById = async (id, companyId) => {
  return await cityRepository.findById(id, companyId);
};

/**
 * Creates a city.
 *
 * @param {string} companyId
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const createCity = async (companyId, data) => {
  const dup = await cityRepository.findByNameAndCountry(companyId, data.name, data.country);
  if (dup) throw new AppError(`City "${data.name}" already exists in ${data.country}`, 409, ErrorCodes.CONFLICT);
  return await cityRepository.create({ ...data, companyId });
};

/**
 * Updates a city.
 *
 * @param {string} id
 * @param {string} companyId
 * @param {Object} data
 * @returns {Promise<Object|null>}
 */
const updateCity = async (id, companyId, data) => {
  return await cityRepository.updateOne(id, companyId, data);
};

/**
 * Deletes a city.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const deleteCity = async (id, companyId) => {
  return await cityRepository.deleteOne(id, companyId);
};

module.exports = { getAllCities, getCityById, createCity, updateCity, deleteCity };
